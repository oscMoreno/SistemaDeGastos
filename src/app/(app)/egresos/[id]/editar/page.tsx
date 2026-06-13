'use client';

export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { EgresoForm } from '@/components/egresos/EgresoForm';
import { Spinner } from '@/components/ui/Spinner';
import { useData } from '@/context/DataContext';
import { dateToInputValue } from '@/lib/utils/dates';

export default function EditarEgresoPage() {
  const { id } = useParams<{ id: string }>();
  const { egresos, loading } = useData();

  const egreso = egresos.find((e) => e.id === id);

  return (
    <>
      <PageHeader title="Editar Egreso" backHref="/egresos" />
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !egreso ? (
        <div className="text-center py-16 px-8">
          <p className="text-gray-400 text-sm">No se encontró el registro.</p>
          <Link href="/egresos" className="text-sm text-emerald-600 underline mt-2 inline-block">
            Volver a egresos
          </Link>
        </div>
      ) : (
        <EgresoForm
          editId={egreso.id}
          initialValues={{
            fecha: dateToInputValue(egreso.fecha.toDate()),
            categoria: egreso.categoria,
            subcategoria: egreso.subcategoria,
            // Si el ticket era USD, mostrar el monto original en dólares.
            // Para Sueldos, mostrar el sueldo base (sin horas extras).
            monto: egreso.moneda === 'USD' && egreso.monto_usd
              ? egreso.monto_usd
              : egreso.monto - (egreso.monto_horas_extras ?? 0),
            notas: egreso.notas ?? '',
            imagen_url: egreso.imagen_url,
            moneda: egreso.moneda,
            tipo_cambio: egreso.tipo_cambio,
            horas_extras: egreso.horas_extras,
            tarifa_hora_extra: egreso.tarifa_hora_extra,
          }}
        />
      )}
    </>
  );
}
