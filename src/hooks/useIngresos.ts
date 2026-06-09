'use client';

import { useState, useEffect } from 'react';
import { subscribeToIngresos } from '@/lib/firebase/firestore';
import { getCurrentYear } from '@/lib/utils/dates';
import type { Ingreso } from '@/types';

export function useIngresos(anio?: number) {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const year = anio ?? getCurrentYear();
    const unsubscribe = subscribeToIngresos({ anio: year }, (data) => {
      setIngresos(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [anio]);

  return { ingresos, loading };
}
