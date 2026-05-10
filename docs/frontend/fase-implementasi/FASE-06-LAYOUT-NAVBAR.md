# FASE 6 — Layout: AppLayout + Navbar

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 0-5 sudah selesai: setup, foundation, auth lengkap, router sudah berjalan.
Saat ini ProtectedRoute render `<Outlet />` tanpa layout — fase ini menambahkan AppLayout.

## Standar Wajib
- AppLayout adalah shared component di `src/shared/components/layouts/`
- Navbar fixed di atas, tinggi `var(--navbar-height)` = 60px
- Background navbar & sidebar: `var(--color-primary)` = #2c3e50
- Tidak ada logic bisnis di AppLayout — hanya layout dan navigasi
- User data diambil dari `useAuth()` hook
- Logout dipanggil via `useLogoutMutation()`

## Desain AppLayout
```
┌──────────────────────────────────────────────────────────────┐
│ NAVBAR (fixed, h=60px, bg=#2c3e50, text=white)               │
│ [≡ Logo POS]          [🔔 Notif]  [Nama User ▾] [Logout]    │
├──────────────┬───────────────────────────────────────────────┤
│ SIDEBAR      │ CONTENT AREA                                  │
│ (fixed,      │ (scroll, padding, background #f5f6fa)         │
│  w=220px,    │                                               │
│  bg=#2c3e50) │  <Outlet />                                   │
│              │                                               │
│ [menu items] │                                               │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

## Tugas Fase Ini

### File 1: `src/shared/components/layouts/Navbar.tsx`
Komponen navbar fixed atas:

**Kiri:**
- Icon hamburger (untuk toggle sidebar di mobile — implementasi dasar dulu)
- Nama aplikasi: "POS System" (dari `config.appName`)

**Kanan:**
- Icon bell notifikasi (placeholder — fungsional di FASE 33)
- Info user: avatar lingkaran dengan inisial nama, nama lengkap, badge role
- Tombol logout: icon `LogOut` dari lucide-react

**Detail:**
- Nama user dari `useAuth().user?.fullName`
- Role badge: `owner` → kuning, `admin` → biru, `kasir` → hijau
- Klik logout → panggil `useLogoutMutation().mutate()`
- Konfirmasi logout: gunakan browser `confirm()` untuk sekarang (ConfirmDialog dibuat di FASE 9)
- Height: 60px, position: fixed, z-index: 1000, full width
- Box shadow bawah ringan

### File 2: `src/shared/components/layouts/AppLayout.tsx`
Wrapper layout utama:
```tsx
export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div style={{ marginTop: 'var(--navbar-height)', display: 'flex' }}>
        {/* Sidebar akan ditambahkan di FASE 7 */}
        <main
          style={{ marginLeft: 'var(--sidebar-width)', flex: 1, padding: '24px', minHeight: 'calc(100vh - var(--navbar-height))' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
```

Untuk sementara sidebar adalah placeholder div dengan width 220px dan background primary.

### File 3: `src/shared/components/layouts/index.ts`
```ts
export { AppLayout } from './AppLayout'
export { Navbar }    from './Navbar'
```

### Update File 4: `src/features/auth/components/ProtectedRoute.tsx`
Update ProtectedRoute untuk membungkus Outlet dengan AppLayout:
```tsx
import { AppLayout } from '@/shared/components/layouts'

// ...setelah semua guard lolos:
return (
  <AppLayout>
    <Outlet />
  </AppLayout>
)
```

## Komponen shadcn yang Dibutuhkan
```bash
npx shadcn@latest add avatar dropdown-menu badge
```

## Detail Styling
- Navbar background: `#2c3e50`, text: `white`
- Avatar: lingkaran 36px, background `#3498db`, text putih, font semibold
- Role badge warna:
  - `owner` → `bg-yellow-500 text-white`
  - `admin` → `bg-blue-500 text-white`
  - `kasir` → `bg-green-500 text-white`
- Tombol logout: ghost style, text putih, hover merah muda
- Sidebar placeholder: `width: 220px, background: #2c3e50, position: fixed, top: 60px, bottom: 0`

## Hasil yang Diharapkan
- Login berhasil → halaman dashboard (placeholder) tampil dengan navbar di atas
- Navbar menampilkan nama user dan role dengan benar
- Tombol logout berfungsi — klik → konfirmasi → logout → redirect `/login`
- Konten halaman sudah punya margin kiri (space untuk sidebar)
- TypeScript tidak ada error
