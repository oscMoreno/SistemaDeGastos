'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error';

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  /** Muestra un toast que se auto-descarta a los 2.5s */
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Contenedor: arriba del BottomNav (h-16 + safe area) */}
      {toasts.length > 0 && (
        <div className="fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white max-w-sm w-fit animate-[toast-in_.2s_ease-out] ${
                t.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              {t.type === 'success' ? (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008z" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              )}
              {t.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
