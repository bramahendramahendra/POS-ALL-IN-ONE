# FASE 13 — Products: ProductsPage + ProductTable

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 12 sudah selesai: products.types, products.api, products.store, products.utils sudah ada.

## Standar Wajib
- Filter di luar DataTable — dikelola `ProductsPage`
- Gunakan `usePagination` dari `@/shared/hooks`
- Gunakan `useDebounce` dari `@/shared/hooks` untuk search
- Gunakan `useDisclosure` dari `@/shared/hooks` untuk modal states
- Gunakan `PageHeader` dari `@/shared/components`
- Gunakan `DataTable` dari `@/shared/components`
- Gunakan `RoleGuard` untuk tombol tambah/edit/hapus

## Desain Halaman Products
```
┌────────────────────────────────────────────────────────────┐
│ Produk                              [+ Tambah Produk]      │
│ Inventori > Produk                                         │
├────────────────────────────────────────────────────────────┤
│ [Tab: Produk] [Tab: Kategori] [Tab: Unit]                  │
├────────────────────────────────────────────────────────────┤
│ [🔍 Cari produk...] [Kategori ▾] [Status ▾]  [🔄 Reset]  │
├────────────────────────────────────────────────────────────┤
│ DataTable Produk                                           │
│ Nama | SKU | Kategori | Status | Harga Default | Aksi      │
└────────────────────────────────────────────────────────────┘
```

## Tugas Fase Ini

### File 1: `src/features/inventory/products/components/ProductTable.tsx`
Tabel produk menggunakan `DataTable`:

**Kolom:**
- Checkbox select
- Nama produk (bold)
- SKU (muted jika kosong)
- Kategori (badge)
- Status: `<StatusBadge status={product.is_active ? 'active' : 'inactive'} />`
- Harga default (formatRupiah dari harga unit default)
- Aksi: tombol Edit (✏️) + Hapus (🗑️)
  - Edit: panggil `openProductModal(product.id)` dari store
  - Hapus: panggil `openDeleteConfirm({ type: 'product', id: product.id })` dari store
  - Aksi hapus dibungkus `RoleGuard allowedRoles={[ROLES.OWNER]}`

**Props:**
```ts
interface ProductTableProps {
  data:      Product[]
  isLoading: boolean
  pagination: PaginationProps
}
```

**Fitur tambahan:**
- Bulk action bar muncul saat ada row terselect:
  ```
  [3 produk dipilih]  [Ekspor] [Cetak Label] [Hapus Semua]
  ```
  Untuk sekarang, tombol ini hanya placeholder (belum ada implementasi)

### File 2: `src/features/inventory/products/components/ProductFilter.tsx`
Filter bar untuk tabel produk:

**Props:**
```ts
interface ProductFilterProps {
  filter:    ProductFilter
  onChange:  (filter: ProductFilter) => void
  onReset:   () => void
  categories: Category[]
}
```

**Controls:**
- Input search (debounce 300ms via `useDebounce`)
- Select kategori (semua kategori dari `useCategoryListQuery`)
- Select status: Semua / Aktif / Nonaktif
- Tombol reset filter

### File 3: `src/features/inventory/products/ProductsPage.tsx`
Halaman utama dengan tab switching:

**State:**
```ts
const [filter, setFilter] = useState<ProductFilter>({ page: 1, page_size: 10 })
const { page, pageSize, onPageChange, reset } = usePagination()
const { activeTab, setActiveTab } = useProductsStore()
```

**Logic:**
- Query produk: `useProductListQuery({ ...filter, page, page_size: pageSize })`
- Query kategori: `useCategoryListQuery()` (untuk filter dropdown)
- Saat filter berubah: `reset()` pagination ke page 1
- Saat search berubah: debounce 500ms sebelum update filter
- Tab switching: ganti `activeTab` di store, render komponen tab yang sesuai

**Tab content:**
- Tab "Produk": render `ProductFilter` + `ProductTable`
- Tab "Kategori": placeholder `<div>Coming in FASE 15</div>`
- Tab "Unit": placeholder `<div>Coming in FASE 15</div>`

**PageHeader:**
```tsx
<PageHeader
  title="Produk"
  breadcrumbs={[{ label: 'Inventori' }, { label: 'Produk' }]}
  actions={
    <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
      <Button onClick={() => openProductModal()}>
        <Plus className="mr-2 h-4 w-4" /> Tambah Produk
      </Button>
    </RoleGuard>
  }
/>
```

**Delete confirm:**
```tsx
<ConfirmDialog
  open={deleteConfirmOpen}
  onOpenChange={closeDeleteConfirm}
  title="Hapus Produk"
  description="Produk yang dihapus tidak bisa dikembalikan."
  variant="destructive"
  isLoading={isDeleting}
  onConfirm={handleDelete}
/>
```

**Update router:**
Ganti placeholder `/products` di `router.tsx` dengan `<ProductsPage />`.

### Update File 4: `src/features/inventory/products/index.ts`
Tambahkan:
```ts
export { ProductsPage } from './ProductsPage'
```

## Hasil yang Diharapkan
- `/products` menampilkan halaman produk dengan tabel
- Filter search berfungsi (debounce)
- Filter kategori dan status berfungsi
- Pagination berfungsi
- Tombol edit/hapus tampil (hapus hanya untuk owner)
- ConfirmDialog muncul saat hapus
- Tab switching antara Produk / Kategori / Unit berfungsi
- TypeScript tidak ada error
