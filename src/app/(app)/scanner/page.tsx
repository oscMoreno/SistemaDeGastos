'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ImageUploader } from '@/components/scanner/ImageUploader';
import { ScannerStatus } from '@/components/scanner/ScannerStatus';
import { ScannerResult, type ScannerConfirmData } from '@/components/scanner/ScannerResult';
import { uploadReceiptImage } from '@/lib/firebase/storage';
import { addEgreso } from '@/lib/firebase/firestore';
import { scanReceipt } from '@/lib/firebase/ai';
import { useToast } from '@/context/ToastContext';
import type { GeminiReceiptResult } from '@/types';

type ScanStep = 'idle' | 'uploading' | 'scanning' | 'confirming' | 'saving' | 'error';

export default function ScannerPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<ScanStep>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const [downloadURL, setDownloadURL] = useState<string | undefined>(undefined);
  const [scanResult, setScanResult] = useState<GeminiReceiptResult | null>(null);
  const [uploadPct, setUploadPct] = useState(0);

  async function handleImageSelected(file: File, preview: string) {
    setImagePreview(preview);
    await startScan(file, preview);
  }

  async function startScan(file: File, preview: string) {
    setStep('scanning');
    setErrorMsg('');
    setUploadPct(0);

    // Upload a Storage y escaneo con IA en paralelo: el escaneo no
    // necesita la URL de Storage (usa el base64 local), así que no
    // hay razón para esperar la subida antes de escanear.
    const base64 = preview.split(',')[1];
    const mimeType = file.type || 'image/jpeg';

    const [uploadRes, scanRes] = await Promise.allSettled([
      uploadReceiptImage(file, setUploadPct),
      scanReceipt(base64, mimeType),
    ]);

    if (uploadRes.status === 'rejected') {
      setStep('error');
      setErrorMsg('No se pudo subir la imagen. Verifica tu conexión.');
      return;
    }
    setDownloadURL(uploadRes.value.downloadURL);

    if (scanRes.status === 'rejected') {
      setStep('error');
      setErrorMsg('No se pudo leer el recibo. Puedes ingresar los datos manualmente.');
      return;
    }

    setScanResult(scanRes.value);
    setStep('confirming');
  }

  async function handleConfirm(confirmed: ScannerConfirmData) {
    setStep('saving');
    try {
      await addEgreso({
        fechaStr: confirmed.fecha,
        categoria: confirmed.categoria,
        subcategoria: confirmed.subcategoria,
        monto: confirmed.monto,
        imagen_url: downloadURL,
        notas: confirmed.notas || undefined,
        moneda: confirmed.moneda === 'USD' ? 'USD' : undefined,
        monto_usd: confirmed.monto_usd,
        tipo_cambio: confirmed.tipo_cambio,
      });
      showToast('Egreso guardado');
      router.replace('/egresos');
    } catch {
      setStep('error');
      setErrorMsg('Error al guardar. Intenta de nuevo.');
    }
  }

  function handleRetry() {
    setStep('idle');
    setScanResult(null);
    setImagePreview(undefined);
    setDownloadURL(undefined);
    setErrorMsg('');
  }

  function goToManual() {
    router.push('/egresos/nuevo');
  }

  return (
    <>
      <PageHeader title="Escanear Recibo" backHref="/dashboard" />

      {step === 'idle' && (
        <ImageUploader onImageSelected={handleImageSelected} />
      )}

      {(step === 'uploading' || step === 'scanning') && (
        <ScannerStatus status={step} uploadProgress={uploadPct} />
      )}

      {step === 'error' && (
        <>
          <ScannerStatus status="error" errorMessage={errorMsg} onRetry={handleRetry} />
          <div className="px-4 text-center">
            <button onClick={goToManual} className="text-sm text-gray-500 underline">
              Ingresar datos manualmente
            </button>
          </div>
        </>
      )}

      {step === 'confirming' && scanResult && (
        <ScannerResult
          result={scanResult}
          imagePreview={imagePreview}
          onConfirm={handleConfirm}
          onCancel={handleRetry}
        />
      )}

      {step === 'saving' && (
        <ScannerStatus status="uploading" />
      )}
    </>
  );
}
