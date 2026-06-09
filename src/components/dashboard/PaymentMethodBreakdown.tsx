'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/dates';
import type { PaymentMethodPoint } from '@/types';

const COLORS: Record<string, string> = {
  Efectivo: '#059669',
  Transferencia: '#0ea5e9',
  Rappi: '#f97316',
};

interface Props { data: PaymentMethodPoint[] }

export function PaymentMethodBreakdown({ data }: Props) {
  if (!data.length) return null;
  return (
    <Card className="mx-4 mb-3">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Ingresos por canal (año actual)</h2>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] ?? '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
