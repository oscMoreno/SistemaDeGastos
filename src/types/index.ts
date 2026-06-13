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

export type Moneda = 'MXN' | 'USD';

export interface Egreso {
  id: string;
  fecha: Timestamp;
  categoria: CategoriaEgreso;
  subcategoria: string;
  monto: number;        // SIEMPRE en MXN (convertido si el ticket era USD)
  semana: number;
  mes: string;
  anio: number;
  imagen_url?: string;
  notas?: string;
  moneda?: Moneda;      // 'USD' solo si el ticket original era en dólares
  monto_usd?: number;   // monto original en USD
  tipo_cambio?: number; // tipo de cambio usado en la conversión
  horas_extras?: number;       // solo categoría Sueldos
  tarifa_hora_extra?: number;  // MXN por hora extra
  monto_horas_extras?: number; // horas_extras × tarifa_hora_extra
}

export interface GeminiReceiptResult {
  monto: number;
  subcategoria: string;
  notas: string;
  fecha: string;
  moneda?: Moneda; // detectada por la IA según el recibo
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
