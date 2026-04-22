# API Contract — Transaksi

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/transactions` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/transactions` | Semua | List transaksi dengan filter |
| GET | `/api/transactions/:id` | Semua | Detail transaksi beserta items |
| POST | `/api/transactions` | Semua | Buat transaksi baru |
| PATCH | `/api/transactions/:id/void` | owner, admin | Void / batalkan transaksi |

---

## Format Kode Transaksi

Nomor transaksi di-generate otomatis oleh backend berdasarkan `device_source`:

| Device Source | Prefix | Contoh |
|---------------|--------|--------|
| `desktop` | `DSK-` | `DSK-20240115-001` |
| `web` | `WEB-` | `WEB-20240115-001` |
| `android` | `AND-` | `AND-20240115-001` |

**Format:** `{PREFIX}-YYYYMMDD-XXX`  
**Aturan:** Nomor urut (XXX) di-reset setiap hari per `device_source`.

---

## Status Transaksi

| Status | Keterangan |
|--------|------------|
| `pending` | Transaksi belum selesai |
| `completed` | Transaksi berhasil |
| `void` | Transaksi dibatalkan |

---

## GET /api/transactions

Mengambil daftar transaksi dengan dukungan filter dan pagination.

**Auth:** Bearer Token | Semua role

**Query Params:**

| Param | Tipe | Keterangan |
|-------|------|------------|
| `start_date` | string (YYYY-MM-DD) | Filter tanggal mulai |
| `end_date` | string (YYYY-MM-DD) | Filter tanggal akhir |
| `user_id` | integer | Filter berdasarkan kasir |
| `payment_method` | string | Filter metode pembayaran (`cash`, `transfer`, dll) |
| `status` | string | Filter status (`pending`, `completed`, `void`) |
| `page` | integer | Halaman (default: 1) |
| `limit` | integer | Jumlah per halaman (default: 20) |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "transaction_code": "WEB-20240101-001",
      "user_id": 1,
      "user_name": "Admin",
      "transaction_date": "2024-01-01T10:00:00Z",
      "total_amount": 35000,
      "payment_method": "cash",
      "status": "completed",
      "device_source": "web"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

---

## GET /api/transactions/:id

Mengambil detail lengkap sebuah transaksi beserta semua item-nya.

**Auth:** Bearer Token | Semua role

**Path Params:**

| Param | Tipe | Keterangan |
|-------|------|------------|
| `id` | integer | ID transaksi |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "transaction_code": "WEB-20240101-001",
    "user_id": 1,
    "user_name": "Admin",
    "transaction_date": "2024-01-01T10:00:00Z",
    "subtotal": 35000,
    "discount": 0,
    "tax": 0,
    "total_amount": 35000,
    "payment_method": "cash",
    "payment_amount": 50000,
    "change_amount": 15000,
    "customer_id": null,
    "customer_name": null,
    "is_credit": false,
    "status": "completed",
    "device_source": "web",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Kopi Susu",
        "quantity": 2,
        "unit": "pcs",
        "price": 12000,
        "subtotal": 24000,
        "discount_item": 0
      }
    ]
  }
}
```

**Response (404):**
```json
{
  "code": "44",
  "status": false,
  "message": "Transaksi tidak ditemukan"
}
```

---

## POST /api/transactions

Membuat transaksi baru. Backend akan otomatis men-generate kode transaksi, mengurangi stok, dan mencatat mutasi stok.

**Auth:** Bearer Token | Semua role

**Request Body:**

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| `transaction_date` | string (ISO 8601) | Ya | Waktu transaksi |
| `shift_id` | integer | Ya | ID shift kasir aktif |
| `subtotal` | integer | Ya | Subtotal sebelum diskon & pajak |
| `discount` | integer | Tidak | Diskon total transaksi (default: 0) |
| `tax` | integer | Tidak | Pajak transaksi (default: 0) |
| `total_amount` | integer | Ya | Total akhir yang harus dibayar |
| `payment_method` | string | Ya | Metode pembayaran (`cash`, `transfer`, dll) |
| `payment_amount` | integer | Ya | Jumlah uang yang dibayarkan pelanggan |
| `change_amount` | integer | Ya | Kembalian |
| `customer_id` | integer\|null | Tidak | ID pelanggan (null jika umum) |
| `is_credit` | boolean | Tidak | Transaksi kredit/piutang (default: false) |
| `device_source` | string | Ya | Sumber device (`desktop`, `web`, `android`) |
| `items` | array | Ya | Daftar item transaksi |

**Struktur `items`:**

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| `product_id` | integer | Ya | ID produk |
| `product_name` | string | Ya | Nama produk (snapshot saat transaksi) |
| `quantity` | integer | Ya | Jumlah yang dibeli |
| `unit` | string | Ya | Nama satuan |
| `price` | integer | Ya | Harga per satuan |
| `subtotal` | integer | Ya | Harga × quantity |
| `discount_item` | integer | Tidak | Diskon per item (default: 0) |
| `conversion_qty` | number | Tidak | Faktor konversi jika satuan alternatif |
| `unit_id` | integer\|null | Tidak | ID satuan alternatif (null jika satuan dasar) |

**Request Body (contoh):**
```json
{
  "transaction_date": "2024-01-01T10:00:00Z",
  "shift_id": 1,
  "subtotal": 35000,
  "discount": 0,
  "tax": 0,
  "total_amount": 35000,
  "payment_method": "cash",
  "payment_amount": 50000,
  "change_amount": 15000,
  "customer_id": null,
  "is_credit": false,
  "device_source": "web",
  "items": [
    {
      "product_id": 1,
      "product_name": "Kopi Susu",
      "quantity": 2,
      "unit": "pcs",
      "price": 12000,
      "subtotal": 24000,
      "discount_item": 0,
      "conversion_qty": 1,
      "unit_id": null
    }
  ]
}
```

**Proses di Backend:**

1. Generate `transaction_code` dengan prefix sesuai `device_source` dan nomor urut harian
2. Simpan transaksi ke tabel `transactions`
3. Simpan items ke tabel `transaction_items`
4. Kurangi stok setiap produk di tabel `products`
5. Catat mutasi stok di tabel `stock_mutations` (tipe: `out`)
6. Jika `is_credit = true`, buat record di tabel `receivables`

**Response (201):**
```json
{
  "code": "21",
  "status": true,
  "message": "Transaksi berhasil disimpan",
  "data": {
    "id": 1,
    "transaction_code": "WEB-20240101-001"
  }
}
```

**Response (422) — Validasi gagal:**
```json
{
  "code": "22",
  "status": false,
  "message": "Validasi gagal",
  "errors": {
    "items": "items tidak boleh kosong",
    "payment_amount": "payment_amount harus lebih besar atau sama dengan total_amount"
  }
}
```

**Response (422) — Stok tidak mencukupi:**
```json
{
  "code": "22",
  "status": false,
  "message": "Stok produk 'Kopi Susu' tidak mencukupi"
}
```

---

## PATCH /api/transactions/:id/void

Membatalkan transaksi yang sudah ada. Stok akan dikembalikan dan mutasi stok bertipe `void` dicatat.

**Auth:** Bearer Token | Role: `owner`, `admin`

**Path Params:**

| Param | Tipe | Keterangan |
|-------|------|------------|
| `id` | integer | ID transaksi yang akan di-void |

**Proses di Backend:**

1. Update status transaksi menjadi `void`
2. Kembalikan stok semua item transaksi ke tabel `products`
3. Catat mutasi stok di tabel `stock_mutations` (tipe: `void`)
4. Jika ada piutang terkait (`receivables`), update status piutang menjadi void/cancelled

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Transaksi berhasil di-void"
}
```

**Response (404):**
```json
{
  "code": "44",
  "status": false,
  "message": "Transaksi tidak ditemukan"
}
```

**Response (409) — Transaksi sudah di-void:**
```json
{
  "code": "09",
  "status": false,
  "message": "Transaksi sudah berstatus void"
}
```

---

## Tabel Database Terkait

### Tabel: `transactions`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | Auto increment |
| `transaction_code` | varchar(30) UNIQUE | Kode unik transaksi |
| `user_id` | bigint FK | Kasir yang melakukan transaksi |
| `shift_id` | bigint FK | Shift aktif saat transaksi |
| `customer_id` | bigint FK nullable | Pelanggan (opsional) |
| `transaction_date` | timestamp | Waktu transaksi |
| `subtotal` | bigint | Subtotal sebelum diskon & pajak |
| `discount` | bigint | Diskon total |
| `tax` | bigint | Pajak |
| `total_amount` | bigint | Total akhir |
| `payment_method` | varchar(50) | Metode pembayaran |
| `payment_amount` | bigint | Jumlah dibayar |
| `change_amount` | bigint | Kembalian |
| `is_credit` | boolean | Transaksi kredit |
| `status` | enum | `pending`, `completed`, `void` |
| `device_source` | varchar(20) | `desktop`, `web`, `android` |
| `created_at` | timestamp | Waktu dibuat |
| `updated_at` | timestamp | Waktu diperbarui |

### Tabel: `transaction_items`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | Auto increment |
| `transaction_id` | bigint FK | Referensi ke `transactions` |
| `product_id` | bigint FK | Referensi ke `products` |
| `product_name` | varchar(255) | Snapshot nama produk |
| `quantity` | decimal(10,2) | Jumlah yang dibeli |
| `unit` | varchar(50) | Satuan yang digunakan |
| `unit_id` | bigint FK nullable | Satuan alternatif (jika bukan satuan dasar) |
| `conversion_qty` | decimal(10,4) | Faktor konversi ke satuan dasar |
| `price` | bigint | Harga per satuan saat transaksi |
| `subtotal` | bigint | price × quantity |
| `discount_item` | bigint | Diskon per item |

### Tabel: `stock_mutations`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | Auto increment |
| `product_id` | bigint FK | Referensi ke `products` |
| `transaction_id` | bigint FK nullable | Transaksi terkait (null jika adjustment manual) |
| `type` | enum | `in`, `out`, `void`, `adjustment` |
| `quantity` | decimal(10,2) | Jumlah perubahan stok (selalu positif) |
| `stock_before` | decimal(10,2) | Stok sebelum mutasi |
| `stock_after` | decimal(10,2) | Stok setelah mutasi |
| `note` | text nullable | Catatan tambahan |
| `created_at` | timestamp | Waktu mutasi |

### Tabel: `receivables` (Piutang)

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | Auto increment |
| `transaction_id` | bigint FK | Transaksi asal piutang |
| `customer_id` | bigint FK | Pelanggan yang berhutang |
| `amount` | bigint | Total piutang |
| `paid_amount` | bigint | Sudah dibayar |
| `remaining_amount` | bigint | Sisa piutang |
| `status` | enum | `unpaid`, `partial`, `paid`, `void` |
| `due_date` | date nullable | Jatuh tempo |
| `created_at` | timestamp | Waktu dibuat |
| `updated_at` | timestamp | Waktu diperbarui |
