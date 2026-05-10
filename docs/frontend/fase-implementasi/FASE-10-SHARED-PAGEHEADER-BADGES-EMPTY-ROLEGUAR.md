# FASE 10 — Shared Components: PageHeader, StatusBadge, EmptyState, RoleGuard, LoadingSpinner

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 0-9 sudah selesai: DataTable, FormModal, ConfirmDialog sudah ada.

## Standar Wajib
- Semua komponen ini LAPISAN 2 — tidak ada API call, tidak ada store
- RoleGuard boleh akses `useAuth()` karena itu shared hook, bukan fitur store
- Konsisten dalam naming dan props pattern

## Tugas Fase Ini

### File 1: `src/shared/components/PageHeader/PageHeader.tsx`
Header standar untuk setiap halaman setelah login.

**Props:**
```ts
interface PageHeaderProps {
  title:        string
  description?: string
  breadcrumbs?: Array<{ label: string; path?: string }>
  actions?:     React.ReactNode
}
```

**Tampilan:**
```
Produk                              [+ Tambah Produk]
Inventori > Produk
```

**Detail:**
- Title: font bold, ukuran besar
- Description: teks kecil, muted, opsional
- Breadcrumb: teks kecil, item clickable punya `path`, separator ">"
- Actions: slot kanan untuk tombol-tombol
- Border bawah tipis, margin bawah sebelum konten
- Responsive: actions pindah ke baris baru di layar kecil

### File 2: `src/shared/components/StatusBadge/StatusBadge.tsx`
Badge status yang konsisten di seluruh aplikasi.

**Props:**
```ts
type StatusType =
  | 'active'    | 'inactive'
  | 'pending'   | 'processing'
  | 'paid'      | 'unpaid'      | 'partial'
  | 'open'      | 'closed'
  | 'synced'    | 'unsynced'    | 'conflict'
  | 'success'   | 'error'       | 'warning'

interface StatusBadgeProps {
  status:  StatusType
  label?:  string   // override label default
  size?:   'sm' | 'md'
}
```

**Mapping status → warna & label default:**
```
active     → hijau    "Aktif"
inactive   → abu      "Nonaktif"
pending    → kuning   "Pending"
processing → biru     "Diproses"
paid       → hijau    "Lunas"
unpaid     → merah    "Belum Lunas"
partial    → oranye   "Sebagian"
open       → biru     "Buka"
closed     → abu      "Tutup"
synced     → hijau    "Tersinkron"
unsynced   → kuning   "Belum Sync"
conflict   → merah    "Konflik"
success    → hijau    "Berhasil"
error      → merah    "Error"
warning    → kuning   "Peringatan"
```

### File 3: `src/shared/components/EmptyState/EmptyState.tsx`
Tampilan saat data kosong.

**Props:**
```ts
interface EmptyStateProps {
  title?:       string           // default: "Tidak ada data"
  description?: string
  action?:      React.ReactNode
  icon?:        React.ReactNode  // override icon default
}
```

**Default icon:** `Inbox` dari lucide-react
**Layout:** centered, flex column, gap, muted colors

### File 4: `src/shared/components/RoleGuard/RoleGuard.tsx`
Wrapper untuk conditional render berdasarkan role — untuk elemen DI DALAM halaman (bukan route guard).

**Props:**
```ts
interface RoleGuardProps {
  allowedRoles: Role[]
  children:     React.ReactNode
  fallback?:    React.ReactNode  // apa yang ditampilkan jika tidak punya akses
}
```

**Logic:** Ambil `user` dari `useAuth()`. Jika `user.role` ada di `allowedRoles` → render `children`. Jika tidak → render `fallback` (default: null).

**Contoh:**
```tsx
<RoleGuard allowedRoles={[ROLES.OWNER]}>
  <Button variant="destructive">Hapus</Button>
</RoleGuard>
```

### File 5: `src/shared/components/LoadingSpinner/LoadingSpinner.tsx`
```ts
interface LoadingSpinnerProps {
  size?:  'sm' | 'md' | 'lg'
  label?: string   // teks di bawah spinner, opsional
}
```
- Animasi: `animate-spin` Tailwind
- Icon: `Loader2` dari lucide-react
- Size: sm=16px, md=24px, lg=40px

### File 6: `src/shared/components/PageLoader/PageLoader.tsx`
Full page loading saat fetch data pertama kali:
- Centered di dalam konten area
- Spinner ukuran lg + teks "Memuat..."
- Bukan full screen overlay — hanya mengisi area konten

### File 7: Update `src/shared/components/index.ts`
Re-export semua shared components:
```ts
export { DataTable }      from './DataTable'
export { FormModal }      from './FormModal'
export { ConfirmDialog }  from './ConfirmDialog'
export { PageHeader }     from './PageHeader'
export { StatusBadge }    from './StatusBadge'
export { EmptyState }     from './EmptyState'
export { RoleGuard }      from './RoleGuard'
export { LoadingSpinner }  from './LoadingSpinner'
export { PageLoader }     from './PageLoader'
export * from './layouts'
```

## Hasil yang Diharapkan
- Semua komponen bisa diimport dari `@/shared/components`
- `StatusBadge` menampilkan warna dan label yang benar untuk setiap status
- `RoleGuard` menyembunyikan konten untuk role yang tidak sesuai
- `PageHeader` konsisten di semua halaman
- TypeScript tidak ada error
