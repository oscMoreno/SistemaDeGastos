'use client';

import { formatCurrency } from '@/lib/utils/dates';
import { Card } from '@/components/ui/Card';
import type { MetodoPago, CategoriaEgreso } from '@/types';

interface Props {
  ingresosPorMetodo: Record<MetodoPago, number>;
  egresosPorCategoria: Record<CategoriaEgreso, number>;
  totalIngresos: number;
  totalEgresos: number;
}

const METODO_BAR: Record<MetodoPago, string> = {
  'Efectivo': 'bg-emerald-500',
  'Transferencia': 'bg-sky-500',
  'Rappi': 'bg-orange-500',
};

const CATEGORIA_BAR: Record<CategoriaEgreso, string> = {
  'Gastos Insumos': 'bg-blue-500',
  'Sueldos': 'bg-purple-500',
  'Gastos Fijos': 'bg-amber-500',
};

function Row({ label, monto, total, color }: { label: string; monto: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((monto / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-20 text-right shrink-0">{formatCurrency(monto)}</span>
    </div>
  );
}

export function BreakdownPanel({ ingresosPorMetodo, egresosPorCategoria, totalIngresos, totalEgresos }: Props) {
  return (
    <Card className="mx-4 mb-3">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ingresos por canal</p>
          <div className="flex flex-col gap-2.5">
            {(['Efectivo', 'Transferencia', 'Rappi'] as MetodoPago[]).map((m) => (
              <Row key={m} label={m} monto={ingresosPorMetodo[m] ?? 0} total={totalIngresos} color={METODO_BAR[m]} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Egresos por categoría</p>
          <div className="flex flex-col gap-2.5">
            {(['Gastos Insumos', 'Sueldos', 'Gastos Fijos'] as CategoriaEgreso[]).map((c) => (
              <Row key={c} label={c} monto={egresosPorCategoria[c] ?? 0} total={totalEgresos} color={CATEGORIA_BAR[c]} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
