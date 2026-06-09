export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/layout/PageHeader';
import { EgresoForm } from '@/components/egresos/EgresoForm';

export default function NuevoEgresoPage() {
  return (
    <>
      <PageHeader title="Nuevo Egreso" backHref="/egresos" />
      <EgresoForm />
    </>
  );
}
