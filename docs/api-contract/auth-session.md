# API Contract — Auth & Session

## Overview

Sistem autentikasi menggunakan **JWT (JSON Web Token)** dengan kebijakan **Single Active Session**:

- 1 akun hanya boleh aktif di 1 device dalam waktu yang sama
- Login di device baru akan otomatis menginvalidate session lama
- Device lama akan menerima response `401` pada request berikutnya
- Validasi token dilakukan dua lapis: signature JWT **dan** keberadaan token di tabel `sessions`

---

## Base URL

```
/api/auth
```

---

## Endpoints

### 1. POST /api/auth/login

**Deskripsi:** Login user dan generate JWT token beserta refresh token.  
**Autentikasi:** Tidak diperlukan

#### Request Body

| Field         | Type   | Required | Keterangan                              |
|---------------|--------|----------|-----------------------------------------|
| `username`    | string | Ya       | Username akun                           |
| `password`    | string | Ya       | Password akun (plain, di-hash server)   |
| `device_info` | string | Ya       | Identifikasi device: `desktop`, `web`, `android` |

```json
{
  "username": "admin",
  "password": "admin123",
  "device_info": "desktop"
}
```

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_at": "2024-01-01T10:00:00Z",
    "user": {
      "id": 1,
      "username": "admin",
      "full_name": "Administrator",
      "role": "admin"
    }
  }
}
```

#### Response Error — 401 Unauthorized

```json
{
  "code": "41",
  "status": false,
  "message": "Username atau password salah"
}
```

#### Response Error — 403 Forbidden

```json
{
  "code": "43",
  "status": false,
  "message": "Akun Anda tidak aktif"
}
```

#### Alur Login (Single Active Session)

```
1. Validasi username & password
2. Cek is_active user → jika false, return 403
3. Cek tabel sessions → apakah user_id sudah punya session aktif?
   - Jika ada → DELETE session lama (invalidate)
4. Generate JWT token (access token) + refresh token
5. INSERT session baru ke tabel sessions
6. Return token + data user
```

---

### 2. POST /api/auth/logout

**Deskripsi:** Logout user dan hapus session aktif dari database.  
**Autentikasi:** Bearer Token (wajib)

#### Request Header

```
Authorization: Bearer <token>
```

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "Logout berhasil"
}
```

#### Response Error — 401 Unauthorized

```json
{
  "code": "41",
  "status": false,
  "message": "Token tidak valid atau sudah expired"
}
```

#### Alur Logout

```
1. Ekstrak token dari header Authorization
2. Validasi JWT signature
3. Cari token di tabel sessions
4. DELETE record sessions berdasarkan token
5. Return success
```

---

### 3. POST /api/auth/refresh

**Deskripsi:** Memperbarui access token yang hampir expired menggunakan refresh token.  
**Autentikasi:** Tidak diperlukan (gunakan `refresh_token`)

#### Request Body

| Field           | Type   | Required | Keterangan            |
|-----------------|--------|----------|-----------------------|
| `refresh_token` | string | Ya       | Refresh token aktif   |

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "Token berhasil diperbarui",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_at": "2024-01-01T10:00:00Z"
  }
}
```

#### Response Error — 401 Unauthorized

```json
{
  "code": "41",
  "status": false,
  "message": "Refresh token tidak valid atau sudah expired"
}
```

#### Alur Refresh Token

```
1. Validasi refresh_token (signature + expiry)
2. Cari session berdasarkan refresh_token di tabel sessions
   - Jika tidak ditemukan → return 401 (session sudah diinvalidate)
3. Generate access token baru
4. UPDATE kolom token & expires_at di tabel sessions
5. Return token baru
```

---

### 4. GET /api/auth/me

**Deskripsi:** Mengambil data profil user yang sedang login.  
**Autentikasi:** Bearer Token (wajib)

#### Request Header

```
Authorization: Bearer <token>
```

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "username": "admin",
    "full_name": "Administrator",
    "role": "admin",
    "is_active": true
  }
}
```

#### Response Error — 401 Unauthorized

```json
{
  "code": "41",
  "status": false,
  "message": "Token tidak valid atau sudah expired"
}
```

---

## JWT Claims

Struktur payload JWT yang digunakan:

```json
{
  "user_id": 1,
  "username": "admin",
  "role": "admin",
  "device_info": "desktop",
  "exp": 1234567890,
  "iat": 1234567890
}
```

| Claim         | Type   | Keterangan                              |
|---------------|--------|-----------------------------------------|
| `user_id`     | int    | ID user dari tabel `users`              |
| `username`    | string | Username akun                           |
| `role`        | string | Role user: `admin`, `kasir`             |
| `device_info` | string | Device saat login                       |
| `exp`         | int    | Unix timestamp waktu token expired      |
| `iat`         | int    | Unix timestamp waktu token dibuat       |

---

## Aturan Single Active Session

### Validasi Setiap Request Terautentikasi

```
1. Ekstrak Bearer token dari header Authorization
2. Verifikasi JWT signature → jika invalid, return 401
3. Cek token di tabel sessions (WHERE token = ? AND is_active = 1)
   → jika tidak ditemukan: return 401 "Sesi Anda telah berakhir karena login di perangkat lain"
4. Cek is_active user → jika false, return 403
5. Inject data user ke request context → lanjut ke handler
```

### Skenario Device Lama Setelah Login di Device Baru

```
Device A (lama)        Server                  Device B (baru)
     |                    |                          |
     |                    |    POST /auth/login  ←---|
     |                    |-→ DELETE sessions[A]     |
     |                    |-→ INSERT sessions[B]  →--|
     |                    |                          |
     |-- GET /any ------→ |                          |
     |                    |-→ sessions[A] NOT FOUND  |
     |←-- 401 -----------|                          |
```

---

## Kode Response

| Code | HTTP Status | Keterangan                                            |
|------|-------------|-------------------------------------------------------|
| `00` | 200         | Berhasil                                              |
| `41` | 401         | Unauthorized — kredensial salah atau token invalid    |
| `43` | 403         | Forbidden — akun tidak aktif                          |
| `50` | 500         | Internal server error                                 |

---

## Tabel Database Terkait

### Tabel `users`

| Kolom       | Type         | Keterangan                    |
|-------------|--------------|-------------------------------|
| `id`        | INT PK       |                               |
| `username`  | VARCHAR(50)  | Unique                        |
| `password`  | VARCHAR(255) | bcrypt hash                   |
| `full_name` | VARCHAR(100) |                               |
| `role`      | ENUM         | `admin`, `kasir`              |
| `is_active` | TINYINT(1)   | 1 = aktif, 0 = nonaktif       |

### Tabel `sessions`

| Kolom           | Type         | Keterangan                              |
|-----------------|--------------|----------------------------------------|
| `id`            | INT PK       |                                         |
| `user_id`       | INT FK       | Referensi ke `users.id`                 |
| `token`         | TEXT         | Access token (JWT)                      |
| `refresh_token` | TEXT         | Refresh token                           |
| `device_info`   | VARCHAR(50)  | Identifikasi device                     |
| `expires_at`    | DATETIME     | Waktu kadaluarsa access token           |
| `is_active`     | TINYINT(1)   | 1 = aktif, 0 = invalidated              |
| `created_at`    | DATETIME     |                                         |
| `updated_at`    | DATETIME     |                                         |

> **Catatan:** 1 `user_id` hanya boleh punya **1 row** dengan `is_active = 1` di tabel `sessions`.  
> Saat login baru, semua session lama untuk `user_id` tersebut di-UPDATE `is_active = 0` sebelum INSERT session baru.
