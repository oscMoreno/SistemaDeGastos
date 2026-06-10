'use client';

export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { IngresoForm } from '@/components/ingresos/IngresoForm';
import { Spinner } from '@/components/ui/Spinner';
import { useData } from '@/context/DataContext';
import { dateToInputValue } from '@/lib/utils/dates';

export default function EditarIngresoPage() {
  const { id } = useParams<{ id: string }>();
  const { ingresos, loading } = useData();

  const ingreso = ingresos.find((i) => i.id === id);

  return (
    <>
      <PageHeader title="Editar Ingreso" backHref="/ingresos" />
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !ingreso ? (
        <div className="text-center py-16 px-8">
          <p className="text-gray-400 text-sm">No se encontró el registro.</p>
          <Link href="/ingresos" className="text-sm text-emerald-600 underline mt-2 inline-block">
            Volver a ingresos
          </Link>
        </div>
      ) : (
        <IngresoForm
          editId={ingreso.id}
          initialValues={{
            fecha: dateToInputValue(ingreso.fecha.toDate()),
            metodo_pago: ingreso.metodo_pago,
            monto: ingreso.monto,
            notas: ingreso.notas,
          }}
        />
      )}
    </>
  );
}
