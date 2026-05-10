# FASE 25 — Finance: Overview

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 24 sudah selesai: Receivables selesai.

## Backend Endpoints
```
GET /finance/summary     → ringkasan keuangan (filter: date_from, date_to)
GET /finance/cashflow    → arus kas (pagination, filter: date_from, date_to, type)
```

## Tugas Fase Ini

### File 1: `src/features/finance/overview/finance.types.ts`
```ts
export interface FinanceSummary {
  total_income:    number
  total_expense:   number
  net_profit:      number
  total_receivable: number
  period_label:    string
}

export interface CashflowItem {
  id:          number
  type:        'income' | 'expense'
  category:    string
  amount:      number
  description: string
  date:        string
}

export interface FinanceFilter {
  date_from?:  string
  date_to?:    string
  page?:       number
  page_size?:  number
}
```

### File 2: `src/features/finance/overview/finance.api.ts`
- `useFinanceSummaryQuery(filter?)` → `FinanceSummary`
- `useCashflowQuery(filter?)` → `PaginatedResponse<CashflowItem>`

### File 3: `src/features/finance/overview/components/FinanceSummaryCard.tsx`
4 kartu ringkasan di atas halaman:
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ 💰 Pemasukan│  │ 💸 Pengeluaran│ │ 📈 Laba     │  │ 📋 Piutang  │
│ Rp 5.000.000│  │ Rp 2.000.000│  │ Rp 3.000.000│  │ Rp 500.000  │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```
Props: `summary: FinanceSummary, isLoading: boolean`

### File 4: `src/features/finance/overview/components/FinanceTable.tsx`
Tabel arus kas:
Kolom: Tanggal, Kategori, Deskripsi, Tipe (income=hijau/expense=merah), Nominal.

### File 5: `src/features/finance/overview/FinancePage.tsx`
- PageHeader: "Keuangan"
- Filter periode: date_from + date_to + tombol preset (Hari ini, Minggu ini, Bulan ini)
- FinanceSummaryCard (4 kartu)
- FinanceTable dengan pagination

### File 6: `src/features/finance/overview/index.ts`
```ts
export { FinancePage } from './FinancePage'
```

### Update Router
Ganti placeholder `/finance` dengan `<FinancePage />`.

## Hasil yang Diharapkan
- Kartu ringkasan tampil dengan data dari API
- Filter periode berfungsi (termasuk preset)
- Tabel cashflow tampil dengan pagination
- Loading state tampil saat fetch
- TypeScript tidak ada error
