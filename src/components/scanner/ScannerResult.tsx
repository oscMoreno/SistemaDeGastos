'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SubcategoriaSelect } from '@/components/egresos/SubcategoriaSelect';
import { MonedaToggle } from '@/components/egresos/MonedaToggle';
import { CATEGORIAS_EGRESO } from '@/lib/utils/constants';
import { useData } from '@/context/DataContext';
import { dateToInputValue, formatCurrency } from '@/lib/utils/dates';
import { getTipoCambioUSD, usdToMxn } from '@/lib/utils/currency';
import type { CategoriaEgreso, GeminiReceiptResult, Moneda } from '@/types';

export interface ScannerConfirmData extends GeminiReceiptResult {
  categoria: CategoriaEgreso;
  monto_usd?: number;
  tipo_cambio?: number;
}

interface ScannerResultProps {
  result: GeminiReceiptResult;
  imagePreview?: string;
  onConfirm: (confirmed: ScannerConfirmData) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface FieldErrors {
  fecha?: string;
  monto?: string;
  subcategoria?: string;
  tipoCambio?: string;
}

export function ScannerResult({ result, imagePreview, onConfirm, onCancel, loading }: ScannerResultProps) {
  const { subcategorias } = useData();
  const [fecha, setFecha] = useState(result.fecha || dateToInputValue(new Date()));
  const [categoria, setCategoria] = useState<CategoriaEgreso>('Gastos Insumos');
  const [subcategoria, setSubcategoria] = useState(() =>
    subcategorias['Gastos Insumos'].includes(result.subcategoria)
      ? result.subcategoria
      : subcategorias['Gastos Insumos'][0]
  );
  const [monto, setMonto] = useState(result.monto?.toString() ?? '');
  const [notas, setNotas] = useState(result.notas ?? '');
  const [moneda, setMoneda] = useState<Moneda>(result.moneda === 'USD' ? 'USD' : 'MXN');
  const [tipoCambio, setTipoCambio] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  // Si la IA detectó dólares, pre-cargar el tipo de cambio del día
  useEffect(() => {
    if (moneda === 'USD' && !tipoCambio) {
      getTipoCambioUSD().then((rate) => {
        if (rate) setTipoCambio((prev) => prev || rate.toFixed(2));
      });
    }
  }, [moneda, tipoCambio]);

  // Valor efectivo derivado: si la subcategoría no existe en la lista actual
  // (cambió la categoría o se eliminó el nombre), usar la primera.
  const lista = subcategorias[categoria] ?? [];
  const subcategoriaEfectiva = lista.includes(subcategoria) ? subcategoria : (lista[0] ?? '');

  const montoMXN =
    moneda === 'USD' && monto && tipoCambio && Number(tipoCambio) > 0
      ? usdToMxn(Number(monto), Number(tipoCambio))
      : Number(monto) || 0;

  function handleConfirm() {
    const errs: FieldErrors = {};
    if (!fecha) errs.fecha = 'La fecha es obligatoria.';
    if (!monto.trim()) errs.monto = 'El monto es obligatorio. Revisa el recibo y captúralo.';
    else if (isNaN(Number(monto)) || Number(monto) <= 0) errs.monto = 'El monto debe ser un número mayor a 0.';
    if (!subcategoriaEfectiva) errs.subcategoria = 'Selecciona una subcategoría (agrega una con el botón de lápiz).';
    if (moneda === 'USD') {
      if (!tipoCambio.trim()) errs.tipoCambio = 'El tipo de cambio es obligatorio para tickets en dólares.';
      else if (isNaN(Number(tipoCambio)) || Number(tipoCambio) <= 0) errs.tipoCambio = 'Tipo de cambio inválido.';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onConfirm({
      fecha,
      subcategoria: subcategoriaEfectiva,
      monto: montoMXN,
      notas,
      categoria,
      moneda,
      ...(moneda === 'USD' ? { monto_usd: Number(monto), tipo_cambio: Number(tipoCambio) } : {}),
    });
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
        onChange={(e) => setCategoria(e.target.value as CategoriaEgreso)}
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
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            label={`Monto (${moneda})`}
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(e) => {
              setMonto(e.target.value);
              if (errors.monto) setErrors((p) => ({ ...p, monto: undefined }));
            }}
            error={errors.monto}
            required
          />
        </div>
        <div className="mt-6">
          <MonedaToggle
            value={moneda}
            onChange={(m) => {
              setMoneda(m);
              setErrors((p) => ({ ...p, tipoCambio: undefined }));
            }}
          />
        </div>
      </div>
      {moneda === 'USD' && (
        <div>
          <p className="text-xs text-sky-700 bg-sky-50 rounded-xl px-3 py-2 mb-2">
            Ticket en dólares — verifica el monto y el tipo de cambio antes de guardar.
          </p>
          <Input
            label="Tipo de cambio (MXN por USD)"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="18.50"
            value={tipoCambio}
            onChange={(e) => {
              setTipoCambio(e.target.value);
              if (errors.tipoCambio) setErrors((p) => ({ ...p, tipoCambio: undefined }));
            }}
            error={errors.tipoCambio}
            required
          />
          {montoMXN > 0 && !errors.tipoCambio && (
            <p className="text-xs text-sky-700 mt-1 font-medium">
              = {formatCurrency(montoMXN)} MXN (se guarda en pesos)
            </p>
          )}
        </div>
      )}
      <Input
        label="Notas"
        optional
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
