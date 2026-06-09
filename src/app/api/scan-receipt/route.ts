import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const { base64Image, mimeType } = await req.json() as { base64Image: string; mimeType: string };

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analiza este recibo o ticket de compra de un restaurante mexicano.
Responde ÚNICAMENTE con JSON válido (sin markdown, sin texto extra) con exactamente estos campos:
{
  "monto": <número: total pagado en pesos MXN>,
  "subcategoria": "<nombre del proveedor o tienda, elige el más cercano de esta lista si aplica: Smart, City Club, Carnemaf, Disfruta, Central de Abastos, o escribe el nombre real si no es ninguno>",
  "notas": "<descripción breve de 1-2 líneas de lo que se compró>",
  "fecha": "<fecha en formato YYYY-MM-DD, si no es clara usa la fecha de hoy>"
}`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: base64Image,
        },
      },
      { text: prompt },
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Gemini scan error:', err);
    return NextResponse.json({ error: 'Error al procesar el recibo' }, { status: 422 });
  }
}
