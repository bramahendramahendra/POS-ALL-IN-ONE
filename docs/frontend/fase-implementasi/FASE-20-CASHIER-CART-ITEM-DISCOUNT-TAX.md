# FASE 20 — Cashier: CartItem + DiscountInput + TaxInput

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 19 sudah selesai: CashierPage, ProductSearch, CartPanel sudah ada.
Fase ini melengkapi komponen-komponen detail di dalam CartPanel.

## Standar Wajib
- Perubahan qty → recalculate discount dan tax otomatis (via store actions)
- Input harga bisa diedit manual (override price tier)
- Discount dan tax dihitung via utils, bukan inline di komponen

## Tugas Fase Ini

### File 1: `src/features/sales/cashier/components/CartItem.tsx`
Satu baris item di dalam keranjang:

**Tampilan:**
```
┌──────────────────────────────────────────────┐
│ Kopi Hitam              [🗑]                 │
│ Pcs                    Rp 5.000              │
│ [−] [  3  ] [+]        = Rp 15.000           │
│ Catatan: [___________]                       │
└──────────────────────────────────────────────┘
```

**Props:**
```ts
interface CartItemProps {
  item: CartItem
}
```

**Fitur:**
- Nama produk bold + nama unit muted
- Tombol − dan + untuk adjust qty (min qty: 1)
- Input qty bisa diketik langsung (validasi angka positif)
- Qty berubah → `updateQty(productId, unitId, newQty)`
- Harga per unit: bisa diedit (klik harga → jadi input)
  - Simpan harga baru via `updatePrice(productId, unitId, newPrice)`
  - Ini untuk override harga khusus pelanggan tertentu
- Input catatan per item (opsional) → `updateNotes(productId, unitId, notes)`
- Tombol hapus (🗑) → langsung `removeFromCart` tanpa konfirmasi

**Recalculation:**
Saat qty atau harga berubah:
- Recalc subtotal item: `qty * price`
- Store otomatis recalc discount dan tax karena subtotal cart berubah

### File 2: `src/features/sales/cashier/components/DiscountInput.tsx`
Input diskon di dalam CartPanel, di atas summary:

**Tampilan:**
```
Diskon:  [% Persen] [Rp Nominal]   [10___] %  = Rp 5.000
```

**Props:** tidak perlu — langsung akses store

**Fitur:**
- Toggle tipe diskon: `percent` vs `amount`
- Input nilai diskon
- Tampil kalkulasi nominal diskon secara real-time
- Max diskon percent: 100%
- Max diskon nominal: tidak lebih dari subtotal
- Saat berubah: `setDiscount({ type, value })`
- Tampilkan tipe aktif dengan highlight/underline

### File 3: `src/features/sales/cashier/components/TaxInput.tsx`
Input pajak di dalam CartPanel, di bawah diskon:

**Tampilan:**
```
Pajak:   [11___] %  = Rp 4.950
```

**Props:** tidak perlu — langsung akses store

**Fitur:**
- Input persentase pajak (0-100)
- Tampil kalkulasi nominal pajak secara real-time
- Pajak dihitung dari (subtotal - diskon)
- Saat berubah: `setTax(percent)`

### Update File 4: `src/features/sales/cashier/components/CartPanel.tsx`
Integrasikan CartItem, DiscountInput, TaxInput:

```tsx
// List items
{cart.map((item) => (
  <CartItem key={`${item.product_id}-${item.unit_id}`} item={item} />
))}

// Di bawah list items, sebelum summary:
<DiscountInput />
<TaxInput />

// Summary (sudah ada dari FASE 19, pastikan pakai calcCartSummary)
```

**Tampilan summary yang benar:**
```tsx
const summary = calcCartSummary(cart, discount, tax)

// Render:
// Subtotal:        Rp {formatRupiah(summary.subtotal)}
// Diskon:         -Rp {formatRupiah(summary.discountAmount)}  (hanya tampil jika > 0)
// Pajak:           Rp {formatRupiah(summary.taxAmount)}       (hanya tampil jika > 0)
// ─────────────────────────────
// TOTAL:           Rp {formatRupiah(summary.grandTotal)}
```

## Hasil yang Diharapkan
- CartItem menampilkan nama, qty controls, harga, subtotal per item
- Qty bisa diubah via tombol + − atau input langsung
- Harga bisa diedit manual
- Catatan item bisa diisi
- DiscountInput mengubah diskon — kalkulasi update real-time
- TaxInput mengubah pajak — kalkulasi update real-time
- Summary menampilkan total yang benar
- TypeScript tidak ada error
