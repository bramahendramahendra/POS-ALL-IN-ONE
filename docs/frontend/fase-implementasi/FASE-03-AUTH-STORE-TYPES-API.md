# FASE 3 — Auth: Store, Types & API

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 0-2 sudah selesai: setup, API client, utils, constants, styles sudah ada.

## Backend Auth Info
- `POST /auth/login` → body: `{ username, password, device_info: 'web' }`
- `POST /auth/logout` → header: Bearer token
- `POST /auth/refresh` → body: `{ refresh_token: string }`
- `GET  /auth/me` → header: Bearer token

**JWT Claims yang ada di token:**
`user_id`, `username`, `role`, `full_name`, `apps`

**Login Response:**
```json
{
  "token": "...",
  "refresh_token": "...",
  "expires_at": "2024-01-15T10:30:00Z",
  "user": { "id": 1, "username": "admin", "full_name": "Admin", "role": "owner" }
}
```

**Role yang ada:** `owner`, `admin`, `kasir`

## Standar Wajib
- Auth store adalah SATU-SATUNYA sumber kebenaran untuk token dan user data
- Tidak ada komponen/hook yang boleh akses `localStorage` langsung
- User data TIDAK dikirim ke API — backend baca dari JWT token
- `device_info: 'web'` selalu dikirim saat login
- Zustand dengan middleware `persist` — key: `'auth-session'`

## Tugas Fase Ini

### File 1: `src/features/auth/auth.types.ts`
```ts
import type { Role, Platform } from '@/shared/types'

export interface AuthUser {
  id:       number
  username: string
  fullName: string
  role:     Role
  apps:     Platform
}

export interface AuthState {
  accessToken:     string | null
  refreshToken:    string | null
  expiresAt:       string | null
  user:            AuthUser | null
  isAuthenticated: boolean

  setSession:   (payload: SetSessionPayload) => void
  clearSession: () => void
}

export interface SetSessionPayload {
  accessToken:  string
  refreshToken: string
  expiresAt:    string
  user:         AuthUser
}

export interface LoginRequest {
  username:    string
  password:    string
  device_info: 'web'
}

export interface LoginResponse {
  token:         string
  refresh_token: string
  expires_at:    string
  user: {
    id:        number
    username:  string
    full_name: string
    role:      Role
  }
}
```

### File 2: `src/features/auth/auth.store.ts`
Zustand store dengan `persist` middleware:
- State: `accessToken`, `refreshToken`, `expiresAt`, `user`, `isAuthenticated`
- Action `setSession(payload)` → set semua field + `isAuthenticated: true`
- Action `clearSession()` → reset semua field ke null + `isAuthenticated: false`
- Persist key: `'auth-session'`
- Export: `useAuthStore`

### File 3: `src/features/auth/auth.api.ts`
TanStack Query hooks untuk auth:

**`useLoginMutation()`**
- Panggil `POST /auth/login`
- `onSuccess`: simpan ke store via `setSession()`, redirect berdasarkan role:
  - role `kasir` → `/kasir`
  - role lain → `/dashboard`
- `onError`: `toast.error(error.message)`

**`useLogoutMutation()`**
- Panggil `POST /auth/logout`
- `onSuccess`: `clearSession()`, redirect ke `/login`, `toast.success('Logout berhasil')`
- `onError`: tetap `clearSession()` dan redirect (logout paksa)

**`useGetMeQuery()`**
- Panggil `GET /auth/me`
- `enabled: isAuthenticated` — hanya fetch kalau sudah login
- `queryKey`: `queryKeys.auth.profile()`
- Dipakai untuk sync data user terbaru

### File 4: `src/features/auth/hooks/useAuth.ts`
Custom hook sebagai facade untuk auth store:
```ts
export const useAuth = () => {
  const { user, isAuthenticated, accessToken, setSession, clearSession } = useAuthStore()
  return {
    user,
    isAuthenticated,
    accessToken,
    isOwner:  user?.role === ROLES.OWNER,
    isAdmin:  user?.role === ROLES.ADMIN,
    isKasir:  user?.role === ROLES.KASIR,
    hasRole:  (roles: Role[]) => !!user && roles.includes(user.role),
    setSession,
    clearSession,
  }
}
```

### File 5: `src/features/auth/index.ts`
Public API — hanya export yang dibutuhkan fitur lain:
```ts
export { useAuthStore }    from './auth.store'
export { useAuth }         from './hooks/useAuth'
export type { AuthUser, AuthState, LoginRequest } from './auth.types'
```
Jangan export `useLoginMutation` dan `useLogoutMutation` di sini — itu internal auth feature.

## Catatan Penting
- Di `auth.api.ts`, saat handle `onSuccess` login: map `full_name` → `fullName` dan set `apps: 'web'` (karena JWT claims akan ada `apps` setelah backend update)
- `useAuthStore.getState()` (bukan hook) dipakai di `api.client.ts` untuk akses token di interceptor
- Jangan import `useAuthStore` dengan hook pattern di luar React component

## Hasil yang Diharapkan
- 5 file baru dibuat
- `useAuth()` bisa dipanggil dari komponen manapun
- `useAuthStore.getState().accessToken` bisa diakses di luar React (untuk interceptor)
- TypeScript tidak ada error
- Auth store tersimpan di localStorage dengan key `auth-session`
