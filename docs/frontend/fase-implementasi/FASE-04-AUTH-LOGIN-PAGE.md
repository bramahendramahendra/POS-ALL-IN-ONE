# FASE 4 — Auth: LoginPage + LoginForm

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 0-3 sudah selesai: setup, API client, utils, constants, auth store + types + api sudah ada.

## Standar Wajib
- Validasi form pakai React Hook Form + Zod
- Error validasi tampil inline di bawah field (bukan toast)
- Error dari API tampil via `toast.error()`
- Tombol submit disabled + loading state saat request berlangsung
- Tidak ada `useState` untuk field form
- Styling pakai Tailwind CSS
- Komponen shadcn/ui yang dipakai: `Button`, `Input`, `Label`, `Card`

## Desain Halaman Login
Layout centered — kartu login di tengah layar:
```
┌─────────────────────────────────┐
│         [Logo / App Name]        │
│         POS System               │
│                                  │
│  ┌───────────────────────────┐  │
│  │  Username                  │  │
│  │  [________________]       │  │
│  │                            │  │
│  │  Password                  │  │
│  │  [________________] 👁    │  │
│  │                            │  │
│  │  [    Masuk    ]           │  │
│  └───────────────────────────┘  │
│                                  │
│  v1.0.0 · POS System             │
└─────────────────────────────────┘
```
Background: `var(--color-primary)` (#2c3e50) — gelap
Kartu: putih, shadow, border radius medium

## Tugas Fase Ini

### File 1: `src/features/auth/components/LoginForm.tsx`
Form login dengan:

**Zod Schema:**
```ts
const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})
```

**Fitur:**
- Field username (type text, autocomplete username)
- Field password dengan toggle show/hide password (icon Eye/EyeOff dari lucide-react)
- Tombol "Masuk" — disabled dan tampil spinner saat `isPending`
- Error field tampil di bawah input dengan warna merah
- Enter di field username → focus ke password
- Enter di field password → submit form
- Saat submit: panggil `useLoginMutation` dari `auth.api.ts`

**Props:** tidak ada (semua logic ada di dalam)

### File 2: `src/features/auth/LoginPage.tsx`
Halaman login lengkap:
- Redirect ke `/dashboard` kalau sudah `isAuthenticated` (pakai `useAuth`)
- Layout: full screen, background primary color
- Center content: logo/nama app, kartu form, versi app di bawah
- Render `<LoginForm />`
- Versi app dari `config.appName`

### Update File 3: `src/features/auth/index.ts`
Tambahkan export:
```ts
export { LoginPage } from './LoginPage'
```

## Komponen shadcn yang Dibutuhkan
Pastikan sudah di-generate:
```bash
npx shadcn@latest add button input label card form
```

## Detail UI yang Harus Diperhatikan
- Warna background halaman login: `bg-[#2c3e50]` (sama dengan sidebar/navbar)
- Kartu login: `bg-white rounded-xl shadow-lg p-8 w-full max-w-sm`
- Nama app di atas kartu: warna putih, font bold, ukuran besar
- Subtitle: "Masuk ke akun Anda" — warna muted putih
- Footer: versi + nama app — kecil, muted, centered
- Loading spinner di tombol: ganti teks "Masuk" dengan spinner + "Memproses..."

## Hasil yang Diharapkan
- Halaman login bisa dirender (belum perlu routing — cukup render langsung di App.tsx untuk test)
- Form validasi berjalan: klik submit tanpa isi → error muncul inline
- Toggle password berfungsi
- TypeScript tidak ada error
- Tampilan rapi sesuai desain
