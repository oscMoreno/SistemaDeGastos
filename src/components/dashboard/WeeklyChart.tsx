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

const BAR_COLORS: Record<string, string> = {
  efectivo: '#059669',
  transferencia: '#0ea5e9',
  rappi: '#f97316',
  gastosInsumos: '#3b82f6',
  sueldos: '#a855f7',
  gastosFijos: '#f59e0b',
};

const BAR_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  rappi: 'Rappi',
  gastosInsumos: 'Insumos',
  sueldos: 'Sueldos',
  gastosFijos: 'G. Fijos',
};

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const nonZero = payload.filter((p) => p.value > 0);
  if (!nonZero.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-xs max-w-[200px]">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {nonZero.map((p) => (
        <p key={p.dataKey} style={{ color: BAR_COLORS[p.dataKey] }} className="font-medium">
          {BAR_LABELS[p.dataKey] ?? p.dataKey}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <Card className="mx-4 mb-3">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Últimas 5 semanas</h2>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(v) => BAR_LABELS[v] ?? v} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
          {/* Ingresos apilados (verde → sky → naranja) */}
          <Bar stackId="i" dataKey="efectivo"      fill="#059669" />
          <Bar stackId="i" dataKey="transferencia" fill="#0ea5e9" />
          <Bar stackId="i" dataKey="rappi"         fill="#f97316" radius={[3, 3, 0, 0]} />
          {/* Egresos apilados (azul → morado → ámbar) */}
          <Bar stackId="e" dataKey="gastosInsumos" fill="#3b82f6" />
          <Bar stackId="e" dataKey="sueldos"       fill="#a855f7" />
          <Bar stackId="e" dataKey="gastosFijos"   fill="#f59e0b" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
