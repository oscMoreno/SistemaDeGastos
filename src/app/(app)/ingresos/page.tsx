'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState } from 'react';
import { useIngresos } from '@/hooks/useIngresos';
import { IngresoItem } from '@/components/ingresos/IngresoItem';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { MESES } from '@/lib/utils/constants';
import { getCurrentYear } from '@/lib/utils/dates';

export default function IngresosPage() {
  const currentYear = getCurrentYear();
  const [filterMes, setFilterMes] = useState('');
  const { ingresos, loading } = useIngresos(currentYear);

  const filtered = filterMes ? ingresos.filter((i) => i.mes === filterMes) : ingresos;
  const total = filtered.reduce((s, i) => s + i.monto, 0);

  return (
    <>
      <PageHeader
        title="Ingresos"
        action={
          <Link href="/ingresos/nuevo">
            <Button size="sm">+ Nuevo</Button>
          </Link>
        }
      />
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterMes('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!filterMes ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Todos
          </button>
          {MESES.map((mes) => (
            <button
              key={mes}
              onClick={() => setFilterMes(filterMes === mes ? '' : mes)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterMes === mes ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {mes}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-8">
          <p className="text-gray-400 text-sm">No hay ingresos registrados.</p>
          <Link href="/ingresos/nuevo" className="mt-4">
            <Button>Registrar ingreso</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="px-4 py-2 bg-slate-50 flex justify-between items-center">
            <span className="text-xs text-gray-500">{filtered.length} registros</span>
            <span className="text-sm font-bold text-emerald-600">
              Total: ${total.toLocaleString('es-MX')}
            </span>
          </div>
          <div>
            {filtered.map((i) => <IngresoItem key={i.id} ingreso={i} />)}
          </div>
        </>
      )}
    </>
  );
}
