import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/dates';

interface SummaryCardsProps {
  ingresos: number;
  egresos: number;
  utilidad: number;
}

export function SummaryCards({ ingresos, egresos, utilidad }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-3">
      <Card className="text-center">
        <p className="text-xs text-gray-500 mb-1">Ingresos</p>
        <p className="text-base font-bold text-emerald-600 leading-tight">{formatCurrency(ingresos)}</p>
      </Card>
      <Card className="text-center">
        <p className="text-xs text-gray-500 mb-1">Egresos</p>
        <p className="text-base font-bold text-rose-600 leading-tight">{formatCurrency(egresos)}</p>
      </Card>
      <Card className={`text-center ${utilidad >= 0 ? '' : 'border-rose-200'}`}>
        <p className="text-xs text-gray-500 mb-1">Utilidad</p>
        <p className={`text-base font-bold leading-tight ${utilidad >= 0 ? 'text-gray-900' : 'text-rose-600'}`}>
          {formatCurrency(utilidad)}
        </p>
      </Card>
    </div>
  );
}
