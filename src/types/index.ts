import { Timestamp } from 'firebase/firestore';

export type MetodoPago = 'Efectivo' | 'Transferencia' | 'Rappi';
export type CategoriaEgreso = 'Gastos Insumos' | 'Sueldos' | 'Gastos Fijos';

export interface Ingreso {
  id: string;
  fecha: Timestamp;
  metodo_pago: MetodoPago;
  monto: number;
  semana: number;
  mes: string;
  anio: number;
  notas?: string;
}

export interface Egreso {
  id: string;
  fecha: Timestamp;
  categoria: CategoriaEgreso;
  subcategoria: string;
  monto: number;
  semana: number;
  mes: string;
  anio: number;
  imagen_url?: string;
  notas?: string;
}

export interface GeminiReceiptResult {
  monto: number;
  subcategoria: string;
  notas: string;
  fecha: string;
}

export interface DashboardStats {
  currentWeekIngresos: number;
  currentWeekEgresos: number;
  utilidad: number;
  weeklyChartData: WeeklyChartPoint[];
  paymentMethodData: PaymentMethodPoint[];
  monthlyTotals: MonthlyTotal[];
}

export interface WeeklyChartPoint {
  label: string;
  ingresos: number;
  egresos: number;
}

export interface PaymentMethodPoint {
  name: MetodoPago;
  value: number;
}

export interface MonthlyTotal {
  mes: string;
  anio: number;
  ingresos: number;
  egresos: number;
  utilidad: number;
}
