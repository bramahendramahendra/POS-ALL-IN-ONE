# FASE 2 — Foundation: Utils, Constants & Styles

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 0 & 1 sudah selesai: project setup selesai, API client dan global types sudah ada.

## Standar Wajib
- Semua import pakai alias `@/`
- Utils adalah pure functions — tidak ada React, tidak ada side effect
- Semua akses env variable lewat `config.ts` — tidak boleh `import.meta.env` langsung di komponen
- Tidak ada `any`

## Tugas Fase Ini

### File 1: `src/shared/constants/config.ts`
Central config dari environment variables:
```ts
export const config = {
  apiUrl:   import.meta.env.VITE_API_URL   as string,
  appName:  import.meta.env.VITE_APP_NAME  as string,
  platform: import.meta.env.VITE_PLATFORM  as string,
  isDev:    import.meta.env.DEV   as boolean,
  isProd:   import.meta.env.PROD  as boolean,
} as const
```

### File 2: `src/shared/constants/roles.ts`
```ts
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  KASIR: 'kasir',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]
```

### File 3: `src/shared/constants/routes.ts`
Semua path route dalam satu konstanta:
```ts
export const ROUTES = {
  LOGIN:        '/login',
  DASHBOARD:    '/dashboard',
  KASIR:        '/kasir',
  PRODUCTS:     '/products',
  SUPPLIERS:    '/suppliers',
  TRANSACTIONS: '/transactions',
  CUSTOMERS:    '/customers',
  RECEIVABLES:  '/receivables',
  FINANCE:      '/finance',
  REPORTS:      '/reports',
  SHIFTS:       '/shifts',
  SETTINGS:     '/settings',
  SYNC:         '/sync',
} as const
```

### File 4: `src/shared/constants/queryKeys.ts`
Query Key Factory untuk TanStack Query.
Semua query key harus terdefinisi di sini — tidak boleh ada magic string di komponen.

Buat factory untuk:
- `auth` → `profile()`
- `products` → `all()`, `list(filter?)`, `detail(id)`, `priceTiers(id)`, `barcode(code)`
- `categories` → `all()`, `list()`
- `units` → `all()`, `list()`
- `suppliers` → `all()`, `list(filter?)`, `detail(id)`
- `transactions` → `all()`, `list(filter?)`, `detail(id)`
- `customers` → `all()`, `list(filter?)`, `detail(id)`
- `receivables` → `all()`, `list(filter?)`
- `finance` → `summary(filter?)`
- `dashboard` → `summary(period)`, `salesChart(period)`, `topProducts(period)`
- `reports` → `data(filter?)`
- `shifts` → `all()`, `list(filter?)`, `active()`
- `settings` → `store()`, `users()`, `appVersions()`
- `sync` → `status()`, `history()`, `conflicts()`

Pattern setiap factory:
```ts
products: {
  all:        () => ['products'] as const,
  list:       (filter?: ProductFilter) => ['products', 'list', filter] as const,
  detail:     (id: number) => ['products', 'detail', id] as const,
  priceTiers: (id: number) => ['products', 'priceTiers', id] as const,
  barcode:    (code: string) => ['products', 'barcode', code] as const,
},
```

Filter types bisa pakai `Record<string, unknown>` untuk sekarang — akan diperketat di fase fitur masing-masing.

### File 5: `src/shared/constants/index.ts`
Re-export semua dari `config`, `roles`, `routes`, `queryKeys`.

### File 6: `src/shared/utils/currency.ts`
Fungsi format mata uang Rupiah:
- `formatRupiah(value: number, withDecimal?: boolean): string`
  → "Rp 150.000" atau "Rp 150.000,50"
- `parseRupiah(value: string): number`
  → "Rp 150.000" → 150000
- `formatNumber(value: number): string`
  → 1500000 → "1.500.000"

### File 7: `src/shared/utils/date.ts`
Fungsi format tanggal dalam Bahasa Indonesia:
- `formatDate(date: string | Date): string`
  → "15 Jan 2024"
- `formatDateTime(date: string | Date): string`
  → "15 Jan 2024, 10:30"
- `formatRelative(date: string | Date): string`
  → "2 jam yang lalu" / "kemarin" / "15 Jan 2024"
- `toISODate(date: Date): string`
  → "2024-01-15" (format untuk dikirim ke API)

### File 8: `src/shared/utils/string.ts`
- `truncate(str: string, maxLength: number): string`
- `capitalize(str: string): string`
- `slugify(str: string): string`

### File 9: `src/shared/utils/number.ts`
- `clamp(value: number, min: number, max: number): number`
- `roundTo(value: number, decimals: number): number`
- `percentage(value: number, total: number): number`

### File 10: `src/shared/utils/index.ts`
Re-export semua dari `currency`, `date`, `string`, `number`.

### File 11: `src/styles/tokens.css`
CSS custom properties (design tokens):
```css
:root {
  /* Colors — sesuai desain POS existing */
  --color-primary:        #2c3e50;
  --color-primary-light:  #34495e;
  --color-accent:         #3498db;
  --color-success:        #27ae60;
  --color-warning:        #f39c12;
  --color-danger:         #e74c3c;
  --color-muted:          #bdc3c7;
  --color-bg:             #f5f6fa;
  --color-surface:        #ffffff;
  --color-border:         #e0e0e0;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;

  /* Spacing */
  --sidebar-width: 220px;
  --navbar-height: 60px;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.12);
}
```

### File 12: `src/styles/globals.css`
```css
@import './tokens.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { box-sizing: border-box; }
  body {
    font-family: var(--font-sans);
    background-color: var(--color-bg);
    color: var(--color-primary);
    margin: 0;
  }
  /* Scrollbar styling */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--color-muted); border-radius: 3px; }
}
```

Update `src/main.tsx` agar import `@/styles/globals.css` (ganti `./index.css`).

## Hasil yang Diharapkan
- 12 file baru dibuat
- Semua utils bisa diimport: `import { formatRupiah } from '@/shared/utils'`
- Semua constants bisa diimport: `import { ROLES, ROUTES, queryKeys } from '@/shared/constants'`
- Styling dasar sudah aktif saat `npm run dev`
- TypeScript tidak ada error
