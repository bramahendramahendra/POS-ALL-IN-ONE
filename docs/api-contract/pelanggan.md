# API Contract — Pelanggan

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/customers` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/customers` | Semua | Daftar pelanggan dengan filter dan pagination |
| GET | `/api/customers/active` | Semua | List pelanggan aktif saja (untuk dropdown di kasir) |
| GET | `/api/customers/:id` | Semua | Detail satu pelanggan |
| POST | `/api/customers` | Semua | Tambah pelanggan baru |
| PUT | `/api/customers/:id` | Semua | Update data pelanggan |
| DELETE | `/api/customers/:id` | owner, admin | Hapus pelanggan (jika tidak punya piutang aktif) |
| PATCH | `/api/customers/:id/toggle-status` | owner, admin | Aktifkan / nonaktifkan pelanggan |

---

## Logika Bisnis

- `customer_code` di-generate otomatis oleh backend dengan format `CUS-001`, `CUS-002`, dst (sequential).
- Pelanggan baru selalu berstatus `is_active = true`.
- Pelanggan **tidak bisa dihapus** jika masih memiliki piutang aktif.
- Toggle status mengubah `is_active` dari `true` ke `false` atau sebaliknya.
- Endpoint `/active` hanya mengembalikan pelanggan dengan `is_active = true`, digunakan untuk keperluan dropdown di form kasir / transaksi.

---

## GET /api/customers

**Deskripsi:** Mengambil daftar Pelanggan dengan filter dan pagination.

**Query Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `search` | string | Filter berdasarkan nama atau kode pelanggan |
| `is_active` | integer (0/1) | Filter berdasarkan status aktif |
| `page` | integer | Halaman (default: 1) |
| `limit` | integer | Jumlah per halaman (default: 20) |

**Contoh Request:**
```
GET /api/customers?search=budi&is_active=1&page=1&limit=20
```

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "customer_code": "CUS-001",
      "name": "Budi Santoso",
      "phone": "08123456789",
      "address": "Jl. Merdeka No. 5",
      "credit_limit": 500000,
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

---

## GET /api/customers/active

**Deskripsi:** Mengambil daftar Pelanggan yang aktif saja. Digunakan untuk keperluan dropdown pada form kasir / transaksi.

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Budi Santoso",
      "customer_code": "CUS-001",
      "credit_limit": 500000
    }
  ]
}
```

---

## GET /api/customers/:id

**Deskripsi:** Mengambil detail satu Pelanggan berdasarkan ID.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Pelanggan |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "customer_code": "CUS-001",
    "name": "Budi Santoso",
    "phone": "08123456789",
    "address": "Jl. Merdeka No. 5",
    "credit_limit": 500000,
    "notes": "",
    "is_active": true
  }
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Pelanggan tidak ditemukan"
}
```

---

## POST /api/customers

**Deskripsi:** Menambahkan Pelanggan baru. Backend otomatis generate `customer_code` secara sequential.

**Request Body:**
```json
{
  "name": "Budi Santoso",
  "phone": "08123456789",
  "address": "Jl. Merdeka No. 5",
  "credit_limit": 500000,
  "notes": ""
}
```

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `name` | string | Ya | Nama pelanggan |
| `phone` | string | Tidak | Nomor telepon pelanggan |
| `address` | string | Tidak | Alamat lengkap pelanggan |
| `credit_limit` | integer | Tidak | Batas kredit / piutang pelanggan (default: 0) |
| `notes` | string | Tidak | Catatan tambahan |

**Proses Backend:**
1. Tentukan `customer_code` berikutnya dengan format `CUS-XXX` (sequential, zero-padded 3 digit)
2. Set `is_active = true` secara default
3. Simpan data pelanggan

**Response (201):**
```json
{
  "code": "21",
  "status": true,
  "message": "Pelanggan berhasil ditambahkan",
  "data": {
    "id": 1,
    "customer_code": "CUS-001"
  }
}
```

**Response (422) — Validasi Gagal:**
```json
{
  "code": "99",
  "status": false,
  "message": "Validasi gagal",
  "errors": {
    "name": "Nama pelanggan wajib diisi"
  }
}
```

---

## PUT /api/customers/:id

**Deskripsi:** Mengupdate data Pelanggan yang sudah ada. `customer_code` tidak bisa diubah.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Pelanggan |

**Request Body:** Sama dengan POST

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Pelanggan berhasil diupdate"
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Pelanggan tidak ditemukan"
}
```

**Response (422) — Validasi Gagal:**
```json
{
  "code": "99",
  "status": false,
  "message": "Validasi gagal",
  "errors": {
    "name": "Nama pelanggan wajib diisi"
  }
}
```

---

## DELETE /api/customers/:id

**Deskripsi:** Menghapus Pelanggan. Tidak bisa dilakukan jika pelanggan masih memiliki piutang aktif.

**Auth:** Bearer Token | Role: owner, admin

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Pelanggan |

**Validasi:**
- Pelanggan tidak boleh memiliki piutang yang belum lunas

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Pelanggan berhasil dihapus"
}
```

**Response (409) — Memiliki Piutang Aktif:**
```json
{
  "code": "99",
  "status": false,
  "message": "Pelanggan tidak dapat dihapus karena masih memiliki piutang aktif"
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Pelanggan tidak ditemukan"
}
```

---

## PATCH /api/customers/:id/toggle-status

**Deskripsi:** Mengubah status aktif Pelanggan dari `true` ke `false` atau sebaliknya.

**Auth:** Bearer Token | Role: owner, admin

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Pelanggan |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Status pelanggan berhasil diubah",
  "data": {
    "is_active": false
  }
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Pelanggan tidak ditemukan"
}
```

---

## Keterkaitan dengan Modul Lain

| Modul | Keterkaitan |
|-------|-------------|
| **Transaksi** | `customer_id` di tabel `transactions` merujuk ke tabel `customers`; pelanggan digunakan saat transaksi dengan pembayaran kredit |
| **Piutang** | `customer_id` di tabel `receivables` merujuk ke tabel `customers`; piutang timbul dari transaksi kredit pelanggan |
