'use client';

import type { GeminiReceiptResult } from '@/types';
import { dateToInputValue } from '@/lib/utils/dates';

export async function scanReceipt(base64Image: string, mimeType: string): Promise<GeminiReceiptResult> {
  const response = await fetch('/api/scan-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, mimeType }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Error ${response.status}`);
  }

  const parsed = (await response.json()) as GeminiReceiptResult;
  if (!parsed.fecha) {
    parsed.fecha = dateToInputValue(new Date());
  }
  return parsed;
}
