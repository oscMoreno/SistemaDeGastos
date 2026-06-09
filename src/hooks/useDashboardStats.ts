'use client';

import { useMemo } from 'react';
import { getCurrentWeek, getCurrentYear } from '@/lib/utils/dates';
import { MESES } from '@/lib/utils/constants';
import type { Ingreso, Egreso, DashboardStats } from '@/types';

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

    const weeklyChartData = Array.from({ length: 8 }, (_, idx) => {
      const week = currentWeek - (7 - idx);
      if (week <= 0) return { label: `S${week + 52}`, ingresos: 0, egresos: 0 };
      const weekIngresos = ingresos
        .filter((i) => i.semana === week && i.anio === currentYear)
        .reduce((sum, i) => sum + i.monto, 0);
      const weekEgresos = egresos
        .filter((e) => e.semana === week && e.anio === currentYear)
        .reduce((sum, e) => sum + e.monto, 0);
      return { label: `S${week}`, ingresos: weekIngresos, egresos: weekEgresos };
    });

    const paymentMap = { Efectivo: 0, Transferencia: 0, Rappi: 0 } as Record<string, number>;
    ingresos
      .filter((i) => i.anio === currentYear)
      .forEach((i) => { paymentMap[i.metodo_pago] = (paymentMap[i.metodo_pago] || 0) + i.monto; });
    const paymentMethodData = (Object.entries(paymentMap) as [string, number][])
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name as Ingreso['metodo_pago'], value }));

    const monthlyMap: Record<string, { ingresos: number; egresos: number; anio: number }> = {};
    ingresos.forEach((i) => {
      const key = `${i.anio}-${i.mes}`;
      if (!monthlyMap[key]) monthlyMap[key] = { ingresos: 0, egresos: 0, anio: i.anio };
      monthlyMap[key].ingresos += i.monto;
    });
    egresos.forEach((e) => {
      const key = `${e.anio}-${e.mes}`;
      if (!monthlyMap[key]) monthlyMap[key] = { ingresos: 0, egresos: 0, anio: e.anio };
      monthlyMap[key].egresos += e.monto;
    });
    const monthlyTotals = Object.entries(monthlyMap)
      .map(([, v]) => ({ ...v, mes: Object.keys(monthlyMap).find(() => true) ?? '', utilidad: v.ingresos - v.egresos }))
      .sort((a, b) => {
        if (a.anio !== b.anio) return b.anio - a.anio;
        return 0;
      });

    const monthlyTotalsClean = Object.entries(monthlyMap).map(([key, v]) => {
      const mes = key.split('-')[1];
      return {
        mes,
        anio: v.anio,
        ingresos: v.ingresos,
        egresos: v.egresos,
        utilidad: v.ingresos - v.egresos,
      };
    }).sort((a, b) => {
      if (a.anio !== b.anio) return b.anio - a.anio;
      return MESES.indexOf(b.mes) - MESES.indexOf(a.mes);
    });

    void monthlyTotals;

    return {
      currentWeekIngresos,
      currentWeekEgresos,
      utilidad: currentWeekIngresos - currentWeekEgresos,
      weeklyChartData,
      paymentMethodData,
      monthlyTotals: monthlyTotalsClean,
    };
  }, [ingresos, egresos]);
}
