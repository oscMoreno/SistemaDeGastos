'use client';

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.78;
/** Si el primer intento supera esto, recomprimir más agresivo */
const TARGET_MAX_BYTES = 600_000;
const FALLBACK_DIMENSION = 900;
const FALLBACK_QUALITY = 0.6;

export interface CompressedImage {
  file: File;
  dataUrl: string;
}

/**
 * Comprime una imagen client-side usando canvas.
 * Primer intento: 1024px / q0.78 (suficiente para que la IA lea recibos).
 * Si queda >600KB (foto muy detallada), segundo intento: 900px / q0.6.
 * Si algo falla, regresa el archivo original sin comprimir.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  try {
    const originalDataUrl = await readAsDataURL(file);
    const img = await loadImage(originalDataUrl);

    let result = await renderToJpeg(img, MAX_DIMENSION, JPEG_QUALITY);
    if (result && result.blob.size > TARGET_MAX_BYTES) {
      const harder = await renderToJpeg(img, FALLBACK_DIMENSION, FALLBACK_QUALITY);
      if (harder && harder.blob.size < result.blob.size) result = harder;
    }

    // Si la compresión no ayudó (imagen ya pequeña), usar la original
    if (!result || result.blob.size >= file.size) {
      return { file, dataUrl: originalDataUrl };
    }

    const compressedFile = new File(
      [result.blob],
      file.name.replace(/\.[^.]+$/, '') + '.jpg',
      { type: 'image/jpeg' }
    );
    return { file: compressedFile, dataUrl: result.dataUrl };
  } catch {
    const dataUrl = await readAsDataURL(file);
    return { file, dataUrl };
  }
}

async function renderToJpeg(
  img: HTMLImageElement,
  maxDim: number,
  quality: number
): Promise<{ blob: Blob; dataUrl: string } | null> {
  let { width, height } = img;
  if (Math.max(width, height) > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  );
  if (!blob) return null;
  return { blob, dataUrl };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
