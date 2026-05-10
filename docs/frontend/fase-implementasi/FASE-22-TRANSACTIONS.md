# FASE 22 — Sales: Transactions

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 21 sudah selesai: fitur Cashier lengkap end-to-end sudah berjalan.

## Backend Endpoints
```
GET  /transactions           → list transaksi (pagination, filter: date_from, date_to, search, payment_method)
GET  /transactions/:id       → detail transaksi
POST /transactions/:id/void  → batalkan transaksi
```

## Tugas Fase Ini

### File 1: `src/features/sales/transactions/transactions.types.ts`
```ts
export interface Transaction {
  id:               number
  transaction_code: string
  customer_name?:   string
  kasir_name:       string
  items:            TransactionItem[]
  subtotal:         number
  discount_type:    DiscountType
  discount_amount:  number
  tax_amount:       number
  grand_total:      number
  payment_method:   PaymentMethod
  amount_paid:      number
  change_amount:    number
  status:           'completed' | 'voided'
  notes?:           string
  created_at:       string
}

export interface TransactionItem {
  product_name: string
  unit_name:    string
  qty:          number
  price:        number
  subtotal:     number
}

export interface TransactionFilter {
  search?:         string
  date_from?:      string
  date_to?:        string
  payment_method?: PaymentMethod | ''
  status?:         'completed' | 'voided' | ''
  page?:           number
  page_size?:      number
}
```

### File 2: `src/features/sales/transactions/transactions.api.ts`
- `useTransactionListQuery(filter?)` → `PaginatedResponse<Transaction>`
- `useTransactionDetailQuery(id)` → `Transaction`
- `useVoidTransactionMutation()` → onSuccess: invalidate list, toast success

### File 3: `src/features/sales/transactions/components/TransactionFilter.tsx`
Filter bar:
- Input search (kode transaksi / nama pelanggan)
- Date range: date_from + date_to (input type="date")
- Select metode bayar: Semua / Tunai / Transfer / QRIS / Kartu
- Select status: Semua / Selesai / Dibatalkan
- Tombol reset

### File 4: `src/features/sales/transactions/components/TransactionTable.tsx`
Kolom:
- Kode transaksi (bold, monospace)
- Tanggal & waktu
- Pelanggan (muted "-" jika tidak ada)
- Kasir
- Total (`formatRupiah`)
- Metode bayar (badge)
- Status: `<StatusBadge status={t.status === 'completed' ? 'success' : 'error'} />`
- Aksi: tombol "Detail" + tombol "Void" (hanya owner, hanya status completed)

### File 5: `src/features/sales/transactions/components/TransactionDetailModal.tsx`
Modal detail transaksi:
- Header: kode transaksi + tanggal + status
- Info: kasir, pelanggan, metode bayar
- Tabel items: nama produk, unit, qty, harga, subtotal
- Summary: subtotal, diskon, pajak, total, bayar, kembalian
- Tombol "Cetak Ulang Struk" (reuse ReceiptPrint component)
- Tombol "Void Transaksi" (hanya owner, hanya jika status completed)
  - Buka ConfirmDialog sebelum void

### File 6: `src/features/sales/transactions/TransactionsPage.tsx`
- PageHeader: "Transaksi" + breadcrumb
- TransactionFilter di atas tabel
- TransactionTable dengan pagination
- TransactionDetailModal
- Tidak ada tombol "Tambah" — transaksi hanya dari kasir

### File 7: `src/features/sales/transactions/index.ts`
```ts
export { TransactionsPage } from './TransactionsPage'
```

### Update Router
Ganti placeholder `/transactions` dengan `<TransactionsPage />`.

## Hasil yang Diharapkan
- `/transactions` menampilkan list transaksi
- Filter by tanggal, metode bayar, status berfungsi
- Klik detail → modal detail terbuka dengan info lengkap
- Void transaksi: ConfirmDialog → sukses → status berubah
- TypeScript tidak ada error
