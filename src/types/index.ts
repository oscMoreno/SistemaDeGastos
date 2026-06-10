import { Timestamp } from 'firebase/firestore';

export type MetodoPago = 'Efectivo' | 'Transferencia' | 'Rappi';
export type CategoriaEgreso = 'Gastos Insumos' | 'Sueldos' | 'Gastos Fijos';

/** Listas de subcategorías por categoría (editables en la app, doc config/subcategorias) */
export type SubcategoriasMap = Record<CategoriaEgreso, string[]>;

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

/** Resumen semana por semana (vista tipo Excel original) */
export interface ResumenSemanal {
  semana: number;
  inicio: Date;
  fin: Date;
  ingresosTotal: number;
  ingresosPorMetodo: Record<MetodoPago, number>;
  ingresosPorDia: IngresoDia[];
  egresosTotal: number;
  egresosPorCategoria: EgresoCategoriaResumen[];
  utilidad: number;
}

export interface IngresoDia {
  fecha: Date;
  porMetodo: Record<MetodoPago, number>;
  total: number;
}

export interface EgresoCategoriaResumen {
  categoria: CategoriaEgreso;
  total: number;
  items: { subcategoria: string; monto: number; veces: number }[];
}
