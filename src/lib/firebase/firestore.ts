import {
  initializeFirestore,
  persistentLocalCache,
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
  updateDoc,
  deleteField,
  type Query,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { getFirebaseApp } from './config';
import { deleteStorageFile } from './storage';
import type { Ingreso, Egreso } from '@/types';
import { getWeekNumber, getMes, getAnio } from '@/lib/utils/dates';

let _db: ReturnType<typeof getFirestore> | null = null;
function getDb() {
  if (_db) return _db;
  try {
    _db = initializeFirestore(getFirebaseApp(), {
      localCache: persistentLocalCache(),
    });
  } catch {
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
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
