'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ImageUploader } from '@/components/scanner/ImageUploader';
import { ScannerStatus } from '@/components/scanner/ScannerStatus';
import { ScannerResult } from '@/components/scanner/ScannerResult';
import { uploadReceiptImage } from '@/lib/firebase/storage';
import { addEgreso } from '@/lib/firebase/firestore';
import { scanReceipt } from '@/lib/firebase/ai';
import type { GeminiReceiptResult, CategoriaEgreso } from '@/types';

type ScanStep = 'idle' | 'uploading' | 'scanning' | 'confirming' | 'saving' | 'error';

export default function ScannerPage() {
  const router = useRouter();
  const [step, setStep] = useState<ScanStep>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const [downloadURL, setDownloadURL] = useState<string | undefined>(undefined);
  const [scanResult, setScanResult] = useState<GeminiReceiptResult | null>(null);

  async function handleImageSelected(file: File, preview: string) {
    setSelectedFile(file);
    setImagePreview(preview);
    await startScan(file, preview);
  }

  async function startScan(file: File, preview: string) {
    setStep('uploading');
    setErrorMsg('');
    let url: string | undefined;

    try {
      const { downloadURL: dl } = await uploadReceiptImage(file);
      url = dl;
      setDownloadURL(dl);
    } catch {
      setStep('error');
      setErrorMsg('No se pudo subir la imagen. Verifica tu conexión.');
      return;
    }

    setStep('scanning');
    try {
      const base64 = preview.split(',')[1];
      const mimeType = file.type || 'image/jpeg';
      const result = await scanReceipt(base64, mimeType);
      setScanResult(result);
      setStep('confirming');
    } catch {
      setStep('error');
      setErrorMsg('No se pudo leer el recibo. Puedes ingresar los datos manualmente.');
    }
  }

  async function handleConfirm(confirmed: GeminiReceiptResult & { categoria: CategoriaEgreso }) {
    setStep('saving');
    try {
      const date = new Date(confirmed.fecha + 'T12:00:00');
      await addEgreso({
        fechaStr: confirmed.fecha,
        categoria: confirmed.categoria,
        subcategoria: confirmed.subcategoria,
        monto: confirmed.monto,
        imagen_url: downloadURL,
        notas: confirmed.notas || undefined,
      });
      router.replace('/egresos');
    } catch {
      setStep('error');
      setErrorMsg('Error al guardar. Intenta de nuevo.');
    }
  }

  function handleRetry() {
    setStep('idle');
    setScanResult(null);
    setSelectedFile(null);
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
        <ScannerStatus status={step} />
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
