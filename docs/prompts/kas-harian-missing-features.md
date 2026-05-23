# Prompt: Implementasi Fitur Kas Harian yang Kurang di web-v2

## Konteks Proyek

Kamu adalah senior developer yang bekerja pada aplikasi POS Retail bernama **web-v2**.

- Stack: React + TypeScript + Vite, TanStack Query, Zustand, shadcn/ui, Tailwind CSS, sonner (toast), zod + react-hook-form
- web-v2 **wajib online** — tidak ada mode offline
- Backend: Go + Gin + GORM, REST API
- Sebelum mulai koding, **baca konvensi kode yang ada di `web-v2/`** — ikuti pola file yang sudah ada (api.ts, types.ts, hooks, components, store)
- Jangan refactor kode di luar scope task yang disebutkan
- Jangan tambah komentar kecuali ada alasan non-obvious

---

## Referensi File yang Sudah Ada

Pelajari file-file ini sebagai acuan konvensi sebelum menulis kode:

- `web-v2/src/features/finance/cash-drawer/cash-drawer.types.ts`
- `web-v2/src/features/finance/cash-drawer/cash-drawer.api.ts`
- `web-v2/src/features/finance/cash-drawer/CashDrawerPage.tsx`
- `web-v2/src/features/finance/expenses/expenses.api.ts`
- `web-v2/src/features/finance/expenses/components/ExpenseFormModal.tsx`
- `web-v2/src/shared/constants/queryKeys.ts`
- `web-v2/src/shared/types/index.ts`

---

## Endpoint Backend yang Tersedia

Endpoint berikut sudah ada di backend (jangan buat ulang):

```
GET    /cash-drawer/current         → CurrentCashDrawer { id, status }
GET    /cash-drawer                 → PaginatedResponse<CashDrawerRecord>
GET    /cash-drawer/:id             → CashDrawerRecord
POST   /cash-drawer/open            → body: { opening_balance, shift?, notes? }
POST   /cash-drawer/:id/close       → body: { closing_balance, notes? }
GET    /expenses                    → PaginatedResponse<Expense>
POST   /expenses                    → Expense
PUT    /expenses/:id                → Expense
DELETE /expenses/:id
```

---

## Task 1 — Fix: Tutup Kas (Close Drawer)

**Masalah:** Tombol "Tutup Kas" memanggil endpoint yang salah dan tidak mengirim `closing_balance`.

**Yang harus diperbaiki di `cash-drawer.api.ts`:**

```ts
export function useCloseCashDrawerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, closing_balance, notes }: { id: number; closing_balance: number; notes?: string }) =>
      api.post<void>(`/cash-drawer/${id}/close`, { closing_balance, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cashDrawer.all() })
      toast.success('Kas berhasil ditutup')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
```

**Yang harus diperbaiki di `CashDrawerPage.tsx`:**

- Tambah state `closingBalance: number` dan `closeNotes: string`
- Modal "Tutup Kas" harus punya input:
  - Saldo Penutupan (number, required)
  - Catatan (text, optional)
- Saat submit: `closeMutation.mutate({ id: currentDrawer.id, closing_balance: closingBalance, notes: closeNotes })`
- Setelah sukses: tutup modal, reset state

---

## Task 2 — Fitur Baru: Buka Kas (Open Drawer)

**Deskripsi:** Saat kas belum aktif (`currentDrawer === null` atau `status === 'closed'`), tampilkan tombol "Buka Kas". Saat diklik, buka modal form.

**Tambah di `cash-drawer.types.ts`:**

```ts
export interface OpenCashDrawerPayload {
  opening_balance: number
  shift?: 'pagi' | 'siang' | 'malam'
  notes?: string
}
```

**Tambah di `cash-drawer.api.ts`:**

```ts
export function useOpenCashDrawerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: OpenCashDrawerPayload) => api.post<void>('/cash-drawer/open', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cashDrawer.all() })
      toast.success('Kas berhasil dibuka')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
```

**Buat komponen baru `OpenCashDrawerModal.tsx`** di folder `cash-drawer/components/`:

- Props: `open: boolean`, `onClose: () => void`
- Form fields:
  - Saldo Awal (number input, required, min 0)
  - Shift (Select: Pagi / Siang / Malam, optional)
  - Catatan (text input, optional)
- Validasi: saldo awal harus diisi (>= 0)
- Submit: panggil `useOpenCashDrawerMutation`

---

## Task 3 — Fitur Baru: Card Status Kas Aktif

**Deskripsi:** Tampilkan card di atas halaman yang menampilkan status kas saat ini secara real-time.

**Tambahkan di `CashDrawerPage.tsx`:**

- Gunakan data dari `useCashDrawerCurrentQuery()`
- Tampilkan card berisi:
  - Status: **Buka** (hijau) atau **Tutup** (abu-abu/merah)
  - Shift aktif (jika ada)
  - Tombol "Buka Kas" (jika status closed/null)
  - Tombol "Tutup Kas" (jika status open)
- Letakkan card ini di atas tab/tabel riwayat

Contoh layout card:

```
┌─────────────────────────────────────────┐
│ Status Kas Hari Ini           [Buka Kas] │
│ ● Tutup                                  │
└─────────────────────────────────────────┘

atau

┌──────────────────────────────────────────┐
│ Status Kas Hari Ini          [Tutup Kas]  │
│ ● Buka  •  Shift: Pagi                   │
└──────────────────────────────────────────┘
```

---

## Task 4 — Fitur Baru: Tab "Rekap Kas" (Owner/Admin Only)

**Deskripsi:** Tambahkan tab kedua "Rekap Kas" di halaman Kas Harian yang menampilkan ringkasan per periode.

**Tambah query di `cash-drawer.api.ts`:**

```ts
export function useCashDrawerSummaryQuery(filter?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: queryKeys.cashDrawer.summary(filter),
    queryFn: () => api.get<CashDrawerSummary>('/cash-drawer/summary', filter),
  })
}
```

**Tambah type di `cash-drawer.types.ts`:**

```ts
export interface CashDrawerSummary {
  total_opening: number
  total_closing: number
  total_expenses: number
  net: number
  records: CashDrawerRecord[]
}
```

**Tambah key di `queryKeys.ts`:**

```ts
cashDrawer: {
  all: () => ['cashDrawer'] as const,
  summary: (filter?: object) => ['cashDrawer', 'summary', filter] as const,
}
```

**Buat komponen `CashDrawerSummaryTab.tsx`** di `cash-drawer/components/`:

- Filter: date_from dan date_to (input type="date")
- Tampilkan cards ringkasan: Total Saldo Buka, Total Saldo Tutup, Total Pengeluaran, Selisih Bersih
- Tabel riwayat dengan kolom: Tanggal, Saldo Buka, Saldo Tutup, Total Pengeluaran, Selisih
- Semua angka format Rupiah: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`
- Tampilkan tab ini hanya jika role user adalah `OWNER` atau `ADMIN` (gunakan auth store yang sudah ada)

**Di `CashDrawerPage.tsx`:**

- Gunakan Tabs component (sudah ada di shadcn/ui)
- Tab 1: "Riwayat Kas" (konten tabel yang sudah ada)
- Tab 2: "Rekap Kas" (hanya untuk OWNER/ADMIN, render `<CashDrawerSummaryTab />`)

---

## Task 5 — Fix: Kolom Tabel Riwayat

**Deskripsi:** Tabel riwayat kas saat ini kurang kolom penting.

**Tabel riwayat harus memiliki kolom:**

| Tanggal | Shift | Saldo Buka | Saldo Tutup | Status | Aksi |
|---------|-------|------------|-------------|--------|------|

- **Shift**: tampilkan nilai shift jika ada, atau "—" jika tidak ada
- **Saldo Buka**: format Rupiah
- **Saldo Tutup**: format Rupiah, tampilkan "—" jika kas belum ditutup
- **Status**: badge "Buka" (hijau) / "Tutup" (abu-abu)
- **Aksi**: tombol detail (opsional, buka modal detail record)

---

## Aturan Implementasi

1. **Ikuti konvensi file yang sudah ada** — jangan ubah struktur folder
2. **Semua state management** menggunakan useState lokal untuk modal, TanStack Query untuk server state
3. **Toast notifications** gunakan `sonner` (`toast.success`, `toast.error`)
4. **Format angka Rupiah** konsisten menggunakan `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`
5. **Query invalidation** selalu gunakan `queryKeys.*` constants — jangan hardcode string
6. **Jangan gunakan `any`** — semua tipe harus eksplisit
7. **Komponen baru** letakkan di `cash-drawer/components/`, bukan langsung di page
8. **Role check** gunakan auth store yang sudah ada di web-v2 — jangan buat ulang
9. **Jangan tambah endpoint baru di backend** kecuali endpoint `/cash-drawer/summary` yang memang belum ada

---

## Urutan Pengerjaan yang Disarankan

1. Baca semua file referensi di atas
2. Update `cash-drawer.types.ts` — tambah semua type baru
3. Update `cash-drawer.api.ts` — tambah/fix semua query dan mutation
4. Update `queryKeys.ts` — tambah key baru
5. Buat `OpenCashDrawerModal.tsx`
6. Buat `CashDrawerSummaryTab.tsx`
7. Update `CashDrawerPage.tsx` — integrasikan semua komponen baru
8. Verifikasi tidak ada TypeScript error
