# FASE 27 — Reporting: Reports

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 26 sudah selesai: Dashboard selesai.

## Backend Endpoints
```
GET /reports/sales        → laporan penjualan (filter: date_from, date_to, group_by)
GET /reports/products     → laporan produk terlaris
GET /reports/cashiers     → laporan per kasir
GET /reports/export       → export laporan ke CSV/Excel (query params sama)
```

## Tugas Fase Ini

### File 1: `src/features/reporting/reports/reports.types.ts`
```ts
export type ReportType   = 'sales' | 'products' | 'cashiers'
export type GroupBy      = 'day' | 'week' | 'month'
export type ExportFormat = 'csv' | 'excel'

export interface ReportFilter {
  type:       ReportType
  date_from:  string
  date_to:    string
  group_by?:  GroupBy
  page?:      number
  page_size?: number
}

export interface SalesReportRow {
  period:            string
  total_transactions: number
  total_revenue:     number
  total_discount:    number
  total_tax:         number
  net_revenue:       number
}

export interface ProductReportRow {
  product_name: string
  unit_name:    string
  qty_sold:     number
  revenue:      number
  avg_price:    number
}

export interface CashierReportRow {
  kasir_name:         string
  total_transactions: number
  total_revenue:      number
}
```

### File 2: `src/features/reporting/reports/reports.api.ts`
- `useSalesReportQuery(filter)` → `PaginatedResponse<SalesReportRow>`
- `useProductReportQuery(filter)` → `PaginatedResponse<ProductReportRow>`
- `useCashierReportQuery(filter)` → `PaginatedResponse<CashierReportRow>`
- `useExportReportMutation()` → download file

**Export implementation:**
```ts
// Trigger download file dari blob response
const { mutate: exportReport } = useMutation({
  mutationFn: async (filter: ReportFilter & { format: ExportFormat }) => {
    const response = await apiClient.get('/reports/export', {
      params: filter,
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-${filter.type}-${filter.date_from}.${filter.format}`
    a.click()
    URL.revokeObjectURL(url)
  },
  onSuccess: () => toast.success('Laporan berhasil diunduh'),
  onError: () => toast.error('Gagal mengunduh laporan'),
})
```

### File 3: `src/features/reporting/reports/components/ReportFilter.tsx`
Filter bar:
- Toggle tipe laporan: [Penjualan] [Produk] [Kasir]
- Date range: date_from + date_to (default: bulan ini)
- Select group by (hanya untuk tipe Penjualan): Harian / Mingguan / Bulanan
- Tombol "Tampilkan" (submit filter)
- Tombol export: [Export CSV] [Export Excel]

### File 4: `src/features/reporting/reports/components/ReportTable.tsx`
Tabel dinamis yang menyesuaikan kolom berdasarkan `reportType`:
- `sales` → period, transaksi, pendapatan, diskon, pajak, net
- `products` → produk, unit, qty, pendapatan, harga rata-rata
- `cashiers` → kasir, transaksi, pendapatan

Semua nominal menggunakan `formatRupiah`.

### File 5: `src/features/reporting/reports/ReportsPage.tsx`
- PageHeader: "Laporan"
- ReportFilter di atas
- Loading state saat fetch
- ReportTable dengan pagination
- Tombol export sudah terintegrasi di ReportFilter

### File 6: `src/features/reporting/reports/index.ts`
```ts
export { ReportsPage } from './ReportsPage'
```

### Update Router
Ganti placeholder `/reports` dengan `<ReportsPage />`.

## Hasil yang Diharapkan
- Laporan penjualan tampil dengan filter tanggal
- Switch tipe laporan → tabel berubah kolom
- Export CSV/Excel berfungsi (download file)
- Pagination berfungsi
- TypeScript tidak ada error
