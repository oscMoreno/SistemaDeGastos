'use client';

import { useState, useEffect } from 'react';
import { subscribeToEgresos } from '@/lib/firebase/firestore';
import { getCurrentYear } from '@/lib/utils/dates';
import type { Egreso } from '@/types';

export function useEgresos(anio?: number) {
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const year = anio ?? getCurrentYear();
    const unsubscribe = subscribeToEgresos({ anio: year }, (data) => {
      setEgresos(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [anio]);

  return { egresos, loading };
}
