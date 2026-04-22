# API Contract — Piutang

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/receivables` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/receivables` | Semua | Daftar piutang dengan filter dan pagination |
| GET | `/api/receivables/summary` | owner, admin | Summary piutang per pelanggan |
| GET | `/api/receivables/:id` | Semua | Detail satu piutang beserta riwayat pembayaran |
| POST | `/api/receivables/:id/pay` | Semua | Catat pembayaran piutang |
| GET | `/api/receivables/:id/payments` | Semua | Riwayat pembayaran suatu piutang |

---

## Logika Bisnis

- Piutang terbentuk **otomatis** saat transaksi dengan `is_credit = true` di modul Transaksi.
- Piutang **tidak dibuat manual** melalui endpoint POST — hanya dibuat oleh sistem saat transaksi kredit terjadi.
- Pembayaran bisa dilakukan **parsial** (cicilan), tidak harus sekaligus.
- `amount` pada pembayaran tidak boleh melebihi `remaining_amount` saat itu.
- Status piutang diperbarui otomatis setelah setiap pembayaran:
  - `remaining_amount = 0` → status `paid`
  - `remaining_amount > 0` → status `partial`
  - Belum ada pembayaran sama sekali → status `unpaid`

---

## Status Piutang

| Status | Keterangan |
|--------|------------|
| `unpaid` | Belum ada pembayaran sama sekali |
| `partial` | Sudah ada pembayaran sebagian |
| `paid` | Lunas (remaining = 0) |

---

## GET /api/receivables

**Deskripsi:** Mengambil daftar piutang dengan filter dan pagination.

**Auth:** Bearer Token | Semua role

**Query Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `customer_id` | integer | Filter berdasarkan ID pelanggan |
| `status` | string | Filter status: `unpaid`, `partial`, `paid` |
| `start_date` | date (YYYY-MM-DD) | Filter tanggal mulai |
| `end_date` | date (YYYY-MM-DD) | Filter tanggal akhir |
| `page` | integer | Halaman (default: 1) |
| `limit` | integer | Jumlah per halaman (default: 20) |

**Contoh Request:**
```
GET /api/receivables?customer_id=1&status=unpaid&start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20
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
      "transaction_code": "WEB-20240101-001",
      "customer_name": "Budi Santoso",
      "total_amount": 500000,
      "paid_amount": 200000,
      "remaining_amount": 300000,
      "status": "partial",
      "due_date": "2024-02-01"
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

## GET /api/receivables/summary

**Deskripsi:** Mengambil ringkasan total piutang, total dibayar, dan sisa piutang per pelanggan.

**Auth:** Bearer Token | Role: owner, admin

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "customer_id": 1,
      "customer_name": "Budi Santoso",
      "total_receivable": 800000,
      "total_paid": 200000,
      "total_remaining": 600000,
      "count": 3
    }
  ]
}
```

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `customer_id` | integer | ID pelanggan |
| `customer_name` | string | Nama pelanggan |
| `total_receivable` | integer | Total nilai piutang dari semua transaksi kredit |
| `total_paid` | integer | Total yang sudah dibayarkan |
| `total_remaining` | integer | Sisa piutang yang belum dibayar |
| `count` | integer | Jumlah transaksi kredit yang tercatat |

---

## GET /api/receivables/:id

**Deskripsi:** Mengambil detail satu piutang beserta seluruh riwayat pembayarannya.

**Auth:** Bearer Token | Semua role

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID piutang |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "transaction_id": 1,
    "transaction_code": "WEB-20240101-001",
    "customer_id": 1,
    "customer_name": "Budi Santoso",
    "total_amount": 500000,
    "paid_amount": 200000,
    "remaining_amount": 300000,
    "status": "partial",
    "due_date": "2024-02-01",
    "notes": "",
    "payments": [
      {
        "id": 1,
        "payment_date": "2024-01-15",
        "amount": 200000,
        "payment_method": "cash",
        "notes": "Bayar sebagian"
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
  "message": "Piutang tidak ditemukan"
}
```

---

## POST /api/receivables/:id/pay

**Deskripsi:** Mencatat pembayaran (baik penuh maupun parsial) untuk suatu piutang.

**Auth:** Bearer Token | Semua role

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID piutang yang akan dibayar |

**Request Body:**
```json
{
  "payment_date": "2024-01-15",
  "amount": 200000,
  "payment_method": "cash",
  "notes": "Bayar sebagian"
}
```

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `payment_date` | date (YYYY-MM-DD) | Ya | Tanggal pembayaran |
| `amount` | integer | Ya | Jumlah yang dibayarkan |
| `payment_method` | string | Ya | Metode pembayaran: `cash`, `transfer`, dll |
| `notes` | string | Tidak | Catatan tambahan |

**Validasi:**
- `amount` harus lebih dari 0
- `amount` tidak boleh melebihi `remaining_amount` saat ini

**Proses Backend:**
1. Simpan record pembayaran ke tabel `receivable_payments`
2. Update `paid_amount` di tabel `receivables` (tambahkan `amount`)
3. Hitung ulang `remaining_amount = total_amount - paid_amount`
4. Update `status`:
   - Jika `remaining_amount = 0` → `paid`
   - Jika `remaining_amount > 0` → `partial`

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Pembayaran piutang berhasil dicatat",
  "data": {
    "paid_amount": 400000,
    "remaining_amount": 100000,
    "status": "partial"
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
    "amount": "Jumlah bayar melebihi sisa piutang"
  }
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Piutang tidak ditemukan"
}
```

---

## GET /api/receivables/:id/payments

**Deskripsi:** Mengambil seluruh riwayat pembayaran dari satu piutang.

**Auth:** Bearer Token | Semua role

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID piutang |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "payment_date": "2024-01-15",
      "amount": 200000,
      "payment_method": "cash",
      "user_name": "Admin",
      "notes": ""
    }
  ]
}
```

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID record pembayaran |
| `payment_date` | date | Tanggal pembayaran |
| `amount` | integer | Jumlah yang dibayarkan |
| `payment_method` | string | Metode pembayaran |
| `user_name` | string | Nama user yang mencatat pembayaran |
| `notes` | string | Catatan tambahan |

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Piutang tidak ditemukan"
}
```

---

## Keterkaitan dengan Modul Lain

| Modul | Keterkaitan |
|-------|-------------|
| **Transaksi** | Piutang dibuat otomatis saat transaksi dengan `is_credit = true`; `transaction_id` di tabel `receivables` merujuk ke tabel `transactions` |
| **Pelanggan** | `customer_id` di tabel `receivables` merujuk ke tabel `customers`; pelanggan tidak bisa dihapus jika masih punya piutang aktif |
