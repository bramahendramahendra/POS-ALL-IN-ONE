# FASE 1 — Foundation: API Client & Global Types

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 0 sudah selesai: project Vite + React + TS sudah berjalan, semua dependencies terinstall, struktur folder sudah ada.

## Standar Wajib
- Semua import pakai alias `@/` (bukan relative path `../`)
- Tidak boleh ada `any` — gunakan generic type
- Semua error dari API dinormalisasi ke class `ApiError`
- Token hanya boleh dibaca dari `useAuthStore` — TIDAK dari localStorage langsung
- Axios interceptor handle: attach token, refresh 401, queue concurrent requests

## Tugas Fase Ini

### File 1: `src/shared/types/api.types.ts`
Buat global types untuk semua response dari backend Go.
Backend selalu return format:
```json
{ "status": true, "message": "...", "data": <T> }
```
Untuk list/pagination:
```json
{ "status": true, "message": "...", "data": { "data": [], "total": 0, "page": 1, "page_size": 10, "total_page": 1 } }
```

Types yang dibuat:
- `ApiResponse<T>` — wrapper response tunggal
- `PaginatedData<T>` — wrapper data list dengan pagination info
- `PaginatedResponse<T>` — ApiResponse yang datanya PaginatedData
- `ApiError` class — extends Error, punya field `statusCode` dan `message`
- `RequestParams` — query params umum: `page`, `page_size`, `search`

### File 2: `src/shared/types/common.types.ts`
Types yang dipakai lintas fitur:
- `SelectOption` — `{ label: string, value: string | number }`
- `DateRangeFilter` — `{ start_date: string, end_date: string }`
- `SortOrder` — `'asc' | 'desc'`
- `Platform` — `'web' | 'desktop' | 'android'`
- `Role` — `'owner' | 'admin' | 'kasir'`

### File 3: `src/shared/types/index.ts`
Re-export semua dari `api.types.ts` dan `common.types.ts`.

### File 4: `src/services/api.client.ts`
Axios instance lengkap dengan:

**Setup dasar:**
- `baseURL` dari `import.meta.env.VITE_API_URL`
- Default header `Content-Type: application/json`
- Timeout 30 detik

**Request interceptor:**
- Ambil `accessToken` dari `useAuthStore.getState().accessToken`
- Pasang ke header `Authorization: Bearer <token>`

**Response interceptor — sukses:**
- Unwrap `response.data.data` → kembalikan langsung data-nya
- Sehingga caller tidak perlu `.data.data` setiap kali

**Response interceptor — error:**
- Status 401 → jalankan refresh token logic
- Refresh berhasil → retry request asal dengan token baru
- Refresh gagal → `clearSession()` + redirect `/login`
- Status lain → throw `ApiError` dengan message dari backend

**Queue untuk concurrent 401:**
- Kalau sedang refresh, request 401 lain masuk queue
- Setelah refresh selesai, semua di queue di-retry sekaligus
- Ini mencegah race condition saat banyak request expired bersamaan

**Helper methods (opsional tapi disarankan):**
Export typed helper:
```ts
export const api = {
  get: <T>(url: string, params?: object) => apiClient.get<T>(url, { params }),
  post: <T>(url: string, data?: unknown) => apiClient.post<T>(url, data),
  put: <T>(url: string, data?: unknown) => apiClient.put<T>(url, data),
  patch: <T>(url: string, data?: unknown) => apiClient.patch<T>(url, data),
  delete: <T>(url: string) => apiClient.delete<T>(url),
}
```

**Catatan penting:**
- Import `useAuthStore` dari `@/features/auth/auth.store` — tapi karena auth store belum ada di fase ini, buat interface sementara atau gunakan lazy import pattern agar tidak circular dependency
- Gunakan `useAuthStore.getState()` (bukan hook) karena ini bukan React component

### File 5: `src/services/index.ts`
Re-export `api` dan `apiClient` dari `api.client.ts`.

## Aturan Tambahan
- `ApiError` class harus bisa di-instanceof check: `if (error instanceof ApiError)`
- Response interceptor sukses hanya unwrap kalau `response.data.status === true`
- Kalau `response.data.status === false`, throw `ApiError` dengan `response.data.message`
- Refresh token endpoint: `POST /auth/refresh` dengan body `{ refresh_token: string }`
- Setelah refresh, simpan token baru via `useAuthStore.getState().setSession()`

## Hasil yang Diharapkan
- 5 file baru dibuat
- TypeScript tidak ada error
- `api.get('/test')` sudah bisa dipanggil (meski belum ada server)
- Semua type tersedia via `import type { ApiResponse } from '@/shared/types'`
