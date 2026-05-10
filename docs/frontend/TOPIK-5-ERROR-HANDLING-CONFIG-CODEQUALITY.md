# Topik 5 — Error Handling, Environment & Config, Code Quality

> Hasil diskusi standar penulisan lanjutan frontend web-v2 POS System.
> Dokumen ini menjadi **standar penulisan** yang wajib diikuti seluruh pengembangan frontend ke depan.

---

## 5A — Error Handling & Toast Notification

### Prinsip

```
Error dari API     → ditangkap di Axios interceptor → dilempar sebagai Error terstandar
Error di mutasi    → ditangkap di onError TanStack Query → tampil via toast
Error di query     → ditangkap otomatis → tampil via ErrorBoundary atau inline
Error validasi     → ditangkap Zod → tampil inline di bawah field form
Error tidak terduga → ditangkap ErrorBoundary → tampil fallback page
```

### Klasifikasi Error

```ts
// services/api.client.ts — normalize semua error dari backend
// Backend selalu return: { status: false, message: string }

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Di response interceptor — semua error dinormalisasi ke ApiError
apiClient.interceptors.response.use(
  (response) => response.data.data,  // unwrap { status, message, data }
  (error) => {
    const statusCode = error.response?.status ?? 0
    const message    = error.response?.data?.message ?? 'Terjadi kesalahan, coba lagi'

    // 401 dihandle di interceptor refresh (Topik 3C)
    // Sisanya dilempar sebagai ApiError
    return Promise.reject(new ApiError(message, statusCode))
  }
)
```

### Pola Toast Notification

Pakai **Sonner** (bukan shadcn toast bawaan) — lebih ringan, posisi fleksibel, support promise toast.

```tsx
// app/providers.tsx
import { Toaster } from 'sonner'

export const Providers = ({ children }) => (
  <>
    {children}
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={4000}
    />
  </>
)
```

### Kapan Pakai Toast, Kapan Pakai Inline

```
Toast (notifikasi global)       Inline (di dalam komponen)
──────────────────────────      ──────────────────────────
✅ Sukses simpan data           ✅ Error validasi form field
✅ Sukses hapus data            ✅ Error fetch data di halaman
✅ Error dari API (mutasi)      ✅ Empty state tabel
✅ Peringatan koneksi offline   ❌ Jangan toast untuk info statis
✅ Notifikasi sync selesai
```

### Pola di TanStack Query Mutation

```ts
// Standar untuk SEMUA mutation di seluruh aplikasi
const { mutate: createProduct, isPending } = useMutation({
  mutationFn: (data: CreateProductPayload) =>
    apiClient.post('/products', data),

  onSuccess: () => {
    toast.success('Produk berhasil ditambahkan')
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
    onClose()  // tutup modal
  },

  onError: (error: ApiError) => {
    toast.error(error.message)
  },
})
```

### Pola Promise Toast (untuk aksi yang butuh waktu)

```ts
// Cocok untuk export, sync, upload file
toast.promise(exportReport(filter), {
  loading: 'Mengekspor laporan...',
  success: 'Laporan berhasil diunduh',
  error:   (err: ApiError) => err.message,
})
```

### Error Boundary

Setiap halaman dibungkus ErrorBoundary untuk mencegah crash total.

```tsx
// app/router.tsx
{
  path: '/products',
  element: (
    <ErrorBoundary fallback={<PageError />}>
      <ProductsPage />
    </ErrorBoundary>
  ),
}

// shared/components/PageError.tsx
// Tampil saat ada unhandled error — tombol "Muat Ulang Halaman"
```

### Offline Detection

```ts
// services/notification.service.ts
// Deteksi status koneksi dan tampil banner/toast
window.addEventListener('offline', () => {
  toast.warning('Koneksi terputus. Beberapa fitur mungkin tidak tersedia.', {
    duration: Infinity,  // tidak hilang sampai online kembali
    id: 'offline-toast', // cegah duplikasi
  })
})

window.addEventListener('online', () => {
  toast.dismiss('offline-toast')
  toast.success('Koneksi kembali')
})
```

---

## 5B — Environment & Configuration

### File Environment

```bash
# .env.development  ← aktif saat npm run dev
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=POS System
VITE_PLATFORM=web

# .env.production   ← aktif saat npm run build
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=POS System
VITE_PLATFORM=web
```

### Centralized Config

Semua akses ke environment variable **wajib** lewat satu file config — tidak boleh akses `import.meta.env` langsung di komponen.

```ts
// shared/constants/config.ts
export const config = {
  apiUrl:      import.meta.env.VITE_API_URL      as string,
  appName:     import.meta.env.VITE_APP_NAME     as string,
  platform:    import.meta.env.VITE_PLATFORM     as string,
  isDev:       import.meta.env.DEV,
  isProd:      import.meta.env.PROD,
} as const

// ✅ Benar
import { config } from '@/shared/constants/config'
const url = config.apiUrl

// ❌ Salah — akses langsung di komponen
const url = import.meta.env.VITE_API_URL
```

### Vite Config

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir:     'dist',
    sourcemap:  false,  // nonaktifkan di production
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:       ['react', 'react-dom', 'react-router-dom'],
          query:        ['@tanstack/react-query'],
          ui:           ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          form:         ['react-hook-form', 'zod', '@hookform/resolvers'],
          charts:       ['recharts'],
        },
      },
    },
  },
})
```

Manual chunks mencegah satu bundle besar — halaman kasir tidak perlu load kode charts.

---

## 5C — Code Quality

### ESLint Config

```ts
// eslint.config.ts
import js       from '@eslint/js'
import ts       from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importPlugin from 'eslint-plugin-import'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser },
    plugins: {
      '@typescript-eslint': ts,
      'react-hooks':        reactHooks,
      'react-refresh':      reactRefresh,
      'import':             importPlugin,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any':        'error',   // tidak boleh pakai any
      '@typescript-eslint/no-unused-vars':          'error',
      '@typescript-eslint/consistent-type-imports': 'error',  // pakai import type

      // React Hooks
      'react-hooks/rules-of-hooks':  'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Import order
      'import/order': ['error', {
        groups: [
          'builtin',
          'external',
          'internal',    // @/ alias
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      }],

      // Tidak boleh ada console.log di production code
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Tidak boleh ada debugger
      'no-debugger': 'error',
    },
  },
]
```

### Prettier Config

```json
// .prettierrc
{
  "semi":           false,
  "singleQuote":    true,
  "tabWidth":       2,
  "trailingComma":  "es5",
  "printWidth":     100,
  "bracketSpacing": true,
  "arrowParens":    "always",
  "endOfLine":      "lf"
}
```

### TypeScript Config

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "target":            "ES2020",
    "useDefineForClassFields": true,
    "lib":               ["ES2020", "DOM", "DOM.Iterable"],
    "module":            "ESNext",
    "skipLibCheck":      true,
    "moduleResolution":  "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules":   true,
    "noEmit":            true,
    "jsx":               "react-jsx",

    // Strict — wajib aktif semua
    "strict":                       true,
    "noUnusedLocals":               true,
    "noUnusedParameters":           true,
    "noFallthroughCasesInSwitch":   true,
    "noImplicitReturns":            true,

    // Path alias
    "baseUrl":  ".",
    "paths":    { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

`strict: true` mengaktifkan semua strict check TypeScript sekaligus — tidak ada kompromi.

### Husky + lint-staged (Pre-commit Hook)

Setiap kali `git commit`, kode yang di-stage otomatis dicek sebelum commit berhasil.

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,json,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

Kalau ada ESLint error yang tidak bisa auto-fix, commit akan **gagal** — developer harus fix dulu sebelum bisa commit. Ini mencegah kode kotor masuk ke repository.

### Struktur Import Order (Standar)

Urutan import yang konsisten di semua file:

```ts
// 1. React & library eksternal
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

// 2. Internal — shared
import { DataTable } from '@/shared/components/DataTable'
import { formatRupiah } from '@/shared/utils/currency'
import { queryKeys } from '@/shared/constants/queryKeys'

// 3. Internal — fitur lain (lewat index.ts)
import { useAuthStore } from '@/features/auth'

// 4. Internal — fitur sendiri
import { useProductsStore } from '../products.store'
import { useProductListQuery } from '../products.api'
import type { Product } from '../products.types'

// 5. Komponen lokal
import { ProductFormModal } from './ProductFormModal'
```

ESLint `import/order` rule akan enforce urutan ini secara otomatis.

---

## Ringkasan Keputusan Topik 5

### 5A — Error Handling

| Aspek | Keputusan |
|---|---|
| Error normalisasi | `ApiError` class di Axios interceptor |
| Toast library | Sonner — posisi top-right, duration 4 detik |
| Error mutasi | `onError` di TanStack mutation → `toast.error(error.message)` |
| Error form | Inline via `<FormMessage />` (Zod) — bukan toast |
| Error query | Inline di halaman atau ErrorBoundary |
| Error boundary | Setiap route dibungkus ErrorBoundary |
| Offline detection | `window online/offline` event → toast permanent sampai online kembali |

### 5B — Environment & Config

| Aspek | Keputusan |
|---|---|
| File env | `.env.development` dan `.env.production` |
| Akses env | Wajib lewat `shared/constants/config.ts` — tidak boleh akses `import.meta.env` langsung |
| Proxy dev | Vite proxy `/api` → `localhost:8080` (tidak ada CORS issue saat development) |
| Bundle split | Manual chunks: vendor, query, ui, form, charts |

### 5C — Code Quality

| Aspek | Keputusan |
|---|---|
| TypeScript | `strict: true` — semua strict check aktif |
| ESLint | No `any`, no `console.log`, import order wajib, hooks rules |
| Prettier | Single quote, no semi, trailing comma ES5, print width 100 |
| Pre-commit | Husky + lint-staged — ESLint + Prettier otomatis saat commit |
| `no-explicit-any` | `error` level — tidak ada toleransi untuk `any` |
