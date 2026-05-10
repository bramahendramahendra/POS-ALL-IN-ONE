# FASE 5 — Auth: ProtectedRoute + Router + App Bootstrap

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 0-4 sudah selesai: setup, foundation, auth store, auth api, LoginPage sudah ada.

## Standar Wajib
- Route guard dilakukan SATU KALI di level router — tidak ditulis ulang di setiap Page
- ProtectedRoute verifikasi: `isAuthenticated` + `user.apps === 'web'` + `allowedRoles`
- Kalau belum login → redirect `/login`
- Kalau platform bukan web → redirect `/login`
- Kalau role tidak sesuai → redirect `/dashboard`
- Semua route protected dibungkus AppLayout (belum ada di fase ini — gunakan placeholder)
- QueryClient setup: staleTime 5 menit, retry 1x, refetchOnWindowFocus false

## Tugas Fase Ini

### File 1: `src/features/auth/components/ProtectedRoute.tsx`
```tsx
interface ProtectedRouteProps {
  allowedRoles: Role[]
}
```
Logic:
1. Ambil `isAuthenticated` dan `user` dari `useAuthStore`
2. Kalau tidak authenticated → `<Navigate to="/login" replace />`
3. Kalau `user.apps !== 'web'` → `<Navigate to="/login" replace />`
4. Kalau role tidak ada di `allowedRoles` → `<Navigate to="/dashboard" replace />`
5. Kalau lolos → render `<Outlet />` (dibungkus AppLayout di fase berikutnya)

Untuk sementara di fase ini, render `<Outlet />` saja tanpa AppLayout.

### File 2: `src/features/auth/components/RootRedirect.tsx`
Komponen yang redirect ke halaman yang tepat berdasarkan role:
- Tidak authenticated → `/login`
- Role `kasir` → `/kasir`
- Role lain → `/dashboard`

### File 3: `src/app/router.tsx`
React Router v6 dengan `createBrowserRouter`:

**Public routes:**
- `/login` → `<LoginPage />`

**Protected — semua role (owner, admin, kasir):**
- `/kasir` → placeholder `<div>Kasir Page (coming soon)</div>`

**Protected — owner & admin:**
- `/dashboard` → placeholder
- `/products` → placeholder
- `/suppliers` → placeholder
- `/transactions` → placeholder
- `/customers` → placeholder
- `/receivables` → placeholder
- `/finance` → placeholder
- `/reports` → placeholder
- `/shifts` → placeholder
- `/settings` → placeholder (hanya owner)
- `/sync` → placeholder

**Root:**
- `/` → `<RootRedirect />`

**404:**
- `*` → redirect ke `/`

Gunakan `ROUTES` constant dari `@/shared/constants/routes`.
Gunakan `ROLES` constant dari `@/shared/constants/roles`.

### File 4: `src/app/providers.tsx`
Wrap semua global providers:
```tsx
// QueryClient config:
// - staleTime: 5 * 60 * 1000 (5 menit)
// - retry: 1
// - refetchOnWindowFocus: false
// - throwOnError: false

// Render:
// <QueryClientProvider client={queryClient}>
//   <RouterProvider router={router} />
//   <Toaster position="top-right" richColors closeButton duration={4000} />
// </QueryClientProvider>
```

Import `Toaster` dari `sonner`.
Import `router` dari `@/app/router`.

### File 5: `src/app/App.tsx`
Simpel — hanya render `<Providers />`:
```tsx
import { Providers } from './providers'
export const App = () => <Providers />
```

### File 6: `src/app/main.tsx`
Entry point:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import '@/styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Catatan:** Pastikan `src/main.tsx` asli diganti dengan ini (atau update isinya).

### Update File 7: `src/features/auth/index.ts`
Tambahkan export:
```ts
export { ProtectedRoute } from './components/ProtectedRoute'
export { RootRedirect }   from './components/RootRedirect'
```

## Hasil yang Diharapkan
- `npm run dev` → buka browser → otomatis redirect ke `/login`
- Halaman login tampil dengan benar
- Login berhasil → redirect ke `/dashboard` (placeholder) atau `/kasir` tergantung role
- Akses `/dashboard` tanpa login → redirect ke `/login`
- Akses `/kasir` sebagai `admin` → redirect ke `/dashboard`
- TypeScript tidak ada error
- Toast "Login berhasil" atau error muncul dengan benar
