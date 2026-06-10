'use client';

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.8;

export interface CompressedImage {
  file: File;
  dataUrl: string;
}

/**
 * Comprime una imagen client-side usando canvas.
 * Redimensiona a máximo 1280px (lado mayor) y exporta JPEG q0.8.
 * Una foto de teléfono de 3–10 MB queda en ~150–300 KB.
 * Si algo falla, regresa el archivo original sin comprimir.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  try {
    const dataUrl = await readAsDataURL(file);
    const img = await loadImage(dataUrl);

    let { width, height } = img;
    if (Math.max(width, height) > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { file, dataUrl };

    ctx.drawImage(img, 0, 0, width, height);
    const compressedDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

    // Si la compresión no ayudó (imagen ya pequeña), usar la original
    if (compressedDataUrl.length >= dataUrl.length) {
      return { file, dataUrl };
    }

    const blob = await canvasToBlob(canvas);
    if (!blob) return { file, dataUrl };

    const compressedFile = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, '') + '.jpg',
      { type: 'image/jpeg' }
    );
    return { file: compressedFile, dataUrl: compressedDataUrl };
  } catch {
    const dataUrl = await readAsDataURL(file);
    return { file, dataUrl };
  }
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

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
  });
}
