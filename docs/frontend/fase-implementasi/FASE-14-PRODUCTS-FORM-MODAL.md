# FASE 14 — Products: ProductFormModal

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 13 sudah selesai: ProductsPage dan ProductTable sudah ada, tombol tambah/edit sudah ada tapi modal belum.

## Standar Wajib
- Validasi pakai React Hook Form + Zod
- Error tampil inline, bukan toast
- Gunakan `FormModal` dari `@/shared/components`
- Form reset otomatis saat modal tutup
- Mode tambah vs edit ditentukan dari ada/tidaknya `productId` prop
- Saat edit: prefill form dari data produk yang ada

## Desain Form Modal Produk
```
┌─────────────────────────────────────────────┐
│ Tambah Produk                            [X] │
├─────────────────────────────────────────────┤
│ Nama Produk *                               │
│ [_______________________________]           │
│                                             │
│ SKU / Kode           Kategori               │
│ [___________]        [Pilih Kategori ▾]     │
│                                             │
│ Deskripsi                                   │
│ [_______________________________]           │
│ [_______________________________]           │
│                                             │
│ Status                                      │
│ (●) Aktif  ( ) Nonaktif                    │
├─────────────────────────────────────────────┤
│              [Batal]    [Simpan]            │
└─────────────────────────────────────────────┘
```

## Tugas Fase Ini

### File 1: `src/features/inventory/products/components/ProductFormModal.tsx`

**Props:**
```ts
interface ProductFormModalProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  productId?:   number   // undefined = mode tambah, ada = mode edit
}
```

**Zod Schema:**
```ts
const productSchema = z.object({
  name:        z.string().min(1, 'Nama produk wajib diisi').max(100),
  sku:         z.string().optional(),
  category_id: z.number().optional(),
  description: z.string().optional(),
  is_active:   z.boolean(),
})
```

**Logic:**
- Jika `productId` ada → fetch detail via `useProductDetailQuery(productId)`
- Prefill form saat data product tersedia: `form.reset(mapProductToForm(product))`
- Submit:
  - Mode tambah → `useCreateProductMutation()`
  - Mode edit → `useUpdateProductMutation()`
- `onSuccess` mutation → tutup modal + toast success
- `onError` mutation → `toast.error(error.message)`
- Reset form saat `open` berubah ke `false`

**Form fields:**
- `name`: Input text, required
- `sku`: Input text, optional, placeholder "Generate otomatis jika kosong"
- `category_id`: Select dari `useCategoryListQuery()`, optional, ada opsi "Tanpa Kategori"
- `description`: Textarea, optional
- `is_active`: Radio group — "Aktif" / "Nonaktif"

**Loading states:**
- Saat fetch detail (mode edit): tampil skeleton/loader di dalam modal
- Saat submit: `isLoading={isPending}` di FormModal

**Title dinamis:**
- Mode tambah: "Tambah Produk"
- Mode edit: "Edit Produk"

## Komponen shadcn yang Dibutuhkan
```bash
npx shadcn@latest add select textarea radio-group
```

### Update File 2: `src/features/inventory/products/ProductsPage.tsx`
Tambahkan render `ProductFormModal`:
```tsx
const { productModalOpen, editingProductId, closeProductModal } = useProductsStore()

// Di JSX:
<ProductFormModal
  open={productModalOpen}
  onOpenChange={(open) => !open && closeProductModal()}
  productId={editingProductId ?? undefined}
/>
```

## Hasil yang Diharapkan
- Klik "Tambah Produk" → modal terbuka dengan form kosong
- Isi form → klik Simpan → produk tersimpan → modal tutup → tabel refresh
- Klik edit di baris produk → modal terbuka dengan data produk
- Edit data → klik Simpan → data terupdate → modal tutup
- Error validasi tampil inline di bawah field
- TypeScript tidak ada error
