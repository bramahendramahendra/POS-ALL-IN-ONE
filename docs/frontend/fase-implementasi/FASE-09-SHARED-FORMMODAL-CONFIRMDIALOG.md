# FASE 9 — Shared Components: FormModal + ConfirmDialog

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 0-8 sudah selesai: DataTable sudah ada, layout lengkap, auth berjalan.

## Standar Wajib
- Komponen LAPISAN 2 — tidak ada API call, tidak ada store
- Semua logic berada di pemanggil (fitur masing-masing)
- Pakai shadcn/ui Dialog sebagai base
- Form submit via `onSubmit` prop — bukan internal
- Loading state via `isLoading` prop

## Tugas Fase Ini

### File 1: `src/shared/components/FormModal/FormModal.tsx`
Modal wrapper untuk semua form tambah/edit data di aplikasi.

**Props:**
```ts
interface FormModalProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  title:        string
  description?: string
  size?:        'sm' | 'md' | 'lg' | 'xl' | 'full'
  isLoading?:   boolean
  onSubmit?:    () => void        // panggil form.handleSubmit(onSubmit) di pemanggil
  submitLabel?: string            // default: "Simpan"
  cancelLabel?: string            // default: "Batal"
  children:     React.ReactNode
  hideFooter?:  boolean           // untuk form dengan footer custom
}
```

**Ukuran modal (max-width):**
- `sm`: 400px
- `md`: 540px (default)
- `lg`: 720px
- `xl`: 900px
- `full`: 100vw - 48px

**Fitur:**
- Header: judul + optional description + tombol X close
- Body: scrollable jika konten panjang (max-height 70vh)
- Footer: tombol "Batal" (outline) + tombol submit (primary)
- Tombol submit: disabled + spinner saat `isLoading`
- Klik backdrop → tutup modal (kecuali sedang loading)
- Escape key → tutup modal (kecuali sedang loading)
- Reset form saat modal tutup: ini tanggung jawab pemanggil via `onOpenChange`

**Contoh penggunaan:**
```tsx
<FormModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Tambah Produk"
  size="lg"
  isLoading={isPending}
  onSubmit={form.handleSubmit(onSubmit)}
>
  <ProductForm form={form} />
</FormModal>
```

### File 2: `src/shared/components/ConfirmDialog/ConfirmDialog.tsx`
Dialog konfirmasi untuk aksi destruktif atau tidak bisa dibatalkan.

**Props:**
```ts
interface ConfirmDialogProps {
  open:          boolean
  onOpenChange:  (open: boolean) => void
  title:         string
  description:   string
  confirmLabel?: string                    // default: "Ya, Lanjutkan"
  cancelLabel?:  string                    // default: "Batal"
  variant?:      'default' | 'destructive' // warna tombol confirm
  isLoading?:    boolean
  onConfirm:     () => void
}
```

**Fitur:**
- Icon peringatan (AlertTriangle dari lucide-react) di atas judul
- Variant `destructive`: tombol confirm merah
- Variant `default`: tombol confirm primary
- Tombol confirm disabled + spinner saat `isLoading`
- Tidak bisa ditutup via backdrop/escape saat `isLoading`

**Contoh penggunaan:**
```tsx
<ConfirmDialog
  open={isDeleteOpen}
  onOpenChange={setIsDeleteOpen}
  title="Hapus Produk"
  description="Produk yang dihapus tidak bisa dikembalikan. Yakin ingin melanjutkan?"
  confirmLabel="Ya, Hapus"
  variant="destructive"
  isLoading={isDeleting}
  onConfirm={handleDelete}
/>
```

### File 3: `src/shared/components/FormModal/index.ts`
```ts
export { FormModal } from './FormModal'
```

### File 4: `src/shared/components/ConfirmDialog/index.ts`
```ts
export { ConfirmDialog } from './ConfirmDialog'
```

### Update Navbar: Ganti `confirm()` dengan `ConfirmDialog`
Di `src/shared/components/layouts/Navbar.tsx`:
- Tambahkan state `logoutDialogOpen`
- Ganti `browser confirm()` dengan `<ConfirmDialog>` yang proper:
  - Title: "Keluar dari Aplikasi"
  - Description: "Anda akan keluar dari sesi ini. Lanjutkan?"
  - Confirm label: "Ya, Keluar"
  - Variant: "default"

## Komponen shadcn yang Dibutuhkan
```bash
npx shadcn@latest add dialog alert-dialog
```

## Hasil yang Diharapkan
- FormModal bisa dibuka/tutup, scroll body jika konten panjang
- Tombol submit disabled saat loading
- ConfirmDialog tampil dengan benar untuk aksi destruktif
- Logout di Navbar sekarang pakai ConfirmDialog (bukan `window.confirm`)
- TypeScript tidak ada error
