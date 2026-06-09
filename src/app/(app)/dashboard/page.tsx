'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useIngresos } from '@/hooks/useIngresos';
import { useEgresos } from '@/hooks/useEgresos';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { WeeklyChart } from '@/components/dashboard/WeeklyChart';
import { PaymentMethodBreakdown } from '@/components/dashboard/PaymentMethodBreakdown';
import { MonthlyTotals } from '@/components/dashboard/MonthlyTotals';
import { Spinner } from '@/components/ui/Spinner';
import { getCurrentWeek, getCurrentYear } from '@/lib/utils/dates';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { ingresos, loading: loadingI } = useIngresos();
  const { egresos, loading: loadingE } = useEgresos();
  const stats = useDashboardStats(ingresos, egresos);
  const router = useRouter();

  const loading = loadingI || loadingE;

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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="pt-1">
            <p className="text-xs text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide font-medium">Esta semana</p>
            <SummaryCards
              ingresos={stats.currentWeekIngresos}
              egresos={stats.currentWeekEgresos}
              utilidad={stats.utilidad}
            />
          </div>

          <WeeklyChart data={stats.weeklyChartData} />
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
