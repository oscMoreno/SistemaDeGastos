# CLAUDE.md — Sistema de Gastos (Restaurant Financial Dashboard)

## Contexto del Proyecto

PWA mobile-first para el control financiero de un restaurante. Reemplaza un Excel manual con un dashboard en tiempo real + escáner de recibos con IA.

**Usuario único:** Dueño del restaurante (admin único, sin multiusuario).

---

## Stack Tecnológico

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Lenguaje:** TypeScript estricto
- **Estilos:** Tailwind CSS v4 (mobile-first)
- **Gráficas:** Recharts
- **Backend:** Firebase Web SDK v10+ (Auth, Firestore, Storage)
- **IA:** Google Gemini 1.5 Flash (via `/api/scan-receipt` server-side route)
- **PWA:** manifest.json manual (next-pwa incompatible con Turbopack)

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx                  # Root layout: AuthProvider + PWA meta tags
│   ├── page.tsx                    # Redirect → /dashboard
│   ├── globals.css                 # Tailwind base
│   ├── api/scan-receipt/route.ts   # Gemini API server-side (protege la API key)
│   ├── (auth)/login/page.tsx       # Login sin bottom nav
│   └── (app)/                      # Rutas protegidas con AuthGuard + BottomNav
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── ingresos/page.tsx + nuevo/page.tsx
│       ├── egresos/page.tsx + nuevo/page.tsx
│       ├── scanner/page.tsx
│       └── historial/page.tsx
├── components/
│   ├── ui/           # Button, Card, Input, Select, Spinner, Badge, Modal
│   ├── layout/       # BottomNav, PageHeader
│   ├── auth/         # LoginForm
│   ├── dashboard/    # SummaryCards, WeeklyChart, PaymentMethodBreakdown, MonthlyTotals
│   ├── ingresos/     # IngresoForm, IngresoItem
│   ├── egresos/      # EgresoForm, EgresoItem, SubcategoriaSelect
│   └── scanner/      # ImageUploader, ScannerResult, ScannerStatus
├── lib/
│   ├── firebase/     # config.ts, auth.ts, firestore.ts, storage.ts
│   └── utils/        # constants.ts, dates.ts
├── hooks/            # useIngresos, useEgresos, useDashboardStats
├── context/          # AuthContext.tsx
└── types/            # index.ts (todas las interfaces)
```

---

## Dominio de Negocio

### Ingresos (`/ingresos`)
| Campo | Valores |
|-------|---------|
| `metodo_pago` | `'Efectivo'` \| `'Transferencia'` \| `'Rappi'` |

### Egresos (`/egresos`)
| Categoría | Subcategorías |
|-----------|--------------|
| `'Gastos Insumos'` | Smart, City Club, Carnemaf, Disfruta, Central de Abastos |
| `'Sueldos'` | Valeria, Javier, Clemente, Sabina |
| `'Gastos Fijos'` | Renta, Luz, Agua, Internet, Spotify, Gas |

Para agregar proveedores o empleados: editar **únicamente** `src/lib/utils/constants.ts` → `SUBCATEGORIAS`.

---

## Schema de Firestore

### Colección `ingresos`
```typescript
{
  id: string;           // auto-generated
  fecha: Timestamp;
  metodo_pago: MetodoPago;
  monto: number;        // MXN
  semana: number;       // ISO week number
  mes: string;          // 'Enero' | 'Febrero' | ...
  anio: number;         // 2026
  notas?: string;
}
```

### Colección `egresos`
```typescript
{
  id: string;
  fecha: Timestamp;
  categoria: CategoriaEgreso;
  subcategoria: string;
  monto: number;        // MXN
  semana: number;
  mes: string;
  anio: number;
  imagen_url?: string;  // Firebase Storage URL del recibo
  notas?: string;
}
```

**Regla invariante:** Los campos `semana`, `mes`, `anio` SIEMPRE se calculan en tiempo de escritura usando `src/lib/utils/dates.ts`. Nunca derivarlos en queries.

---

## Variables de Entorno

Archivo: `.env.local` (nunca se commitea — está en `.gitignore`)

```bash
# Firebase Client SDK (prefijo NEXT_PUBLIC_ obligatorio)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Gemini AI — server-side ONLY (sin prefijo NEXT_PUBLIC_)
GEMINI_API_KEY=
```

---

## Reglas de Desarrollo

### 1. Firebase — Patrón de Inicialización Lazy (CRÍTICO)

**NUNCA** llamar `getAuth()`, `getFirestore()` o `getStorage()` a nivel de módulo. Firebase falla en SSR (build de Next.js) si se inicializa sin API keys.

**Patrón correcto:**
```typescript
// src/lib/firebase/config.ts
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length) return getApp();
  return initializeApp(firebaseConfig);
}

// src/lib/firebase/auth.ts
export function getFirebaseAuth() {
  return getAuth(getFirebaseApp()); // llamada dentro de función, no a nivel módulo
}

// src/lib/firebase/firestore.ts
function getDb() {
  return getFirestore(getFirebaseApp());
}
```

**AuthContext** usa dynamic import para evitar SSR:
```typescript
useEffect(() => {
  import('@/lib/firebase/auth').then(({ getFirebaseAuth }) => {
    import('firebase/auth').then(({ onAuthStateChanged }) => {
      unsubscribe = onAuthStateChanged(getFirebaseAuth(), callback);
    });
  });
}, []);
```

### 2. Rutas Protegidas — `force-dynamic`

Toda página en `(app)/` y `(auth)/` debe tener:
```typescript
export const dynamic = 'force-dynamic';
```
Esto previene pre-rendering estático que dispara Firebase en build time.

### 3. Seguridad de API Keys

- `GEMINI_API_KEY` solo se lee en `src/app/api/scan-receipt/route.ts` (server-side)
- El cliente NUNCA tiene acceso a la key de Gemini
- Las Firebase client keys (`NEXT_PUBLIC_*`) sí son seguras en el browser

### 4. Componentes UI

Siempre usar los átomos de `src/components/ui/`:
- `Button` — variantes: `primary` (emerald), `secondary`, `danger` (rose), `ghost`
- `Card` — contenedor estándar con shadow y border
- `Input` — con `label` y `error` props
- `Select` — recibe `options: { value, label }[]`
- `Modal` — bottom-sheet para confirmaciones de delete
- `Badge` — para categorías/métodos de pago con colores de `constants.ts`
- `Spinner` — loading states

### 5. Formularios

- `EgresoForm` acepta `initialValues` opcional para pre-llenado desde el scanner
- `SubcategoriaSelect` se re-renderiza automáticamente cuando cambia `categoria`
- Siempre usar `dateToInputValue(new Date())` como valor inicial de fecha
- Guardar con `addIngreso()`/`addEgreso()` pasando `fechaStr: string` (formato `YYYY-MM-DD`)

### 6. Hooks de Datos

Los hooks usan `onSnapshot` (tiempo real):
```typescript
const { ingresos, loading } = useIngresos(anio?); // default: año actual
const { egresos, loading } = useEgresos(anio?);
const stats = useDashboardStats(ingresos, egresos); // derivado, sin fetch
```

### 7. Colores del Sistema

| Tipo | Color |
|------|-------|
| Ingresos / positivo | `emerald-600` |
| Egresos / negativo | `rose-600` |
| Efectivo | `emerald` |
| Transferencia | `sky` |
| Rappi | `orange` |
| Gastos Insumos | `blue` |
| Sueldos | `purple` |
| Gastos Fijos | `amber` |

### 8. Mobile-First

- Mínimo `min-h-[44px]` / `min-w-[44px]` en todos los elementos táctiles
- BottomNav ocupa `h-16` → contenido con `pb-20` en el layout
- `safe-area-inset-bottom` en el BottomNav para iPhone
- Tailwind v4: usar clases `min-h-11` / `min-w-11` equivalente a `44px`

### 9. Tipos TypeScript

Todos los tipos en `src/types/index.ts`. No crear interfaces locales en componentes. Usar los tipos exportados:
```typescript
import type { Ingreso, Egreso, MetodoPago, CategoriaEgreso, GeminiReceiptResult } from '@/types';
```

### 10. Constantes del Negocio

Siempre importar de `src/lib/utils/constants.ts`:
```typescript
import { SUBCATEGORIAS, CATEGORIAS_EGRESO, METODOS_PAGO, CATEGORIA_COLORS, METODO_COLORS } from '@/lib/utils/constants';
```

---

## Flujo del Escáner IA

```
Usuario toma foto
  → ImageUploader (capture="environment")
  → uploadReceiptImage() → Firebase Storage → downloadURL
  → POST /api/scan-receipt { base64Image, mimeType }
      → Gemini 1.5 Flash analiza imagen
      → Retorna JSON: { monto, subcategoria, notas, fecha }
  → ScannerResult: campos editables pre-llenados
  → Usuario confirma
  → addEgreso({ ...parsed, imagen_url: downloadURL })
  → Redirect → /egresos

Error: → ScannerStatus error → botón "Ingresar manualmente" → /egresos/nuevo
```

---

## Qué Falta por Implementar

### Pendiente (alta prioridad)
1. **Iconos PWA** — Faltan los archivos `public/icon-192x192.png` y `public/icon-512x512.png`. Sin ellos el PWA no se puede instalar en móvil. Crear con fondo emerald-600 (#059669) y símbolo de peso "$".
2. **Índices de Firestore** — Al hacer la primera query combinada (`anio` + `orderBy fecha`), Firestore pedirá crear índices. Crearlos en Firebase Console o via `firestore.indexes.json`.
3. **Reglas de seguridad de Firebase** — Aplicar en Firebase Console:
   ```
   // Firestore
   match /{collection}/{docId} {
     allow read, write: if request.auth != null;
   }
   // Storage
   match /receipts/{userId}/{allPaths=**} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```

### Pendiente (funcionalidad adicional)
4. **Editar registros** — No hay edición, solo agregar/eliminar. Agregar ruta `/ingresos/[id]/editar` y `/egresos/[id]/editar`.
5. **Exportar a Excel/CSV** — El dueño necesita reportes semanales para llevar al contador.
6. **Notificaciones de presupuesto** — Alertar cuando los egresos superan un umbral semanal configurado.
7. **Múltiples años** — `useIngresos`/`useEgresos` actualmente solo cargan el año actual. Agregar selector de año en historial.
8. **Resumen semanal** — Vista dedicada semana-por-semana con desglose por categoría (similar al Excel original).
9. **Toast/feedback visual** — No hay notificación de éxito al guardar. Implementar toast notifications.
10. **Service Worker offline** — next-pwa no funciona con Turbopack. Implementar SW manual en `public/sw.js` para cache offline.

---

## Comandos Útiles

```bash
npm run dev      # Desarrollo (http://localhost:3000)
npm run build    # Build de producción — debe pasar sin errores
npm run lint     # ESLint
```

**Antes de commitear:** siempre correr `npm run build` para verificar que no hay errores de TypeScript.

---

## Reglas de Firestore (Índices necesarios)

Las queries usan `where('anio', '==', X)` + `orderBy('fecha', 'desc')`. Firestore requiere índices compuestos para esto. Crear en Firebase Console:

| Colección | Campos | Orden |
|-----------|--------|-------|
| `ingresos` | `anio` ASC, `fecha` DESC | Ascending / Descending |
| `egresos` | `anio` ASC, `fecha` DESC | Ascending / Descending |
| `egresos` | `anio` ASC, `categoria` ASC, `fecha` DESC | — |

---

## Notas de Arquitectura

- **Route groups:** `(auth)` para login (sin nav), `(app)` para rutas protegidas (con AuthGuard + BottomNav)
- **`EgresoForm` es shared:** lo usan `/egresos/nuevo` (manual) Y `/scanner` (pre-llenado con IA). La prop `initialValues` es el puente.
- **No hay middleware Edge** — la protección de rutas es client-side en `(app)/layout.tsx` con `useAuth()`. Suficiente para app single-admin.
- **Recharts necesita `'use client'`** — todos los componentes de gráficas son client components.
