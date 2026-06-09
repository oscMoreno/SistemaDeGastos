import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/dates';

interface SummaryCardsProps {
  ingresos: number;
  egresos: number;
  utilidad: number;
  label?: string;
}

export function SummaryCards({ ingresos, egresos, utilidad, label }: SummaryCardsProps) {
  return (
    <div>
      {label && (
        <p className="text-xs text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide font-medium">{label}</p>
      )}
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
    </div>
  );
}
