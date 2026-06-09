import type { CategoriaEgreso, MetodoPago } from '@/types';

export const METODOS_PAGO: MetodoPago[] = ['Efectivo', 'Transferencia', 'Rappi'];

export const CATEGORIAS_EGRESO: CategoriaEgreso[] = [
  'Gastos Insumos',
  'Sueldos',
  'Gastos Fijos',
];

export const SUBCATEGORIAS: Record<CategoriaEgreso, string[]> = {
  'Gastos Insumos': ['Smart', 'City Club', 'Carnemaf', 'Disfruta', 'Central de Abastos'],
  'Sueldos': ['Valeria', 'Javier', 'Clemente', 'Sabina'],
  'Gastos Fijos': ['Renta', 'Luz', 'Agua', 'Internet', 'Spotify', 'Gas'],
};

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const CATEGORIA_COLORS: Record<CategoriaEgreso, string> = {
  'Gastos Insumos': 'bg-blue-100 text-blue-800',
  'Sueldos': 'bg-purple-100 text-purple-800',
  'Gastos Fijos': 'bg-amber-100 text-amber-800',
};

export const METODO_COLORS: Record<string, string> = {
  'Efectivo': 'bg-emerald-100 text-emerald-800',
  'Transferencia': 'bg-sky-100 text-sky-800',
  'Rappi': 'bg-orange-100 text-orange-800',
};
