# FASE 26 — Reporting: Dashboard

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 25 sudah selesai: Finance selesai.

## Backend Endpoints
```
GET /dashboard/summary      → ringkasan (filter: period = 'today'|'week'|'month')
GET /dashboard/sales-chart  → data grafik penjualan (filter: period)
GET /dashboard/top-products → top produk terlaris (filter: period, limit)
```

## Library Charts
Gunakan **Recharts** (sudah terinstall di FASE 0).
Jangan gunakan Chart.js (tidak ada di stack yang disepakati).

## Tugas Fase Ini

### File 1: `src/features/reporting/dashboard/dashboard.types.ts`
```ts
export type DashboardPeriod = 'today' | 'week' | 'month'

export interface DashboardSummary {
  total_transactions: number
  total_revenue:      number
  total_items_sold:   number
  new_customers:      number
  avg_transaction:    number
  period_label:       string
}

export interface SalesChartPoint {
  label:    string   // jam/hari/tanggal
  revenue:  number
  transactions: number
}

export interface TopProduct {
  rank:         number
  product_name: string
  unit_name:    string
  qty_sold:     number
  revenue:      number
}

export interface DashboardFilter {
  period: DashboardPeriod
}
```

### File 2: `src/features/reporting/dashboard/dashboard.api.ts`
- `useDashboardSummaryQuery(period)` → `DashboardSummary`
- `useSalesChartQuery(period)` → `SalesChartPoint[]`
- `useTopProductsQuery(period, limit?)` → `TopProduct[]`

### File 3: `src/features/reporting/dashboard/components/SummaryCards.tsx`
5 kartu statistik:
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 🧾 Transaksi │  │ 💰 Pendapatan│  │ 📦 Terjual   │  │ 👥 Pelanggan │  │ 📊 Rata-rata │
│     150      │  │ Rp 5.000.000 │  │    320 item  │  │  Baru: 12    │  │ Rp 33.333    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### File 4: `src/features/reporting/dashboard/components/SalesChart.tsx`
Grafik penjualan menggunakan Recharts `<AreaChart>` atau `<BarChart>`:
- X axis: label (jam/hari/tanggal tergantung period)
- Y axis: revenue (format Rupiah singkat: "Rp 5jt")
- Tooltip: tampil revenue + jumlah transaksi
- Warna: `var(--color-accent)` = #3498db
- Responsive: gunakan `<ResponsiveContainer width="100%" height={300}>`

### File 5: `src/features/reporting/dashboard/components/TopProductsTable.tsx`
Tabel 5-10 produk terlaris:
Kolom: Rank, Produk, Unit, Qty Terjual, Revenue.
Tidak ada pagination — tampil semua (biasanya ≤ 10).

### File 6: `src/features/reporting/dashboard/DashboardPage.tsx`
- PageHeader: "Dashboard"
- Toggle period: [Hari Ini] [Minggu Ini] [Bulan Ini]
- SummaryCards (loading skeleton saat fetch)
- 2 kolom bawah:
  - Kiri (2/3): SalesChart
  - Kanan (1/3): TopProductsTable

### File 7: `src/features/reporting/dashboard/index.ts`
```ts
export { DashboardPage } from './DashboardPage'
```

### Update Router
Ganti placeholder `/dashboard` dengan `<DashboardPage />`.

## Hasil yang Diharapkan
- Dashboard tampil setelah login (untuk owner/admin)
- Toggle period mengubah semua data sekaligus
- Grafik penjualan tampil dengan benar
- Kartu statistik menampilkan data real dari API
- Loading state tampil dengan benar
- TypeScript tidak ada error
