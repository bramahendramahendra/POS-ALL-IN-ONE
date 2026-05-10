# Topik 3 — Auth Strategy

> Hasil diskusi strategi autentikasi frontend web-v2 POS System.
> Dokumen ini menjadi **standar penulisan** yang wajib diikuti seluruh pengembangan frontend ke depan.

---

## Konteks: Apa yang Ada di Backend

### JWT Claims (setelah backend diupdate)

```go
claims := map[string]any{
    "user_id":   user.ID,
    "username":  user.Username,
    "role":      user.Role,
    "full_name": user.FullName,  // ← ditambahkan
    "apps":      "web",          // ← ditambahkan, nilai: "web" | "desktop" | "android"
}
```

### Endpoint Auth yang Tersedia

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/login` | Login, kembalikan token + user data |
| POST | `/api/auth/logout` | Logout, hapus session di backend |
| POST | `/api/auth/refresh` | Refresh token dengan refresh_token |
| GET  | `/api/auth/me` | Ambil data user dari token (via middleware) |

### Login Request

```ts
{
  username:    string   // kredensial
  password:    string   // kredensial
  device_info: 'web'   // platform identifier — selalu 'web' untuk web app
}
```

### Login Response

```ts
{
  token:         string    // access token (JWT)
  refresh_token: string    // refresh token (random hex 32 byte)
  expires_at:    string    // waktu expired token
  user: {
    id:        number
    username:  string
    full_name: string
    role:      'owner' | 'admin' | 'kasir'
  }
}
```

---

## 3A — Struktur Auth Store

Auth store adalah **satu-satunya sumber kebenaran** untuk data user dan token di frontend.
Tidak ada komponen atau hook yang boleh membaca `localStorage` secara langsung.

### Interface

```ts
// auth.types.ts
export type Role     = 'owner' | 'admin' | 'kasir'
export type Platform = 'web' | 'desktop' | 'android'

export interface AuthUser {
  id:       number
  username: string
  fullName: string
  role:     Role
  apps:     Platform
}

export interface AuthState {
  // Token
  accessToken:  string | null
  refreshToken: string | null
  expiresAt:    string | null

  // User — untuk kebutuhan UI (navbar, route guard, conditional render)
  user: AuthUser | null

  // Computed
  isAuthenticated: boolean

  // Actions
  setSession: (session: SetSessionPayload) => void
  clearSession: () => void
}
```

### Implementasi Store

```ts
// auth.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, AuthUser } from './auth.types'

interface SetSessionPayload {
  accessToken:  string
  refreshToken: string
  expiresAt:    string
  user:         AuthUser
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken:     null,
      refreshToken:    null,
      expiresAt:       null,
      user:            null,
      isAuthenticated: false,

      setSession: (payload) =>
        set({
          accessToken:     payload.accessToken,
          refreshToken:    payload.refreshToken,
          expiresAt:       payload.expiresAt,
          user:            payload.user,
          isAuthenticated: true,
        }),

      clearSession: () =>
        set({
          accessToken:     null,
          refreshToken:    null,
          expiresAt:       null,
          user:            null,
          isAuthenticated: false,
        }),
    }),
    { name: 'auth-session' } // key di localStorage
  )
)
```

### Aturan Akses User Data

```ts
// ✅ Benar — baca dari store
const user = useAuthStore((state) => state.user)
const role = useAuthStore((state) => state.user?.role)

// ❌ Salah — akses localStorage langsung
const user = JSON.parse(localStorage.getItem('user') ?? '{}')
const token = localStorage.getItem('access_token')
```

### Data User: Untuk UI Saja, Tidak Dikirim ke API

```ts
// ✅ Token di header — backend extract user_id, role, dll dari JWT
await apiClient.get('/transactions')
// Header: Authorization: Bearer eyJhbGci...

// ❌ Jangan kirim user data di body
await apiClient.post('/transactions', {
  user_id: user.id,    // tidak perlu
  role: user.role,     // tidak perlu
  items: [...]
})
```

Satu-satunya waktu user data dikirim ke backend adalah saat **login** (username, password, device_info).
Setelah itu, semua identitas user dibaca backend dari JWT token secara otomatis.

---

## 3B — Route Protection: ProtectedRoute Component

Guard route dilakukan **satu kali di level router**, bukan ditulis ulang di setiap Page component.

### Struktur Route

```tsx
// app/router.tsx
import { ProtectedRoute } from '@/features/auth'

const router = createBrowserRouter([
  // Public
  { path: '/login', element: <LoginPage /> },

  // Semua role yang sudah login
  {
    element: <ProtectedRoute allowedRoles={['owner', 'admin', 'kasir']} />,
    children: [
      { path: '/kasir', element: <CashierPage /> },
    ],
  },

  // Hanya owner & admin
  {
    element: <ProtectedRoute allowedRoles={['owner', 'admin']} />,
    children: [
      { path: '/dashboard',    element: <DashboardPage /> },
      { path: '/products',     element: <ProductsPage /> },
      { path: '/transactions', element: <TransactionsPage /> },
      { path: '/customers',    element: <CustomersPage /> },
      { path: '/suppliers',    element: <SuppliersPage /> },
      { path: '/finance',      element: <FinancePage /> },
      { path: '/receivables',  element: <ReceivablesPage /> },
      { path: '/reports',      element: <ReportsPage /> },
      { path: '/shifts',       element: <ShiftsPage /> },
      { path: '/settings',     element: <SettingsPage /> },
      { path: '/sync',         element: <SyncCenterPage /> },
    ],
  },

  // Redirect default berdasarkan role
  { path: '/', element: <RootRedirect /> },
])
```

### Implementasi ProtectedRoute

```tsx
// features/auth/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../auth.store'
import { AppLayout } from '@/shared/components/layouts/AppLayout'
import type { Role } from '../auth.types'

interface Props {
  allowedRoles: Role[]
}

export const ProtectedRoute = ({ allowedRoles }: Props) => {
  const { isAuthenticated, user } = useAuthStore()

  // Belum login → ke halaman login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Platform bukan web → tolak (token bukan untuk web app)
  if (user.apps !== 'web') {
    return <Navigate to="/login" replace />
  }

  // Role tidak sesuai → ke dashboard (bukan unauthorized page)
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
```

### RootRedirect — Arahkan Berdasarkan Role

```tsx
// features/auth/components/RootRedirect.tsx
export const RootRedirect = () => {
  const user = useAuthStore((state) => state.user)

  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'kasir') return <Navigate to="/kasir" replace />
  return <Navigate to="/dashboard" replace />
}
```

---

## 3C — Token Refresh: Axios Interceptor

Refresh token dihandle **sepenuhnya di Axios interceptor** — tidak ada logic refresh di component atau hook manapun.

### Flow

```
Request keluar
  └─→ Request interceptor: pasang Authorization header otomatis

Response masuk status 401
  └─→ Response interceptor: coba POST /auth/refresh
        ├─→ Berhasil:
        │     simpan token baru ke auth store
        │     retry request asal dengan token baru
        └─→ Gagal:
              clear auth store (clearSession)
              redirect ke /login
```

### Implementasi

```ts
// services/api.client.ts
import axios from 'axios'
import { useAuthStore } from '@/features/auth/auth.store'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// REQUEST INTERCEPTOR — pasang token otomatis
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// RESPONSE INTERCEPTOR — handle 401 + refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Ada refresh yang sedang berjalan — antri request ini
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const { refreshToken, setSession, clearSession } = useAuthStore.getState()

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        { refresh_token: refreshToken }
      )

      const newToken = data.data.token
      const newRefreshToken = data.data.refresh_token
      const newExpiresAt = data.data.expires_at

      // Simpan token baru ke store (dan otomatis ke localStorage via persist)
      setSession({
        accessToken:  newToken,
        refreshToken: newRefreshToken,
        expiresAt:    newExpiresAt,
        user:         useAuthStore.getState().user!, // user tidak berubah saat refresh
      })

      processQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return apiClient(originalRequest)

    } catch (refreshError) {
      processQueue(refreshError, null)
      clearSession()
      window.location.href = '/login'
      return Promise.reject(refreshError)

    } finally {
      isRefreshing = false
    }
  }
)

export default apiClient
```

### Kenapa Pakai Queue?

Kalau ada 5 request bersamaan dan semua dapat 401, tanpa queue semua akan coba refresh token sekaligus — menghasilkan 5 refresh request yang race condition. Dengan queue, hanya **1 refresh** yang berjalan, sisanya menunggu dan pakai token hasil refresh yang sama.

---

## 3D — Role & Permission

### Role yang Ada Saat Ini

| Role | Akses |
|---|---|
| `owner` | Semua halaman dan fitur |
| `admin` | Semua halaman kecuali beberapa setting sensitif |
| `kasir` | Hanya halaman kasir |

### Pola Pengecekan Role

```ts
// Di ProtectedRoute — sudah otomatis via allowedRoles
// Di komponen — pakai hook
const user = useAuthStore((state) => state.user)

// Tampilkan tombol hapus hanya untuk owner
{user?.role === 'owner' && <DeleteButton />}

// Sembunyikan menu settings untuk kasir
{user?.role !== 'kasir' && <SettingsMenu />}
```

### Aturan

```
✅ Role check di router → pakai ProtectedRoute allowedRoles
✅ Role check di UI     → baca dari useAuthStore
❌ Jangan hardcode role string di luar constants/roles.ts
```

```ts
// shared/constants/roles.ts
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  KASIR: 'kasir',
} as const
```

---

## 3E — Login Flow Lengkap

```
1. User isi form (username, password)
2. POST /api/auth/login → { username, password, device_info: 'web' }
3. Backend return { token, refresh_token, expires_at, user }
4. Frontend:
   a. Decode token → verifikasi apps === 'web'
   b. Simpan ke auth store via setSession()
      (Zustand persist otomatis tulis ke localStorage)
   c. Redirect berdasarkan role:
      - kasir  → /kasir
      - lainnya → /dashboard

5. Setiap request berikutnya:
   a. Axios interceptor pasang Authorization: Bearer <token>
   b. Backend baca user_id, role, dll dari JWT — tidak perlu dikirim di body

6. Token expired (401):
   a. Interceptor POST /auth/refresh → { refresh_token }
   b. Berhasil → update store, retry request asal
   c. Gagal    → clearSession(), redirect /login

7. Logout:
   a. POST /api/auth/logout (token di header)
   b. clearSession() → hapus dari store + localStorage
   c. Redirect /login
```

---

## Ringkasan Keputusan Topik 3

| Sub-topik | Keputusan |
|---|---|
| **3A** JWT Claims | `user_id`, `username`, `role`, `full_name`, `apps` |
| **3A** Auth store | Simpan: accessToken, refreshToken, expiresAt, user (id, username, fullName, role, apps), isAuthenticated |
| **3A** Akses token | Hanya via `useAuthStore` — tidak ada akses localStorage langsung |
| **3A** User data di request | TIDAK dikirim di body — backend baca dari JWT |
| **3B** Route guard | ProtectedRoute di router — satu definisi, semua halaman terlindungi |
| **3B** Platform check | ProtectedRoute verifikasi `user.apps === 'web'` |
| **3B** Role tidak sesuai | Redirect ke `/dashboard`, bukan halaman error |
| **3C** Token refresh | Axios response interceptor dengan queue (mencegah race condition) |
| **3C** Refresh gagal | clearSession() + redirect `/login` |
| **3D** Role saat ini | `owner`, `admin`, `kasir` — simpan di `shared/constants/roles.ts` |
| **3E** device_info login | Selalu kirim `'web'` — sesuai platform |
