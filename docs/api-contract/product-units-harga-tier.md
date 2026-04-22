# API Contract — Product Units & Harga Tier

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/products/:product_id` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/products/:product_id/units` | Semua | List satuan alternatif produk |
| POST | `/api/products/:product_id/units` | owner, admin | Tambah/update satuan alternatif (upsert) |
| DELETE | `/api/products/:product_id/units/:unit_id` | owner, admin | Hapus satuan alternatif produk |
| GET | `/api/products/:product_id/prices` | Semua | List harga tier/grosir produk |
| POST | `/api/products/:product_id/prices` | owner, admin | Simpan harga tier (replace semua) |

---

## PRODUCT UNITS — Satuan Alternatif per Produk

### GET /api/products/:product_id/units

Mengambil semua satuan alternatif yang terdaftar untuk sebuah produk.

**Auth:** Bearer Token | Semua role

**Path Params:**

| Param | Tipe | Keterangan |
|-------|------|------------|
| `product_id` | integer | ID produk |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "unit_id": 2,
      "unit_name": "Dus",
      "conversion_qty": 24,
      "selling_price": 100000,
      "is_default": false
    }
  ]
}
```

**Keterangan Field:**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `id` | integer | ID record satuan produk |
| `product_id` | integer | ID produk |
| `unit_id` | integer | ID satuan master (dari tabel units) |
| `unit_name` | string | Nama satuan (e.g. "Dus", "Karton") |
| `conversion_qty` | integer | Jumlah satuan dasar dalam 1 unit ini (e.g. 24 pcs per Dus) |
| `selling_price` | integer | Harga jual untuk satuan ini |
| `is_default` | boolean | Apakah ini satuan jual default produk |

**Response (404):**
```json
{ "code": "44", "status": false, "message": "Produk tidak ditemukan" }
```

---

### POST /api/products/:product_id/units

Tambah atau update satuan alternatif produk (upsert berdasarkan `unit_id`).

**Auth:** Bearer Token | Role: owner, admin

**Path Params:**

| Param | Tipe | Keterangan |
|-------|------|------------|
| `product_id` | integer | ID produk |

**Request Body:**
```json
{
  "units": [
    {
      "unit_id": 2,
      "unit_name": "Dus",
      "conversion_qty": 24,
      "selling_price": 100000,
      "is_default": false
    }
  ]
}
```

**Validasi:**
- `units`: required, minimal 1 item
- `unit_id`: required, harus ada di tabel units master
- `conversion_qty`: required, > 0
- `selling_price`: required, >= 0
- Maksimal 1 item boleh `is_default: true` per produk
- `unit_id` tidak boleh duplikat dalam satu request

**Response (200):**
```json
{ "code": "00", "status": true, "message": "Satuan produk berhasil disimpan" }
```

**Response (400) — Validasi gagal:**
```json
{ "code": "40", "status": false, "message": "unit_id tidak valid atau conversion_qty harus lebih dari 0" }
```

**Response (404):**
```json
{ "code": "44", "status": false, "message": "Produk tidak ditemukan" }
```

---

### DELETE /api/products/:product_id/units/:unit_id

Hapus satuan alternatif dari sebuah produk.

**Auth:** Bearer Token | Role: owner, admin

**Path Params:**

| Param | Tipe | Keterangan |
|-------|------|------------|
| `product_id` | integer | ID produk |
| `unit_id` | integer | ID satuan yang akan dihapus |

**Response (200):**
```json
{ "code": "00", "status": true, "message": "Satuan produk berhasil dihapus" }
```

**Response (404):**
```json
{ "code": "44", "status": false, "message": "Satuan produk tidak ditemukan" }
```

---

## PRODUCT PRICES — Harga Tier / Grosir

### GET /api/products/:product_id/prices

Mengambil semua harga tier/grosir yang terdaftar untuk sebuah produk.

**Auth:** Bearer Token | Semua role

**Path Params:**

| Param | Tipe | Keterangan |
|-------|------|------------|
| `product_id` | integer | ID produk |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "tier_name": "Grosir",
      "min_qty": 12,
      "price": 10000
    }
  ]
}
```

**Keterangan Field:**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `id` | integer | ID record harga tier |
| `product_id` | integer | ID produk |
| `tier_name` | string | Nama tier (e.g. "Grosir", "Partai") |
| `min_qty` | integer | Minimum qty pembelian untuk harga ini berlaku |
| `price` | integer | Harga per satuan dasar pada tier ini |

> Data diurutkan berdasarkan `min_qty` ascending.

**Response (404):**
```json
{ "code": "44", "status": false, "message": "Produk tidak ditemukan" }
```

---

### POST /api/products/:product_id/prices

Simpan harga tier produk. Operasi ini **mengganti semua** data harga tier yang lama (replace all).

**Auth:** Bearer Token | Role: owner, admin

**Path Params:**

| Param | Tipe | Keterangan |
|-------|------|------------|
| `product_id` | integer | ID produk |

**Request Body:**
```json
{
  "prices": [
    { "tier_name": "Grosir", "min_qty": 12, "price": 10000 },
    { "tier_name": "Partai", "min_qty": 50, "price": 9000 }
  ]
}
```

**Validasi:**
- `prices`: required, minimal 1 item (kirim array kosong `[]` untuk menghapus semua tier)
- `tier_name`: required, tidak boleh kosong
- `min_qty`: required, > 0
- `price`: required, >= 0
- Nilai `min_qty` tidak boleh duplikat dalam satu request
- Harga tier sebaiknya lebih rendah dari `selling_price` produk utama (warning, tidak blocking)

**Response (200):**
```json
{ "code": "00", "status": true, "message": "Harga tier berhasil disimpan" }
```

**Response (400) — Validasi gagal:**
```json
{ "code": "40", "status": false, "message": "min_qty tidak boleh duplikat" }
```

**Response (404):**
```json
{ "code": "44", "status": false, "message": "Produk tidak ditemukan" }
```

---

## Catatan Bisnis

- Satuan alternatif (units) digunakan di kasir saat kasir memilih satuan jual yang berbeda dari default.
- `conversion_qty` digunakan untuk menghitung pengurangan stok. Contoh: jual 1 Dus = kurangi stok 24 pcs.
- Harga tier (prices) berlaku otomatis saat qty item dalam transaksi memenuhi `min_qty`.
- Jika ada beberapa tier yang memenuhi syarat `min_qty`, sistem mengambil tier dengan `min_qty` tertinggi yang masih terpenuhi.
- Harga tier hanya berlaku pada satuan dasar produk, bukan pada satuan alternatif.
