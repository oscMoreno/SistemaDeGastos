'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToIngresos, subscribeToEgresos, subscribeToSubcategorias } from '@/lib/firebase/firestore';
import { SUBCATEGORIAS } from '@/lib/utils/constants';
import { getCurrentYear } from '@/lib/utils/dates';
import { useAuth } from './AuthContext';
import type { Ingreso, Egreso, SubcategoriasMap } from '@/types';

interface DataContextValue {
  ingresos: Ingreso[];
  egresos: Egreso[];
  subcategorias: SubcategoriasMap;
  loading: boolean;
  anio: number;
}

const DataContext = createContext<DataContextValue>({
  ingresos: [],
  egresos: [],
  subcategorias: SUBCATEGORIAS,
  loading: true,
  anio: getCurrentYear(),
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const anio = getCurrentYear();
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [subcategorias, setSubcategorias] = useState<SubcategoriasMap>(SUBCATEGORIAS);
  const [loadedI, setLoadedI] = useState(false);
  const [loadedE, setLoadedE] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubI = subscribeToIngresos({ anio }, (data) => {
      setIngresos(data);
      setLoadedI(true);
    });
    const unsubE = subscribeToEgresos({ anio }, (data) => {
      setEgresos(data);
      setLoadedE(true);
    });
    const unsubS = subscribeToSubcategorias(setSubcategorias);
    return () => { unsubI(); unsubE(); unsubS(); };
  }, [user, anio]);

  return (
    <DataContext.Provider value={{ ingresos, egresos, subcategorias, loading: !loadedI || !loadedE, anio }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
