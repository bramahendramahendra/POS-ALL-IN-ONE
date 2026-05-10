# FASE 8 — Shared Components: DataTable

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 0-7 sudah selesai: setup, foundation, auth, layout lengkap sudah berjalan.

## Standar Wajib
- DataTable adalah komponen LAPISAN 2 — tidak boleh ada API call atau store di dalamnya
- Semua data dipass via props — DataTable hanya render
- Server-side pagination — DataTable tidak filter/sort data sendiri
- Gunakan shadcn/ui Table sebagai base
- TypeScript generic: `DataTable<TData>` agar type-safe per penggunaan
- Filter/search TIDAK ada di DataTable — dikelola fitur masing-masing

## Desain DataTable
```
┌──────────────────────────────────────────────────────────┐
│ [□] Nama Produk    │ Harga        │ Stok   │ Aksi        │
├──────────────────────────────────────────────────────────┤
│ [□] Kopi Hitam     │ Rp 5.000     │ 100    │ [✏] [🗑]   │
│ [□] Teh Manis      │ Rp 4.000     │ 50     │ [✏] [🗑]   │
│ [□] Es Jeruk       │ Rp 6.000     │ 75     │ [✏] [🗑]   │
├──────────────────────────────────────────────────────────┤
│ Menampilkan 3 dari 100 data       [ < ] [ 1 ] [ 2 ] [ > ]│
└──────────────────────────────────────────────────────────┘
```

## Tugas Fase Ini

### File 1: `src/shared/components/DataTable/DataTable.types.ts`
```ts
export interface ColumnDef<TData> {
  key:       string
  header:    string
  cell?:     (row: TData) => React.ReactNode  // custom render
  width?:    string
  align?:    'left' | 'center' | 'right'
  sortable?: boolean
}

export interface PaginationProps {
  page:         number
  pageSize:     number
  total:        number
  onPageChange: (page: number) => void
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}

export interface RowSelectionProps<TData> {
  enabled:           boolean
  selectedKeys?:     Set<string | number>
  rowKey:            keyof TData
  onSelectionChange: (keys: Set<string | number>) => void
}

export interface SortState {
  key:   string
  order: 'asc' | 'desc'
}

export interface DataTableProps<TData> {
  columns:      ColumnDef<TData>[]
  data:         TData[]
  isLoading?:   boolean
  emptyMessage?: string
  emptyDescription?: string
  pagination?:  PaginationProps
  rowSelection?: RowSelectionProps<TData>
  onSort?:      (sort: SortState) => void
  className?:   string
}
```

### File 2: `src/shared/components/DataTable/DataTablePagination.tsx`
Komponen pagination standalone:
- Tampilkan: "Menampilkan X-Y dari Z data"
- Tombol prev/next
- Nomor halaman (max 5 nomor tampil, sisanya "...")
- Page size selector (jika `pageSizeOptions` ada)
- Disable tombol saat di halaman pertama/terakhir

### File 3: `src/shared/components/DataTable/DataTableSkeleton.tsx`
Loading state — tampilkan skeleton rows:
- Props: `columns: number, rows?: number` (default 5 rows)
- Setiap cell: animated shimmer effect via Tailwind `animate-pulse`

### File 4: `src/shared/components/DataTable/DataTableEmpty.tsx`
Empty state:
- Props: `message?: string, description?: string, action?: React.ReactNode`
- Default message: "Tidak ada data"
- Layout: centered, icon inbox dari lucide-react, teks, optional action button

### File 5: `src/shared/components/DataTable/DataTable.tsx`
Komponen utama yang menggabungkan semua:

**Fitur:**
- Render `DataTableSkeleton` saat `isLoading === true`
- Render `DataTableEmpty` saat `data.length === 0 && !isLoading`
- Header checkbox "select all" jika `rowSelection.enabled`
- Row checkbox per baris jika `rowSelection.enabled`
- Click header kolom untuk sort jika `sortable === true` (tampil icon arrow)
- Render custom cell jika `column.cell` ada, otherwise `String(row[column.key])`
- Render `DataTablePagination` di bawah tabel jika `pagination` ada
- Sticky header saat scroll

**Select all logic:**
- Checked: semua baris di halaman ini terselect
- Indeterminate: sebagian terselect
- Click: toggle semua baris di halaman ini

### File 6: `src/shared/components/DataTable/index.ts`
```ts
export { DataTable }           from './DataTable'
export { DataTablePagination } from './DataTablePagination'
export type { ColumnDef, DataTableProps, PaginationProps } from './DataTable.types'
```

## Komponen shadcn yang Dibutuhkan
```bash
npx shadcn@latest add table checkbox select
```

## Hasil yang Diharapkan
- DataTable bisa dipakai dengan:
```tsx
<DataTable
  columns={[
    { key: 'name', header: 'Nama', sortable: true },
    { key: 'price', header: 'Harga', cell: (row) => formatRupiah(row.price) },
    { key: 'actions', header: 'Aksi', cell: (row) => <ActionButtons id={row.id} /> },
  ]}
  data={products}
  isLoading={isLoading}
  pagination={{ page, pageSize: 10, total, onPageChange: setPage }}
  rowSelection={{ enabled: true, rowKey: 'id', onSelectionChange: setSelected }}
/>
```
- Loading state tampil saat `isLoading`
- Empty state tampil saat data kosong
- Pagination berfungsi
- TypeScript generic berjalan — tidak ada `any`
