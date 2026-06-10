import { MESES } from './constants';

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function getMes(date: Date): string {
  return MESES[date.getMonth()];
}

export function getAnio(date: Date): number {
  return date.getFullYear();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getCurrentWeek(): number {
  return getWeekNumber(new Date());
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function dateToInputValue(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Rango lunes–domingo de una semana ISO de un año dado */
export function getWeekRange(anio: number, semana: number): { inicio: Date; fin: Date } {
  // El 4 de enero siempre cae en la semana ISO 1
  const jan4 = new Date(anio, 0, 4);
  const day = jan4.getDay() || 7; // 1=lunes ... 7=domingo
  const lunesSemana1 = new Date(anio, 0, 4 - (day - 1));
  const inicio = new Date(lunesSemana1);
  inicio.setDate(lunesSemana1.getDate() + (semana - 1) * 7);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  return { inicio, fin };
}

/** "1 jun" — fecha corta sin año */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(date);
}

/** "lun 1" — día de semana + número */
export function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric' }).format(date);
}
