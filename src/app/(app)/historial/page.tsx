'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useIngresos } from '@/hooks/useIngresos';
import { useEgresos } from '@/hooks/useEgresos';
import { IngresoItem } from '@/components/ingresos/IngresoItem';
import { EgresoItem } from '@/components/egresos/EgresoItem';
import { WeekCard } from '@/components/historial/WeekCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { getCurrentYear } from '@/lib/utils/dates';
import { computeResumenesSemanales } from '@/lib/utils/weekly';
import { exportAnioCsv } from '@/lib/utils/export';
import { useToast } from '@/context/ToastContext';
import type { Ingreso, Egreso } from '@/types';

type TabType = 'semanas' | 'todos' | 'ingresos' | 'egresos';

export default function HistorialPage() {
  const currentYear = getCurrentYear();
  const [tab, setTab] = useState<TabType>('semanas');
  const { ingresos, loading: loadingI } = useIngresos(currentYear);
  const { egresos, loading: loadingE } = useEgresos(currentYear);
  const { showToast } = useToast();
  const loading = loadingI || loadingE;

  const resumenes = useMemo(
    () => (tab === 'semanas' ? computeResumenesSemanales(ingresos, egresos, currentYear) : []),
    [tab, ingresos, egresos, currentYear]
  );

  type Row = ({ type: 'ingreso'; item: Ingreso } | { type: 'egreso'; item: Egreso }) & { ts: number };

  const rows: Row[] = [
    ...(tab === 'todos' || tab === 'ingresos' ? ingresos.map((i): Row => ({ type: 'ingreso', item: i, ts: i.fecha.toMillis() })) : []),
    ...(tab === 'todos' || tab === 'egresos' ? egresos.map((e): Row => ({ type: 'egreso', item: e, ts: e.fecha.toMillis() })) : []),
  ].sort((a, b) => b.ts - a.ts);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'semanas', label: 'Semanas' },
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
      ) : tab === 'semanas' ? (
        resumenes.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-16">No hay registros este año.</p>
        ) : (
          <div className="px-4 py-4 space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  exportAnioCsv(ingresos, egresos, currentYear);
                  showToast(`Movimientos de ${currentYear} exportados`);
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Exportar año (CSV)
              </Button>
            </div>
            {resumenes.map((r, idx) => (
              <WeekCard
                key={r.semana}
                resumen={r}
                anterior={resumenes[idx + 1]}
                anio={currentYear}
              />
            ))}
          </div>
        )
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
