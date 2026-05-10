# FASE 33 — Polish: Husky, Lint & TypeScript Strict Final

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 32 sudah selesai: Error boundaries dan offline detection sudah ada.
Semua fitur sudah diimplementasikan. Fase ini memastikan kode bersih sebelum dianggap selesai.

## Tugas Fase Ini

### 1. Jalankan TypeScript Check
```bash
cd web-v2
npx tsc --noEmit
```
Fix SEMUA TypeScript error yang muncul. Tidak boleh ada error yang tersisa.
Tidak boleh menggunakan `// @ts-ignore` atau `// @ts-expect-error` sebagai solusi.

### 2. Jalankan ESLint
```bash
npx eslint src --ext .ts,.tsx --fix
```
Fix semua yang bisa auto-fix. Untuk yang tidak bisa auto-fix, perbaiki manual.

Prioritas fix:
- `@typescript-eslint/no-explicit-any` — ganti semua `any` dengan type yang benar
- `react-hooks/exhaustive-deps` — tambahkan dependency yang hilang di useEffect
- `no-console` — hapus semua `console.log` (boleh ada `console.error` untuk error logging)
- `import/order` — urutkan import sesuai convention

### 3. Jalankan Prettier
```bash
npx prettier --write src/
```

### 4. Verifikasi Husky Setup
Pastikan Husky pre-commit hook berjalan:
```bash
# Test hook berjalan
git add .
git commit -m "test" --dry-run
```
Jika ada error setup Husky:
```bash
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

Verifikasi `package.json` punya:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,json,md}": ["prettier --write"]
  }
}
```

### 5. Jalankan Build Production
```bash
npm run build
```
Build harus berhasil tanpa warning yang signifikan.
Jika ada bundle size warning, evaluasi apakah perlu lazy loading.

### 6. Implementasikan Code Splitting (Lazy Loading) per Route
Ganti semua import Page di router.tsx menjadi lazy:
```tsx
import { lazy, Suspense } from 'react'

const ProductsPage  = lazy(() => import('@/features/inventory/products/ProductsPage').then(m => ({ default: m.ProductsPage })))
const CashierPage   = lazy(() => import('@/features/sales/cashier/CashierPage').then(m => ({ default: m.CashierPage })))
// ... dan seterusnya untuk semua Page

// Di router, bungkus dengan Suspense:
{
  path: '/products',
  element: (
    <Suspense fallback={<PageLoader />}>
      <ProductsPage />
    </Suspense>
  )
}
```

Ini memastikan kode di-split per halaman — halaman kasir tidak load kode dashboard.

### 7. Audit Konsistensi
Cek hal-hal berikut secara manual atau dengan grep:

```bash
# Pastikan tidak ada akses localStorage langsung (kecuali di Zustand persist dan useLocalStorage hook)
grep -r "localStorage\." src --include="*.tsx" --include="*.ts" | grep -v "auth.store" | grep -v "useLocalStorage" | grep -v "node_modules"

# Pastikan tidak ada import.meta.env langsung (kecuali di config.ts)
grep -r "import.meta.env" src --include="*.tsx" --include="*.ts" | grep -v "config.ts"

# Pastikan tidak ada magic string query key
grep -r "queryKey:\s*\['" src --include="*.tsx" --include="*.ts" | grep -v "queryKeys\."

# Pastikan tidak ada any
grep -r ": any" src --include="*.tsx" --include="*.ts"
```

Fix setiap temuan yang melanggar aturan.

### 8. Performance Check
- Buka browser DevTools → Network tab
- Login dan navigasi ke semua halaman
- Pastikan tidak ada request yang duplikat
- Pastikan TanStack Query caching berjalan (request yang sama tidak di-fetch ulang dalam 5 menit)

## Hasil yang Diharapkan
- `npx tsc --noEmit` → 0 errors
- `npx eslint src` → 0 errors
- `npm run build` → build berhasil
- Pre-commit hook berjalan saat `git commit`
- Code splitting aktif — bundle utama lebih kecil
- Tidak ada `any`, tidak ada `localStorage` langsung, tidak ada magic query key
- Aplikasi siap untuk development selanjutnya
