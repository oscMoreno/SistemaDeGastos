'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteEgreso } from '@/lib/firebase/firestore';
import { formatCurrency, formatDate } from '@/lib/utils/dates';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CATEGORIA_COLORS } from '@/lib/utils/constants';
import type { Egreso } from '@/types';

interface Props { egreso: Egreso }

export function EgresoItem({ egreso }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const date = egreso.fecha.toDate();

  async function handleDelete() {
    setDeleting(true);
    await deleteEgreso(egreso.id);
    setShowConfirm(false);
    setDeleting(false);
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-50 active:bg-gray-50">
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
          {egreso.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={egreso.imagen_url} alt="recibo" loading="lazy" decoding="async" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <Badge className={CATEGORIA_COLORS[egreso.categoria] ?? 'bg-gray-100 text-gray-600'}>
              {egreso.subcategoria}
            </Badge>
            <span className="text-xs text-gray-400">S{egreso.semana}</span>
          </div>
          <p className="text-xs text-gray-500">{formatDate(date)}</p>
          {egreso.moneda === 'USD' && egreso.monto_usd && (
            <p className="text-xs text-sky-600 font-medium">
              USD ${egreso.monto_usd.toFixed(2)}{egreso.tipo_cambio ? ` · TC ${egreso.tipo_cambio}` : ''}
            </p>
          )}
          {egreso.notas && <p className="text-xs text-gray-400 truncate">{egreso.notas}</p>}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-base font-bold text-rose-600">{formatCurrency(egreso.monto)}</span>
          <Link
            href={`/egresos/${egreso.id}/editar`}
            aria-label="Editar egreso"
            className="p-2 rounded-xl text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </Link>
          <button
            onClick={() => setShowConfirm(true)}
            className="p-2 rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
      <Modal
        open={showConfirm}
        title="Eliminar egreso"
        message={`¿Eliminar ${formatCurrency(egreso.monto)} de ${egreso.subcategoria}?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        loading={deleting}
      />
    </>
  );
}
