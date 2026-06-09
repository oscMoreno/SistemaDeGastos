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
- **IA:** Mistral AI `pixtral-12b-2409` (via `/api/scan-receipt` server-side route)
- **PWA:** manifest.json manual (next-pwa incompatible con Turbopack)

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx                  # Root layout: AuthProvider + PWA meta tags
│   ├── page.tsx                    # Redirect → /dashboard
│   ├── globals.css                 # Tailwind base
│   ├── api/scan-receipt/route.ts   # Mistral API server-side (protege la API key)
│   ├── (auth)/login/page.tsx       # Login sin bottom nav
│   └── (app)/                      # Rutas protegidas con AuthGuard + BottomNav
│       ├── layout.tsx              # DataProvider + cleanupExpiredImages()
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
├── context/          # AuthContext.tsx, DataContext.tsx
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
  imagen_url?: string;  // Firebase Storage URL del recibo (se borra a los 30 días)
  notas?: string;
}
```

**Regla invariante:** Los campos `semana`, `mes`, `anio` SIEMPRE se calculan en tiempo de escritura usando `src/lib/utils/dates.ts`. Nunca derivarlos en queries.

### Índices compuestos (ya creados en Firebase Console)

| Colección | Campos | Orden |
|-----------|--------|-------|
| `ingresos` | `anio` ASC, `fecha` DESC | Ascending / Descending |
| `egresos` | `anio` ASC, `fecha` DESC | Ascending / Descending |
| `egresos` | `anio` ASC, `categoria` ASC, `fecha` DESC | — |

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

# Mistral AI — server-side ONLY (sin prefijo NEXT_PUBLIC_)
MISTRAL_API_KEY=
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
  return getFirestore(getFirebaseApp()); // simple — sin opciones, sin persistentLocalCache
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

### 2. `persistentLocalCache` — PROHIBIDO

**NUNCA** usar `initializeFirestore` con `persistentLocalCache`. Causa que la app muestre la URL cruda del stream de Firestore (`gsessionid=...&VER=8&TYPE=xmlhttp`) en lugar de renderizar la UI. `getDb()` debe ser siempre `return getFirestore(getFirebaseApp())` sin opciones.

### 3. Rutas Protegidas — `force-dynamic`

Toda página en `(app)/` y `(auth)/` debe tener:
```typescript
export const dynamic = 'force-dynamic';
```
Esto previene pre-rendering estático que dispara Firebase en build time.

### 4. Seguridad de API Keys

- `MISTRAL_API_KEY` solo se lee en `src/app/api/scan-receipt/route.ts` (server-side)
- El cliente NUNCA tiene acceso a la key de Mistral
- Las Firebase client keys (`NEXT_PUBLIC_*`) sí son seguras en el browser

### 5. Componentes UI

Siempre usar los átomos de `src/components/ui/`:
- `Button` — variantes: `primary` (emerald), `secondary`, `danger` (rose), `ghost`
- `Card` — contenedor estándar con shadow y border
- `Input` — con `label` y `error` props
- `Select` — recibe `options: { value, label }[]`
- `Modal` — bottom-sheet para confirmaciones de delete
- `Badge` — para categorías/métodos de pago con colores de `constants.ts`
- `Spinner` — loading states

### 6. Formularios

- `EgresoForm` acepta `initialValues` opcional para pre-llenado desde el scanner
- `SubcategoriaSelect` se re-renderiza automáticamente cuando cambia `categoria`
- Siempre usar `dateToInputValue(new Date())` como valor inicial de fecha
- Guardar con `addIngreso()`/`addEgreso()` pasando `fechaStr: string` (formato `YYYY-MM-DD`)

### 7. Hooks de Datos y DataContext

`DataContext` (`src/context/DataContext.tsx`) inicia los listeners de Firestore una sola vez al autenticarse, en `(app)/layout.tsx`. Todas las páginas consumen datos compartidos vía `useData()` — sin re-fetch por página.

```typescript
const { ingresos, loading } = useIngresos(anio?); // usa DataContext si anio == año actual
const { egresos, loading } = useEgresos(anio?);
const stats = useDashboardStats(ingresos, egresos); // derivado, sin fetch
```

`useIngresos`/`useEgresos` usan `DataContext` para el año actual; caen a `subscribeToX` directo para otros años.

### 8. Colores del Sistema

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

### 9. Mobile-First

- Mínimo `min-h-[44px]` / `min-w-[44px]` en todos los elementos táctiles
- BottomNav ocupa `h-16` → contenido con `pb-20` en el layout
- `safe-area-inset-bottom` en el BottomNav para iPhone
- Tailwind v4: usar clases `min-h-11` / `min-w-11` equivalente a `44px`

### 10. Tipos TypeScript

Todos los tipos en `src/types/index.ts`. No crear interfaces locales en componentes. Usar los tipos exportados:
```typescript
import type { Ingreso, Egreso, MetodoPago, CategoriaEgreso, GeminiReceiptResult } from '@/types';
```

### 11. Constantes del Negocio

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
      → Mistral pixtral-12b-2409 analiza imagen
      → Retorna JSON: { monto, subcategoria, notas, fecha }
      → JSON limpiado con regex: .replace(/:(\s*)([\d.]+)\s+[a-zA-Záéíóú]+/g, ':$1$2')
  → ScannerResult: campos editables pre-llenados
  → Usuario confirma
  → addEgreso({ ...parsed, imagen_url: downloadURL })
  → Redirect → /egresos

Error: → ScannerStatus error → botón "Ingresar manualmente" → /egresos/nuevo
```

**IMPORTANTE:** La IA es Mistral AI, NO Gemini. Gemini fue abandonado porque la política de la organización de Google bloquea todos los tipos de API key (los tokens OAuth `AQ.` devuelven `ACCESS_TOKEN_TYPE_UNSUPPORTED`; las service account JWTs devuelven `API_KEY_SERVICE_BLOCKED`; Vertex AI requiere billing deshabilitado). No intentar volver a Gemini.

---

## Auto-delete de Imágenes de Recibos

`cleanupExpiredImages()` en `firestore.ts` se ejecuta client-side, fire-and-forget, una vez cada 24h (throttle vía `localStorage`). Se dispara desde `(app)/layout.tsx` cuando el usuario se autentica.

- Queries `egresos` para `anio == año actual` y `anio == año anterior`
- Filtra en memoria: `fecha < hace 30 días AND imagen_url existe`
- Borra el archivo de Firebase Storage via `deleteStorageFile(imagen_url)`
- Limpia el campo `imagen_url` con `deleteField()` — **los datos financieros del egreso se conservan**

Path de storage derivado de la URL sin cambios de schema:
```
decodeURIComponent(url.split('/o/')[1].split('?')[0])
```

---

## Dashboard — Filtro Mensual

El dashboard tiene toggle `viewMode: 'semana' | 'mes'`:

- **Modo semana:** SummaryCards muestra stats de la semana actual, WeeklyChart visible
- **Modo mes:** selector horizontal de pills con los 12 meses, SummaryCards muestra totales del mes seleccionado desde `stats.monthlyTotals`, WeeklyChart oculto

`SummaryCards` acepta prop `label?: string` para mostrar el período encima de las cards.

---

## Qué Falta por Implementar

### Pendiente (alta prioridad)
1. **Reglas de seguridad de Firebase** — Aplicar en Firebase Console:
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
2. **Editar registros** — No hay edición, solo agregar/eliminar. Agregar ruta `/ingresos/[id]/editar` y `/egresos/[id]/editar`.
3. **Exportar a Excel/CSV** — El dueño necesita reportes semanales para llevar al contador.
4. **Notificaciones de presupuesto** — Alertar cuando los egresos superan un umbral semanal configurado.
5. **Múltiples años** — Agregar selector de año en historial.
6. **Resumen semanal** — Vista dedicada semana-por-semana con desglose por categoría (similar al Excel original).
7. **Toast/feedback visual** — No hay notificación de éxito al guardar. Implementar toast notifications.
8. **Service Worker offline** — next-pwa no funciona con Turbopack. Implementar SW manual en `public/sw.js` para cache offline.
9. **Deploy en Vercel** — No desplegado aún. Requiere configurar las variables de entorno en Vercel dashboard.

---

## Comandos Útiles

```bash
npm run dev      # Desarrollo (http://localhost:3000)
npm run build    # Build de producción — debe pasar sin errores
npm run lint     # ESLint
```

**Antes de commitear:** siempre correr `npm run build` para verificar que no hay errores de TypeScript.

---

## Notas de Arquitectura

- **Route groups:** `(auth)` para login (sin nav), `(app)` para rutas protegidas (con AuthGuard + BottomNav)
- **`EgresoForm` es shared:** lo usan `/egresos/nuevo` (manual) Y `/scanner` (pre-llenado con IA). La prop `initialValues` es el puente.
- **No hay middleware Edge** — la protección de rutas es client-side en `(app)/layout.tsx` con `useAuth()`. Suficiente para app single-admin.
- **Recharts necesita `'use client'`** — todos los componentes de gráficas son client components.
- **`DataContext`** en `(app)/layout.tsx` — inicia ambos listeners de Firestore al autenticarse, evita re-fetch por navegación entre páginas.
