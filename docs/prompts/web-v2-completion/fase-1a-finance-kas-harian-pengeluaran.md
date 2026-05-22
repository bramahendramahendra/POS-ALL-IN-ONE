# Fase 1A — Finance Sub-Menu: Kas Harian & Pengeluaran

Kamu adalah senior React/TypeScript developer. Saya punya project web-v2 (React + TypeScript +
Vite + Zustand + React Query + React Router v6, Tailwind CSS + shadcn/ui).

## Context

Struktur project: `web-v2/src/features/<domain>/`
Pattern per feature:
- `*.api.ts`      → React Query hooks (useQuery/useMutation via apiClient)
- `*.types.ts`    → TypeScript types
- `components/`   → sub-komponen
- `*Page.tsx`     → halaman utama

API client import: `import { apiClient } from '@/shared/lib/api-client'`
Shared UI: `@/shared/components/ui/*` (button, input, select, dialog, table, badge, dll)
Format currency: gunakan helper `formatCurrency` yang sudah ada di project.

## Existing Finance

- `/finance` → `FinancePage.tsx` sudah ada: menampilkan summary arus kas + tabel cashflow
- Route `/finance` sudah di `router.tsx` dan `navigation.ts`
- Referensi pattern: `web-v2/src/features/finance/overview/`

## Task

Desktop punya 3 tab di finance: "Arus Kas", "Kas Harian" (cash drawer), dan "Pengeluaran".
Di web-v2 kita buat sub-menu (nested route) bukan tab.

Buat 2 halaman baru:

---

### Halaman 1: Kas Harian — `/finance/cash-drawer`

Fitur:
- Tabel riwayat kas harian: kolom = Tanggal, Saldo Awal, Total Masuk, Total Keluar, Saldo Akhir, Selisih, Status (open/closed), Aksi
- Filter: date_from, date_to
- Klik baris → modal detail: tampilkan breakdown transaksi masuk/keluar hari itu
- Tombol "Tutup Kas" jika hari ini belum ditutup (role: owner/admin)

API endpoints:
- `GET /cash-drawer` — params: `date_from`, `date_to`, `page`, `page_size`
  Response: `{ success, data: { items: CashDrawer[], total } }`
- `GET /cash-drawer/:id` — detail satu record
- `POST /cash-drawer/close` — body: `{ notes: string }` — tutup kas hari ini

Types untuk `cash-drawer.types.ts`:
```ts
interface CashDrawer {
  id: number
  date: string
  opening_balance: number
  total_in: number
  total_out: number
  closing_balance: number
  expected_balance: number
  difference: number
  status: 'open' | 'closed'
  notes?: string
  closed_at?: string
  closed_by_name?: string
}
```

---

### Halaman 2: Pengeluaran — `/finance/expenses`

Fitur:
- Tabel pengeluaran: kolom = Tanggal, Kategori, Keterangan, Jumlah, Kasir, Aksi (edit, hapus)
- Filter: date_from, date_to, category
- Tombol "Tambah Pengeluaran" → modal form
- Form: tanggal, kategori (select: operasional/pembelian/gaji/lainnya), keterangan, jumlah (rupiah input), catatan

API endpoints:
- `GET /expenses` — params: `date_from`, `date_to`, `category`, `page`, `page_size`
- `GET /expenses/:id`
- `POST /expenses` — body: `{ expense_date, category, description, amount, notes }`
- `PUT /expenses/:id`
- `DELETE /expenses/:id`

Types untuk `expenses.types.ts`:
```ts
interface Expense {
  id: number
  expense_date: string
  category: 'operasional' | 'pembelian' | 'gaji' | 'lainnya'
  description: string
  amount: number
  notes?: string
  created_by_name: string
  created_at: string
}
```

---

## Router & Navigation Changes

Di `web-v2/src/shared/constants/routes.ts` tambahkan:
```ts
FINANCE_CASH_DRAWER: '/finance/cash-drawer',
FINANCE_EXPENSES: '/finance/expenses',
```

Di `web-v2/src/app/router.tsx` tambahkan ke protected MANAGEMENT_ROLES children:
```ts
{ path: ROUTES.FINANCE_CASH_DRAWER, element: <LazyRoute><CashDrawerPage /></LazyRoute> },
{ path: ROUTES.FINANCE_EXPENSES,    element: <LazyRoute><ExpensesPage /></LazyRoute> },
```

Di `web-v2/src/shared/constants/navigation.ts` tambahkan di group "Keuangan":
```ts
{ label: 'Kas Harian',  path: ROUTES.FINANCE_CASH_DRAWER, icon: Landmark, allowedRoles: MANAGEMENT_ROLES, group: 'Keuangan' },
{ label: 'Pengeluaran', path: ROUTES.FINANCE_EXPENSES,    icon: TrendingDown, allowedRoles: MANAGEMENT_ROLES, group: 'Keuangan' },
```

---

## Output yang Diharapkan

Buat file-file berikut (isi lengkap, siap pakai):

1. `web-v2/src/features/finance/cash-drawer/cash-drawer.types.ts`
2. `web-v2/src/features/finance/cash-drawer/cash-drawer.api.ts`
3. `web-v2/src/features/finance/cash-drawer/components/CashDrawerTable.tsx`
4. `web-v2/src/features/finance/cash-drawer/components/CashDrawerDetailModal.tsx`
5. `web-v2/src/features/finance/cash-drawer/CashDrawerPage.tsx`
6. `web-v2/src/features/finance/expenses/expenses.types.ts`
7. `web-v2/src/features/finance/expenses/expenses.api.ts`
8. `web-v2/src/features/finance/expenses/components/ExpenseFormModal.tsx`
9. `web-v2/src/features/finance/expenses/components/ExpenseTable.tsx`
10. `web-v2/src/features/finance/expenses/ExpensesPage.tsx`
11. Update `web-v2/src/shared/constants/routes.ts`
12. Update `web-v2/src/shared/constants/navigation.ts`
13. Update `web-v2/src/app/router.tsx`

Jangan buat file lain selain yang disebutkan di atas.
Ikuti pattern yang sudah ada di `web-v2/src/features/finance/overview/` sebagai referensi gaya kode.
