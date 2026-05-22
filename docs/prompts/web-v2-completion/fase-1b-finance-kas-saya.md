# Fase 1B — Finance: Kas Saya (My Cash)

Kamu adalah senior React/TypeScript developer. Saya punya project web-v2 (React + TypeScript +
Vite + Zustand + React Query + React Router v6, Tailwind CSS + shadcn/ui).

## Context

Melanjutkan dari Fase 1A. Routes `/finance/cash-drawer` dan `/finance/expenses` sudah ada.

Struktur project: `web-v2/src/features/<domain>/`
Pattern per feature:
- `*.api.ts`      → React Query hooks
- `*.types.ts`    → TypeScript types
- `components/`   → sub-komponen
- `*Page.tsx`     → halaman utama

API client import: `import { apiClient } from '@/shared/lib/api-client'`
Shared UI: `@/shared/components/ui/*`

## Task: Kas Saya — `/finance/my-cash`

Halaman ini hanya untuk role `kasir`. Menampilkan kas yang dipegang kasir yang sedang login.

Fitur:
- Summary card: Saldo kas yang dipegang sekarang (angka besar, mencolok)
- Tabel riwayat penerimaan/pengembalian uang kas
- Kolom tabel: Tanggal, Jenis (Terima / Kembalikan), Jumlah, Catatan, Oleh (admin/owner yang mencatat)

API endpoints:
- `GET /cash-drawer/my-cash`
  Response: `{ success, data: { balance: number, transactions: MyCashTransaction[] } }`

Types untuk `my-cash.types.ts`:
```ts
interface MyCashTransaction {
  id: number
  type: 'receive' | 'return'
  amount: number
  notes?: string
  created_by_name: string
  created_at: string
}

interface MyCashData {
  balance: number
  transactions: MyCashTransaction[]
}
```

## Router & Navigation Changes

Di `web-v2/src/shared/constants/routes.ts` tambahkan:
```ts
FINANCE_MY_CASH: '/finance/my-cash',
```

Di `web-v2/src/app/router.tsx` tambahkan ke protected ALL_ROLES children
(kasir perlu akses halaman ini):
```ts
{ path: ROUTES.FINANCE_MY_CASH, element: <LazyRoute><MyCashPage /></LazyRoute> },
```

Di `web-v2/src/shared/constants/navigation.ts` tambahkan di group "Keuangan":
```ts
{ label: 'Kas Saya', path: ROUTES.FINANCE_MY_CASH, icon: Wallet, allowedRoles: [ROLES.KASIR], group: 'Keuangan' },
```

Catatan: nav item ini hanya muncul untuk role kasir, bukan owner/admin.

## Output yang Diharapkan

Buat file-file berikut (isi lengkap, siap pakai):

1. `web-v2/src/features/finance/my-cash/my-cash.types.ts`
2. `web-v2/src/features/finance/my-cash/my-cash.api.ts`
3. `web-v2/src/features/finance/my-cash/MyCashPage.tsx`
4. Update `web-v2/src/shared/constants/routes.ts`
5. Update `web-v2/src/shared/constants/navigation.ts`
6. Update `web-v2/src/app/router.tsx`

Jangan buat file lain selain yang disebutkan di atas.
