# FASE 28 — Shifts

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 27 sudah selesai: Reports selesai.

## Backend Endpoints
```
GET  /shifts              → list shift (pagination, filter: date_from, date_to, status)
GET  /shifts/active       → shift yang sedang berjalan
POST /shifts/open         → buka shift baru
POST /shifts/:id/close    → tutup shift
GET  /shifts/:id          → detail shift
```

## Konteks Bisnis
- Kasir harus buka shift sebelum bisa transaksi
- Satu shift = satu sesi kerja (pagi/siang/malam)
- Saat tutup shift: hitung total transaksi selama shift, modal awal vs akhir
- Di halaman Kasir sudah ada validasi shift aktif (FASE 19)

## Tugas Fase Ini

### File 1: `src/features/shifts/shifts.types.ts`
```ts
export type ShiftStatus = 'open' | 'closed'

export interface Shift {
  id:                  number
  kasir_id:            number
  kasir_name:          string
  opening_balance:     number
  closing_balance?:    number
  total_transactions:  number
  total_revenue:       number
  status:              ShiftStatus
  notes?:              string
  opened_at:           string
  closed_at?:          string
}

export interface ShiftFilter {
  date_from?:  string
  date_to?:    string
  status?:     ShiftStatus | ''
  page?:       number
  page_size?:  number
}

export interface OpenShiftPayload {
  opening_balance: number
  notes?:          string
}

export interface CloseShiftPayload {
  closing_balance: number
  notes?:          string
}
```

### File 2: `src/features/shifts/shifts.api.ts`
- `useShiftListQuery(filter?)` → `PaginatedResponse<Shift>`
- `useActiveShiftQuery()` → `Shift | null` (queryKey: `queryKeys.shifts.active()`)
- `useShiftDetailQuery(id)` → `Shift`
- `useOpenShiftMutation()` → onSuccess: invalidate `queryKeys.shifts.all()` + active
- `useCloseShiftMutation()` → onSuccess: invalidate `queryKeys.shifts.all()` + active

### File 3: `src/features/shifts/components/ShiftTable.tsx`
Kolom: Kasir, Buka Shift (waktu), Tutup Shift, Modal Awal, Modal Akhir, Total Transaksi, Revenue, Status.
Aksi: tombol "Detail" untuk lihat ringkasan shift.

### File 4: `src/features/shifts/components/OpenShiftModal.tsx`
Modal buka shift:
```ts
const openShiftSchema = z.object({
  opening_balance: z.number().min(0, 'Modal awal tidak boleh negatif'),
  notes: z.string().optional(),
})
```
- Label: "Modal Awal (uang di laci kasir)"
- Input nominal dengan format Rupiah

### File 5: `src/features/shifts/components/CloseShiftModal.tsx`
Modal tutup shift:
```ts
const closeShiftSchema = z.object({
  closing_balance: z.number().min(0, 'Uang akhir tidak boleh negatif'),
  notes: z.string().optional(),
})
```
Tampilkan ringkasan shift yang akan ditutup:
- Total transaksi selama shift
- Total pendapatan
- Modal awal
- Input modal akhir (uang fisik di laci)
- Selisih: modal_akhir - (modal_awal + revenue) — tampil merah jika negatif

### File 6: `src/features/shifts/ShiftsPage.tsx`
- PageHeader: "Manajemen Shift"
- Banner shift aktif (jika ada): "Shift sedang berjalan sejak [waktu] — [Tutup Shift]"
- Tombol "Buka Shift" (jika tidak ada shift aktif, hanya owner/admin)
- Filter: date range + status
- ShiftTable dengan pagination
- OpenShiftModal + CloseShiftModal

### File 7: `src/features/shifts/index.ts`
```ts
export { ShiftsPage }        from './ShiftsPage'
export { useActiveShiftQuery } from './shifts.api'
```
`useActiveShiftQuery` di-export karena dipakai di cashier.api.ts.

### Update Router
Ganti placeholder `/shifts` dengan `<ShiftsPage />`.

## Hasil yang Diharapkan
- List shift dengan filter berfungsi
- Banner shift aktif muncul jika ada shift berjalan
- Buka shift: isi modal awal → shift terbuka
- Tutup shift: tampil ringkasan → isi modal akhir → shift tertutup
- TypeScript tidak ada error
