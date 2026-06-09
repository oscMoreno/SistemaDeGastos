import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  type Query,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { getFirebaseApp } from './config';
import type { Ingreso, Egreso } from '@/types';
import { getWeekNumber, getMes, getAnio } from '@/lib/utils/dates';

function getDb() {
  return getFirestore(getFirebaseApp());
}

function computeDateFields(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00');
  return {
    fecha: Timestamp.fromDate(date),
    semana: getWeekNumber(date),
    mes: getMes(date),
    anio: getAnio(date),
  };
}

export async function addIngreso(data: Omit<Ingreso, 'id' | 'fecha' | 'semana' | 'mes' | 'anio'> & { fechaStr: string }) {
  const { fechaStr, ...rest } = data;
  const dateFields = computeDateFields(fechaStr);
  const docRef = await addDoc(collection(getDb(), 'ingresos'), { ...rest, ...dateFields });
  return docRef.id;
}

export async function addEgreso(data: Omit<Egreso, 'id' | 'fecha' | 'semana' | 'mes' | 'anio'> & { fechaStr: string }) {
  const { fechaStr, ...rest } = data;
  const dateFields = computeDateFields(fechaStr);
  const docRef = await addDoc(collection(getDb(), 'egresos'), { ...rest, ...dateFields });
  return docRef.id;
}

export async function deleteIngreso(id: string) {
  await deleteDoc(doc(getDb(), 'ingresos', id));
}

export async function deleteEgreso(id: string) {
  await deleteDoc(doc(getDb(), 'egresos', id));
}

export function ingresosQuery(filters?: { mes?: string; anio?: number }): Query<DocumentData> {
  const col = collection(getDb(), 'ingresos');
  const constraints: QueryConstraint[] = [orderBy('fecha', 'desc')];
  if (filters?.anio) constraints.unshift(where('anio', '==', filters.anio));
  if (filters?.mes) constraints.unshift(where('mes', '==', filters.mes));
  return query(col, ...constraints);
}

export function egresosQuery(filters?: { categoria?: string; mes?: string; anio?: number }): Query<DocumentData> {
  const col = collection(getDb(), 'egresos');
  const constraints: QueryConstraint[] = [orderBy('fecha', 'desc')];
  if (filters?.anio) constraints.unshift(where('anio', '==', filters.anio));
  if (filters?.mes) constraints.unshift(where('mes', '==', filters.mes));
  if (filters?.categoria) constraints.unshift(where('categoria', '==', filters.categoria));
  return query(col, ...constraints);
}

export function subscribeToIngresos(
  filters: { anio: number },
  callback: (data: Ingreso[]) => void
) {
  const q = ingresosQuery(filters);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Ingreso));
    callback(data);
  });
}

export function subscribeToEgresos(
  filters: { anio: number },
  callback: (data: Egreso[]) => void
) {
  const q = egresosQuery(filters);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Egreso));
    callback(data);
  });
}
