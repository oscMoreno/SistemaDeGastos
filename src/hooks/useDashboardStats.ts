'use client';

import { useMemo } from 'react';
import { getCurrentWeek, getCurrentYear } from '@/lib/utils/dates';
import { MESES } from '@/lib/utils/constants';
import type { Ingreso, Egreso, DashboardStats, MetodoPago, CategoriaEgreso } from '@/types';

const EMPTY_METODO: Record<MetodoPago, number> = { Efectivo: 0, Transferencia: 0, Rappi: 0 };
const EMPTY_CATEGORIA: Record<CategoriaEgreso, number> = { 'Gastos Insumos': 0, 'Sueldos': 0, 'Gastos Fijos': 0 };

export function useDashboardStats(ingresos: Ingreso[], egresos: Egreso[]): DashboardStats {
  return useMemo(() => {
    const currentWeek = getCurrentWeek();
    const currentYear = getCurrentYear();

    const currentWeekIngresos = ingresos
      .filter((i) => i.semana === currentWeek && i.anio === currentYear)
      .reduce((sum, i) => sum + i.monto, 0);

    const currentWeekEgresos = egresos
      .filter((e) => e.semana === currentWeek && e.anio === currentYear)
      .reduce((sum, e) => sum + e.monto, 0);

    // Últimas 5 semanas con desglose por método de pago (ingresos) y categoría (egresos)
    const weeklyChartData = Array.from({ length: 5 }, (_, idx) => {
      const week = currentWeek - (4 - idx);
      if (week <= 0) {
        return {
          label: `S${week + 52}`,
          ingresos: 0, egresos: 0,
          efectivo: 0, transferencia: 0, rappi: 0,
          gastosInsumos: 0, sueldos: 0, gastosFijos: 0,
        };
      }
      const semIngresos = ingresos.filter((i) => i.semana === week && i.anio === currentYear);
      const semEgresos = egresos.filter((e) => e.semana === week && e.anio === currentYear);
      const efectivo = semIngresos.filter((i) => i.metodo_pago === 'Efectivo').reduce((s, i) => s + i.monto, 0);
      const transferencia = semIngresos.filter((i) => i.metodo_pago === 'Transferencia').reduce((s, i) => s + i.monto, 0);
      const rappi = semIngresos.filter((i) => i.metodo_pago === 'Rappi').reduce((s, i) => s + i.monto, 0);
      const gastosInsumos = semEgresos.filter((e) => e.categoria === 'Gastos Insumos').reduce((s, e) => s + e.monto, 0);
      const sueldos = semEgresos.filter((e) => e.categoria === 'Sueldos').reduce((s, e) => s + e.monto, 0);
      const gastosFijos = semEgresos.filter((e) => e.categoria === 'Gastos Fijos').reduce((s, e) => s + e.monto, 0);
      return {
        label: `S${week}`,
        ingresos: efectivo + transferencia + rappi,
        egresos: gastosInsumos + sueldos + gastosFijos,
        efectivo, transferencia, rappi,
        gastosInsumos, sueldos, gastosFijos,
      };
    });

    const paymentMap = { Efectivo: 0, Transferencia: 0, Rappi: 0 } as Record<string, number>;
    ingresos
      .filter((i) => i.anio === currentYear)
      .forEach((i) => { paymentMap[i.metodo_pago] = (paymentMap[i.metodo_pago] || 0) + i.monto; });
    const paymentMethodData = (Object.entries(paymentMap) as [string, number][])
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name as Ingreso['metodo_pago'], value }));

    // Totales mensuales con desglose — construidos en un único pase por los arrays
    const monthlyMap: Record<string, { ingresos: number; egresos: number; anio: number }> = {};
    const monthlyBreakdown: Record<string, {
      ingresosPorMetodo: Record<string, number>;
      egresosPorCategoria: Record<string, number>;
    }> = {};

    ingresos.forEach((i) => {
      const key = `${i.anio}-${i.mes}`;
      if (!monthlyMap[key]) monthlyMap[key] = { ingresos: 0, egresos: 0, anio: i.anio };
      monthlyMap[key].ingresos += i.monto;
      if (!monthlyBreakdown[key]) monthlyBreakdown[key] = {
        ingresosPorMetodo: { Efectivo: 0, Transferencia: 0, Rappi: 0 },
        egresosPorCategoria: { 'Gastos Insumos': 0, 'Sueldos': 0, 'Gastos Fijos': 0 },
      };
      monthlyBreakdown[key].ingresosPorMetodo[i.metodo_pago] =
        (monthlyBreakdown[key].ingresosPorMetodo[i.metodo_pago] || 0) + i.monto;
    });

    egresos.forEach((e) => {
      const key = `${e.anio}-${e.mes}`;
      if (!monthlyMap[key]) monthlyMap[key] = { ingresos: 0, egresos: 0, anio: e.anio };
      monthlyMap[key].egresos += e.monto;
      if (!monthlyBreakdown[key]) monthlyBreakdown[key] = {
        ingresosPorMetodo: { Efectivo: 0, Transferencia: 0, Rappi: 0 },
        egresosPorCategoria: { 'Gastos Insumos': 0, 'Sueldos': 0, 'Gastos Fijos': 0 },
      };
      monthlyBreakdown[key].egresosPorCategoria[e.categoria] =
        (monthlyBreakdown[key].egresosPorCategoria[e.categoria] || 0) + e.monto;
    });

    const monthlyTotals = Object.entries(monthlyMap).map(([key, v]) => {
      const mes = key.split('-')[1];
      const bd = monthlyBreakdown[key] ?? {
        ingresosPorMetodo: { ...EMPTY_METODO },
        egresosPorCategoria: { ...EMPTY_CATEGORIA },
      };
      return {
        mes,
        anio: v.anio,
        ingresos: v.ingresos,
        egresos: v.egresos,
        utilidad: v.ingresos - v.egresos,
        ingresosPorMetodo: bd.ingresosPorMetodo as Record<MetodoPago, number>,
        egresosPorCategoria: bd.egresosPorCategoria as Record<CategoriaEgreso, number>,
      };
    }).sort((a, b) => {
      if (a.anio !== b.anio) return b.anio - a.anio;
      return MESES.indexOf(b.mes) - MESES.indexOf(a.mes);
    });

    return {
      currentWeekIngresos,
      currentWeekEgresos,
      utilidad: currentWeekIngresos - currentWeekEgresos,
      weeklyChartData,
      paymentMethodData,
      monthlyTotals,
    };
  }, [ingresos, egresos]);
}
