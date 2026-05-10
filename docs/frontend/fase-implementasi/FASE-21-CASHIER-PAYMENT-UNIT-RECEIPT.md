# FASE 21 — Cashier: PaymentModal + UnitSelectModal + ReceiptPrint

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 20 sudah selesai: CartItem, DiscountInput, TaxInput sudah berfungsi.
Fase ini adalah fase terakhir Cashier — menyelesaikan alur pembayaran.

## Standar Wajib
- Validasi pembayaran: amount paid >= grand total
- Kembalian dihitung real-time saat input amount paid
- Checkout hanya bisa jika shift aktif (validasi dari backend)
- Setelah checkout sukses: cart dikosongkan, struk ditampilkan
- ReceiptPrint menggunakan CSS @media print

## Tugas Fase Ini

### File 1: `src/features/sales/cashier/components/UnitSelectModal.tsx`
Modal pilih unit ketika produk punya lebih dari 1 unit.

**Tampilan:**
```
┌──────────────────────────────────┐
│ Pilih Unit — Kopi Hitam      [X] │
├──────────────────────────────────┤
│ ┌────────────┐  ┌────────────┐  │
│ │ Pcs        │  │ Lusin      │  │
│ │ Rp 5.000   │  │ Rp 55.000  │  │
│ └────────────┘  └────────────┘  │
└──────────────────────────────────┘
```

**Props:** tidak perlu — ambil dari store (`pendingProduct`)

**Fitur:**
- Tampil semua unit yang dimiliki produk
- Tampil harga berlaku per unit (cari dari price tiers dengan qty=1)
- Klik unit → `addToCart` dengan unit yang dipilih + `closeUnitSelectModal()`
- Bisa pilih qty sebelum konfirmasi (input qty, default: 1)

### File 2: `src/features/sales/cashier/components/PaymentModal.tsx`
Modal pembayaran — modal terpenting di aplikasi.

**Tampilan:**
```
┌─────────────────────────────────────────┐
│ Pembayaran                           [X] │
├─────────────────────────────────────────┤
│ TOTAL BELANJA          Rp 49.950        │
├─────────────────────────────────────────┤
│ Metode Pembayaran:                      │
│ [Tunai] [Transfer] [QRIS] [Kartu]       │
│                                         │
│ Jumlah Bayar:                           │
│ [Rp _______________]                    │
│                                         │
│ Kembalian:              Rp 50           │
│                                         │
│ Bayar Pas: [Rp 50.000] [Rp 100.000]    │
├─────────────────────────────────────────┤
│             [Batal]  [✓ Proses Bayar]  │
└─────────────────────────────────────────┘
```

**Form schema (React Hook Form + Zod):**
```ts
const paymentSchema = z.object({
  payment_method: z.enum(['cash', 'transfer', 'qris', 'card']),
  amount_paid:    z.number().min(0, 'Jumlah bayar wajib diisi'),
}).refine(
  (data) => data.amount_paid >= grandTotal,
  { message: 'Jumlah bayar kurang', path: ['amount_paid'] }
)
```

**Fitur:**
- Total belanja dari `calcCartSummary`
- Pilih metode pembayaran (4 tombol, visual toggle)
- Input jumlah bayar — focus otomatis saat modal buka
- Kembalian: hitung real-time (`amount_paid - grand_total`)
- Kembalian negatif: tampil merah + tombol proses disabled
- Tombol bayar pas: `[Rp X.000] [Rp Y.000]` yang lebih besar dari total
  - Auto-generate 2-3 nominal: pembulatan ke atas ke 5.000, 10.000, 50.000 terdekat
- Submit: panggil `useCheckoutMutation` dengan `PaymentPayload` lengkap
- `onSuccess`: simpan `checkoutResponse`, tutup modal, tampil `ReceiptPrint`

**Build PaymentPayload dari store:**
```ts
const buildPayload = (
  cart: CartItem[],
  summary: CartSummary,
  discount: Discount,
  tax: Tax,
  customerId: number | undefined,
  paymentMethod: PaymentMethod,
  amountPaid: number
): PaymentPayload
```

### File 3: `src/features/sales/cashier/components/ReceiptPrint.tsx`
Struk transaksi — tampil setelah checkout sukses, bisa dicetak.

**Tampilan:**
```
        ===========================
              NAMA TOKO
              Alamat Toko
        ===========================
        No: TRX-20240115-001
        Tanggal: 15 Jan 2024 10:30
        Kasir: Budi
        Pelanggan: -
        ---------------------------
        Kopi Hitam x2
          Pcs @ Rp 5.000     Rp 10.000

        Teh Manis x1
          Pcs @ Rp 4.000     Rp 4.000
        ---------------------------
        Subtotal:            Rp 14.000
        Diskon (10%):       -Rp 1.400
        Pajak (11%):         Rp 1.386
        ---------------------------
        TOTAL:               Rp 13.986
        Bayar (Tunai):       Rp 20.000
        Kembalian:           Rp 6.014
        ===========================
           Terima kasih!
        ===========================
```

**Props:**
```ts
interface ReceiptPrintProps {
  open:            boolean
  onClose:         () => void
  checkoutData:    CheckoutResponse
  cart:            CartItem[]
  summary:         CartSummary
  discount:        Discount
  tax:             Tax
  paymentMethod:   PaymentMethod
  amountPaid:      number
  customerName?:   string
}
```

**Fitur:**
- Tampil di modal setelah checkout
- Tombol "Cetak Struk" → `window.print()`
- Tombol "Transaksi Baru" → tutup modal + cart sudah di-clear
- CSS print: sembunyikan semua kecuali `.receipt-content`
- Nama toko dari settings (untuk sekarang hardcode "POS System")

### Update CashierPage
Tambahkan semua modal:
```tsx
<UnitSelectModal />
<PaymentModal
  open={paymentModalOpen}
  onOpenChange={(open) => !open && closePaymentModal()}
/>
{receiptData && (
  <ReceiptPrint
    open={receiptOpen}
    onClose={handleReceiptClose}
    checkoutData={receiptData}
    ...
  />
)}
```

## Hasil yang Diharapkan
- Klik "Bayar" → PaymentModal terbuka dengan total yang benar
- Pilih metode pembayaran → toggle visual aktif
- Input jumlah bayar → kembalian terhitung real-time
- Klik "Proses Bayar" → request checkout dikirim → sukses → struk tampil
- Klik "Cetak Struk" → print dialog browser terbuka
- Klik "Transaksi Baru" → cart kosong, siap transaksi berikutnya
- Produk multi-unit → UnitSelectModal muncul saat produk diklik
- TypeScript tidak ada error
- Alur kasir end-to-end berfungsi penuh
