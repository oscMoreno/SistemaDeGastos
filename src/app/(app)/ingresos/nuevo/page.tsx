export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/layout/PageHeader';
import { IngresoForm } from '@/components/ingresos/IngresoForm';

export default function NuevoIngresoPage() {
  return (
    <>
      <PageHeader title="Nuevo Ingreso" backHref="/ingresos" />
      <IngresoForm />
    </>
  );
}
