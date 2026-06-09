'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addIngreso } from '@/lib/firebase/firestore';
import { METODOS_PAGO } from '@/lib/utils/constants';
import { dateToInputValue } from '@/lib/utils/dates';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { MetodoPago } from '@/types';

export function IngresoForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fecha, setFecha] = useState(dateToInputValue(new Date()));
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [monto, setMonto] = useState('');
  const [notas, setNotas] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await addIngreso({
        fechaStr: fecha,
        metodo_pago: metodoPago,
        monto: Number(monto),
        notas: notas.trim() || undefined,
      });
      router.replace('/ingresos');
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
        label="Método de pago"
        value={metodoPago}
        onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
        options={METODOS_PAGO.map((m) => ({ value: m, label: m }))}
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
        placeholder="Observaciones..."
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
      />
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
