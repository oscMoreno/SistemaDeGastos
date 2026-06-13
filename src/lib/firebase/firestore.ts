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
  getDocs,
  getDoc,
  updateDoc,
  deleteField,
  setDoc,
  arrayUnion,
  arrayRemove,
  type Query,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { getFirebaseApp } from './config';
import { deleteStorageFile } from './storage';
import type { Ingreso, Egreso, CategoriaEgreso, SubcategoriasMap } from '@/types';
import { getWeekNumber, getMes, getAnio } from '@/lib/utils/dates';
import { SUBCATEGORIAS } from '@/lib/utils/constants';

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

/** Firestore no acepta `undefined`: eliminar esas claves antes de escribir */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export async function addIngreso(data: Omit<Ingreso, 'id' | 'fecha' | 'semana' | 'mes' | 'anio'> & { fechaStr: string }) {
  const { fechaStr, ...rest } = data;
  const dateFields = computeDateFields(fechaStr);
  const docRef = await addDoc(collection(getDb(), 'ingresos'), stripUndefined({ ...rest, ...dateFields }));
  return docRef.id;
}

export async function addEgreso(data: Omit<Egreso, 'id' | 'fecha' | 'semana' | 'mes' | 'anio'> & { fechaStr: string }) {
  const { fechaStr, ...rest } = data;
  const dateFields = computeDateFields(fechaStr);
  const docRef = await addDoc(collection(getDb(), 'egresos'), stripUndefined({ ...rest, ...dateFields }));
  return docRef.id;
}

export async function updateIngreso(
  id: string,
  data: Omit<Ingreso, 'id' | 'fecha' | 'semana' | 'mes' | 'anio'> & { fechaStr: string }
) {
  const { fechaStr, ...rest } = data;
  const dateFields = computeDateFields(fechaStr);
  await updateDoc(doc(getDb(), 'ingresos', id), {
    ...stripUndefined(rest),
    ...dateFields,
    // Si las notas quedaron vacías, limpiar el campo
    ...(rest.notas === undefined ? { notas: deleteField() } : {}),
  });
}

export async function updateEgreso(
  id: string,
  data: Omit<Egreso, 'id' | 'fecha' | 'semana' | 'mes' | 'anio' | 'imagen_url'> & { fechaStr: string }
) {
  const { fechaStr, ...rest } = data;
  const dateFields = computeDateFields(fechaStr);
  // imagen_url no se toca al editar: se conserva la del recibo original
  await updateDoc(doc(getDb(), 'egresos', id), {
    ...stripUndefined(rest),
    ...dateFields,
    ...(rest.notas === undefined ? { notas: deleteField() } : {}),
    // Si el egreso dejó de ser USD, limpiar los campos de conversión
    ...(rest.moneda === undefined ? { moneda: deleteField(), monto_usd: deleteField(), tipo_cambio: deleteField() } : {}),
    // Si ya no hay horas extras, limpiar los campos
    ...(rest.horas_extras === undefined ? { horas_extras: deleteField(), tarifa_hora_extra: deleteField(), monto_horas_extras: deleteField() } : {}),
  });
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
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Ingreso));
      callback(data);
    },
    (err) => {
      // No dejar la app cargando para siempre: entregar lista vacía y loguear
      console.error('[ingresos] listener error:', err.code, err.message);
      callback([]);
    }
  );
}

export function subscribeToEgresos(
  filters: { anio: number },
  callback: (data: Egreso[]) => void
) {
  const q = egresosQuery(filters);
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Egreso));
      callback(data);
    },
    (err) => {
      console.error('[egresos] listener error:', err.code, err.message);
      callback([]);
    }
  );
}

// ---------------------------------------------------------------------------
// Subcategorías dinámicas (doc config/subcategorias)
// Las listas (personal, proveedores, gastos fijos) son editables desde la app.
// SUBCATEGORIAS de constants.ts solo se usa como semilla inicial y fallback.
// ---------------------------------------------------------------------------

function subcategoriasRef() {
  return doc(getDb(), 'config', 'subcategorias');
}

export function subscribeToSubcategorias(callback: (data: SubcategoriasMap) => void) {
  return onSnapshot(
    subcategoriasRef(),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
          'Gastos Insumos': (data['Gastos Insumos'] as string[]) ?? SUBCATEGORIAS['Gastos Insumos'],
          'Sueldos': (data['Sueldos'] as string[]) ?? SUBCATEGORIAS['Sueldos'],
          'Gastos Fijos': (data['Gastos Fijos'] as string[]) ?? SUBCATEGORIAS['Gastos Fijos'],
        });
      } else {
        // Primera vez: sembrar el doc con los defaults de constants.ts
        setDoc(subcategoriasRef(), SUBCATEGORIAS).catch(() => { /* offline: reintenta solo */ });
        callback({ ...SUBCATEGORIAS });
      }
    },
    (err) => {
      // Sin permisos o error de red: continuar con los defaults, nunca bloquear la app
      console.error('[subcategorias] listener error:', err.code, err.message);
      callback({ ...SUBCATEGORIAS });
    }
  );
}

export async function addSubcategoria(categoria: CategoriaEgreso, nombre: string): Promise<void> {
  await setDoc(subcategoriasRef(), { [categoria]: arrayUnion(nombre) }, { merge: true });
}

/** Quita el nombre de la lista. Los egresos históricos con ese nombre se conservan. */
export async function removeSubcategoria(categoria: CategoriaEgreso, nombre: string): Promise<void> {
  await setDoc(subcategoriasRef(), { [categoria]: arrayRemove(nombre) }, { merge: true });
}

// ---------------------------------------------------------------------------
// Notas semanales (colección notas_semanales, doc id `${anio}-S${semana}`)
// Observaciones libres por semana: faltas, eventos, recordatorios.
// ---------------------------------------------------------------------------

function notaSemanalRef(anio: number, semana: number) {
  return doc(getDb(), 'notas_semanales', `${anio}-S${semana}`);
}

export async function getNotaSemanal(anio: number, semana: number): Promise<string> {
  const snap = await getDoc(notaSemanalRef(anio, semana));
  return snap.exists() ? ((snap.data().texto as string) ?? '') : '';
}

export async function setNotaSemanal(anio: number, semana: number, texto: string): Promise<void> {
  await setDoc(notaSemanalRef(anio, semana), {
    anio,
    semana,
    texto: texto.trim(),
    actualizado: Timestamp.now(),
  });
}

export async function cleanupExpiredImages(): Promise<void> {
  const STORAGE_KEY = 'last_img_cleanup';
  const last = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (last && Number(last) > Date.now() - 24 * 60 * 60 * 1000) return;
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, String(Date.now()));
  try {
    const db = getDb();
    const cutoff = Timestamp.fromMillis(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const year = new Date().getFullYear();
    const [snapA, snapB] = await Promise.all([
      getDocs(query(collection(db, 'egresos'), where('anio', '==', year), orderBy('fecha', 'desc'))),
      getDocs(query(collection(db, 'egresos'), where('anio', '==', year - 1), orderBy('fecha', 'desc'))),
    ]);
    const expired: { id: string; imagen_url: string }[] = [];
    for (const snap of [snapA, snapB]) {
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.imagen_url && (data.fecha as Timestamp).toMillis() < cutoff.toMillis()) {
          expired.push({ id: d.id, imagen_url: data.imagen_url as string });
        }
      });
    }
    await Promise.allSettled(
      expired.map(async ({ id, imagen_url }) => {
        try { await deleteStorageFile(imagen_url); } catch { /* ya borrado */ }
        await updateDoc(doc(db, 'egresos', id), { imagen_url: deleteField() });
      })
    );
  } catch { /* silent */ }
}
