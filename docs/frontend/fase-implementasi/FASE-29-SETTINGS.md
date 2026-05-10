# FASE 29 — Settings

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 28 sudah selesai: Shifts selesai.
Settings hanya bisa diakses oleh role `owner`.

## Backend Endpoints
```
GET  /settings/store        → profil toko
PUT  /settings/store        → update profil toko
GET  /settings/users        → list user
POST /settings/users        → tambah user
PUT  /settings/users/:id    → update user
PUT  /settings/users/:id/password → ganti password user
DELETE /settings/users/:id  → hapus user (nonaktifkan)
GET  /settings/app-versions → list versi app
```

## Tugas Fase Ini

### File 1: `src/features/settings/settings.types.ts`
```ts
export interface StoreProfile {
  name:      string
  address?:  string
  phone?:    string
  email?:    string
  logo_url?: string
  tax_default?: number   // persentase pajak default untuk kasir
}

export interface AppUser {
  id:        number
  username:  string
  full_name: string
  role:      Role
  is_active: boolean
  created_at: string
}

export interface CreateUserPayload {
  username:  string
  password:  string
  full_name: string
  role:      Role
}

export interface UpdateUserPayload {
  full_name?: string
  role?:      Role
  is_active?: boolean
}

export interface ChangePasswordPayload {
  new_password: string
}

export interface AppVersion {
  id:           number
  platform:     Platform
  version:      string
  download_url: string
  is_mandatory: boolean
  release_notes?: string
  created_at:   string
}
```

### File 2: `src/features/settings/settings.api.ts`
- `useStoreProfileQuery()` → `StoreProfile`
- `useUpdateStoreProfileMutation()` → onSuccess: invalidate store profile
- `useUserListQuery()` → `AppUser[]`
- `useCreateUserMutation()` → onSuccess: invalidate users
- `useUpdateUserMutation()` → onSuccess: invalidate users
- `useChangePasswordMutation()` → onSuccess: toast success
- `useDeleteUserMutation()` → onSuccess: invalidate users
- `useAppVersionListQuery()` → `AppVersion[]`

### File 3: `src/features/settings/components/StoreProfileForm.tsx`
Form update profil toko:
```ts
const storeSchema = z.object({
  name:        z.string().min(1, 'Nama toko wajib diisi'),
  address:     z.string().optional(),
  phone:       z.string().optional(),
  email:       z.string().email().optional().or(z.literal('')),
  tax_default: z.number().min(0).max(100).optional(),
})
```
- Prefill dari `useStoreProfileQuery()`
- Submit langsung (bukan modal) — tombol "Simpan Perubahan" di bawah form
- Catatan: pajak default ini dipakai untuk pre-fill TaxInput di halaman kasir

### File 4: `src/features/settings/components/UserManagementTab.tsx`
Tab manajemen user:
- Tabel: username, nama, role badge, status, aksi
- Tombol "Tambah User"
- Aksi per baris: Edit, Ganti Password, Nonaktifkan
- Tidak bisa hapus diri sendiri (disable tombol jika id === currentUser.id)
- Form tambah user: username, password, nama, role
- Form edit user: nama, role, status aktif
- Form ganti password: new_password + confirm_password

### File 5: `src/features/settings/components/AppVersionTab.tsx`
Tab versi aplikasi (read-only untuk sekarang):
- Tabel: platform, versi, tanggal, mandatory, download URL
- Menampilkan versi terbaru per platform
- Catatan: fitur upload versi baru adalah fitur masa depan

### File 6: `src/features/settings/SettingsPage.tsx`
- PageHeader: "Pengaturan"
- Tab: [Profil Toko] [Manajemen User] [Versi Aplikasi]
- Render komponen sesuai tab aktif

### File 7: `src/features/settings/index.ts`
```ts
export { SettingsPage } from './SettingsPage'
```

### Update Router
Ganti placeholder `/settings` dengan `<SettingsPage />`.

## Hasil yang Diharapkan
- Profil toko bisa diedit dan disimpan
- List user tampil, CRUD user berfungsi
- Ganti password user berfungsi
- Tidak bisa nonaktifkan akun sendiri
- Tab versi aplikasi menampilkan info versi
- TypeScript tidak ada error
