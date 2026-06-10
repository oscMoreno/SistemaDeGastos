'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addIngreso, updateIngreso } from '@/lib/firebase/firestore';
import { METODOS_PAGO } from '@/lib/utils/constants';
import { dateToInputValue } from '@/lib/utils/dates';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { MetodoPago } from '@/types';

interface FieldErrors {
  fecha?: string;
  monto?: string;
}

interface IngresoFormProps {
  /** Si se pasa, el formulario edita ese registro en vez de crear uno nuevo */
  editId?: string;
  initialValues?: {
    fecha: string;
    metodo_pago: MetodoPago;
    monto: number;
    notas?: string;
  };
}

export function IngresoForm({ editId, initialValues }: IngresoFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const [fecha, setFecha] = useState(initialValues?.fecha ?? dateToInputValue(new Date()));
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(initialValues?.metodo_pago ?? 'Efectivo');
  const [monto, setMonto] = useState(initialValues?.monto?.toString() ?? '');
  const [notas, setNotas] = useState(initialValues?.notas ?? '');

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!fecha) errs.fecha = 'La fecha es obligatoria.';
    if (!monto.trim()) errs.monto = 'El monto es obligatorio.';
    else if (isNaN(Number(monto)) || Number(monto) <= 0) errs.monto = 'El monto debe ser un número mayor a 0.';
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
      const payload = {
        fechaStr: fecha,
        metodo_pago: metodoPago,
        monto: Number(monto),
        notas: notas.trim() || undefined,
      };
      if (editId) {
        await updateIngreso(editId, payload);
        showToast('Ingreso actualizado');
      } else {
        await addIngreso(payload);
        showToast('Ingreso guardado');
      }
      router.replace('/ingresos');
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
        label="Método de pago"
        value={metodoPago}
        onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
        options={METODOS_PAGO.map((m) => ({ value: m, label: m }))}
        required
      />
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
        placeholder="Observaciones..."
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
      />
      {saveError && <p className="text-sm text-rose-600">{saveError}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          {editId ? 'Actualizar' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
