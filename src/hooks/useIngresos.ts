'use client';

import { useState, useEffect } from 'react';
import { subscribeToIngresos } from '@/lib/firebase/firestore';
import { getCurrentYear } from '@/lib/utils/dates';
import { useData } from '@/context/DataContext';
import type { Ingreso } from '@/types';

export function useIngresos(anio?: number) {
  const currentYear = getCurrentYear();
  const isCurrentYear = !anio || anio === currentYear;
  const ctx = useData();

  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isCurrentYear) return;
    const unsubscribe = subscribeToIngresos({ anio: anio! }, (data) => {
      setIngresos(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [anio, isCurrentYear]);

  if (isCurrentYear) return { ingresos: ctx.ingresos, loading: ctx.loading };
  return { ingresos, loading };
}
