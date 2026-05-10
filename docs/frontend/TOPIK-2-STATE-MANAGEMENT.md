# Topik 2 — State Management

> Hasil diskusi state management frontend web-v2 POS System.
> Dokumen ini menjadi **standar penulisan** yang wajib diikuti seluruh pengembangan frontend ke depan.

---

## 2A — Pembagian 3 Lapis State

Setiap state di aplikasi ini jatuh ke salah satu dari 3 kategori berikut.
Tidak boleh ada tumpang tindih antar lapisan.

```
┌─────────────────────────────────────────────────────┐
│  SERVER STATE          → TanStack Query              │
│  Data dari API, perlu cache, sync, refetch           │
│  Contoh: daftar produk, data transaksi, user profile │
├─────────────────────────────────────────────────────┤
│  CLIENT STATE          → Zustand                     │
│  UI state yang tidak dari server                     │
│  Contoh: isi keranjang, modal open/close, tab aktif  │
├─────────────────────────────────────────────────────┤
│  FORM STATE            → React Hook Form             │
│  State sementara di dalam form, tidak perlu global   │
│  Contoh: field input tambah produk, form login       │
└─────────────────────────────────────────────────────┘
```

### Panduan Cepat — "State ini masuk ke mana?"

| Pertanyaan | Jawaban |
|---|---|
| Apakah data ini berasal dari API? | → TanStack Query |
| Apakah data ini perlu di-share antar komponen dalam satu fitur? | → Zustand |
| Apakah data ini hanya hidup selama form terbuka? | → React Hook Form |
| Apakah data ini perlu di-persist ke localStorage? | → Zustand + middleware persist |

### Contoh Konkret: Fitur Kasir

```
TanStack Query (cashier.api.ts)
├── useProductSearchQuery(keyword)    → hasil search produk dari API
├── useProductPriceTiersQuery(id)     → harga tier per produk
└── useCustomerListQuery()            → daftar pelanggan

Zustand (cashier.store.ts)
├── cart[]                            → item di keranjang
├── discount                          → tipe & nilai diskon
├── tax                               → persentase pajak
├── selectedCustomer                  → pelanggan yang dipilih
└── paymentModalOpen                  → buka/tutup modal bayar

React Hook Form (lokal di PaymentModal.tsx)
└── jumlahBayar, metodePembayaran     → input form pembayaran
```

---

## 2B — Desain Zustand: Satu Store Per Fitur

Setiap fitur yang membutuhkan client state memiliki store Zustand sendiri.
Tidak ada global store monolitik.

### Pola Penulisan Store

```ts
// cashier.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Discount, Tax } from './cashier.types'

interface CashierState {
  // State
  cart: CartItem[]
  discount: Discount
  tax: Tax
  paymentModalOpen: boolean

  // Actions
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, qty: number) => void
  setDiscount: (discount: Discount) => void
  setTax: (tax: Tax) => void
  openPaymentModal: () => void
  closePaymentModal: () => void
  clearCart: () => void
}

export const useCashierStore = create<CashierState>()(
  persist(
    (set) => ({
      cart: [],
      discount: { type: 'none', value: 0, amount: 0 },
      tax: { percent: 0, amount: 0 },
      paymentModalOpen: false,

      addToCart: (item) =>
        set((state) => ({ cart: [...state.cart, item] })),

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((i) => i.product_id !== productId),
        })),

      clearCart: () =>
        set({ cart: [], discount: { type: 'none', value: 0, amount: 0 } }),

      // ... actions lainnya
    }),
    { name: 'cashier-draft' } // persist ke localStorage untuk fitur draft
  )
)
```

### Aturan Store

```
✅ State + Actions selalu dalam satu interface
✅ Actions harus pure (tidak ada side effect seperti API call)
✅ Gunakan middleware persist hanya jika state perlu survive page refresh
✅ Export store dengan prefix use (useCashierStore, useAuthStore)
❌ Jangan taruh data dari server di Zustand
❌ Jangan akses store dari luar fitur — lewat index.ts saja
```

### Pengecualian: auth.store.ts

`auth.store.ts` adalah satu-satunya store yang boleh diakses dari semua fitur
karena user dan role dibutuhkan di mana-mana.

```ts
// auth.store.ts — diakses via shared/hooks/usePermission.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setSession: (session) => set({ ...session }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'auth-session' }
  )
)
```

**Aturan akses token — tidak ada komponen yang boleh baca localStorage langsung:**
```ts
// ✅ Benar — lewat store
const token = useAuthStore((state) => state.accessToken)

// ❌ Salah — akses localStorage langsung dari komponen
const token = localStorage.getItem('access_token')
```

---

## 2C — Query Key Factory (TanStack Query)

Semua query key wajib didefinisikan di `shared/constants/queryKeys.ts`.
Tidak boleh ada magic string query key yang ditulis langsung di komponen atau api file.

### Struktur Factory

```ts
// shared/constants/queryKeys.ts

export const queryKeys = {
  // Auth
  auth: {
    profile: () => ['auth', 'profile'] as const,
  },

  // Inventory
  products: {
    all: () => ['products'] as const,
    list: (filter?: ProductFilter) => ['products', 'list', filter] as const,
    detail: (id: number) => ['products', 'detail', id] as const,
    priceTiers: (id: number) => ['products', 'priceTiers', id] as const,
    barcode: (code: string) => ['products', 'barcode', code] as const,
  },
  categories: {
    all: () => ['categories'] as const,
    list: () => ['categories', 'list'] as const,
  },
  units: {
    all: () => ['units'] as const,
    list: () => ['units', 'list'] as const,
  },
  suppliers: {
    all: () => ['suppliers'] as const,
    list: (filter?: SupplierFilter) => ['suppliers', 'list', filter] as const,
    detail: (id: number) => ['suppliers', 'detail', id] as const,
  },

  // Sales
  transactions: {
    all: () => ['transactions'] as const,
    list: (filter?: TransactionFilter) => ['transactions', 'list', filter] as const,
    detail: (id: number) => ['transactions', 'detail', id] as const,
  },
  customers: {
    all: () => ['customers'] as const,
    list: (filter?: CustomerFilter) => ['customers', 'list', filter] as const,
    detail: (id: number) => ['customers', 'detail', id] as const,
  },

  // Finance
  finance: {
    summary: (filter?: FinanceFilter) => ['finance', 'summary', filter] as const,
  },
  receivables: {
    all: () => ['receivables'] as const,
    list: (filter?: ReceivableFilter) => ['receivables', 'list', filter] as const,
  },

  // Reporting
  dashboard: {
    summary: (period: string) => ['dashboard', 'summary', period] as const,
    salesChart: (period: string) => ['dashboard', 'salesChart', period] as const,
    topProducts: (period: string) => ['dashboard', 'topProducts', period] as const,
  },
  reports: {
    data: (filter?: ReportFilter) => ['reports', 'data', filter] as const,
  },

  // Shifts
  shifts: {
    all: () => ['shifts'] as const,
    list: (filter?: ShiftFilter) => ['shifts', 'list', filter] as const,
    active: () => ['shifts', 'active'] as const,
  },

  // Sync
  sync: {
    status: () => ['sync', 'status'] as const,
    history: () => ['sync', 'history'] as const,
    conflicts: () => ['sync', 'conflicts'] as const,
  },

  // Settings
  settings: {
    store: () => ['settings', 'store'] as const,
    users: () => ['settings', 'users'] as const,
    appVersions: () => ['settings', 'appVersions'] as const,
  },
}
```

### Cara Pakai di *.api.ts

```ts
// products.api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/constants/queryKeys'
import { apiClient } from '@/services/api.client'

export const useProductListQuery = (filter?: ProductFilter) =>
  useQuery({
    queryKey: queryKeys.products.list(filter),
    queryFn: () => apiClient.get('/products', filter),
  })

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProductPayload) => apiClient.post('/products', data),
    onSuccess: () => {
      // Invalidate semua query produk sekaligus
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
    },
  })
}
```

---

## 2D — Auth Storage: localStorage (Tanpa Ubah Backend)

Token auth disimpan di `localStorage` menggunakan Zustand dengan middleware `persist`.
Backend Go tidak perlu diubah.

### Keputusan

| Aspek | Keputusan |
|---|---|
| Storage | localStorage via Zustand persist |
| Key storage | Dikelola otomatis oleh Zustand (`auth-session`) |
| Akses token | Hanya lewat `useAuthStore` — tidak boleh akses localStorage langsung |
| Token refresh | Dihandle di Axios interceptor di `services/api.client.ts` |
| Multi-platform | Web, Android (Capacitor), Desktop (Electron) pakai localStorage yang sama |

### Alasan Tidak Pakai HttpOnly Cookie

- Backend Go tidak perlu diubah
- Aplikasi juga jalan di Android (Capacitor) dan Desktop (Electron) — cookie lebih rumit di native app
- localStorage dengan enkapsulasi yang ketat sudah cukup aman untuk tahap ini

---

## Ringkasan Keputusan Topik 2

| Sub-topik | Keputusan |
|---|---|
| **2A** Server state | TanStack Query |
| **2A** Client state | Zustand (satu store per fitur) |
| **2A** Form state | React Hook Form |
| **2B** Store pattern | Satu store per fitur, state + actions dalam satu interface |
| **2B** Auth store | Pengecualian — boleh diakses global via `useAuthStore` |
| **2B** Persist | Gunakan middleware `persist` hanya jika state perlu survive refresh |
| **2C** Query key | Wajib pakai Query Key Factory di `shared/constants/queryKeys.ts` |
| **2C** Invalidasi | Selalu invalidate via `.all()` key setelah mutasi |
| **2D** Auth storage | localStorage via Zustand persist, tidak ada perubahan backend |
| **2D** Token akses | Hanya lewat `useAuthStore`, tidak boleh akses localStorage langsung |
