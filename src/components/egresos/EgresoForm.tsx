'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addEgreso } from '@/lib/firebase/firestore';
import { CATEGORIAS_EGRESO, SUBCATEGORIAS } from '@/lib/utils/constants';
import { dateToInputValue } from '@/lib/utils/dates';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SubcategoriaSelect } from './SubcategoriaSelect';
import type { CategoriaEgreso, GeminiReceiptResult } from '@/types';

interface EgresoFormProps {
  initialValues?: Partial<GeminiReceiptResult & { categoria: CategoriaEgreso; imagen_url?: string }>;
}

export function EgresoForm({ initialValues }: EgresoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    const defaults = SUBCATEGORIAS[categoria];
    if (!defaults.includes(subcategoria)) {
      setSubcategoria(defaults[0]);
    }
  }, [categoria, subcategoria]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await addEgreso({
        fechaStr: fecha,
        categoria,
        subcategoria,
        monto: Number(monto),
        imagen_url: initialValues?.imagen_url,
        notas: notas.trim() || undefined,
      });
      router.replace('/egresos');
    } catch {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 py-4">
      <Input
        label="Fecha"
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        required
      />
      <Select
        label="Categoría"
        value={categoria}
        onChange={(e) => {
          setCategoria(e.target.value as CategoriaEgreso);
        }}
        options={CATEGORIAS_EGRESO.map((c) => ({ value: c, label: c }))}
      />
      <SubcategoriaSelect
        categoria={categoria}
        value={subcategoria}
        onChange={setSubcategoria}
      />
      <Input
        label="Monto (MXN)"
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        placeholder="0.00"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        required
      />
      <Input
        label="Notas (opcional)"
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
      {error && <p className="text-sm text-rose-600">{error}</p>}
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
