'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SubcategoriaSelect } from '@/components/egresos/SubcategoriaSelect';
import { CATEGORIAS_EGRESO, SUBCATEGORIAS } from '@/lib/utils/constants';
import { dateToInputValue } from '@/lib/utils/dates';
import type { CategoriaEgreso, GeminiReceiptResult } from '@/types';

interface ScannerResultProps {
  result: GeminiReceiptResult;
  imagePreview?: string;
  onConfirm: (confirmed: GeminiReceiptResult & { categoria: CategoriaEgreso }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ScannerResult({ result, imagePreview, onConfirm, onCancel, loading }: ScannerResultProps) {
  const [fecha, setFecha] = useState(result.fecha || dateToInputValue(new Date()));
  const [categoria, setCategoria] = useState<CategoriaEgreso>('Gastos Insumos');
  const [subcategoria, setSubcategoria] = useState(
    SUBCATEGORIAS['Gastos Insumos'].includes(result.subcategoria)
      ? result.subcategoria
      : SUBCATEGORIAS['Gastos Insumos'][0]
  );
  const [monto, setMonto] = useState(result.monto?.toString() ?? '');
  const [notas, setNotas] = useState(result.notas ?? '');

  function handleConfirm() {
    onConfirm({ fecha, subcategoria, monto: Number(monto), notas, categoria });
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2">
        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-emerald-700 font-medium">Recibo analizado · Revisa y confirma</span>
      </div>

      {imagePreview && (
        <div className="rounded-xl overflow-hidden border border-gray-200 max-h-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="Recibo" className="w-full object-cover max-h-32" />
        </div>
      )}

      <Input label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
      <Select
        label="Categoría"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value as CategoriaEgreso)}
        options={CATEGORIAS_EGRESO.map((c) => ({ value: c, label: c }))}
      />
      <SubcategoriaSelect categoria={categoria} value={subcategoria} onChange={setSubcategoria} />
      <Input
        label="Monto (MXN)"
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        required
      />
      <Input
        label="Notas"
        type="text"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="button" className="flex-1" onClick={handleConfirm} loading={loading}>
          Confirmar y guardar
        </Button>
      </div>
    </div>
  );
}
