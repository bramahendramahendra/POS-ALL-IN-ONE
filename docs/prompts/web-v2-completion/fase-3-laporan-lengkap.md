# Fase 3 — Laporan Lengkap (Reports)

Kamu adalah senior React/TypeScript developer. Saya punya project web-v2 (React + TypeScript +
Vite + Zustand + React Query + React Router v6, Tailwind CSS + shadcn/ui).

## Context

Struktur project: `web-v2/src/features/<domain>/`
Pattern per feature:
- `*.api.ts`      → React Query hooks
- `*.types.ts`    → TypeScript types
- `components/`   → sub-komponen
- `*Page.tsx`     → halaman utama

API client import: `import { apiClient } from '@/shared/lib/api-client'`
Shared UI: `@/shared/components/ui/*`

## Existing Reports

`/reports` → `ReportsPage.tsx` sudah ada tapi sangat minimal (skeleton/placeholder).
File yang ada:
- `web-v2/src/features/reporting/reports/reports.api.ts`
- `web-v2/src/features/reporting/reports/reports.types.ts`
- `web-v2/src/features/reporting/reports/components/ReportFilter.tsx`
- `web-v2/src/features/reporting/reports/components/ReportTable.tsx`

## Task

Replace implementasi ReportsPage dengan 4 tab laporan lengkap.
Gunakan komponen Tab (bisa shadcn Tabs atau custom tab sederhana dengan state).

---

### Tab 1: Laporan Penjualan

Filter: date_from, date_to, user_id (select kasir), payment_method (select)
Summary cards: Total Transaksi, Total Pendapatan, Rata-rata per Transaksi
Tabel: Tanggal, Kode Transaksi, Kasir, Customer, Total, Metode Bayar, Status (badge)
Tombol Export CSV: generate dan download CSV dari data yang ditampilkan

API: `GET /reports/sales`
Params: `date_from`, `date_to`, `user_id`, `payment_method`, `page`, `page_size`
Response: `{ success, data: { items: SalesReport[], total, summary: SalesReportSummary } }`

---

### Tab 2: Laporan Laba Rugi

Filter: date_from, date_to (default: awal bulan ini sampai hari ini)
Tampilan berupa kartu/section bukan tabel:
- **Pendapatan**: Total Penjualan (dari transaksi completed), Retur Penjualan (jika ada)
- **Pengeluaran**: Total HPP (harga pokok penjualan), Total Expense (pengeluaran)
- **Laba Kotor** = Total Penjualan - Total HPP
- **Laba Bersih** = Laba Kotor - Total Expense
Warnai angka: hijau jika positif, merah jika negatif

API: `GET /reports/profit-loss`
Params: `date_from`, `date_to`
Response: `{ success, data: ProfitLossReport }`

---

### Tab 3: Laporan Stok

Filter: category_id (select kategori), search nama/kode produk
Summary: Total Item Produk, Total Nilai Stok
Tabel: Kode, Nama Produk, Kategori, Satuan, Stok Saat Ini, Nilai Stok (stok × harga modal)
Beri badge merah "Stok Rendah" jika current_stock < min_stock

API: `GET /reports/stock`
Params: `category_id`, `search`, `page`, `page_size`
Response: `{ success, data: { items: StockReport[], total, total_stock_value } }`

---

### Tab 4: Kinerja Kasir

Filter: date_from, date_to
Tabel: Nama Kasir, Jumlah Transaksi, Total Penjualan, Rata-rata per Transaksi, Void Count
Urutkan dari total penjualan tertinggi

API: `GET /reports/cashier-performance`
Params: `date_from`, `date_to`
Response: `{ success, data: CashierPerformance[] }`

---

## Types untuk `reports.types.ts` (replace/tambahkan)

```ts
interface SalesReport {
  transaction_code: string
  transaction_date: string
  cashier_name: string
  customer_name?: string
  total_amount: number
  payment_method: string
  status: 'completed' | 'void'
}

interface SalesReportSummary {
  total_transactions: number
  total_revenue: number
  avg_per_transaction: number
}

interface ProfitLossReport {
  period_from: string
  period_to: string
  total_sales: number
  total_returns: number
  total_hpp: number
  total_expense: number
  gross_profit: number
  net_profit: number
}

interface StockReport {
  product_code: string
  product_name: string
  category_name: string
  unit: string
  current_stock: number
  min_stock: number
  cost_price: number
  stock_value: number
}

interface CashierPerformance {
  user_id: number
  cashier_name: string
  total_transactions: number
  total_sales: number
  avg_per_transaction: number
  void_count: number
}
```

---

## Output yang Diharapkan

Buat file-file berikut (isi lengkap, siap pakai):

1. Update `web-v2/src/features/reporting/reports/reports.types.ts`
2. Update `web-v2/src/features/reporting/reports/reports.api.ts`
3. `web-v2/src/features/reporting/reports/components/SalesReportTab.tsx`
4. `web-v2/src/features/reporting/reports/components/ProfitLossTab.tsx`
5. `web-v2/src/features/reporting/reports/components/StockReportTab.tsx`
6. `web-v2/src/features/reporting/reports/components/CashierPerformanceTab.tsx`
7. Update `web-v2/src/features/reporting/reports/ReportsPage.tsx`

Jangan buat file lain selain yang disebutkan di atas.

**Catatan**: Jika jawaban terlalu panjang, implementasikan Tab 1 (Penjualan) dan Tab 2 (Laba Rugi)
dulu, kemudian lanjutkan dengan prompt tambahan untuk Tab 3 dan Tab 4.
