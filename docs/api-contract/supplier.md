# API Contract — Supplier

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/suppliers` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/suppliers` | Semua | Daftar supplier dengan filter dan pagination |
| GET | `/api/suppliers/active` | Semua | List supplier aktif saja (untuk dropdown) |
| GET | `/api/suppliers/:id` | Semua | Detail satu supplier beserta riwayat pembelian |
| POST | `/api/suppliers` | owner, admin | Tambah supplier baru |
| PUT | `/api/suppliers/:id` | owner, admin | Update data supplier |
| DELETE | `/api/suppliers/:id` | owner, admin | Hapus supplier (jika belum punya PO) |
| PATCH | `/api/suppliers/:id/toggle-status` | owner, admin | Aktifkan / nonaktifkan supplier |

---

## Logika Bisnis

- `supplier_code` di-generate otomatis oleh backend dengan format `SUP-001`, `SUP-002`, dst (sequential).
- Supplier baru selalu berstatus `is_active = true`.
- Supplier **tidak bisa dihapus** jika sudah memiliki Purchase Order terkait.
- Toggle status mengubah `is_active` dari `true` ke `false` atau sebaliknya.
- Endpoint `/active` hanya mengembalikan supplier dengan `is_active = true`, digunakan untuk keperluan dropdown di form PO dan retur.

---

## GET /api/suppliers

**Deskripsi:** Mengambil daftar Supplier dengan filter dan pagination.

**Query Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `search` | string | Filter berdasarkan nama supplier |
| `is_active` | integer (0/1) | Filter berdasarkan status aktif |
| `page` | integer | Halaman (default: 1) |
| `limit` | integer | Jumlah per halaman (default: 20) |

**Contoh Request:**
```
GET /api/suppliers?search=makmur&is_active=1&page=1&limit=20
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
      "supplier_code": "SUP-001",
      "name": "PT Sumber Makmur",
      "phone": "021-1234567",
      "email": "info@sumbermakmur.com",
      "contact_person": "Budi",
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

---

## GET /api/suppliers/active

**Deskripsi:** Mengambil daftar Supplier yang aktif saja. Digunakan untuk keperluan dropdown pada form Purchase Order dan Retur Supplier.

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "PT Sumber Makmur",
      "supplier_code": "SUP-001"
    }
  ]
}
```

---

## GET /api/suppliers/:id

**Deskripsi:** Mengambil detail satu Supplier beserta riwayat Purchase Order yang pernah dibuat.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Supplier |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "supplier_code": "SUP-001",
    "name": "PT Sumber Makmur",
    "address": "Jl. Raya No. 1, Jakarta",
    "phone": "021-1234567",
    "email": "info@sumbermakmur.com",
    "contact_person": "Budi",
    "notes": "",
    "is_active": true,
    "purchase_history": [
      {
        "id": 1,
        "purchase_code": "PO-20240101-001",
        "purchase_date": "2024-01-01",
        "total_amount": 1500000,
        "payment_status": "paid"
      }
    ]
  }
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Supplier tidak ditemukan"
}
```

---

## POST /api/suppliers

**Deskripsi:** Menambahkan Supplier baru. Backend otomatis generate `supplier_code` secara sequential.

**Request Body:**
```json
{
  "name": "PT Sumber Makmur",
  "address": "Jl. Raya No. 1, Jakarta",
  "phone": "021-1234567",
  "email": "info@sumbermakmur.com",
  "contact_person": "Budi",
  "notes": ""
}
```

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `name` | string | Ya | Nama supplier |
| `address` | string | Tidak | Alamat lengkap supplier |
| `phone` | string | Tidak | Nomor telepon supplier |
| `email` | string | Tidak | Email supplier |
| `contact_person` | string | Tidak | Nama kontak yang bisa dihubungi |
| `notes` | string | Tidak | Catatan tambahan |

**Proses Backend:**
1. Tentukan `supplier_code` berikutnya dengan format `SUP-XXX` (sequential, zero-padded 3 digit)
2. Set `is_active = true` secara default
3. Simpan data supplier

**Response (201):**
```json
{
  "code": "21",
  "status": true,
  "message": "Supplier berhasil ditambahkan",
  "data": {
    "id": 1,
    "supplier_code": "SUP-001"
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
    "name": "Nama supplier wajib diisi"
  }
}
```

---

## PUT /api/suppliers/:id

**Deskripsi:** Mengupdate data Supplier yang sudah ada. `supplier_code` tidak bisa diubah.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Supplier |

**Request Body:** Sama dengan POST

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Supplier berhasil diupdate"
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Supplier tidak ditemukan"
}
```

**Response (422) — Validasi Gagal:**
```json
{
  "code": "99",
  "status": false,
  "message": "Validasi gagal",
  "errors": {
    "name": "Nama supplier wajib diisi"
  }
}
```

---

## DELETE /api/suppliers/:id

**Deskripsi:** Menghapus Supplier. Tidak bisa dilakukan jika supplier sudah memiliki Purchase Order.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Supplier |

**Validasi:**
- Supplier tidak boleh memiliki Purchase Order yang terkait

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Supplier berhasil dihapus"
}
```

**Response (409) — Memiliki Purchase Order:**
```json
{
  "code": "99",
  "status": false,
  "message": "Supplier tidak dapat dihapus karena sudah memiliki Purchase Order"
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Supplier tidak ditemukan"
}
```

---

## PATCH /api/suppliers/:id/toggle-status

**Deskripsi:** Mengubah status aktif Supplier dari `true` ke `false` atau sebaliknya.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Supplier |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Status supplier berhasil diubah",
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
  "message": "Supplier tidak ditemukan"
}
```

---

## Keterkaitan dengan Modul Lain

| Modul | Keterkaitan |
|-------|-------------|
| **Purchase Order** | `supplier_id` di tabel `purchases` merujuk ke tabel `suppliers`; supplier harus ada sebelum PO dibuat |
| **Retur Supplier** | `supplier_id` di tabel `supplier_returns` merujuk ke tabel `suppliers` |
