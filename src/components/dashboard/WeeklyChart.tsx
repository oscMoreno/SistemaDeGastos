'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/dates';
import type { WeeklyChartPoint } from '@/types';

interface WeeklyChartProps {
  data: WeeklyChartPoint[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className={p.name === 'ingresos' ? 'text-emerald-600' : 'text-rose-600'}>
          {p.name === 'ingresos' ? 'Ingresos' : 'Egresos'}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <Card className="mx-4 mb-3">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Últimas 8 semanas</h2>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(v) => v === 'ingresos' ? 'Ingresos' : 'Egresos'} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="ingresos" fill="#059669" radius={[4, 4, 0, 0]} />
          <Bar dataKey="egresos" fill="#e11d48" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
