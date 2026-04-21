# API Contract — User Management

## Overview

Manajemen user mencakup operasi CRUD untuk akun pengguna sistem POS. Hanya role `owner` dan `admin` yang diizinkan mengakses seluruh endpoint di modul ini.

Role yang tersedia dalam sistem:

| Role    | Keterangan                                          |
|---------|-----------------------------------------------------|
| `owner` | Pemilik toko, akses penuh termasuk manajemen admin  |
| `admin` | Administrator, dapat kelola kasir                   |
| `kasir` | Operator kasir, tidak dapat kelola user lain        |

---

## Base URL

```
/api/users
```

---

## Autentikasi

Semua endpoint memerlukan:

```
Authorization: Bearer <token>
```

Role yang diizinkan: `owner`, `admin`

Jika token tidak valid atau role tidak sesuai, server mengembalikan:

```json
{
  "code": "41",
  "status": false,
  "message": "Token tidak valid atau sudah expired"
}
```

```json
{
  "code": "43",
  "status": false,
  "message": "Anda tidak memiliki akses ke resource ini"
}
```

---

## Endpoints

### 1. GET /api/users

**Deskripsi:** Mengambil daftar semua user.  
**Auth:** Bearer Token | Role: `owner`, `admin`

#### Query Parameters

| Parameter   | Type   | Required | Keterangan                              |
|-------------|--------|----------|-----------------------------------------|
| `search`    | string | Tidak    | Filter berdasarkan nama atau username   |
| `role`      | string | Tidak    | Filter berdasarkan role: `owner`, `admin`, `kasir` |
| `is_active` | int    | Tidak    | Filter status aktif: `1` = aktif, `0` = nonaktif |

Contoh:

```
GET /api/users?search=kasir&role=kasir&is_active=1
```

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "username": "admin",
      "full_name": "Administrator",
      "role": "admin",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "username": "kasir1",
      "full_name": "Kasir Satu",
      "role": "kasir",
      "is_active": true,
      "created_at": "2024-01-02T00:00:00Z"
    }
  ]
}
```

> **Catatan:** Field `password` tidak pernah dikembalikan di response manapun.

---

### 2. GET /api/users/:id

**Deskripsi:** Mengambil detail satu user berdasarkan ID.  
**Auth:** Bearer Token | Role: `owner`, `admin`

#### Path Parameter

| Parameter | Type | Keterangan    |
|-----------|------|---------------|
| `id`      | int  | ID user       |

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
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Response Error — 404 Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "User tidak ditemukan"
}
```

---

### 3. POST /api/users

**Deskripsi:** Menambahkan user baru ke sistem.  
**Auth:** Bearer Token | Role: `owner`, `admin`

#### Request Body

| Field       | Type   | Required | Keterangan                              |
|-------------|--------|----------|-----------------------------------------|
| `username`  | string | Ya       | Min 3 karakter, alphanumeric, unik      |
| `password`  | string | Ya       | Min 6 karakter                          |
| `full_name` | string | Ya       | Nama lengkap user                       |
| `role`      | string | Ya       | Salah satu: `owner`, `admin`, `kasir`   |

```json
{
  "username": "kasir1",
  "password": "password123",
  "full_name": "Kasir Satu",
  "role": "kasir"
}
```

#### Aturan Validasi

| Field       | Aturan                                                    |
|-------------|-----------------------------------------------------------|
| `username`  | Required, unik di tabel `users`, min 3 karakter, hanya huruf/angka/underscore |
| `password`  | Required, min 6 karakter                                  |
| `full_name` | Required, tidak boleh kosong                              |
| `role`      | Required, nilai harus salah satu dari: `owner`, `admin`, `kasir` |

#### Response Sukses — 201 Created

```json
{
  "code": "21",
  "status": true,
  "message": "User berhasil ditambahkan",
  "data": {
    "id": 2
  }
}
```

#### Response Error — 422 Unprocessable Entity

```json
{
  "code": "42",
  "status": false,
  "message": "Validasi gagal",
  "errors": {
    "username": "Username sudah digunakan",
    "password": "Password minimal 6 karakter"
  }
}
```

#### Alur Tambah User

```
1. Validasi semua field request body
2. Cek duplikasi username di tabel users
   → jika sudah ada: return 422
3. Hash password menggunakan bcrypt
4. INSERT record baru ke tabel users dengan is_active = 1
5. Return id user yang baru dibuat
```

---

### 4. PUT /api/users/:id

**Deskripsi:** Mengubah data user yang sudah ada.  
**Auth:** Bearer Token | Role: `owner`, `admin`

#### Path Parameter

| Parameter | Type | Keterangan    |
|-----------|------|---------------|
| `id`      | int  | ID user       |

#### Request Body

| Field       | Type   | Required | Keterangan                                         |
|-------------|--------|----------|----------------------------------------------------|
| `full_name` | string | Ya       | Nama lengkap user                                  |
| `role`      | string | Ya       | Salah satu: `owner`, `admin`, `kasir`              |
| `password`  | string | Tidak    | Kosongkan jika tidak ingin mengganti password      |

```json
{
  "full_name": "Kasir Satu Updated",
  "role": "kasir",
  "password": "newpassword123"
}
```

#### Aturan Validasi

| Field       | Aturan                                              |
|-------------|-----------------------------------------------------|
| `full_name` | Required, tidak boleh kosong                        |
| `role`      | Required, nilai harus salah satu dari: `owner`, `admin`, `kasir` |
| `password`  | Opsional — jika diisi, minimal 6 karakter; jika kosong/null, password tidak diubah |

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "User berhasil diupdate"
}
```

#### Response Error — 404 Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "User tidak ditemukan"
}
```

#### Alur Update User

```
1. Cek apakah user dengan id tersebut ada
   → jika tidak ada: return 404
2. Validasi field request body
3. Jika password diisi dan tidak kosong:
   → hash dengan bcrypt
   → UPDATE kolom password
4. UPDATE kolom full_name dan role
5. Return success
```

---

### 5. DELETE /api/users/:id

**Deskripsi:** Menghapus user dari sistem.  
**Auth:** Bearer Token | Role: `owner`, `admin`

#### Path Parameter

| Parameter | Type | Keterangan    |
|-----------|------|---------------|
| `id`      | int  | ID user       |

#### Aturan Bisnis

- Tidak bisa menghapus akun diri sendiri (user yang sedang login)
- Tidak bisa menghapus user yang sedang memiliki session aktif di device lain

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "User berhasil dihapus"
}
```

#### Response Error — 404 Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "User tidak ditemukan"
}
```

#### Response Error — 409 Conflict

```json
{
  "code": "49",
  "status": false,
  "message": "Tidak dapat menghapus akun Anda sendiri"
}
```

```json
{
  "code": "49",
  "status": false,
  "message": "User sedang aktif di perangkat lain, tidak dapat dihapus"
}
```

#### Alur Hapus User

```
1. Cek apakah user dengan id tersebut ada
   → jika tidak ada: return 404
2. Cek apakah id target == id user yang sedang login
   → jika ya: return 409 "Tidak dapat menghapus akun Anda sendiri"
3. Cek tabel sessions: apakah user_id target memiliki session aktif (is_active = 1)?
   → jika ada: return 409 "User sedang aktif di perangkat lain"
4. DELETE record dari tabel users
5. Return success
```

---

### 6. PATCH /api/users/:id/toggle-status

**Deskripsi:** Mengaktifkan atau menonaktifkan user (toggle `is_active`).  
**Auth:** Bearer Token | Role: `owner`, `admin`

#### Path Parameter

| Parameter | Type | Keterangan    |
|-----------|------|---------------|
| `id`      | int  | ID user       |

#### Aturan Bisnis

- Jika `is_active` saat ini `true` → diubah menjadi `false` (nonaktifkan)
- Jika `is_active` saat ini `false` → diubah menjadi `true` (aktifkan)
- Tidak bisa menonaktifkan diri sendiri

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "Status user berhasil diubah",
  "data": {
    "is_active": false
  }
}
```

#### Response Error — 404 Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "User tidak ditemukan"
}
```

#### Response Error — 409 Conflict

```json
{
  "code": "49",
  "status": false,
  "message": "Tidak dapat menonaktifkan akun Anda sendiri"
}
```

#### Alur Toggle Status

```
1. Cek apakah user dengan id tersebut ada
   → jika tidak ada: return 404
2. Cek apakah id target == id user yang sedang login
   → jika ya dan action akan menonaktifkan: return 409
3. Ambil nilai is_active saat ini
4. UPDATE is_active ke nilai kebalikannya (!is_active)
5. Return is_active baru
```

---

## Kode Response

| Code | HTTP Status | Keterangan                                            |
|------|-------------|-------------------------------------------------------|
| `00` | 200         | Berhasil                                              |
| `21` | 201         | Berhasil dibuat                                       |
| `41` | 401         | Unauthorized — token tidak valid atau expired         |
| `42` | 422         | Validasi gagal                                        |
| `43` | 403         | Forbidden — role tidak diizinkan                      |
| `44` | 404         | Not Found — user tidak ditemukan                      |
| `49` | 409         | Conflict — operasi tidak diizinkan oleh aturan bisnis |
| `50` | 500         | Internal server error                                 |

---

## Tabel Database Terkait

### Tabel `users`

| Kolom        | Type         | Keterangan                              |
|--------------|--------------|-----------------------------------------|
| `id`         | INT PK AI    | Primary key, auto increment             |
| `username`   | VARCHAR(50)  | Unique, tidak boleh duplikat            |
| `password`   | VARCHAR(255) | bcrypt hash, tidak pernah dikembalikan  |
| `full_name`  | VARCHAR(100) | Nama lengkap user                       |
| `role`       | ENUM         | `owner`, `admin`, `kasir`               |
| `is_active`  | TINYINT(1)   | 1 = aktif, 0 = nonaktif, default 1      |
| `created_at` | DATETIME     | Waktu akun dibuat                       |
| `updated_at` | DATETIME     | Waktu terakhir diubah                   |

### Relasi dengan Tabel `sessions`

Tabel `sessions` digunakan untuk:
- Memeriksa apakah user sedang aktif login di device lain (sebelum DELETE)
- Validasi single active session per user

| Kolom      | Digunakan untuk                                  |
|------------|--------------------------------------------------|
| `user_id`  | Join ke `users.id`                               |
| `is_active`| Cek apakah user sedang aktif (`is_active = 1`)   |

---

## Catatan Keamanan

- Field `password` **tidak pernah** dikembalikan di response manapun
- Password di-hash dengan **bcrypt** sebelum disimpan ke database
- `username` bersifat immutable setelah user dibuat — tidak ada endpoint untuk mengubah username
- Pengecekan session aktif sebelum DELETE mencegah penghapusan user yang sedang bertransaksi
