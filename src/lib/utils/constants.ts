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
  'Gastos Fijos': ['Renta', 'Luz', 'Agua', 'Internet', 'Spotify', 'Gas', 'Coepris', 'Fumigaciones', 'Gasolina', 'Aguinaldos', 'Inversión'],
};

/** Monto semanal a apartar por cada gasto fijo (se muestra como chip en el formulario) */
export const MONTOS_SEMANALES_FIJOS: Record<string, number> = {
  'Renta': 3000,
  'Luz': 1000,
  'Gas': 500,
  'Spotify': 47.25,
  'Internet': 119,
  'Coepris': 58.33,
  'Fumigaciones': 104.16,
  'Gasolina': 300,
  'Aguinaldos': 1295.83,
  'Inversión': 1388.88,
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
