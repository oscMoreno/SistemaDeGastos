'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState } from 'react';
import { useEgresos } from '@/hooks/useEgresos';
import { EgresoItem } from '@/components/egresos/EgresoItem';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { MESES, CATEGORIAS_EGRESO } from '@/lib/utils/constants';
import { getCurrentYear } from '@/lib/utils/dates';
import type { CategoriaEgreso } from '@/types';

export default function EgresosPage() {
  const currentYear = getCurrentYear();
  const [filterMes, setFilterMes] = useState('');
  const [filterCat, setFilterCat] = useState<CategoriaEgreso | ''>('');
  const { egresos, loading } = useEgresos(currentYear);

  const filtered = egresos
    .filter((e) => (!filterMes || e.mes === filterMes) && (!filterCat || e.categoria === filterCat));
  const total = filtered.reduce((s, e) => s + e.monto, 0);

  return (
    <>
      <PageHeader
        title="Egresos"
        action={
          <Link href="/egresos/nuevo">
            <Button size="sm" variant="danger">+ Nuevo</Button>
          </Link>
        }
      />
      <div className="px-4 py-3 bg-white border-b border-gray-100 space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterCat('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!filterCat ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Todos
          </button>
          {CATEGORIAS_EGRESO.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCat === cat ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterMes('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!filterMes ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Todos
          </button>
          {MESES.map((mes) => (
            <button
              key={mes}
              onClick={() => setFilterMes(filterMes === mes ? '' : mes)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterMes === mes ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'}`}
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
          <p className="text-gray-400 text-sm">No hay egresos registrados.</p>
          <Link href="/egresos/nuevo" className="mt-4">
            <Button variant="danger">Registrar egreso</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="px-4 py-2 bg-slate-50 flex justify-between items-center">
            <span className="text-xs text-gray-500">{filtered.length} registros</span>
            <span className="text-sm font-bold text-rose-600">
              Total: ${total.toLocaleString('es-MX')}
            </span>
          </div>
          <div>
            {filtered.map((e) => <EgresoItem key={e.id} egreso={e} />)}
          </div>
        </>
      )}
    </>
  );
}
