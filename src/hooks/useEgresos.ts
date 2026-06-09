'use client';

import { useState, useEffect } from 'react';
import { subscribeToEgresos } from '@/lib/firebase/firestore';
import { getCurrentYear } from '@/lib/utils/dates';
import { useData } from '@/context/DataContext';
import type { Egreso } from '@/types';

export function useEgresos(anio?: number) {
  const currentYear = getCurrentYear();
  const isCurrentYear = !anio || anio === currentYear;
  const ctx = useData();

  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isCurrentYear) return;
    const unsubscribe = subscribeToEgresos({ anio: anio! }, (data) => {
      setEgresos(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [anio, isCurrentYear]);

  if (isCurrentYear) return { egresos: ctx.egresos, loading: ctx.loading };
  return { egresos, loading };
}
