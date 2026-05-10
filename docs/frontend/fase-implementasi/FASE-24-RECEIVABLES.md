# FASE 24 — Finance: Receivables (Piutang)

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 23 sudah selesai: Customers selesai.

## Backend Endpoints
```
GET  /receivables              → list piutang (pagination, filter: search, status)
GET  /receivables/:id          → detail piutang
POST /receivables/:id/payments → catat pembayaran piutang
```

## Tugas Fase Ini

### File 1: `src/features/finance/receivables/receivables.types.ts`
```ts
export type ReceivableStatus = 'unpaid' | 'partial' | 'paid'

export interface Receivable {
  id:              number
  transaction_id:  number
  transaction_code: string
  customer_id:     number
  customer_name:   string
  total_amount:    number
  paid_amount:     number
  remaining_amount: number
  status:          ReceivableStatus
  due_date?:       string
  payments:        ReceivablePayment[]
  created_at:      string
}

export interface ReceivablePayment {
  id:           number
  amount:       number
  payment_date: string
  notes?:       string
}

export interface ReceivableFilter {
  search?:    string
  status?:    ReceivableStatus | ''
  page?:      number
  page_size?: number
}

export interface CreatePaymentPayload {
  amount:       number
  payment_date: string
  notes?:       string
}
```

### File 2: `src/features/finance/receivables/receivables.api.ts`
- `useReceivableListQuery(filter?)` → `PaginatedResponse<Receivable>`
- `useReceivableDetailQuery(id)` → `Receivable`
- `useAddPaymentMutation(receivableId)` → onSuccess: invalidate receivable detail + list

### File 3: `src/features/finance/receivables/components/ReceivableTable.tsx`
Kolom:
- Kode transaksi
- Pelanggan
- Total piutang (`formatRupiah`)
- Sudah dibayar (`formatRupiah`)
- Sisa (`formatRupiah`, merah jika > 0)
- Status: `<StatusBadge status={receivable.status} />`
- Jatuh tempo (merah jika sudah lewat)
- Aksi: "Bayar" (buka PaymentRecordModal)

### File 4: `src/features/finance/receivables/components/PaymentRecordModal.tsx`
Modal catat pembayaran:

**Props:** `receivableId: number, remaining: number`

**Form schema:**
```ts
const paymentSchema = z.object({
  amount: z.number()
    .min(1, 'Jumlah bayar wajib diisi')
    .max(remaining, `Maksimal pembayaran Rp ${formatRupiah(remaining)}`),
  payment_date: z.string().min(1, 'Tanggal wajib diisi'),
  notes: z.string().optional(),
})
```

Tampilkan info: total piutang, sudah dibayar, sisa.
Tombol "Bayar Lunas" → set amount = remaining otomatis.

### File 5: `src/features/finance/receivables/ReceivablesPage.tsx`
- PageHeader: "Piutang" + breadcrumb Finance > Piutang
- Filter: search + status (Semua / Belum Lunas / Sebagian / Lunas)
- ReceivableTable dengan pagination
- PaymentRecordModal

### File 6: `src/features/finance/receivables/index.ts`
```ts
export { ReceivablesPage } from './ReceivablesPage'
```

### Update Router
Ganti placeholder `/receivables` dengan `<ReceivablesPage />`.

## Hasil yang Diharapkan
- List piutang dengan filter status berfungsi
- Klik "Bayar" → modal catat pembayaran terbuka
- Catat pembayaran → sisa berkurang → status update
- Tombol "Bayar Lunas" mengisi nominal penuh
- TypeScript tidak ada error
