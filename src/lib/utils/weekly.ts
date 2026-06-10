import { METODOS_PAGO, CATEGORIAS_EGRESO } from './constants';
import { getWeekRange, getCurrentYear } from './dates';
import type { Ingreso, Egreso, ResumenSemanal, IngresoDia, EgresoCategoriaResumen, MetodoPago } from '@/types';

function emptyPorMetodo(): Record<MetodoPago, number> {
  return Object.fromEntries(METODOS_PAGO.map((m) => [m, 0])) as Record<MetodoPago, number>;
}

/**
 * Agrupa ingresos y egresos por número de semana (campo `semana` ya almacenado)
 * y produce el resumen tipo Excel: ingresos por día/método, egresos por
 * categoría con subcategorías sumadas, y utilidad de la semana.
 * Resultado ordenado de la semana más reciente a la más antigua.
 */
export function computeResumenesSemanales(
  ingresos: Ingreso[],
  egresos: Egreso[],
  anio: number = getCurrentYear()
): ResumenSemanal[] {
  const semanas = new Set<number>();
  ingresos.forEach((i) => semanas.add(i.semana));
  egresos.forEach((e) => semanas.add(e.semana));

  const resumenes: ResumenSemanal[] = [];

  for (const semana of semanas) {
    const ins = ingresos.filter((i) => i.semana === semana);
    const egs = egresos.filter((e) => e.semana === semana);

    // Ingresos por método (total semanal)
    const ingresosPorMetodo = emptyPorMetodo();
    let ingresosTotal = 0;
    for (const i of ins) {
      ingresosPorMetodo[i.metodo_pago] += i.monto;
      ingresosTotal += i.monto;
    }

    // Ingresos por día (solo días con registros), ordenados cronológicamente
    const porDiaMap = new Map<string, IngresoDia>();
    for (const i of ins) {
      const fecha = i.fecha.toDate();
      const key = fecha.toDateString();
      let dia = porDiaMap.get(key);
      if (!dia) {
        dia = { fecha, porMetodo: emptyPorMetodo(), total: 0 };
        porDiaMap.set(key, dia);
      }
      dia.porMetodo[i.metodo_pago] += i.monto;
      dia.total += i.monto;
    }
    const ingresosPorDia = [...porDiaMap.values()].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

    // Egresos por categoría, con subcategorías agregadas (suma + veces)
    const egresosPorCategoria: EgresoCategoriaResumen[] = [];
    let egresosTotal = 0;
    for (const categoria of CATEGORIAS_EGRESO) {
      const deCat = egs.filter((e) => e.categoria === categoria);
      if (deCat.length === 0) continue;
      const subMap = new Map<string, { monto: number; veces: number }>();
      let total = 0;
      for (const e of deCat) {
        const acc = subMap.get(e.subcategoria) ?? { monto: 0, veces: 0 };
        acc.monto += e.monto;
        acc.veces += 1;
        subMap.set(e.subcategoria, acc);
        total += e.monto;
      }
      egresosTotal += total;
      egresosPorCategoria.push({
        categoria,
        total,
        items: [...subMap.entries()]
          .map(([subcategoria, v]) => ({ subcategoria, ...v }))
          .sort((a, b) => b.monto - a.monto),
      });
    }

    const { inicio, fin } = getWeekRange(anio, semana);
    resumenes.push({
      semana,
      inicio,
      fin,
      ingresosTotal,
      ingresosPorMetodo,
      ingresosPorDia,
      egresosTotal,
      egresosPorCategoria,
      utilidad: ingresosTotal - egresosTotal,
    });
  }

  return resumenes.sort((a, b) => b.semana - a.semana);
}
