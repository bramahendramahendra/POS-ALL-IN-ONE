# FASE 18 — Cashier: Types, Store & Utils

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 17 sudah selesai: Suppliers selesai.
Cashier adalah modul PALING KOMPLEKS — dipecah menjadi 4 fase (18-21).
Fase ini hanya types, store, dan utils — belum ada UI.

## Standar Wajib
- Cart state disimpan di Zustand dengan `persist` (draft selamat dari refresh)
- Persist key: `'cashier-draft'`
- Semua kalkulasi (total, diskon, pajak) ada di utils — bukan di komponen
- Store hanya simpan state dan action — kalkulasi dipanggil dari utils
- Tidak ada API call di store

## Tugas Fase Ini

### File 1: `src/features/sales/cashier/cashier.types.ts`
```ts
export type DiscountType = 'none' | 'percent' | 'amount'
export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'card'

export interface CartItem {
  product_id:   number
  product_name: string
  unit_id:      number
  unit_name:    string
  barcode?:     string
  qty:          number
  price:        number          // harga per unit saat ditambahkan ke cart
  subtotal:     number          // qty * price
  notes?:       string
}

export interface Discount {
  type:   DiscountType
  value:  number    // persen (0-100) atau nominal
  amount: number    // hasil kalkulasi nominal diskon
}

export interface Tax {
  percent: number   // 0-100
  amount:  number   // hasil kalkulasi
}

export interface CartSummary {
  subtotal:        number   // total sebelum diskon & pajak
  discountAmount:  number
  taxAmount:       number
  grandTotal:      number
}

export interface PaymentPayload {
  customer_id?:    number
  items:           Array<{
    product_id: number
    unit_id:    number
    qty:        number
    price:      number
    subtotal:   number
    notes?:     string
  }>
  subtotal:        number
  discount_type:   DiscountType
  discount_value:  number
  discount_amount: number
  tax_percent:     number
  tax_amount:      number
  grand_total:     number
  payment_method:  PaymentMethod
  amount_paid:     number
  change_amount:   number
  notes?:          string
}

export interface CheckoutResponse {
  transaction_id:  number
  transaction_code: string
  grand_total:     number
  amount_paid:     number
  change_amount:   number
  created_at:      string
}
```

### File 2: `src/features/sales/cashier/cashier.utils.ts`
Pure functions untuk kalkulasi kasir:

```ts
// Hitung subtotal per item
export const calcItemSubtotal = (qty: number, price: number): number

// Hitung total cart sebelum diskon & pajak
export const calcSubtotal = (items: CartItem[]): number

// Hitung nominal diskon
export const calcDiscountAmount = (
  subtotal: number,
  discount: Omit<Discount, 'amount'>
): number

// Hitung nominal pajak
export const calcTaxAmount = (
  subtotal: number,
  discountAmount: number,
  taxPercent: number
): number

// Hitung grand total
export const calcGrandTotal = (
  subtotal: number,
  discountAmount: number,
  taxAmount: number
): number

// Summary lengkap dari cart
export const calcCartSummary = (
  items: CartItem[],
  discount: Discount,
  tax: Tax
): CartSummary

// Hitung kembalian
export const calcChange = (grandTotal: number, amountPaid: number): number

// Cari harga yang berlaku berdasarkan qty dan price tiers
export const getApplicablePrice = (
  priceTiers: PriceTier[],
  unitId: number,
  qty: number
): number | null

// Validasi: apakah pembayaran cukup?
export const isPaymentSufficient = (grandTotal: number, amountPaid: number): boolean
```

### File 3: `src/features/sales/cashier/cashier.store.ts`
Zustand store dengan persist:

```ts
interface CashierState {
  // Data
  cart:             CartItem[]
  discount:         Discount
  tax:              Tax
  selectedCustomer: { id: number, name: string } | null

  // UI State
  paymentModalOpen:    boolean
  unitSelectModalOpen: boolean
  pendingProduct:      { product: Product, availableUnits: ProductUnit[] } | null

  // Actions — Cart
  addToCart:       (item: CartItem) => void
  removeFromCart:  (productId: number, unitId: number) => void
  updateQty:       (productId: number, unitId: number, qty: number) => void
  updateNotes:     (productId: number, unitId: number, notes: string) => void
  updatePrice:     (productId: number, unitId: number, price: number) => void
  clearCart:       () => void

  // Actions — Discount & Tax
  setDiscount: (discount: Omit<Discount, 'amount'>) => void
  setTax:      (percent: number) => void

  // Actions — Customer
  setCustomer:   (customer: { id: number, name: string } | null) => void

  // Actions — Modal
  openPaymentModal:    () => void
  closePaymentModal:   () => void
  openUnitSelectModal: (product: Product, units: ProductUnit[]) => void
  closeUnitSelectModal: () => void
}
```

**Implementasi penting:**
- `addToCart`: jika item dengan `product_id + unit_id` sama sudah ada → tambah qty, recalc subtotal
- `updateQty`: recalc subtotal item
- `setDiscount`: simpan type + value, hitung `amount` via `calcDiscountAmount`
- `setTax`: hitung `amount` via `calcTaxAmount`
- Saat qty item berubah → re-evaluasi diskon dan pajak (karena subtotal berubah)
- Persist: simpan `cart`, `discount`, `tax`, `selectedCustomer` — tidak perlu simpan modal states

### File 4: `src/features/sales/cashier/index.ts`
```ts
export { useCashierStore } from './cashier.store'
export * from './cashier.utils'
export type { CartItem, Discount, Tax, PaymentPayload, CheckoutResponse } from './cashier.types'
```

## Hasil yang Diharapkan
- Store bisa diakses dari komponen manapun
- `addToCart` item yang sama → qty bertambah, subtotal terupdate
- `setDiscount({ type: 'percent', value: 10 })` → amount terhitung otomatis
- `clearCart()` → cart kosong, draft terhapus dari localStorage
- Setelah refresh browser, cart masih ada (persist berjalan)
- Semua utils terhitung dengan benar (buat test manual jika perlu)
- TypeScript tidak ada error
