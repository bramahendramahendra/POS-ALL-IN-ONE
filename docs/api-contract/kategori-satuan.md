# API Contract — Kategori & Satuan

## Overview

Modul ini mencakup dua master data yang saling terkait dengan produk:

- **Kategori** — pengelompokan produk (misal: Minuman, Makanan, Rokok)
- **Satuan** — unit pengukuran produk yang digunakan pada produk dan transaksi (misal: Pcs, Dus, Karton)

Kedua resource hanya bisa diubah oleh role `owner` dan `admin`. Role `kasir` hanya bisa membaca.

---

## Base URL

```
/api/categories
/api/units
```

---

## Autentikasi

Semua endpoint memerlukan:

```
Authorization: Bearer <token>
```

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

## KATEGORI

### 1. GET /api/categories

**Deskripsi:** Mengambil daftar semua kategori.  
**Auth:** Bearer Token | Role: semua role

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Minuman",
      "description": "Produk minuman",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Makanan",
      "description": "Produk makanan",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2. POST /api/categories

**Deskripsi:** Menambahkan kategori baru.  
**Auth:** Bearer Token | Role: `owner`, `admin`

#### Request Body

| Field         | Type   | Required | Keterangan                            |
|---------------|--------|----------|---------------------------------------|
| `name`        | string | Ya       | Nama kategori, unik                   |
| `description` | string | Tidak    | Deskripsi kategori                    |

```json
{
  "name": "Minuman",
  "description": "Produk minuman"
}
```

#### Aturan Validasi

| Field         | Aturan                                          |
|---------------|-------------------------------------------------|
| `name`        | Required, unik di tabel `categories`            |
| `description` | Opsional, boleh kosong                          |

#### Response Sukses — 201 Created

```json
{
  "code": "21",
  "status": true,
  "message": "Kategori berhasil ditambahkan",
  "data": {
    "id": 1
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
    "name": "Nama kategori sudah digunakan"
  }
}
```

#### Alur Tambah Kategori

```
1. Validasi field request body
2. Cek duplikasi name di tabel categories
   → jika sudah ada: return 422
3. INSERT record baru ke tabel categories
4. Return id kategori yang baru dibuat
```

---

### 3. PUT /api/categories/:id

**Deskripsi:** Mengubah data kategori yang sudah ada.  
**Auth:** Bearer Token | Role: `owner`, `admin`

#### Path Parameter

| Parameter | Type | Keterangan      |
|-----------|------|-----------------|
| `id`      | int  | ID kategori     |

#### Request Body

| Field         | Type   | Required | Keterangan                            |
|---------------|--------|----------|---------------------------------------|
| `name`        | string | Ya       | Nama kategori baru, unik              |
| `description` | string | Tidak    | Deskripsi kategori                    |

```json
{
  "name": "Minuman Updated",
  "description": "Deskripsi diperbarui"
}
```

#### Aturan Validasi

| Field         | Aturan                                                      |
|---------------|-------------------------------------------------------------|
| `name`        | Required, unik di tabel `categories` (kecuali ID sendiri)  |
| `description` | Opsional, boleh kosong                                      |

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "Kategori berhasil diupdate"
}
```

#### Response Error — 404 Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "Kategori tidak ditemukan"
}
```

#### Alur Update Kategori

```
1. Cek apakah kategori dengan id tersebut ada
   → jika tidak ada: return 404
2. Validasi field request body
3. Cek duplikasi name (exclude ID kategori ini sendiri)
   → jika duplikat: return 422
4. UPDATE record di tabel categories
5. Return success
```

---

### 4. DELETE /api/categories/:id

**Deskripsi:** Menghapus kategori dari sistem.  
**Auth:** Bearer Token | Role: `owner`, `admin`

#### Path Parameter

| Parameter | Type | Keterangan      |
|-----------|------|-----------------|
| `id`      | int  | ID kategori     |

#### Aturan Bisnis

- Tidak bisa menghapus kategori yang masih digunakan oleh produk aktif

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "Kategori berhasil dihapus"
}
```

#### Response Error — 404 Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "Kategori tidak ditemukan"
}
```

#### Response Error — 409 Conflict

```json
{
  "code": "49",
  "status": false,
  "message": "Kategori masih digunakan oleh produk, tidak dapat dihapus"
}
```

#### Alur Hapus Kategori

```
1. Cek apakah kategori dengan id tersebut ada
   → jika tidak ada: return 404
2. Cek tabel products: apakah ada produk dengan category_id ini?
   → jika ada: return 409
3. DELETE record dari tabel categories
4. Return success
```

---

## SATUAN (UNITS)

### 1. GET /api/units

**Deskripsi:** Mengambil daftar semua satuan.  
**Auth:** Bearer Token | Role: semua role

#### Query Parameters

| Parameter   | Type | Required | Keterangan                              |
|-------------|------|----------|-----------------------------------------|
| `is_active` | int  | Tidak    | Filter status: `1` = aktif, `0` = nonaktif |

Contoh:

```
GET /api/units?is_active=1
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
      "name": "Pcs",
      "abbreviation": "pcs",
      "is_active": true
    },
    {
      "id": 2,
      "name": "Dus",
      "abbreviation": "dus",
      "is_active": true
    }
  ]
}
```

---

### 2. GET /api/units/:id

**Deskripsi:** Mengambil detail satu satuan berdasarkan ID.  
**Auth:** Bearer Token | Role: semua role

#### Path Parameter

| Parameter | Type | Keterangan    |
|-----------|------|---------------|
| `id`      | int  | ID satuan     |

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Pcs",
    "abbreviation": "pcs",
    "is_active": true
  }
}
```

#### Response Error — 404 Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "Satuan tidak ditemukan"
}
```

---

### 3. POST /api/units

**Deskripsi:** Menambahkan satuan baru.  
**Auth:** Bearer Token | Role: `owner`, `admin`

#### Request Body

| Field          | Type   | Required | Keterangan                            |
|----------------|--------|----------|---------------------------------------|
| `name`         | string | Ya       | Nama satuan, unik                     |
| `abbreviation` | string | Ya       | Singkatan satuan, unik                |

```json
{
  "name": "Karton",
  "abbreviation": "ktn"
}
```

#### Aturan Validasi

| Field          | Aturan                                          |
|----------------|-------------------------------------------------|
| `name`         | Required, unik di tabel `units`                 |
| `abbreviation` | Required, unik di tabel `units`                 |

#### Response Sukses — 201 Created

```json
{
  "code": "21",
  "status": true,
  "message": "Satuan berhasil ditambahkan",
  "data": {
    "id": 10
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
    "name": "Nama satuan sudah digunakan",
    "abbreviation": "Singkatan satuan sudah digunakan"
  }
}
```

#### Alur Tambah Satuan

```
1. Validasi field request body
2. Cek duplikasi name dan abbreviation di tabel units
   → jika salah satu duplikat: return 422
3. INSERT record baru ke tabel units dengan is_active = 1
4. Return id satuan yang baru dibuat
```

---

### 4. PUT /api/units/:id

**Deskripsi:** Mengubah data satuan yang sudah ada.  
**Auth:** Bearer Token | Role: `owner`, `admin`

#### Path Parameter

| Parameter | Type | Keterangan    |
|-----------|------|---------------|
| `id`      | int  | ID satuan     |

#### Request Body

| Field          | Type   | Required | Keterangan                            |
|----------------|--------|----------|---------------------------------------|
| `name`         | string | Ya       | Nama satuan baru, unik                |
| `abbreviation` | string | Ya       | Singkatan satuan baru, unik           |

```json
{
  "name": "Karton",
  "abbreviation": "ktn"
}
```

#### Aturan Validasi

| Field          | Aturan                                                         |
|----------------|----------------------------------------------------------------|
| `name`         | Required, unik di tabel `units` (kecuali ID sendiri)          |
| `abbreviation` | Required, unik di tabel `units` (kecuali ID sendiri)          |

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "Satuan berhasil diupdate"
}
```

#### Response Error — 404 Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "Satuan tidak ditemukan"
}
```

#### Alur Update Satuan

```
1. Cek apakah satuan dengan id tersebut ada
   → jika tidak ada: return 404
2. Validasi field request body
3. Cek duplikasi name dan abbreviation (exclude ID satuan ini sendiri)
   → jika duplikat: return 422
4. UPDATE record di tabel units
5. Return success
```

---

### 5. DELETE /api/units/:id

**Deskripsi:** Menghapus satuan dari sistem.  
**Auth:** Bearer Token | Role: `owner`, `admin`

#### Path Parameter

| Parameter | Type | Keterangan    |
|-----------|------|---------------|
| `id`      | int  | ID satuan     |

#### Aturan Bisnis

- Tidak bisa menghapus satuan yang masih digunakan oleh produk aktif

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "Satuan berhasil dihapus"
}
```

#### Response Error — 404 Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "Satuan tidak ditemukan"
}
```

#### Response Error — 409 Conflict

```json
{
  "code": "49",
  "status": false,
  "message": "Satuan masih digunakan oleh produk, tidak dapat dihapus"
}
```

#### Alur Hapus Satuan

```
1. Cek apakah satuan dengan id tersebut ada
   → jika tidak ada: return 404
2. Cek tabel products atau product_units: apakah ada yang menggunakan unit_id ini?
   → jika ada: return 409
3. DELETE record dari tabel units
4. Return success
```

---

### 6. PATCH /api/units/:id/toggle-status

**Deskripsi:** Mengaktifkan atau menonaktifkan satuan (toggle `is_active`).  
**Auth:** Bearer Token | Role: `owner`, `admin`

#### Path Parameter

| Parameter | Type | Keterangan    |
|-----------|------|---------------|
| `id`      | int  | ID satuan     |

#### Aturan Bisnis

- Jika `is_active` saat ini `true` → diubah menjadi `false` (nonaktifkan)
- Jika `is_active` saat ini `false` → diubah menjadi `true` (aktifkan)
- Satuan yang nonaktif tidak muncul saat filter `?is_active=1`

#### Response Sukses — 200 OK

```json
{
  "code": "00",
  "status": true,
  "message": "Status satuan berhasil diubah",
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
  "message": "Satuan tidak ditemukan"
}
```

#### Alur Toggle Status Satuan

```
1. Cek apakah satuan dengan id tersebut ada
   → jika tidak ada: return 404
2. Ambil nilai is_active saat ini
3. UPDATE is_active ke nilai kebalikannya (!is_active)
4. Return is_active baru
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
| `44` | 404         | Not Found — resource tidak ditemukan                  |
| `49` | 409         | Conflict — operasi tidak diizinkan oleh aturan bisnis |
| `50` | 500         | Internal server error                                 |

---

## Tabel Database Terkait

### Tabel `categories`

| Kolom         | Type         | Keterangan                          |
|---------------|--------------|-------------------------------------|
| `id`          | INT PK AI    | Primary key, auto increment         |
| `name`        | VARCHAR(100) | Unique, nama kategori               |
| `description` | TEXT         | Deskripsi kategori, boleh kosong    |
| `created_at`  | DATETIME     | Waktu dibuat                        |
| `updated_at`  | DATETIME     | Waktu terakhir diubah               |

### Tabel `units`

| Kolom          | Type        | Keterangan                          |
|----------------|-------------|-------------------------------------|
| `id`           | INT PK AI   | Primary key, auto increment         |
| `name`         | VARCHAR(50) | Unique, nama satuan                 |
| `abbreviation` | VARCHAR(10) | Unique, singkatan satuan            |
| `is_active`    | TINYINT(1)  | 1 = aktif, 0 = nonaktif, default 1  |
| `created_at`   | DATETIME    | Waktu dibuat                        |
| `updated_at`   | DATETIME    | Waktu terakhir diubah               |

### Relasi dengan Tabel Lain

| Tabel            | Kolom         | Keterangan                                               |
|------------------|---------------|----------------------------------------------------------|
| `products`       | `category_id` | FK ke `categories.id` — kategori tidak bisa dihapus jika ada produk |
| `products`       | `unit_id`     | FK ke `units.id` — satuan tidak bisa dihapus jika ada produk       |
| `product_units`  | `unit_id`     | FK ke `units.id` — satuan konversi produk multi-unit                |

---

## Catatan

- Kategori dan satuan adalah **master data** — perubahan akan langsung berdampak pada produk yang menggunakannya
- Satuan yang dinonaktifkan (`is_active = 0`) tidak akan muncul di dropdown pilihan saat input produk baru
- Hapus kategori/satuan hanya diizinkan jika tidak ada produk yang menggunakannya — ini mencegah data produk menjadi orphan
