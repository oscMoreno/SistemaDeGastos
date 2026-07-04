'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useIngresos } from '@/hooks/useIngresos';
import { useEgresos } from '@/hooks/useEgresos';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { WeeklyChart } from '@/components/dashboard/WeeklyChart';
import { PaymentMethodBreakdown } from '@/components/dashboard/PaymentMethodBreakdown';
import { MonthlyTotals } from '@/components/dashboard/MonthlyTotals';
import { BreakdownPanel } from '@/components/dashboard/BreakdownPanel';
import { Spinner } from '@/components/ui/Spinner';
import { getCurrentWeek, getCurrentYear, getMes } from '@/lib/utils/dates';
import { MESES } from '@/lib/utils/constants';
import type { MetodoPago, CategoriaEgreso } from '@/types';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

type ViewMode = 'semana' | 'mes';

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('semana');
  const [selectedMes, setSelectedMes] = useState<string>(getMes(new Date()));

  const { ingresos, loading: loadingI } = useIngresos();
  const { egresos, loading: loadingE } = useEgresos();
  const stats = useDashboardStats(ingresos, egresos);
  const router = useRouter();

  const loading = loadingI || loadingE;

  const mesStats = stats.monthlyTotals.find((m) => m.mes === selectedMes) ?? {
    ingresos: 0, egresos: 0, utilidad: 0,
    ingresosPorMetodo: { Efectivo: 0, Transferencia: 0, Rappi: 0 } as Record<MetodoPago, number>,
    egresosPorCategoria: { 'Gastos Insumos': 0, 'Sueldos': 0, 'Gastos Fijos': 0 } as Record<CategoriaEgreso, number>,
  };

  const currentWeekData = stats.weeklyChartData[stats.weeklyChartData.length - 1];

  const periodoStats = viewMode === 'mes'
    ? { ingresos: mesStats.ingresos, egresos: mesStats.egresos, utilidad: mesStats.utilidad }
    : { ingresos: stats.currentWeekIngresos, egresos: stats.currentWeekEgresos, utilidad: stats.utilidad };

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <div>
      <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-30">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-400">Semana {getCurrentWeek()} · {getCurrentYear()}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </header>

      {/* Toggle semana / mes */}
      <div className="flex gap-2 px-4 pt-3 pb-1">
        <button
          onClick={() => setViewMode('semana')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            viewMode === 'semana'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          Esta semana
        </button>
        <button
          onClick={() => setViewMode('mes')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            viewMode === 'mes'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          Por mes
        </button>
      </div>

      {/* Selector de mes */}
      {viewMode === 'mes' && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
          {MESES.map((mes) => (
            <button
              key={mes}
              onClick={() => setSelectedMes(mes)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedMes === mes
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {mes.slice(0, 3)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <SummaryCards
            ingresos={periodoStats.ingresos}
            egresos={periodoStats.egresos}
            utilidad={periodoStats.utilidad}
            label={viewMode === 'semana' ? `Semana ${getCurrentWeek()}` : selectedMes}
          />

          {viewMode === 'semana' && <WeeklyChart data={stats.weeklyChartData} />}
          {viewMode === 'semana' && currentWeekData && (
            <BreakdownPanel
              ingresosPorMetodo={{
                Efectivo: currentWeekData.efectivo,
                Transferencia: currentWeekData.transferencia,
                Rappi: currentWeekData.rappi,
              }}
              egresosPorCategoria={{
                'Gastos Insumos': currentWeekData.gastosInsumos,
                'Sueldos': currentWeekData.sueldos,
                'Gastos Fijos': currentWeekData.gastosFijos,
              }}
              totalIngresos={stats.currentWeekIngresos}
              totalEgresos={stats.currentWeekEgresos}
            />
          )}
          {viewMode === 'mes' && (
            <BreakdownPanel
              ingresosPorMetodo={mesStats.ingresosPorMetodo}
              egresosPorCategoria={mesStats.egresosPorCategoria}
              totalIngresos={mesStats.ingresos}
              totalEgresos={mesStats.egresos}
            />
          )}
          <PaymentMethodBreakdown data={stats.paymentMethodData} />
          <MonthlyTotals data={stats.monthlyTotals} />

          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            <Link
              href="/ingresos/nuevo"
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-2xl py-4 font-medium text-sm shadow-sm active:bg-emerald-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Ingreso
            </Link>
            <Link
              href="/egresos/nuevo"
              className="flex items-center justify-center gap-2 bg-rose-600 text-white rounded-2xl py-4 font-medium text-sm shadow-sm active:bg-rose-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
              Egreso
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
