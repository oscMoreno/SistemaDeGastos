'use client';

import { useState } from 'react';
import { formatCurrency, formatDateShort, formatDayLabel, getCurrentWeek } from '@/lib/utils/dates';
import { METODOS_PAGO, METODO_COLORS, CATEGORIA_COLORS } from '@/lib/utils/constants';
import { getNotaSemanal, setNotaSemanal } from '@/lib/firebase/firestore';
import { exportSemanaCsv } from '@/lib/utils/export';
import { useToast } from '@/context/ToastContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ResumenSemanal } from '@/types';

interface WeekCardProps {
  resumen: ResumenSemanal;
  /** Resumen de la semana anterior, para la comparativa */
  anterior?: ResumenSemanal;
  anio: number;
}

function deltaPct(actual: number, previo: number): string | null {
  if (previo === 0) return null;
  const pct = ((actual - previo) / Math.abs(previo)) * 100;
  const signo = pct >= 0 ? '+' : '';
  return `${signo}${pct.toFixed(0)}%`;
}

export function WeekCard({ resumen, anterior, anio }: WeekCardProps) {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [nota, setNota] = useState('');
  const [notaCargada, setNotaCargada] = useState(false);
  const [guardandoNota, setGuardandoNota] = useState(false);

  const esActual = resumen.semana === getCurrentWeek();
  const positiva = resumen.utilidad >= 0;

  // Solo comparar si realmente es la semana inmediata anterior (sin huecos)
  const prev = anterior && anterior.semana === resumen.semana - 1 ? anterior : undefined;
  const deltaIngresos = prev ? deltaPct(resumen.ingresosTotal, prev.ingresosTotal) : null;
  const deltaEgresos = prev ? deltaPct(resumen.egresosTotal, prev.egresosTotal) : null;

  const mejorDia = resumen.ingresosPorDia.reduce<typeof resumen.ingresosPorDia[number] | null>(
    (best, dia) => (best === null || dia.total > best.total ? dia : best),
    null
  );

  async function toggleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next && !notaCargada) {
      try {
        setNota(await getNotaSemanal(anio, resumen.semana));
      } catch { /* sin conexión: textarea vacío */ }
      setNotaCargada(true);
    }
  }

  async function handleGuardarNota() {
    setGuardandoNota(true);
    try {
      await setNotaSemanal(anio, resumen.semana, nota);
      showToast('Nota guardada');
    } catch {
      showToast('No se pudo guardar la nota', 'error');
    } finally {
      setGuardandoNota(false);
    }
  }

  function handleExport() {
    exportSemanaCsv(resumen, anio, nota.trim() || undefined);
    showToast(`Semana ${resumen.semana} exportada`);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Encabezado: siempre visible, tap para expandir */}
      <button
        type="button"
        onClick={toggleExpand}
        className="w-full text-left px-4 py-3 active:bg-gray-50 min-h-[44px]"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">Semana {resumen.semana}</span>
            {esActual && (
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                Actual
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {formatDateShort(resumen.inicio)} – {formatDateShort(resumen.fin)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-gray-400 uppercase">Ingresos</p>
            <p className="text-sm font-bold text-emerald-600">{formatCurrency(resumen.ingresosTotal)}</p>
            {deltaIngresos && (
              <p className={`text-[10px] font-medium ${deltaIngresos.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {deltaIngresos} vs S{resumen.semana - 1}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase">Egresos</p>
            <p className="text-sm font-bold text-rose-600">{formatCurrency(resumen.egresosTotal)}</p>
            {deltaEgresos && (
              <p className={`text-[10px] font-medium ${deltaEgresos.startsWith('+') ? 'text-rose-500' : 'text-emerald-500'}`}>
                {deltaEgresos} vs S{resumen.semana - 1}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase">Utilidad</p>
            <p className={`text-sm font-bold ${positiva ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(resumen.utilidad)}
            </p>
          </div>
        </div>
        <div className="flex justify-center mt-1">
          <svg
            className={`w-4 h-4 text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 px-4 py-3 space-y-4">
          {/* Mejor día */}
          {mejorDia && (
            <p className="text-xs text-gray-500">
              Mejor día: <span className="font-semibold text-gray-700 capitalize">{formatDayLabel(mejorDia.fecha)}</span>{' '}
              <span className="font-semibold text-emerald-600">{formatCurrency(mejorDia.total)}</span>
            </p>
          )}

          {/* Ingresos por día */}
          {resumen.ingresosPorDia.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Ingresos por día</p>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="text-left font-medium px-1 pb-1">Día</th>
                      {METODOS_PAGO.map((m) => (
                        <th key={m} className="text-right font-medium px-1 pb-1">{m === 'Transferencia' ? 'Transf.' : m}</th>
                      ))}
                      <th className="text-right font-semibold px-1 pb-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.ingresosPorDia.map((dia) => (
                      <tr key={dia.fecha.toISOString()} className="border-t border-gray-50">
                        <td className="px-1 py-1.5 capitalize text-gray-600">{formatDayLabel(dia.fecha)}</td>
                        {METODOS_PAGO.map((m) => (
                          <td key={m} className="px-1 py-1.5 text-right text-gray-700">
                            {dia.porMetodo[m] > 0 ? formatCurrency(dia.porMetodo[m]) : '—'}
                          </td>
                        ))}
                        <td className="px-1 py-1.5 text-right font-semibold text-gray-900">{formatCurrency(dia.total)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-100">
                      <td className="px-1 py-1.5 font-semibold text-gray-700">Total</td>
                      {METODOS_PAGO.map((m) => (
                        <td key={m} className="px-1 py-1.5 text-right font-semibold text-emerald-700">
                          {resumen.ingresosPorMetodo[m] > 0 ? formatCurrency(resumen.ingresosPorMetodo[m]) : '—'}
                        </td>
                      ))}
                      <td className="px-1 py-1.5 text-right font-bold text-emerald-700">{formatCurrency(resumen.ingresosTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Egresos por categoría */}
          {resumen.egresosPorCategoria.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Egresos</p>
              <div className="space-y-3">
                {resumen.egresosPorCategoria.map((cat) => (
                  <div key={cat.categoria}>
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={CATEGORIA_COLORS[cat.categoria]}>{cat.categoria}</Badge>
                      <span className="text-xs font-bold text-rose-600">{formatCurrency(cat.total)}</span>
                    </div>
                    <ul className="space-y-0.5">
                      {cat.items.map((item) => (
                        <li key={item.subcategoria} className="flex justify-between text-xs text-gray-600 px-1">
                          <span>
                            {item.subcategoria}
                            {item.veces > 1 && <span className="text-gray-400"> ×{item.veces}</span>}
                          </span>
                          <span>{formatCurrency(item.monto)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Métodos de pago de la semana (chips) */}
          <div className="flex gap-2 flex-wrap">
            {METODOS_PAGO.filter((m) => resumen.ingresosPorMetodo[m] > 0).map((m) => (
              <Badge key={m} className={METODO_COLORS[m]}>
                {m}: {formatCurrency(resumen.ingresosPorMetodo[m])}
              </Badge>
            ))}
          </div>

          {/* Nota de la semana */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Nota de la semana <span className="font-normal normal-case text-gray-400">· opcional</span>
            </p>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Faltas, eventos, recordatorios... (ej. Valeria faltó 3 días)"
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
            <div className="flex gap-2 mt-1">
              <Button type="button" size="sm" variant="secondary" onClick={handleGuardarNota} loading={guardandoNota}>
                Guardar nota
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={handleExport}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Exportar semana (CSV)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
