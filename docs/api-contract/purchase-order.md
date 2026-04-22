# API Contract — Purchase Order

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/purchases` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/purchases` | Semua | Daftar PO dengan filter tanggal, supplier, dan status pembayaran |
| GET | `/api/purchases/:id` | Semua | Detail satu PO beserta item-itemnya |
| POST | `/api/purchases` | owner, admin | Buat PO baru, otomatis tambah stok |
| PUT | `/api/purchases/:id` | owner, admin | Update PO (hanya jika belum ada pembayaran) |
| DELETE | `/api/purchases/:id` | owner, admin | Hapus PO + rollback stok (hanya jika belum ada pembayaran) |
| POST | `/api/purchases/:id/pay` | owner, admin | Bayar PO (parsial atau lunas) |

---

## Logika Bisnis

- `purchase_code` di-generate otomatis oleh backend dengan format `PO-YYYYMMDD-XXX`.
- `total_amount` dihitung dari penjumlahan semua `subtotal` item.
- Saat PO dibuat (POST), stok setiap produk bertambah sesuai `quantity`, dan mutasi stok tipe `in` dicatat.
- PO **hanya bisa diedit atau dihapus** jika belum ada pembayaran (`paid_amount == 0`).
- Saat PO dihapus, stok setiap produk di-rollback (dikurangi) sebelum data dihapus.
- `payment_status` dihitung otomatis:
  - `unpaid` — belum ada pembayaran
  - `partial` — sudah ada pembayaran tapi belum lunas
  - `paid` — sudah lunas (`remaining_amount == 0`)

---

## GET /api/purchases

**Deskripsi:** Mengambil daftar Purchase Order dengan filter dan pagination.

**Query Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `start_date` | string (YYYY-MM-DD) | Filter dari tanggal |
| `end_date` | string (YYYY-MM-DD) | Filter sampai tanggal |
| `supplier_id` | integer | Filter berdasarkan supplier |
| `payment_status` | string | Filter status: `unpaid`, `partial`, `paid` |
| `page` | integer | Halaman (default: 1) |
| `limit` | integer | Jumlah per halaman (default: 20) |

**Contoh Request:**
```
GET /api/purchases?start_date=2024-01-01&end_date=2024-01-31&supplier_id=1&payment_status=unpaid&page=1&limit=20
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
      "purchase_code": "PO-20240101-001",
      "supplier_name": "PT Sumber Makmur",
      "purchase_date": "2024-01-01",
      "total_amount": 1500000,
      "paid_amount": 500000,
      "remaining_amount": 1000000,
      "payment_status": "partial"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 20
  }
}
```

---

## GET /api/purchases/:id

**Deskripsi:** Mengambil detail satu Purchase Order beserta daftar item.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Purchase Order |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "purchase_code": "PO-20240101-001",
    "supplier_id": 1,
    "supplier_name": "PT Sumber Makmur",
    "purchase_date": "2024-01-01",
    "total_amount": 1500000,
    "paid_amount": 500000,
    "remaining_amount": 1000000,
    "payment_status": "partial",
    "notes": "",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Kopi Susu",
        "quantity": 100,
        "unit": "pcs",
        "purchase_price": 8000,
        "subtotal": 800000
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
  "message": "Purchase Order tidak ditemukan"
}
```

---

## POST /api/purchases

**Deskripsi:** Membuat Purchase Order baru. Backend otomatis generate `purchase_code`, hitung `total_amount`, tambah stok produk, dan catat mutasi stok.

**Request Body:**
```json
{
  "supplier_id": 1,
  "supplier_name": "PT Sumber Makmur",
  "purchase_date": "2024-01-01",
  "notes": "",
  "items": [
    {
      "product_id": 1,
      "product_name": "Kopi Susu",
      "quantity": 100,
      "unit": "pcs",
      "purchase_price": 8000,
      "subtotal": 800000
    }
  ]
}
```

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `supplier_id` | integer | Ya | ID supplier |
| `supplier_name` | string | Ya | Nama supplier (snapshot saat PO dibuat) |
| `purchase_date` | string (YYYY-MM-DD) | Ya | Tanggal pembelian |
| `notes` | string | Tidak | Catatan tambahan |
| `items` | array | Ya | Daftar produk yang dibeli (minimal 1 item) |
| `items[].product_id` | integer | Ya | ID produk |
| `items[].product_name` | string | Ya | Nama produk (snapshot) |
| `items[].quantity` | integer | Ya | Jumlah yang dibeli (> 0) |
| `items[].unit` | string | Ya | Satuan produk |
| `items[].purchase_price` | integer | Ya | Harga beli per satuan |
| `items[].subtotal` | integer | Ya | `quantity × purchase_price` |

**Proses Backend:**
1. Generate `purchase_code` format `PO-YYYYMMDD-XXX`
2. Hitung `total_amount` dari sum semua `subtotal`
3. Simpan PO header dan semua item
4. Tambah stok setiap produk sesuai `quantity`
5. Catat mutasi stok tipe `in` untuk setiap item

**Response (201):**
```json
{
  "code": "21",
  "status": true,
  "message": "Purchase Order berhasil dibuat",
  "data": {
    "id": 1,
    "purchase_code": "PO-20240101-001"
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
    "supplier_id": "Supplier wajib dipilih",
    "purchase_date": "Tanggal pembelian wajib diisi",
    "items": "Minimal satu item wajib diisi"
  }
}
```

---

## PUT /api/purchases/:id

**Deskripsi:** Mengupdate Purchase Order. Hanya bisa dilakukan jika belum ada pembayaran (`paid_amount == 0`).

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Purchase Order |

**Request Body:** Sama dengan POST `/api/purchases`

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Purchase Order berhasil diupdate"
}
```

**Response (409) — Sudah Ada Pembayaran:**
```json
{
  "code": "99",
  "status": false,
  "message": "Purchase Order tidak dapat diubah karena sudah ada pembayaran"
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Purchase Order tidak ditemukan"
}
```

---

## DELETE /api/purchases/:id

**Deskripsi:** Menghapus Purchase Order beserta seluruh itemnya. Hanya bisa dilakukan jika belum ada pembayaran. Stok produk di-rollback sebelum data dihapus.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Purchase Order |

**Proses Backend:**
1. Validasi tidak ada pembayaran (`paid_amount == 0`)
2. Kurangi stok setiap produk sesuai `quantity` item
3. Hapus mutasi stok terkait PO ini
4. Hapus semua item PO
5. Hapus PO header

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Purchase Order berhasil dihapus"
}
```

**Response (409) — Sudah Ada Pembayaran:**
```json
{
  "code": "99",
  "status": false,
  "message": "Purchase Order tidak dapat dihapus karena sudah ada pembayaran"
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Purchase Order tidak ditemukan"
}
```

---

## POST /api/purchases/:id/pay

**Deskripsi:** Mencatat pembayaran PO, bisa parsial (cicilan) atau lunas sekaligus. `payment_status` diperbarui otomatis setelah pembayaran.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Purchase Order |

**Request Body:**
```json
{
  "amount": 500000,
  "payment_method": "cash",
  "notes": "Pembayaran tahap 1"
}
```

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `amount` | integer | Ya | Nominal pembayaran (> 0, tidak boleh melebihi `remaining_amount`) |
| `payment_method` | string | Ya | Metode pembayaran: `cash`, `transfer` |
| `notes` | string | Tidak | Catatan pembayaran |

**Validasi:**
- `amount` harus > 0
- `amount` tidak boleh melebihi `remaining_amount`
- PO harus ada dan belum berstatus `paid`

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Pembayaran berhasil dicatat",
  "data": {
    "paid_amount": 1000000,
    "remaining_amount": 500000,
    "payment_status": "partial"
  }
}
```

**Response (422) — Nominal Melebihi Sisa Hutang:**
```json
{
  "code": "99",
  "status": false,
  "message": "Nominal pembayaran melebihi sisa tagihan"
}
```

**Response (409) — PO Sudah Lunas:**
```json
{
  "code": "99",
  "status": false,
  "message": "Purchase Order sudah lunas"
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Purchase Order tidak ditemukan"
}
```

---

## Status Pembayaran

| Nilai | Kondisi |
|-------|---------|
| `unpaid` | `paid_amount == 0` |
| `partial` | `paid_amount > 0` dan `remaining_amount > 0` |
| `paid` | `remaining_amount == 0` |

---

## Metode Pembayaran

| Nilai | Deskripsi |
|-------|-----------|
| `cash` | Tunai |
| `transfer` | Transfer bank / non-tunai |

---

## Keterkaitan dengan Modul Lain

| Modul | Keterkaitan |
|-------|-------------|
| **Supplier** | `supplier_id` merujuk ke tabel `suppliers` |
| **Produk** | `product_id` merujuk ke tabel `products`; stok produk bertambah saat PO dibuat |
| **Stock Mutations** | Mutasi stok tipe `in` dicatat untuk setiap item saat PO berhasil dibuat |
