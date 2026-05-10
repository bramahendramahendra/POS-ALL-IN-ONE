# FASE 16 — Products: PriceTierTab + ImportCsvModal + LabelPrintModal

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 15 sudah selesai: CategoryTab dan UnitTab sudah berfungsi.
Fase ini melengkapi fitur Products dengan price tier, import CSV, dan cetak label.

## Standar Wajib
- PriceTierTab ada DI DALAM ProductFormModal (bukan tab terpisah di ProductsPage)
- Import CSV: validasi baris per baris sebelum upload
- Cetak label: format print-friendly, gunakan CSS `@media print`
- Semua error tampil via toast

## Tugas Fase Ini

### File 1: `src/features/inventory/products/components/PriceTierTab.tsx`
Tab harga tier di dalam detail/edit produk.
Dirender sebagai bagian dari ProductFormModal (tab kedua setelah info dasar).

**Tampilan:**
```
┌─────────────────────────────────────────────────────┐
│ Harga Tier                         [+ Tambah Harga] │
├─────────────────────────────────────────────────────┤
│ Tier     │ Unit  │ Min Qty │ Harga      │ Aksi       │
│ Retail   │ Pcs   │ 1       │ Rp 5.000   │ ✏ 🗑       │
│ Grosir   │ Pcs   │ 12      │ Rp 4.500   │ ✏ 🗑       │
│ Lusin    │ Lusin │ 1       │ Rp 50.000  │ ✏ 🗑       │
└─────────────────────────────────────────────────────┘
```

**Props:**
```ts
interface PriceTierTabProps {
  productId: number
}
```

**Query & Mutation:**
- `useProductPricesQuery(productId)` → list harga tier
- `useAddPriceTierMutation(productId)`
- `useUpdatePriceTierMutation(productId)`
- `useDeletePriceTierMutation(productId)`

**Form tambah/edit harga:**
```ts
const priceTierSchema = z.object({
  unit_id:   z.number({ required_error: 'Unit wajib dipilih' }),
  tier_name: z.string().min(1, 'Nama tier wajib diisi'),
  min_qty:   z.number().min(1, 'Minimal qty harus > 0'),
  price:     z.number().min(0, 'Harga tidak boleh negatif'),
})
```
- Select unit dari `useUnitListQuery()`
- Input tier name (contoh: "Retail", "Grosir", "Member")
- Input min qty
- Input harga (format Rupiah)

**Unit produk (ProductUnit) — bagian terpisah di atas price tier:**
Tampilkan tabel unit yang dimiliki produk ini:
```
Unit Produk                          [+ Tambah Unit]
Unit   │ Barcode    │ Harga Pokok  │ Default │ Aksi
Pcs    │ 8901234    │ Rp 3.500     │ ✅      │ ✏ 🗑
Lusin  │ -          │ Rp 40.000    │         │ ✏ 🗑
```
- Query: `useProductUnitsQuery(productId)`
- Mutation: `useAddProductUnitMutation`, `useUpdateProductUnitMutation`, `useDeleteProductUnitMutation`

### File 2: `src/features/inventory/products/components/ImportCsvModal.tsx`
Modal untuk import produk via file CSV.

**Props:**
```ts
interface ImportCsvModalProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
}
```

**Flow:**
1. Upload file CSV
2. Parse CSV di client (tanpa kirim ke server)
3. Validasi setiap baris via `validateImportRow` dari `products.utils.ts`
4. Tampilkan preview tabel: baris valid (hijau) vs invalid (merah + pesan error)
5. Tombol "Import [N] Baris Valid" — hanya import baris yang valid
6. Kirim ke endpoint: `POST /products/import` dengan array data

**Format CSV yang diterima:**
```
name,sku,category_name,price,stock
Kopi Hitam,KH001,Minuman,5000,100
Teh Manis,,Minuman,4000,50
```

**Validasi per baris:**
- `name` wajib ada
- `price` harus angka positif
- Baris invalid ditampilkan dengan highlight merah

### File 3: `src/features/inventory/products/components/LabelPrintModal.tsx`
Modal untuk cetak label produk.

**Props:**
```ts
interface LabelPrintModalProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  products:     Product[]   // produk yang akan dicetak labelnya
}
```

**Tampilan:**
- Preview label per produk: nama produk + harga + barcode (jika ada)
- Setting: ukuran label (kecil/sedang/besar), jumlah kolom
- Tombol "Cetak" → `window.print()`

**CSS print:**
```css
@media print {
  .no-print { display: none !important; }
  .label-grid { display: grid; grid-template-columns: repeat(var(--cols), 1fr); }
}
```

### Update ProductsPage: Tambahkan Import & Label Button
Di bulk action bar (muncul saat ada produk terselect):
- Tombol "Import CSV" → buka `ImportCsvModal`
- Tombol "Cetak Label" → buka `LabelPrintModal` dengan produk terselect

Di PageHeader actions:
- Tambahkan tombol "Import CSV" (di samping "Tambah Produk")

## Hasil yang Diharapkan
- PriceTierTab tampil di dalam ProductFormModal saat edit produk
- Unit produk bisa ditambah/edit/hapus per produk
- Price tier bisa ditambah/edit/hapus per produk
- Import CSV: upload → preview → import baris valid
- Cetak label: preview → print
- TypeScript tidak ada error
