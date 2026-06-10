import { Spinner } from '@/components/ui/Spinner';

type StatusType = 'uploading' | 'scanning' | 'error';

interface ScannerStatusProps {
  status: StatusType;
  errorMessage?: string;
  onRetry?: () => void;
  /** Porcentaje de subida (0-100); muestra barra de progreso si se pasa */
  uploadProgress?: number;
}

const messages: Record<StatusType, string> = {
  uploading: 'Subiendo imagen...',
  scanning: 'Analizando recibo con IA...',
  error: '',
};

export function ScannerStatus({ status, errorMessage, onRetry, uploadProgress }: ScannerStatusProps) {
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-800">No se pudo leer el recibo</p>
          <p className="text-sm text-gray-500 mt-1">{errorMessage ?? 'Intenta de nuevo o ingresa los datos manualmente.'}</p>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="text-sm text-emerald-600 font-medium underline">
            Intentar de nuevo
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-12">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">{messages[status]}</p>
      {uploadProgress !== undefined && uploadProgress < 100 && (
        <div className="w-full max-w-xs">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center mt-1">Subiendo foto {uploadProgress}%</p>
        </div>
      )}
    </div>
  );
}
