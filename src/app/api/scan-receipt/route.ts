import { NextResponse } from 'next/server';

// Vercel: permitir hasta 30s (el análisis de Mistral puede tardar >10s,
// que es el límite default del plan Hobby)
export const maxDuration = 30;

const PROMPT = `Analiza este recibo de compra y devuelve ÚNICAMENTE un objeto JSON válido, sin markdown ni texto adicional.

Campos requeridos:
- "monto": número decimal exacto del total final (busca "Total", "TOTAL", "total", "Total a pagar", "Importe total" — copia el número exactamente como aparece, con centavos, sin redondear)
- "subcategoria": nombre del proveedor (si coincide con alguno de esta lista úsalo tal cual: Smart, City Club, Carnemaf, Disfruta, Santos, Central de Abastos, Carne MG; si no, escribe el nombre real)
- "notas": descripción breve de 1-2 líneas de lo que se compró
- "fecha": fecha del recibo en formato YYYY-MM-DD (si no es visible usa la fecha de hoy)
- "moneda": "MXN" o "USD". Usa "USD" SOLO si el recibo es claramente de Estados Unidos o el total está en dólares (indicios: "USD", "US$", "DLLS", dirección en EE.UU., textos en inglés como "SUBTOTAL/TAX/TOTAL" con tienda americana tipo Walmart US, Ross, HEB de Texas). Si es un recibo mexicano normal usa "MXN".

Ejemplo de respuesta correcta:
{"monto":572.63,"subcategoria":"Smart","notas":"Compra de carnes y verduras","fecha":"2026-06-08","moneda":"MXN"}`;

export async function POST(request: Request) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'MISTRAL_API_KEY no configurada' }, { status: 500 });
  }

  let base64Image: string;
  let mimeType: string;
  try {
    ({ base64Image, mimeType } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${base64Image}` },
              },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return NextResponse.json({ error: errBody }, { status: 502 });
    }

    const data = await response.json();
    const text: string = data?.choices?.[0]?.message?.content?.trim() ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No se obtuvo JSON válido' }, { status: 502 });
    }

    // Limpiar valores numéricos con texto extra: "572.63 pesos" → 572.63
    const cleaned = jsonMatch[0].replace(/:(\s*)([\d.]+)\s+[a-zA-Záéíóú]+/g, ':$1$2');
    return NextResponse.json(JSON.parse(cleaned));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
