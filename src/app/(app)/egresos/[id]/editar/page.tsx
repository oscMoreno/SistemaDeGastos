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
            monto: egreso.monto,
            notas: egreso.notas ?? '',
            imagen_url: egreso.imagen_url,
          }}
        />
      )}
    </>
  );
}
