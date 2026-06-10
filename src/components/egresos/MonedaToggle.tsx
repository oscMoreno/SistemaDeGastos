'use client';

import type { Moneda } from '@/types';

interface MonedaToggleProps {
  value: Moneda;
  onChange: (m: Moneda) => void;
}

/** Selector segmentado MXN | USD para el monto del ticket */
export function MonedaToggle({ value, onChange }: MonedaToggleProps) {
  const opciones: Moneda[] = ['MXN', 'USD'];
  return (
    <div className="flex rounded-xl border border-gray-200 overflow-hidden shrink-0" role="group" aria-label="Moneda del ticket">
      {opciones.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`px-3 min-h-[44px] text-xs font-semibold transition-colors ${
            value === m
              ? m === 'USD'
                ? 'bg-sky-600 text-white'
                : 'bg-emerald-600 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
