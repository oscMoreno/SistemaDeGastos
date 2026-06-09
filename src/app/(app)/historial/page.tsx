'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useIngresos } from '@/hooks/useIngresos';
import { useEgresos } from '@/hooks/useEgresos';
import { IngresoItem } from '@/components/ingresos/IngresoItem';
import { EgresoItem } from '@/components/egresos/EgresoItem';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { getCurrentYear } from '@/lib/utils/dates';
import type { Ingreso, Egreso } from '@/types';

type TabType = 'todos' | 'ingresos' | 'egresos';

export default function HistorialPage() {
  const currentYear = getCurrentYear();
  const [tab, setTab] = useState<TabType>('todos');
  const { ingresos, loading: loadingI } = useIngresos(currentYear);
  const { egresos, loading: loadingE } = useEgresos(currentYear);
  const loading = loadingI || loadingE;

  type Row = ({ type: 'ingreso'; item: Ingreso } | { type: 'egreso'; item: Egreso }) & { ts: number };

  const rows: Row[] = [
    ...(tab !== 'egresos' ? ingresos.map((i): Row => ({ type: 'ingreso', item: i, ts: i.fecha.toMillis() })) : []),
    ...(tab !== 'ingresos' ? egresos.map((e): Row => ({ type: 'egreso', item: e, ts: e.fecha.toMillis() })) : []),
  ].sort((a, b) => b.ts - a.ts);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'ingresos', label: 'Ingresos' },
    { key: 'egresos', label: 'Egresos' },
  ];

  return (
    <>
      <PageHeader title="Historial" />
      <div className="flex border-b border-gray-100 bg-white sticky top-14 z-20">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${tab === t.key ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-16">No hay registros.</p>
      ) : (
        <div>
          {rows.map((row) =>
            row.type === 'ingreso'
              ? <IngresoItem key={`i-${row.item.id}`} ingreso={row.item} />
              : <EgresoItem key={`e-${row.item.id}`} egreso={row.item} />
          )}
        </div>
      )}
    </>
  );
}
