import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/dates';
import type { MonthlyTotal } from '@/types';

interface Props { data: MonthlyTotal[] }

export function MonthlyTotals({ data }: Props) {
  if (!data.length) return null;
  return (
    <Card className="mx-4 mb-3" padding={false}>
      <h2 className="text-sm font-semibold text-gray-700 px-4 pt-4 pb-2">Resumen mensual</h2>
      <div className="divide-y divide-gray-50">
        {data.slice(0, 6).map((row) => (
          <div key={`${row.anio}-${row.mes}`} className="flex items-center px-4 py-3">
            <span className="text-sm font-medium text-gray-700 w-24 shrink-0">{row.mes}</span>
            <div className="flex-1 grid grid-cols-3 gap-1 text-right">
              <span className="text-xs text-emerald-600 font-medium">{formatCurrency(row.ingresos)}</span>
              <span className="text-xs text-rose-600 font-medium">{formatCurrency(row.egresos)}</span>
              <span className={`text-xs font-semibold ${row.utilidad >= 0 ? 'text-gray-900' : 'text-rose-700'}`}>
                {formatCurrency(row.utilidad)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end px-4 pb-3">
        <div className="flex gap-4 text-[10px] text-gray-400">
          <span>Ingresos</span>
          <span>Egresos</span>
          <span>Utilidad</span>
        </div>
      </div>
    </Card>
  );
}
