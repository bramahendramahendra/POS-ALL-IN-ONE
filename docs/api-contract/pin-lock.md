# API Contract — PIN Lock

**Versi:** 1.0  
**Fase:** 1.3  
**Base URL:** `/api/pin`  
**Auth:** Semua endpoint membutuhkan `Authorization: Bearer <token>`

---

## Ringkasan Endpoint

| Method | Path            | Deskripsi                        |
|--------|-----------------|----------------------------------|
| GET    | /api/pin/check  | Cek apakah user sudah punya PIN  |
| POST   | /api/pin/set    | Set PIN baru (jika belum ada)    |
| POST   | /api/pin/verify | Verifikasi PIN untuk unlock      |
| POST   | /api/pin/change | Ubah PIN lama ke PIN baru        |

---

## Aturan Umum PIN

- PIN hanya berlaku untuk role **`kasir`**
- Format: **4–6 digit angka saja** (contoh: `"1234"`, `"123456"`)
- Disimpan sebagai **bcrypt hash** di kolom `pin_hash` tabel `users`
- Tidak ada batas percobaan salah (untuk kemudahan operasional kasir)

---

## GET /api/pin/check

**Deskripsi:** Cek apakah user yang sedang login sudah memiliki PIN.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200 — Sukses:**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "has_pin": true
  }
}
```

> `has_pin: false` jika `pin_hash` masih `NULL` di database.

---

## POST /api/pin/set

**Deskripsi:** Set PIN baru. Hanya bisa digunakan jika user **belum memiliki PIN**.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "pin": "1234"
}
```

**Validasi:**
- `pin` wajib diisi
- Harus berupa angka saja (regex: `^\d{4,6}$`)
- Jika user sudah punya PIN → tolak, arahkan ke endpoint `/change`

**Response 200 — Sukses:**
```json
{
  "code": "00",
  "status": true,
  "message": "PIN berhasil disimpan"
}
```

**Response 400 — Sudah punya PIN:**
```json
{
  "code": "40",
  "status": false,
  "message": "PIN sudah ada, gunakan endpoint /change untuk mengubahnya"
}
```

**Response 422 — Validasi gagal:**
```json
{
  "code": "42",
  "status": false,
  "message": "PIN harus berupa 4–6 digit angka"
}
```

---

## POST /api/pin/verify

**Deskripsi:** Verifikasi PIN yang diinput kasir untuk membuka kunci layar (unlock screen).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "pin": "1234"
}
```

**Response 200 — PIN benar:**
```json
{
  "code": "00",
  "status": true,
  "message": "PIN benar"
}
```

**Response 401 — PIN salah:**
```json
{
  "code": "41",
  "status": false,
  "message": "PIN salah"
}
```

**Response 400 — Belum punya PIN:**
```json
{
  "code": "40",
  "status": false,
  "message": "PIN belum diset"
}
```

---

## POST /api/pin/change

**Deskripsi:** Ubah PIN lama ke PIN baru. Memerlukan verifikasi PIN lama terlebih dahulu.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "old_pin": "1234",
  "new_pin": "5678"
}
```

**Validasi:**
- `old_pin` wajib diisi dan cocok dengan hash yang tersimpan
- `new_pin` wajib diisi, format 4–6 digit angka
- `new_pin` tidak boleh sama dengan `old_pin`

**Response 200 — Sukses:**
```json
{
  "code": "00",
  "status": true,
  "message": "PIN berhasil diubah"
}
```

**Response 401 — PIN lama salah:**
```json
{
  "code": "41",
  "status": false,
  "message": "PIN lama tidak sesuai"
}
```

**Response 422 — Validasi gagal:**
```json
{
  "code": "42",
  "status": false,
  "message": "PIN baru harus berupa 4–6 digit angka"
}
```

**Response 400 — PIN baru sama dengan lama:**
```json
{
  "code": "40",
  "status": false,
  "message": "PIN baru tidak boleh sama dengan PIN lama"
}
```

---

## Kode Respons

| Code | HTTP Status | Keterangan                      |
|------|-------------|---------------------------------|
| `00` | 200         | Sukses                          |
| `40` | 400         | Bad Request / kondisi tidak valid |
| `41` | 401         | PIN salah / tidak sesuai        |
| `42` | 422         | Validasi format input gagal     |

---

## Catatan Implementasi

- `pin_hash` disimpan di tabel `users`, kolom bertipe `VARCHAR(255) NULL`
- Proses hashing menggunakan **bcrypt** dengan cost factor minimal 10
- Kolom `pin_hash` sudah didefinisikan di skema database fase 1.1
