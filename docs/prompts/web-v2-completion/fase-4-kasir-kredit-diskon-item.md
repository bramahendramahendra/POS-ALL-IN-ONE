# Fase 4 — Kasir: Mode Kredit & Diskon Per Item

Kamu adalah senior React/TypeScript developer. Saya punya project web-v2 (React + TypeScript +
Vite + Zustand + React Query + React Router v6, Tailwind CSS + shadcn/ui).

## Context

Kasir sudah berjalan di `/kasir` → `CashierPage.tsx`.
File yang relevan:
- `web-v2/src/features/sales/cashier/cashier.store.ts`    → Zustand store
- `web-v2/src/features/sales/cashier/cashier.types.ts`    → TypeScript types
- `web-v2/src/features/sales/cashier/cashier.api.ts`      → React Query hooks + checkout mutation
- `web-v2/src/features/sales/cashier/cashier.utils.ts`    → Pure calculation functions
- `web-v2/src/features/sales/cashier/components/CartItemRow.tsx`  → baris item di keranjang
- `web-v2/src/features/sales/cashier/components/PaymentModal.tsx` → modal pembayaran

**Baca semua file di atas sebelum mulai coding.**

## Task 1: Diskon Per Item

Desktop memiliki diskon per item (berbeda dari diskon global seluruh transaksi).
Tambahkan UI input diskon di setiap baris `CartItemRow`.

### Perubahan di `cashier.types.ts`

Pastikan `CartItem` punya field berikut (tambahkan jika belum ada):
```ts
discount_type?: 'percent' | 'nominal'
discount_value?: number
discount_amount?: number   // dihitung: hasil potongan dalam rupiah
effective_price?: number   // harga setelah diskon per unit
```

### Perubahan di `cashier.utils.ts`

Tambahkan fungsi:
```ts
function calculateItemDiscount(
  price: number,
  qty: number,
  type: 'percent' | 'nominal',
  value: number
): { discount_amount: number; subtotal: number }
```

### Perubahan di `cashier.store.ts`

Tambahkan action:
```ts
setItemDiscount(productId: number, type: 'percent' | 'nominal', value: number): void
```
Action ini harus recalculate `discount_amount`, `effective_price`, dan `subtotal` pada item.

### Perubahan di `CartItemRow.tsx`

- Tambahkan tombol kecil "%" di sebelah harga item
- Klik tombol → tampilkan inline input (atau small popover) dengan:
  - Toggle tipe: "%" (percent) atau "Rp" (nominal)
  - Input nilai diskon
  - Tombol apply/konfirmasi
- Jika item sudah punya diskon: tampilkan badge kecil merah (contoh: "Disc 10%" atau "-Rp5.000")
- Harga yang ditampilkan berubah menjadi harga setelah diskon

---

## Task 2: Metode Bayar Kredit (Piutang Pelanggan)

Desktop memiliki mode bayar "kredit" — transaksi dicatat sebagai piutang, customer belum bayar tunai.
Tambahkan opsi ini di `PaymentModal.tsx`.

### Perubahan di `cashier.types.ts`

Update union type payment method:
```ts
payment_method: 'cash' | 'debit' | 'credit' | 'qris' | 'transfer' | 'kredit'
```

Update `PaymentPayload`:
```ts
interface PaymentPayload {
  // ... field yang sudah ada
  payment_method: 'cash' | 'debit' | 'credit' | 'qris' | 'transfer' | 'kredit'
  customer_id?: number  // wajib diisi jika payment_method === 'kredit'
}
```

### Perubahan di `PaymentModal.tsx`

- Tambahkan pilihan "Kredit" di daftar metode bayar
- Pilihan "Kredit" hanya tampil (enabled) jika customer sudah dipilih di kasir
- Jika "Kredit" dipilih, tampilkan section info customer:
  - Credit Limit: Rp X (atau "Tak Terbatas" jika 0)
  - Outstanding: Rp Y (hutang yang belum dibayar)
  - Sisa Limit: Rp Z = credit_limit - outstanding (hanya tampil jika credit_limit > 0)
  - Jika total transaksi > sisa limit: tampilkan warning merah, tapi tetap bisa lanjut proses
- Jika "Kredit" dipilih: field "Jumlah Bayar" dan "Kembalian" disembunyikan (karena tidak ada pembayaran tunai)

Data customer (credit_limit, outstanding) bisa diambil dari state kasir yang sudah ada,
atau fetch ulang dari `GET /customers/:id`.

---

## Output yang Diharapkan

Update file-file berikut (jangan buat file baru):

1. Update `web-v2/src/features/sales/cashier/cashier.types.ts`
2. Update `web-v2/src/features/sales/cashier/cashier.utils.ts`
3. Update `web-v2/src/features/sales/cashier/cashier.store.ts`
4. Update `web-v2/src/features/sales/cashier/cashier.api.ts`
5. Update `web-v2/src/features/sales/cashier/components/CartItemRow.tsx`
6. Update `web-v2/src/features/sales/cashier/components/PaymentModal.tsx`

**Penting:**
- Pastikan perubahan backward-compatible: fitur kasir yang sudah ada tidak boleh rusak
- Jangan ubah komponen lain (CashierPage, ProductSearch, CartPanel, dll) kecuali memang perlu
- Baca isi file sebelum mengedit agar tidak kehilangan kode yang sudah ada
