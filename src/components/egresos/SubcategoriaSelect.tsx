'use client';

import { Select } from '@/components/ui/Select';
import { SUBCATEGORIAS } from '@/lib/utils/constants';
import type { CategoriaEgreso } from '@/types';

interface SubcategoriaSelectProps {
  categoria: CategoriaEgreso;
  value: string;
  onChange: (value: string) => void;
}

export function SubcategoriaSelect({ categoria, value, onChange }: SubcategoriaSelectProps) {
  const options = SUBCATEGORIAS[categoria].map((s) => ({ value: s, label: s }));
  return (
    <Select
      label="Subcategoría"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      required
    />
  );
}
