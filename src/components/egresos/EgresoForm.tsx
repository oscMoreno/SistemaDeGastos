'use client';

import { useState, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addEgreso, updateEgreso } from '@/lib/firebase/firestore';
import { CATEGORIAS_EGRESO, SUBCATEGORIAS } from '@/lib/utils/constants';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { dateToInputValue, formatCurrency } from '@/lib/utils/dates';
import { getTipoCambioUSD, usdToMxn } from '@/lib/utils/currency';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SubcategoriaSelect } from './SubcategoriaSelect';
import { MonedaToggle } from './MonedaToggle';
import type { CategoriaEgreso, GeminiReceiptResult, Egreso, Moneda } from '@/types';

interface EgresoFormProps {
  initialValues?: Partial<
    GeminiReceiptResult & {
      categoria: CategoriaEgreso;
      imagen_url?: string;
      tipo_cambio?: number;
      horas_extras?: number;
      tarifa_hora_extra?: number;
    }
  >;
  /** Si se pasa, el formulario edita ese registro en vez de crear uno nuevo */
  editId?: string;
}

interface FieldErrors {
  fecha?: string;
  monto?: string;
  subcategoria?: string;
  tipoCambio?: string;
  horasExtras?: string;
  tarifaHoraExtra?: string;
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
  const [moneda, setMoneda] = useState<Moneda>(initialValues?.moneda ?? 'MXN');
  const [tipoCambio, setTipoCambio] = useState(initialValues?.tipo_cambio?.toString() ?? '');
  const [horasExtras, setHorasExtras] = useState(initialValues?.horas_extras?.toString() ?? '');
  const [tarifaHoraExtra, setTarifaHoraExtra] = useState(initialValues?.tarifa_hora_extra?.toString() ?? '');

  function selectMoneda(m: Moneda) {
    setMoneda(m);
    setErrors((p) => ({ ...p, tipoCambio: undefined }));
    if (m === 'USD' && !tipoCambio) {
      getTipoCambioUSD().then((rate) => {
        if (rate) setTipoCambio((prev) => prev || rate.toFixed(2));
      });
    }
  }

  // Valor efectivo derivado: si la subcategoría guardada no existe en la lista
  // actual (cambió la categoría o se eliminó el nombre), usar la primera.
  const lista = subcategorias[categoria] ?? [];
  const subcategoriaEfectiva = lista.includes(subcategoria) ? subcategoria : (lista[0] ?? '');

  const montoHorasExtras = useMemo(() => {
    const h = parseFloat(horasExtras);
    const t = parseFloat(tarifaHoraExtra);
    if (!isNaN(h) && !isNaN(t) && h > 0 && t > 0) return h * t;
    return 0;
  }, [horasExtras, tarifaHoraExtra]);

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
    if (moneda === 'USD') {
      if (!tipoCambio.trim()) errs.tipoCambio = 'El tipo de cambio es obligatorio para tickets en dólares.';
      else if (isNaN(Number(tipoCambio)) || Number(tipoCambio) <= 0) errs.tipoCambio = 'Tipo de cambio inválido.';
    }
    if (categoria === 'Sueldos') {
      const h = horasExtras.trim();
      const t = tarifaHoraExtra.trim();
      if (h && !t) errs.tarifaHoraExtra = 'Ingresa la tarifa por hora.';
      if (!h && t) errs.horasExtras = 'Ingresa el número de horas.';
      if (h && isNaN(Number(h))) errs.horasExtras = 'Número de horas inválido.';
      if (t && isNaN(Number(t))) errs.tarifaHoraExtra = 'Tarifa inválida.';
    }
    return errs;
  }

  const montoMXN =
    moneda === 'USD' && monto && tipoCambio && Number(tipoCambio) > 0
      ? usdToMxn(Number(monto), Number(tipoCambio))
      : Number(monto) || 0;

  const totalGuardado = montoMXN + (categoria === 'Sueldos' ? montoHorasExtras : 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaveError('');
    setLoading(true);
    try {
      const camposMoneda =
        moneda === 'USD'
          ? { moneda: 'USD' as Moneda, monto_usd: Number(monto), tipo_cambio: Number(tipoCambio) }
          : { moneda: undefined, monto_usd: undefined, tipo_cambio: undefined };

      const camposHorasExtras =
        categoria === 'Sueldos' && montoHorasExtras > 0
          ? {
              horas_extras: parseFloat(horasExtras),
              tarifa_hora_extra: parseFloat(tarifaHoraExtra),
              monto_horas_extras: montoHorasExtras,
            }
          : { horas_extras: undefined, tarifa_hora_extra: undefined, monto_horas_extras: undefined };

      if (editId) {
        await updateEgreso(editId, {
          fechaStr: fecha,
          categoria,
          subcategoria: subcategoriaEfectiva,
          monto: totalGuardado,
          notas: notas.trim() || undefined,
          ...camposMoneda,
          ...camposHorasExtras,
        });
        showToast('Egreso actualizado');
      } else {
        await addEgreso({
          fechaStr: fecha,
          categoria,
          subcategoria: subcategoriaEfectiva,
          monto: totalGuardado,
          imagen_url: initialValues?.imagen_url,
          notas: notas.trim() || undefined,
          ...camposMoneda,
          ...camposHorasExtras,
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
          const nueva = e.target.value as CategoriaEgreso;
          setCategoria(nueva);
          if (nueva !== 'Sueldos') {
            setHorasExtras('');
            setTarifaHoraExtra('');
          }
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
                  const base = p.monto - (p.monto_horas_extras ?? 0);
                  setMonto(base.toString());
                  if (p.tarifa_hora_extra) setTarifaHoraExtra(p.tarifa_hora_extra.toString());
                  setHorasExtras('');
                  setErrors({});
                }}
                className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors min-h-[44px]"
              >
                {p.subcategoria} · {formatCurrency(p.monto - (p.monto_horas_extras ?? 0))}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            label={categoria === 'Sueldos' ? `Sueldo base (${moneda})` : `Monto (${moneda})`}
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
        </div>
        <div className="mt-6">
          <MonedaToggle value={moneda} onChange={selectMoneda} />
        </div>
      </div>
      {moneda === 'USD' && (
        <div>
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
      {categoria === 'Sueldos' && (
        <div className="bg-purple-50 rounded-xl p-3 flex flex-col gap-3">
          <p className="text-xs font-medium text-purple-700">Horas extras (opcional)</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Horas"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                placeholder="0"
                value={horasExtras}
                onChange={(e) => {
                  setHorasExtras(e.target.value);
                  if (errors.horasExtras) setErrors((p) => ({ ...p, horasExtras: undefined }));
                }}
                error={errors.horasExtras}
                optional
              />
            </div>
            <div className="flex-1">
              <Input
                label="Tarifa / hora (MXN)"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={tarifaHoraExtra}
                onChange={(e) => {
                  setTarifaHoraExtra(e.target.value);
                  if (errors.tarifaHoraExtra) setErrors((p) => ({ ...p, tarifaHoraExtra: undefined }));
                }}
                error={errors.tarifaHoraExtra}
                optional
              />
            </div>
          </div>
          {montoHorasExtras > 0 && (
            <div className="text-xs text-purple-700 space-y-0.5">
              <p>Horas extras: <span className="font-semibold">{formatCurrency(montoHorasExtras)}</span></p>
              <p>Total a pagar: <span className="font-bold text-sm">{formatCurrency(totalGuardado)}</span></p>
            </div>
          )}
        </div>
      )}
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
