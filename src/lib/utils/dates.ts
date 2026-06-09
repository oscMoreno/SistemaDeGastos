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
