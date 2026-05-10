# FASE 19 — Cashier: CashierPage + ProductSearch + CartPanel

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 18 sudah selesai: cashier types, store, dan utils sudah siap.

## Standar Wajib
- Debounce search produk 300ms
- Barcode lookup via Enter key pada search input
- Cart panel di kanan layar — fixed height, scroll jika item banyak
- Semua kalkulasi via utils dari FASE 18
- Tidak ada kalkulasi langsung di komponen

## Desain Halaman Kasir
```
┌─────────────────────────────────────────────────────────────┐
│ NAVBAR                                                       │
├────────────────────────────┬────────────────────────────────┤
│ PANEL KIRI (flex-grow)     │ PANEL KANAN (fixed w=380px)   │
│                            │                                │
│ [🔍 Cari / Scan Barcode]  │ 🛒 Keranjang                  │
│                            │ ─────────────────────────────  │
│ [Hasil pencarian produk]   │ [item 1]                      │
│ ┌──────┐ ┌──────┐          │ [item 2]                      │
│ │Produk│ │Produk│          │ ...                           │
│ │Kopi  │ │Teh   │          │ ─────────────────────────────  │
│ │5.000 │ │4.000 │          │ Subtotal:      Rp 50.000      │
│ └──────┘ └──────┘          │ Diskon:        Rp 0           │
│                            │ Pajak:         Rp 0           │
│ [Pelanggan: -]             │ ─────────────────────────────  │
│                            │ TOTAL:         Rp 50.000      │
│                            │                                │
│                            │ [🗑 Kosongkan] [💳 Bayar]     │
└────────────────────────────┴────────────────────────────────┘
```

## Tugas Fase Ini

### File 1: `src/features/sales/cashier/cashier.api.ts`
Query dan mutation untuk cashier:

**Queries:**
- `useProductSearchQuery(keyword: string, enabled: boolean)` → `Product[]`
  - queryKey: `queryKeys.products.list({ search: keyword })`
  - enabled: `keyword.length >= 2`
- `useProductBarcodeQuery(code: string, enabled: boolean)` → `{ product: Product, units: ProductUnit[] }`
  - queryKey: `queryKeys.products.barcode(code)`
- `useCustomerListQuery()` → `Customer[]` (untuk autocomplete pelanggan)
- `useActiveShiftQuery()` → data shift aktif (untuk validasi checkout)

**Mutations:**
- `useCheckoutMutation()` → `POST /transactions/checkout`
  - body: `PaymentPayload`
  - onSuccess: `clearCart()`, tutup payment modal, `toast.success`, navigate ke struk
  - onError: `toast.error(error.message)`

### File 2: `src/features/sales/cashier/hooks/useProductSearch.ts`
Custom hook untuk logika search produk:
```ts
export const useProductSearch = () => {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)

  const { data: results, isLoading } = useProductSearchQuery(
    debouncedKeyword,
    debouncedKeyword.length >= 2
  )

  const clearSearch = () => setKeyword('')

  return { keyword, setKeyword, results: results ?? [], isLoading, clearSearch }
}
```

### File 3: `src/features/sales/cashier/hooks/useBarcodeScan.ts`
Custom hook untuk barcode scan via Enter key:
```ts
export const useBarcodeScan = () => {
  const [isScanning, setIsScanning] = useState(false)

  const handleBarcodeEnter = async (code: string) => {
    // fetch via queryClient.fetchQuery dengan queryKeys.products.barcode(code)
    // return product + units
    // throw error jika tidak ditemukan
  }

  return { handleBarcodeEnter, isScanning }
}
```

### File 4: `src/features/sales/cashier/components/ProductSearch.tsx`
Komponen search produk di panel kiri:

**Fitur:**
- Input text dengan placeholder "Cari produk atau scan barcode..."
- Auto-focus saat halaman load
- Saat mengetik (>= 2 char): tampil hasil pencarian sebagai grid kartu produk
- Saat Enter: coba barcode lookup
- Jika barcode ditemukan + hanya 1 unit → langsung `addToCart`
- Jika barcode ditemukan + beberapa unit → buka `UnitSelectModal`
- Klik kartu produk:
  - 1 unit → langsung `addToCart` dengan unit default dan harga tier berlaku
  - Beberapa unit → buka `UnitSelectModal`
- Clear input setelah produk berhasil ditambahkan

**Tampilan kartu produk (dalam grid 2-3 kolom):**
```
┌───────────────┐
│  [ikon produk]│
│  Kopi Hitam   │
│  Rp 5.000/Pcs │
└───────────────┘
```

### File 5: `src/features/sales/cashier/components/CartPanel.tsx`
Panel keranjang di sisi kanan:

**Sections:**
1. Header: "🛒 Keranjang (N item)"
2. Pilih pelanggan: dropdown/autocomplete dari `useCustomerListQuery`
3. List cart items (render `CartItem` per baris) — scrollable
4. Summary section: subtotal, diskon, pajak, grand total
5. Footer: tombol "Kosongkan" + tombol "Bayar"

**Logic:**
- Ambil `cart`, `discount`, `tax`, `selectedCustomer` dari `useCashierStore`
- Hitung summary via `calcCartSummary(cart, discount, tax)`
- Tombol "Kosongkan": `ConfirmDialog` → `clearCart()`
- Tombol "Bayar": disabled jika `cart.length === 0` → `openPaymentModal()`

**Tampilan summary:**
```
Subtotal:       Rp 50.000
Diskon (-10%):  Rp 5.000
Pajak (11%):    Rp 4.950
──────────────────────────
TOTAL:          Rp 49.950
```

### File 6: `src/features/sales/cashier/CashierPage.tsx`
Layout halaman kasir:

```tsx
const CashierPage = () => {
  useEffect(() => { /* validasi shift aktif — jika tidak ada, tampil warning */ }, [])

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--navbar-height))' }}>
      {/* Panel Kiri */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        <ProductSearch />
        {/* Modal-modal akan ditambahkan di FASE 20 & 21 */}
      </div>

      {/* Panel Kanan */}
      <div style={{ width: '380px', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
        <CartPanel />
      </div>
    </div>
  )
}
```

Catatan: CashierPage tidak menggunakan padding dari AppLayout — layout-nya full height sendiri.
Perlu override padding di ProtectedRoute atau AppLayout untuk route `/kasir`.

### Update Router
Ganti placeholder `/kasir` dengan `<CashierPage />`.

## Hasil yang Diharapkan
- `/kasir` menampilkan layout dua panel
- Ketik di search → hasil produk muncul
- Klik produk → masuk ke cart
- Cart menampilkan item + summary kalkulasi yang benar
- Tombol "Kosongkan" memunculkan ConfirmDialog
- TypeScript tidak ada error
