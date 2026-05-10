# Topik 1 — Struktur Folder & Naming Convention

> Hasil diskusi arsitektur frontend web-v2 POS System.
> Dokumen ini menjadi **standar penulisan** yang wajib diikuti seluruh pengembangan frontend ke depan.

---

## Struktur Folder Lengkap

```
web-v2/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   ├── main.tsx                    → Vite entry point, React root mount
│   │   ├── App.tsx                     → Router setup, global providers
│   │   ├── router.tsx                  → Route definitions (React Router v6)
│   │   └── providers.tsx               → QueryClientProvider, ThemeProvider, dll
│   │
│   ├── features/
│   │   │
│   │   ├── auth/
│   │   │   ├── index.ts
│   │   │   ├── LoginPage.tsx
│   │   │   ├── components/
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── auth.store.ts           → Zustand: user session, role
│   │   │   ├── auth.api.ts             → login, logout, refresh token
│   │   │   └── auth.types.ts           → User, Role, AuthState
│   │   │
│   │   ├── sales/
│   │   │   ├── cashier/
│   │   │   │   ├── index.ts
│   │   │   │   ├── CashierPage.tsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── ProductSearch.tsx
│   │   │   │   │   ├── CartPanel.tsx
│   │   │   │   │   ├── CartItem.tsx
│   │   │   │   │   ├── DiscountInput.tsx
│   │   │   │   │   ├── TaxInput.tsx
│   │   │   │   │   ├── PaymentModal.tsx
│   │   │   │   │   ├── UnitSelectModal.tsx
│   │   │   │   │   └── ReceiptPrint.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useCart.ts
│   │   │   │   │   ├── useBarcodeScan.ts
│   │   │   │   │   └── useProductSearch.ts
│   │   │   │   ├── cashier.store.ts    → cart, discount, tax, payment state
│   │   │   │   ├── cashier.api.ts      → product search, price tier, checkout
│   │   │   │   ├── cashier.types.ts    → CartItem, Discount, PaymentPayload
│   │   │   │   └── cashier.utils.ts    → hitungTotal, hitungDiskon, hitungPajak
│   │   │   │
│   │   │   └── transactions/
│   │   │       ├── index.ts
│   │   │       ├── TransactionsPage.tsx
│   │   │       ├── components/
│   │   │       │   ├── TransactionTable.tsx
│   │   │       │   ├── TransactionFilter.tsx
│   │   │       │   └── TransactionDetailModal.tsx
│   │   │       ├── transactions.api.ts
│   │   │       └── transactions.types.ts
│   │   │
│   │   ├── inventory/
│   │   │   ├── products/
│   │   │   │   ├── index.ts
│   │   │   │   ├── ProductsPage.tsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── ProductTable.tsx
│   │   │   │   │   ├── ProductFormModal.tsx
│   │   │   │   │   ├── CategoryTab.tsx
│   │   │   │   │   ├── UnitTab.tsx
│   │   │   │   │   ├── PriceTierTab.tsx
│   │   │   │   │   ├── ImportCsvModal.tsx
│   │   │   │   │   └── LabelPrintModal.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useProductForm.ts
│   │   │   │   ├── products.store.ts   → tab aktif, selected rows, editing state
│   │   │   │   ├── products.api.ts     → CRUD produk, kategori, unit, harga
│   │   │   │   ├── products.types.ts   → Product, Category, Unit, PriceTier
│   │   │   │   └── products.utils.ts   → validasi import CSV
│   │   │   │
│   │   │   └── suppliers/
│   │   │       ├── index.ts
│   │   │       ├── SuppliersPage.tsx
│   │   │       ├── components/
│   │   │       │   ├── SupplierTable.tsx
│   │   │       │   └── SupplierFormModal.tsx
│   │   │       ├── suppliers.api.ts
│   │   │       └── suppliers.types.ts
│   │   │
│   │   ├── finance/
│   │   │   ├── overview/
│   │   │   │   ├── index.ts
│   │   │   │   ├── FinancePage.tsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── FinanceSummaryCard.tsx
│   │   │   │   │   └── FinanceTable.tsx
│   │   │   │   ├── finance.api.ts
│   │   │   │   └── finance.types.ts
│   │   │   │
│   │   │   └── receivables/
│   │   │       ├── index.ts
│   │   │       ├── ReceivablesPage.tsx
│   │   │       ├── components/
│   │   │       │   ├── ReceivableTable.tsx
│   │   │       │   └── PaymentRecordModal.tsx
│   │   │       ├── receivables.api.ts
│   │   │       └── receivables.types.ts
│   │   │
│   │   ├── customers/
│   │   │   ├── index.ts
│   │   │   ├── CustomersPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── CustomerTable.tsx
│   │   │   │   └── CustomerFormModal.tsx
│   │   │   ├── customers.api.ts
│   │   │   └── customers.types.ts
│   │   │
│   │   ├── reporting/
│   │   │   ├── dashboard/
│   │   │   │   ├── index.ts
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── SummaryCards.tsx
│   │   │   │   │   ├── SalesChart.tsx
│   │   │   │   │   └── TopProductsTable.tsx
│   │   │   │   ├── dashboard.api.ts
│   │   │   │   └── dashboard.types.ts
│   │   │   │
│   │   │   └── reports/
│   │   │       ├── index.ts
│   │   │       ├── ReportsPage.tsx
│   │   │       ├── components/
│   │   │       │   ├── ReportFilter.tsx
│   │   │       │   ├── ReportTable.tsx
│   │   │       │   └── ExportButton.tsx
│   │   │       ├── reports.api.ts
│   │   │       └── reports.types.ts
│   │   │
│   │   ├── shifts/
│   │   │   ├── index.ts
│   │   │   ├── ShiftsPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── ShiftTable.tsx
│   │   │   │   ├── OpenShiftModal.tsx
│   │   │   │   └── CloseShiftModal.tsx
│   │   │   ├── shifts.api.ts
│   │   │   └── shifts.types.ts
│   │   │
│   │   ├── settings/
│   │   │   ├── index.ts
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── StoreProfileForm.tsx
│   │   │   │   ├── UserManagementTab.tsx
│   │   │   │   └── AppVersionTab.tsx
│   │   │   ├── settings.api.ts
│   │   │   └── settings.types.ts
│   │   │
│   │   └── sync/
│   │       ├── index.ts
│   │       ├── SyncCenterPage.tsx
│   │       ├── components/
│   │       │   ├── SyncStatusCard.tsx
│   │       │   ├── ConflictList.tsx
│   │       │   └── SyncHistoryTable.tsx
│   │       ├── hooks/
│   │       │   └── useSyncStatus.ts    → polling via TanStack Query
│   │       ├── sync.store.ts           → notifikasi aktif, conflict pending
│   │       ├── sync.api.ts
│   │       └── sync.types.ts
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/                     → shadcn/ui components (raw)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   └── ...
│   │   │   ├── DataTable/
│   │   │   │   ├── index.ts
│   │   │   │   ├── DataTable.tsx
│   │   │   │   └── DataTable.types.ts
│   │   │   ├── PageHeader/
│   │   │   │   ├── index.ts
│   │   │   │   └── PageHeader.tsx
│   │   │   ├── ConfirmDialog/
│   │   │   │   ├── index.ts
│   │   │   │   └── ConfirmDialog.tsx
│   │   │   └── RoleGuard/
│   │   │       ├── index.ts
│   │   │       └── RoleGuard.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   ├── usePagination.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── usePermission.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── currency.ts             → formatRupiah, parseRupiah
│   │   │   ├── date.ts                 → formatDate, formatDateTime
│   │   │   ├── string.ts               → truncate, capitalize
│   │   │   └── validation.ts
│   │   │
│   │   ├── types/
│   │   │   ├── api.types.ts            → ApiResponse<T>, PaginatedResponse<T>, ApiError
│   │   │   └── common.types.ts         → User, Role, SelectOption
│   │   │
│   │   └── constants/
│   │       ├── roles.ts                → ROLES = { OWNER, ADMIN, KASIR }
│   │       ├── queryKeys.ts            → TanStack Query key factory
│   │       └── routes.ts               → ROUTES = { DASHBOARD, CASHIER, ... }
│   │
│   ├── services/
│   │   ├── api.client.ts               → Axios instance + interceptor token + refresh
│   │   ├── printer.service.ts          → abstraksi cetak struk
│   │   └── notification.service.ts     → polling atau future WebSocket
│   │
│   └── styles/
│       ├── globals.css                 → Tailwind base + CSS reset
│       └── tokens.css                  → CSS variables: warna, spacing, radius
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tailwind.config.ts
├── eslint.config.ts
├── .env.development
├── .env.production
└── package.json
```

---

## Domain Mapping

| Domain | Sub-fitur | Deskripsi |
|---|---|---|
| `auth` | — | Login, session, role guard |
| `sales` | cashier, transactions | Kasir, riwayat transaksi |
| `inventory` | products, suppliers | Produk, kategori, unit, harga tier, supplier |
| `finance` | overview, receivables | Keuangan, piutang |
| `customers` | — | Manajemen pelanggan |
| `reporting` | dashboard, reports | Grafik ringkasan, laporan |
| `shifts` | — | Manajemen shift kasir |
| `settings` | — | Pengaturan toko, user, versi app |
| `sync` | — | Sync center, notifikasi, conflict |

---

## Naming Convention

| Tipe | Convention | Contoh |
|---|---|---|
| React Component | PascalCase | `CartPanel.tsx` |
| Page entry | PascalCase + `Page` | `CashierPage.tsx` |
| Layout | PascalCase + `Layout` | `AppLayout.tsx` |
| Modal/Dialog | PascalCase + `Modal` | `PaymentModal.tsx` |
| Form | PascalCase + `Form` | `LoginForm.tsx` |
| Table | PascalCase + `Table` | `TransactionTable.tsx` |
| Hook | camelCase + `use` prefix | `useCart.ts` |
| Store | kebab + `.store.ts` | `cashier.store.ts` |
| API hooks | kebab + `.api.ts` | `cashier.api.ts` |
| Types | kebab + `.types.ts` | `cashier.types.ts` |
| Utils | kebab + `.utils.ts` | `cashier.utils.ts` |

---

## Aturan Wajib

### Aturan 1 — Import hanya lewat `index.ts`
```ts
// ✅ Benar
import { useCart } from '@/features/sales/cashier'

// ❌ Salah
import { useCart } from '@/features/sales/cashier/hooks/useCart'
```

### Aturan 2 — Fitur tidak boleh saling import langsung
```ts
// ❌ Salah — cashier mengimport komponen dari feature products
import { ProductTable } from '@/features/inventory/products'

// ✅ Benar — cashier punya api sendiri untuk fetch data produk
// cashier.api.ts memanggil endpoint /products via api.client
```

### Aturan 3 — Kapan sesuatu masuk `shared/`
```
Dipakai oleh 1 fitur   → tetap di dalam folder fitur itu
Dipakai oleh 2+ fitur  → pindah ke shared/
```

### Aturan 4 — State: Zustand vs TanStack Query vs React Hook Form
```
Data dari server (fetch/cache)  → TanStack Query  → *.api.ts
UI state (cart, modal, filter)  → Zustand         → *.store.ts
Form state                      → React Hook Form  → lokal di komponen
```

### Aturan 5 — Path alias wajib `@/`
```ts
// ✅ Benar
import { formatRupiah } from '@/shared/utils/currency'

// ❌ Salah
import { formatRupiah } from '../../../shared/utils/currency'
```

### Aturan 6 — File opsional, buat hanya jika dibutuhkan
```
hooks/        → buat jika ada hook spesifik fitur (bukan wajib)
*.store.ts    → buat jika ada UI state kompleks (bukan wajib)
*.utils.ts    → buat jika ada pure function ≥ 2 buah (bukan wajib)
```
