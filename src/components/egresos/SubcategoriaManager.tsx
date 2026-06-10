'use client';

import { useState, useEffect } from 'react';
import { addSubcategoria, removeSubcategoria } from '@/lib/firebase/firestore';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/Button';
import type { CategoriaEgreso } from '@/types';

const TITULOS: Record<CategoriaEgreso, string> = {
  'Gastos Insumos': 'Proveedores',
  'Sueldos': 'Personal',
  'Gastos Fijos': 'Gastos fijos',
};

interface SubcategoriaManagerProps {
  categoria: CategoriaEgreso;
  open: boolean;
  onClose: () => void;
}

export function SubcategoriaManager({ categoria, open, onClose }: SubcategoriaManagerProps) {
  const { subcategorias } = useData();
  const [nuevo, setNuevo] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const lista = subcategorias[categoria] ?? [];

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  function handleClose() {
    setNuevo('');
    setError('');
    setPendingDelete(null);
    onClose();
  }

  async function handleAdd() {
    const nombre = nuevo.trim();
    if (!nombre) return;
    if (lista.some((s) => s.toLowerCase() === nombre.toLowerCase())) {
      setError(`"${nombre}" ya existe.`);
      return;
    }
    setError('');
    setSaving(true);
    try {
      await addSubcategoria(categoria, nombre);
      setNuevo('');
    } catch {
      setError('No se pudo agregar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(nombre: string) {
    if (lista.length <= 1) {
      setError('Debe quedar al menos un nombre en la lista.');
      setPendingDelete(null);
      return;
    }
    setError('');
    setSaving(true);
    try {
      await removeSubcategoria(categoria, nombre);
    } catch {
      setError('No se pudo eliminar. Intenta de nuevo.');
    } finally {
      setSaving(false);
      setPendingDelete(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-xl max-h-[85vh] flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{TITULOS[categoria]}</h3>
        <p className="text-xs text-gray-400 mb-4">
          Al eliminar un nombre, los egresos ya registrados con ese nombre se conservan.
        </p>

        <ul className="flex-1 overflow-y-auto -mx-2 mb-4 divide-y divide-gray-50">
          {lista.map((nombre) => (
            <li key={nombre} className="flex items-center justify-between gap-2 px-2 py-1">
              <span className="text-sm text-gray-800 truncate">{nombre}</span>
              {pendingDelete === nombre ? (
                <span className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDelete(nombre)}
                    disabled={saving}
                    className="text-xs font-semibold text-rose-600 px-3 min-h-[44px] rounded-xl hover:bg-rose-50"
                  >
                    Eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(null)}
                    disabled={saving}
                    className="text-xs text-gray-500 px-3 min-h-[44px] rounded-xl hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingDelete(nombre)}
                  aria-label={`Eliminar ${nombre}`}
                  className="p-2 rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={nuevo}
            onChange={(e) => { setNuevo(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleAdd(); } }}
            placeholder="Nuevo nombre..."
            className="flex-1 rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <Button type="button" onClick={handleAdd} loading={saving} disabled={!nuevo.trim()}>
            Agregar
          </Button>
        </div>

        {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}

        <Button type="button" variant="secondary" onClick={handleClose} className="w-full">
          Cerrar
        </Button>
      </div>
    </div>
  );
}
