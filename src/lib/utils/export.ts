import { METODOS_PAGO } from './constants';
import { formatDayLabel, formatDateShort } from './dates';
import type { Ingreso, Egreso, ResumenSemanal } from '@/types';

type CsvCell = string | number;

function escapeCsvCell(cell: CsvCell): string {
  const s = String(cell);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows: CsvCell[][]): string {
  return rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
}

/** Descarga un CSV con BOM UTF-8 (acentos correctos al abrir en Excel) */
export function downloadCsv(filename: string, rows: CsvCell[][]): void {
  const blob = new Blob(['\uFEFF' + rowsToCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Reporte de una semana con el formato del Excel original */
export function exportSemanaCsv(resumen: ResumenSemanal, anio: number, nota?: string): void {
  const rows: CsvCell[][] = [];

  rows.push([`Semana ${resumen.semana} (${formatDateShort(resumen.inicio)} - ${formatDateShort(resumen.fin)} ${anio})`]);
  rows.push([]);

  // Ingresos por día
  rows.push(['INGRESOS']);
  rows.push(['Día', ...METODOS_PAGO, 'Total']);
  for (const dia of resumen.ingresosPorDia) {
    rows.push([
      formatDayLabel(dia.fecha),
      ...METODOS_PAGO.map((m) => dia.porMetodo[m]),
      dia.total,
    ]);
  }
  rows.push(['Total', ...METODOS_PAGO.map((m) => resumen.ingresosPorMetodo[m]), resumen.ingresosTotal]);
  rows.push([]);

  // Egresos por categoría
  rows.push(['EGRESOS']);
  rows.push(['Categoría', 'Subcategoría', 'Veces', 'Total']);
  for (const cat of resumen.egresosPorCategoria) {
    for (const item of cat.items) {
      rows.push([cat.categoria, item.subcategoria, item.veces, item.monto]);
    }
    rows.push([`Total ${cat.categoria}`, '', '', cat.total]);
  }
  rows.push(['Total egresos', '', '', resumen.egresosTotal]);
  rows.push([]);

  // Resumen
  rows.push(['RESUMEN']);
  rows.push(['Ingresos', resumen.ingresosTotal]);
  rows.push(['Egresos', resumen.egresosTotal]);
  rows.push(['Utilidad', resumen.utilidad]);
  if (nota) {
    rows.push([]);
    rows.push(['Nota', nota]);
  }

  downloadCsv(`semana-${resumen.semana}-${anio}.csv`, rows);
}

/** Todos los movimientos del año en una tabla plana (para el contador) */
export function exportAnioCsv(ingresos: Ingreso[], egresos: Egreso[], anio: number): void {
  const rows: CsvCell[][] = [
    ['Tipo', 'Fecha', 'Semana', 'Mes', 'Método / Categoría', 'Subcategoría', 'Monto', 'Notas'],
  ];

  type Mov = { ts: number; row: CsvCell[] };
  const movs: Mov[] = [
    ...ingresos.map((i) => ({
      ts: i.fecha.toMillis(),
      row: ['Ingreso', i.fecha.toDate().toLocaleDateString('es-MX'), i.semana, i.mes, i.metodo_pago, '', i.monto, i.notas ?? ''] as CsvCell[],
    })),
    ...egresos.map((e) => ({
      ts: e.fecha.toMillis(),
      row: ['Egreso', e.fecha.toDate().toLocaleDateString('es-MX'), e.semana, e.mes, e.categoria, e.subcategoria, -e.monto, e.notas ?? ''] as CsvCell[],
    })),
  ].sort((a, b) => a.ts - b.ts);

  rows.push(...movs.map((m) => m.row));

  const totalIngresos = ingresos.reduce((s, i) => s + i.monto, 0);
  const totalEgresos = egresos.reduce((s, e) => s + e.monto, 0);
  rows.push([]);
  rows.push(['Total ingresos', '', '', '', '', '', totalIngresos, '']);
  rows.push(['Total egresos', '', '', '', '', '', -totalEgresos, '']);
  rows.push(['Utilidad', '', '', '', '', '', totalIngresos - totalEgresos, '']);

  downloadCsv(`movimientos-${anio}.csv`, rows);
}
