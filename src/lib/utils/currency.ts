'use client';

const CACHE_KEY = 'usd_mxn_rate';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

interface CachedRate {
  rate: number;
  ts: number;
}

function readCache(): CachedRate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRate;
    if (typeof parsed.rate !== 'number' || parsed.rate <= 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Tipo de cambio USD→MXN. Usa una API gratuita (sin key) con caché de 12h
 * en localStorage. Si no hay red, regresa el último valor cacheado aunque
 * esté vencido; si nunca hubo, regresa null (el usuario lo captura a mano).
 */
export async function getTipoCambioUSD(): Promise<number | null> {
  const cached = readCache();
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.rate;

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    const rate = data?.rates?.MXN;
    if (typeof rate === 'number' && rate > 0) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, ts: Date.now() } satisfies CachedRate));
      } catch { /* storage lleno: seguir sin caché */ }
      return rate;
    }
  } catch { /* sin red: usar caché vencido abajo */ }

  return cached?.rate ?? null;
}

/** Convierte USD a MXN redondeado a centavos */
export function usdToMxn(usd: number, tipoCambio: number): number {
  return Math.round(usd * tipoCambio * 100) / 100;
}
