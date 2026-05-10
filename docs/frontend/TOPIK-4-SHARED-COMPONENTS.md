# Topik 4 — Shared Components

> Hasil diskusi desain shared components frontend web-v2 POS System.
> Dokumen ini menjadi **standar penulisan** yang wajib diikuti seluruh pengembangan frontend ke depan.

---

## Prinsip Dasar

Sebelum membahas komponen satu per satu, ada 3 prinsip yang mendasari semua keputusan di Topik 4:

1. **Komposisi, bukan konfigurasi** — komponen kecil yang bisa dikombinasi lebih baik dari satu komponen besar dengan 20 props
2. **Konsistensi lebih penting dari fleksibilitas** — developer tidak perlu berpikir ulang saat membuat halaman baru
3. **Shared hanya untuk yang benar-benar shared** — masuk `shared/` jika dipakai ≥ 2 fitur, sisanya tetap di fitur masing-masing

---

## 4A — Lapisan Komponen

Ada **3 lapisan** komponen yang tegas. Setiap lapisan punya aturan yang tidak boleh dilanggar.

```
Lapisan 1: shared/components/ui/
  → Raw shadcn/ui components
  → Murni styling, zero business logic
  → Tidak tahu tentang POS, user, role, atau API

Lapisan 2: shared/components/
  → Opinionated components
  → Sudah punya behavior dan pola yang konsisten untuk POS
  → Boleh menggunakan komponen Lapisan 1
  → Tidak boleh menggunakan store atau API call

Lapisan 3: features/[domain]/components/
  → Feature-specific components
  → Boleh menggunakan komponen Lapisan 1 dan 2
  → Boleh menggunakan store dan API call
```

### Ilustrasi Perbedaan Lapisan

```tsx
// ─── Lapisan 1: ui/button.tsx ───────────────────────────────
// Hanya tahu tentang visual
<Button variant="destructive" size="sm">Hapus</Button>

// ─── Lapisan 2: components/ConfirmDialog.tsx ────────────────
// Tahu tentang pola UX hapus di POS, tapi tidak tahu produk apa yang dihapus
<ConfirmDialog
  title="Hapus Produk"
  description="Produk yang dihapus tidak bisa dikembalikan."
  onConfirm={handleDelete}
  isLoading={isPending}
/>

// ─── Lapisan 3: features/inventory/products/components/ ─────
// Tahu tentang produk, terhubung ke store dan API
<ProductFormModal
  productId={editingId}
  onSuccess={() => queryClient.invalidateQueries(...)}
/>
```

### Aturan Antar Lapisan

```
✅ Lapisan 3 boleh import dari Lapisan 1 dan 2
✅ Lapisan 2 boleh import dari Lapisan 1
❌ Lapisan 2 TIDAK boleh import dari Lapisan 3
❌ Lapisan 1 TIDAK boleh import dari Lapisan 2 atau 3
❌ Lapisan 2 TIDAK boleh memanggil API atau menggunakan store
```

---

## 4B — Daftar Komponen Shared (Lapisan 2)

### 1. DataTable

Komponen tabel yang dipakai hampir semua halaman. Didesain untuk server-side pagination karena data POS bisa sangat banyak.

**Fitur built-in:**
- Kolom dikonfigurasi via props (menggunakan pola TanStack Table)
- Loading state — skeleton rows
- Empty state — pesan dan ikon bisa dikustomisasi
- Server-side pagination — terima `total`, `page`, `pageSize` dari luar
- Row selection opsional (untuk bulk action)
- Sorting opsional per kolom

**Fitur yang TIDAK ada di DataTable (dikelola fitur masing-masing):**
- Search/filter bar — tiap fitur punya filter berbeda
- Export button — diletakkan di PageHeader, bukan di tabel
- Tombol aksi per baris — dipass sebagai kolom via `columns` prop

```tsx
// Contoh penggunaan
<DataTable
  columns={columns}
  data={products}
  isLoading={isLoading}
  emptyMessage="Belum ada produk"
  pagination={{
    page,
    pageSize,
    total,
    onPageChange: setPage,
  }}
  rowSelection={{
    enabled: true,
    onSelectionChange: setSelectedIds,
  }}
/>
```

**Alasan filter di luar DataTable:**
Produk filter by kategori + unit. Transaksi filter by tanggal + metode bayar. Pelanggan filter by status. Tidak ada satu pola filter yang cocok untuk semua — lebih bersih kalau filter dikontrol fitur masing-masing, DataTable hanya render data yang sudah difilter.

---

### 2. PageHeader

Setiap halaman punya header konsisten: judul, breadcrumb, dan tombol aksi utama.

```tsx
<PageHeader
  title="Produk"
  breadcrumbs={[
    { label: 'Inventory' },
    { label: 'Produk' },
  ]}
  actions={
    <Button onClick={openAddModal}>
      <Plus className="mr-2 h-4 w-4" />
      Tambah Produk
    </Button>
  }
/>
```

---

### 3. ConfirmDialog

Dialog konfirmasi untuk aksi destruktif atau tidak bisa dibatalkan. Dipakai saat hapus data, tutup shift, batalkan transaksi, dll.

```tsx
<ConfirmDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Hapus Produk"
  description="Produk yang dihapus tidak bisa dikembalikan. Lanjutkan?"
  confirmLabel="Ya, Hapus"
  cancelLabel="Batal"
  variant="destructive"       // warna tombol confirm: destructive | default
  isLoading={isPending}
  onConfirm={handleDelete}
/>
```

---

### 4. FormModal

Wrapper modal untuk semua form (tambah/edit data). Standarisasi ukuran, header, footer, dan scroll behavior.

```tsx
<FormModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Tambah Produk"
  size="lg"                   // sm | md | lg | xl | full
  isLoading={isPending}
  onSubmit={form.handleSubmit(onSubmit)}
  submitLabel="Simpan"
>
  {/* Form fields di sini */}
</FormModal>
```

---

### 5. StatusBadge

Badge status yang konsisten di seluruh aplikasi.

```tsx
<StatusBadge status="active" />    // → hijau "Aktif"
<StatusBadge status="inactive" />  // → abu "Nonaktif"
<StatusBadge status="pending" />   // → kuning "Pending"
<StatusBadge status="paid" />      // → hijau "Lunas"
<StatusBadge status="unpaid" />    // → merah "Belum Lunas"
```

---

### 6. EmptyState

Tampilan saat data kosong atau hasil pencarian tidak ditemukan.

```tsx
<EmptyState
  title="Belum ada produk"
  description="Mulai dengan menambahkan produk pertama Anda."
  action={
    <Button onClick={openAddModal}>Tambah Produk</Button>
  }
/>
```

---

### 7. LoadingSpinner & PageLoader

```tsx
// Inline loading (di dalam komponen)
<LoadingSpinner size="sm" />

// Full page loading (saat fetch data pertama kali)
<PageLoader />
```

---

### 8. RoleGuard

Wrapper untuk menyembunyikan elemen UI berdasarkan role. Dipakai untuk conditional render di dalam halaman (bukan untuk guard route — itu sudah dihandle ProtectedRoute).

```tsx
// Tampilkan tombol hapus hanya untuk owner
<RoleGuard allowedRoles={[ROLES.OWNER]}>
  <Button variant="destructive">Hapus</Button>
</RoleGuard>

// Sembunyikan section untuk kasir
<RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
  <ProfitSection />
</RoleGuard>
```

---

## 4C — AppLayout & Sidebar Dinamis

### Struktur Layout

```
┌──────────────────────────────────────────────────────┐
│  Navbar (fixed top)                                  │
│  Logo | — | Nama User | Role | Notif | Logout        │
├──────────────┬───────────────────────────────────────┤
│              │                                       │
│   Sidebar    │   <Outlet />                          │
│   (fixed)    │   (konten halaman)                    │
│              │                                       │
│              │                                       │
└──────────────┴───────────────────────────────────────┘
```

### Konfigurasi Menu Sidebar

Menu sidebar dikonfigurasi sebagai data, bukan hardcode di JSX. Ini memudahkan penambahan menu baru di masa depan tanpa ubah komponen.

```ts
// shared/constants/navigation.ts
import { ROLES } from './roles'

export interface NavItem {
  label:        string
  path:         string
  icon:         LucideIcon
  allowedRoles: Role[]
  group?:       string       // pengelompokan visual di sidebar
}

export const NAV_ITEMS: NavItem[] = [
  // Sales
  { label: 'Kasir',        path: '/kasir',        icon: ShoppingCart, allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.KASIR], group: 'Penjualan' },
  { label: 'Transaksi',    path: '/transactions', icon: Receipt,      allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Penjualan' },

  // Inventory
  { label: 'Produk',       path: '/products',     icon: Package,      allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Inventori' },
  { label: 'Supplier',     path: '/suppliers',    icon: Truck,        allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Inventori' },

  // Customers
  { label: 'Pelanggan',    path: '/customers',    icon: Users,        allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Pelanggan' },
  { label: 'Piutang',      path: '/receivables',  icon: CreditCard,   allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Pelanggan' },

  // Finance & Reports
  { label: 'Keuangan',     path: '/finance',      icon: Wallet,       allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Keuangan'  },
  { label: 'Laporan',      path: '/reports',      icon: BarChart2,    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Keuangan'  },
  { label: 'Dashboard',    path: '/dashboard',    icon: LayoutDashboard, allowedRoles: [ROLES.OWNER, ROLES.ADMIN],           group: 'Keuangan'  },

  // Operations
  { label: 'Shift',        path: '/shifts',       icon: Clock,        allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Operasional' },
  { label: 'Sync Center',  path: '/sync',         icon: RefreshCw,    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Operasional' },

  // Settings
  { label: 'Pengaturan',   path: '/settings',     icon: Settings,     allowedRoles: [ROLES.OWNER],                           group: 'Sistem' },
]
```

### Sidebar Render — Filter Berdasarkan Role

```tsx
// Sidebar hanya render menu yang sesuai role user
const visibleItems = NAV_ITEMS.filter((item) =>
  item.allowedRoles.includes(user.role)
)
```

**Keuntungan pola ini untuk project besar:**
- Tambah menu baru = tambah 1 baris di `NAV_ITEMS`, tidak perlu ubah komponen
- Tambah role baru = tambah role di `allowedRoles` per item, tidak ada perubahan lain
- Mudah di-test: render sidebar dengan role tertentu, assert item yang muncul

---

## 4D — Form Pattern: React Hook Form + Zod

Semua form wajib menggunakan pola ini. Tidak boleh ada form yang menggunakan `useState` untuk setiap field.

### Pola Standar

```tsx
// Langkah 1: Definisi schema di file yang sama atau *.types.ts
const productSchema = z.object({
  name:        z.string().min(1, 'Nama produk wajib diisi'),
  sku:         z.string().optional(),
  category_id: z.number({ required_error: 'Kategori wajib dipilih' }),
  price:       z.number().min(0, 'Harga tidak boleh negatif'),
  stock:       z.number().int().min(0, 'Stok tidak boleh negatif'),
  is_active:   z.boolean().default(true),
})

type ProductFormValues = z.infer<typeof productSchema>

// Langkah 2: Setup form
const form = useForm<ProductFormValues>({
  resolver: zodResolver(productSchema),
  defaultValues: {
    name:        '',
    sku:         '',
    category_id: undefined,
    price:       0,
    stock:       0,
    is_active:   true,
  },
})

// Langkah 3: Reset saat modal tutup
useEffect(() => {
  if (!isOpen) form.reset()
}, [isOpen])

// Langkah 4: Submit — loading state otomatis dari mutation
const onSubmit = (values: ProductFormValues) => {
  createProduct(values)  // TanStack mutation
}
```

### Aturan Form

```
✅ Validasi pakai Zod schema
✅ Error tampil inline di bawah field (bukan toast)
✅ Tombol submit disabled saat isLoading === true
✅ Form reset otomatis saat modal ditutup
✅ defaultValues selalu didefinisikan (mencegah uncontrolled → controlled warning)
❌ Jangan pakai useState per field
❌ Jangan validasi manual di onSubmit — biar Zod yang handle
❌ Jangan taruh schema di luar file form (kecuali dipakai 2+ form)
```

### Tampilan Error Field — Standar

```tsx
// shared/components/ui/form-field-error.tsx
// Komponen kecil untuk display error message konsisten
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Nama Produk</FormLabel>
      <FormControl>
        <Input placeholder="Masukkan nama produk" {...field} />
      </FormControl>
      <FormMessage />   {/* otomatis tampil error dari Zod */}
    </FormItem>
  )}
/>
```

---

## 4E — Hooks Shared

Hook yang dipakai minimal 2 fitur berbeda wajib dipindah ke `shared/hooks/`.

### Daftar Hooks Shared

```ts
// useDebounce.ts — untuk search input
const debouncedKeyword = useDebounce(keyword, 300)

// usePagination.ts — untuk server-side pagination
const { page, pageSize, onPageChange, reset } = usePagination()

// useLocalStorage.ts — typed localStorage access
const [draft, setDraft] = useLocalStorage<CartItem[]>('cashier-draft', [])

// usePermission.ts — cek role dengan mudah
const { isOwner, isAdmin, isKasir, hasRole } = usePermission()
// contoh: hasRole([ROLES.OWNER, ROLES.ADMIN])

// useDisclosure.ts — manage open/close state modal
const { isOpen, open, close, toggle } = useDisclosure()
```

---

## 4F — Utils Shared

Pure functions yang tidak mengandung React. Wajib ada unit test untuk setiap utility function.

```ts
// shared/utils/currency.ts
formatRupiah(150000)           // → "Rp 150.000"
formatRupiah(150000.5, true)   // → "Rp 150.000,50"
parseRupiah("Rp 150.000")      // → 150000

// shared/utils/date.ts
formatDate("2024-01-15")                    // → "15 Jan 2024"
formatDateTime("2024-01-15T10:30:00Z")      // → "15 Jan 2024, 10:30"
formatRelative("2024-01-15T10:30:00Z")      // → "2 jam yang lalu"

// shared/utils/string.ts
truncate("Nama produk yang panjang", 20)    // → "Nama produk yang p..."
capitalize("kasir")                          // → "Kasir"
slugify("Nama Produk")                       // → "nama-produk"

// shared/utils/number.ts
formatNumber(1500000)       // → "1.500.000"
clamp(value, min, max)      // → nilai dalam batas min-max
```

---

## 4G — Global Types

Type yang dipakai lintas fitur didefinisikan di `shared/types/`.

```ts
// shared/types/api.types.ts
export interface ApiResponse<T> {
  status:  boolean
  message: string
  data:    T
}

export interface PaginatedResponse<T> {
  data:       T[]
  total:      number
  page:       number
  page_size:  number
  total_page: number
}

export interface ApiError {
  status:  false
  message: string
  code?:   string
}

// shared/types/common.types.ts
export interface SelectOption {
  label: string
  value: string | number
}

export interface DateRangeFilter {
  start_date: string
  end_date:   string
}
```

---

## Ringkasan Keputusan Topik 4

| Sub-topik | Keputusan |
|---|---|
| **4A** Lapisan | 3 lapisan: `ui/` (raw shadcn) → `components/` (opinionated) → `features/.../components/` (domain) |
| **4A** Aturan | Lapisan atas tidak boleh import lapisan bawah. Lapisan 2 tidak boleh pakai store/API |
| **4B** DataTable | Built-in: loading, empty state, pagination, row selection, sorting opsional |
| **4B** Filter | Di luar DataTable — dikelola fitur masing-masing |
| **4C** Layout | AppLayout: navbar fixed + sidebar dinamis berdasarkan role |
| **4C** Sidebar | Dikonfigurasi via `NAV_ITEMS` array — tambah menu = tambah 1 baris data |
| **4D** Form | React Hook Form + Zod wajib untuk semua form |
| **4D** Error | Inline di bawah field via `<FormMessage />` — bukan toast |
| **4E** Hooks | `useDebounce`, `usePagination`, `useLocalStorage`, `usePermission`, `useDisclosure` |
| **4F** Utils | `currency`, `date`, `string`, `number` — pure functions, wajib ada unit test |
| **4G** Types | `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`, `SelectOption`, `DateRangeFilter` |
