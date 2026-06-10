'use client';

import { useState, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addEgreso, updateEgreso } from '@/lib/firebase/firestore';
import { CATEGORIAS_EGRESO, SUBCATEGORIAS } from '@/lib/utils/constants';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { dateToInputValue, formatCurrency } from '@/lib/utils/dates';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SubcategoriaSelect } from './SubcategoriaSelect';
import type { CategoriaEgreso, GeminiReceiptResult, Egreso } from '@/types';

interface EgresoFormProps {
  initialValues?: Partial<GeminiReceiptResult & { categoria: CategoriaEgreso; imagen_url?: string }>;
  /** Si se pasa, el formulario edita ese registro en vez de crear uno nuevo */
  editId?: string;
}

interface FieldErrors {
  fecha?: string;
  monto?: string;
  subcategoria?: string;
}

export function EgresoForm({ initialValues, editId }: EgresoFormProps) {
  const router = useRouter();
  const { subcategorias, egresos } = useData();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const [fecha, setFecha] = useState(
    initialValues?.fecha ? initialValues.fecha : dateToInputValue(new Date())
  );
  const [categoria, setCategoria] = useState<CategoriaEgreso>(
    initialValues?.categoria ?? 'Gastos Insumos'
  );
  const [subcategoria, setSubcategoria] = useState(
    initialValues?.subcategoria ?? SUBCATEGORIAS['Gastos Insumos'][0]
  );
  const [monto, setMonto] = useState(initialValues?.monto?.toString() ?? '');
  const [notas, setNotas] = useState(initialValues?.notas ?? '');

  // Valor efectivo derivado: si la subcategoría guardada no existe en la lista
  // actual (cambió la categoría o se eliminó el nombre), usar la primera.
  const lista = subcategorias[categoria] ?? [];
  const subcategoriaEfectiva = lista.includes(subcategoria) ? subcategoria : (lista[0] ?? '');

  // Pagos rápidos: último pago por subcategoría (solo Sueldos y Gastos Fijos,
  // donde los montos se repiten semana a semana). Tap = pre-llenar.
  const pagosRecientes = useMemo<Egreso[]>(() => {
    if (editId || categoria === 'Gastos Insumos') return [];
    const vistos = new Map<string, Egreso>();
    for (const e of egresos) {
      // egresos viene ordenado por fecha desc — el primero es el más reciente
      if (e.categoria === categoria && !vistos.has(e.subcategoria)) {
        vistos.set(e.subcategoria, e);
      }
    }
    return [...vistos.values()].slice(0, 8);
  }, [egresos, categoria, editId]);

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!fecha) errs.fecha = 'La fecha es obligatoria.';
    if (!monto.trim()) errs.monto = 'El monto es obligatorio.';
    else if (isNaN(Number(monto)) || Number(monto) <= 0) errs.monto = 'El monto debe ser un número mayor a 0.';
    if (!subcategoriaEfectiva) errs.subcategoria = 'Selecciona una subcategoría (agrega una con el botón de lápiz).';
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaveError('');
    setLoading(true);
    try {
      if (editId) {
        await updateEgreso(editId, {
          fechaStr: fecha,
          categoria,
          subcategoria: subcategoriaEfectiva,
          monto: Number(monto),
          notas: notas.trim() || undefined,
        });
        showToast('Egreso actualizado');
      } else {
        await addEgreso({
          fechaStr: fecha,
          categoria,
          subcategoria: subcategoriaEfectiva,
          monto: Number(monto),
          imagen_url: initialValues?.imagen_url,
          notas: notas.trim() || undefined,
        });
        showToast('Egreso guardado');
      }
      router.replace('/egresos');
    } catch {
      setSaveError('Error al guardar. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 px-4 py-4">
      <Input
        label="Fecha"
        type="date"
        value={fecha}
        onChange={(e) => {
          setFecha(e.target.value);
          if (errors.fecha) setErrors((p) => ({ ...p, fecha: undefined }));
        }}
        error={errors.fecha}
        required
      />
      <Select
        label="Categoría"
        value={categoria}
        onChange={(e) => {
          setCategoria(e.target.value as CategoriaEgreso);
        }}
        options={CATEGORIAS_EGRESO.map((c) => ({ value: c, label: c }))}
        required
      />
      <SubcategoriaSelect
        categoria={categoria}
        value={subcategoriaEfectiva}
        onChange={(v) => {
          setSubcategoria(v);
          if (errors.subcategoria) setErrors((p) => ({ ...p, subcategoria: undefined }));
        }}
        error={errors.subcategoria}
      />
      {pagosRecientes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1.5">Pagos recientes — toca para repetir</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {pagosRecientes.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSubcategoria(p.subcategoria);
                  setMonto(p.monto.toString());
                  setErrors({});
                }}
                className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors min-h-[44px]"
              >
                {p.subcategoria} · {formatCurrency(p.monto)}
              </button>
            ))}
          </div>
        </div>
      )}
      <Input
        label="Monto (MXN)"
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        placeholder="0.00"
        value={monto}
        onChange={(e) => {
          setMonto(e.target.value);
          if (errors.monto) setErrors((p) => ({ ...p, monto: undefined }));
        }}
        error={errors.monto}
        required
      />
      <Input
        label="Notas"
        optional
        type="text"
        placeholder="Descripción de la compra..."
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
      />
      {initialValues?.imagen_url && (
        <div className="rounded-xl overflow-hidden border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={initialValues.imagen_url} alt="Recibo escaneado" className="w-full max-h-48 object-cover" />
        </div>
      )}
      {saveError && <p className="text-sm text-rose-600">{saveError}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
