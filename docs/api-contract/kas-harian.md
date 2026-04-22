# API Contract — Kas Harian (Cash Drawer)

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/cash-drawer` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/cash-drawer/current` | Semua | Get kas yang sedang terbuka milik user login |
| POST | `/api/cash-drawer/open` | Semua | Buka kas baru di awal shift |
| POST | `/api/cash-drawer/:id/close` | Semua | Tutup kas di akhir shift |
| GET | `/api/cash-drawer` | owner, admin | Riwayat seluruh kas dengan filter |
| GET | `/api/cash-drawer/:id` | Semua | Detail satu record kas |
| PATCH | `/api/cash-drawer/:id/update-sales` | Internal | Update total penjualan (dipanggil otomatis saat transaksi) |
| PATCH | `/api/cash-drawer/:id/update-expenses` | Internal | Update total pengeluaran (dipanggil otomatis saat input pengeluaran) |

---

## Logika Bisnis

- Setiap kasir hanya boleh memiliki **satu kas terbuka** pada satu waktu.
- Kas dibuka di awal shift dengan saldo awal (`opening_balance`).
- `expected_balance` dihitung otomatis: `opening_balance + total_cash_sales - total_expenses`.
- `difference` dihitung saat tutup kas: `closing_balance - expected_balance`.
- `total_sales` dan `total_cash_sales` diperbarui otomatis oleh sistem saat transaksi dibuat.
- `total_expenses` diperbarui otomatis oleh sistem saat pengeluaran dicatat.

---

## GET /api/cash-drawer/current

**Deskripsi:** Mengambil data kas yang sedang terbuka milik user yang sedang login.

**Response (200) — Kas Terbuka:**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "user_id": 1,
    "user_name": "Kasir Satu",
    "shift_id": 1,
    "shift_name": "Pagi",
    "open_time": "2024-01-01T08:00:00Z",
    "opening_balance": 500000,
    "total_sales": 1500000,
    "total_cash_sales": 1200000,
    "total_expenses": 50000,
    "expected_balance": 1650000,
    "status": "open"
  }
}
```

> `expected_balance = opening_balance + total_cash_sales - total_expenses`

**Response (200) — Tidak Ada Kas Terbuka:**
```json
{
  "code": "00",
  "status": true,
  "message": "Tidak ada kas yang terbuka",
  "data": null
}
```

---

## POST /api/cash-drawer/open

**Deskripsi:** Membuka kas baru di awal shift.

**Validasi:**
- Tidak dapat membuka kas baru jika user sudah memiliki kas dengan status `open`.

**Request Body:**
```json
{
  "shift_id": 1,
  "opening_balance": 500000
}
```

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `shift_id` | integer | Ya | ID shift yang sedang berjalan |
| `opening_balance` | integer | Ya | Saldo awal kas (dalam rupiah, tanpa desimal) |

**Response (201):**
```json
{
  "code": "21",
  "status": true,
  "message": "Kas berhasil dibuka",
  "data": {
    "id": 1
  }
}
```

**Response (409) — Kas Sudah Terbuka:**
```json
{
  "code": "99",
  "status": false,
  "message": "Masih ada kas yang terbuka, tutup terlebih dahulu"
}
```

---

## POST /api/cash-drawer/:id/close

**Deskripsi:** Menutup kas di akhir shift. Sistem menghitung selisih antara saldo yang diharapkan dengan saldo aktual yang dihitung kasir.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID cash drawer |

**Request Body:**
```json
{
  "closing_balance": 1645000,
  "notes": "Selisih karena uang kembalian"
}
```

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `closing_balance` | integer | Ya | Saldo aktual yang dihitung kasir saat tutup kas |
| `notes` | string | Tidak | Catatan terkait selisih atau kondisi kas |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Kas berhasil ditutup",
  "data": {
    "expected_balance": 1650000,
    "closing_balance": 1645000,
    "difference": -5000
  }
}
```

> `difference = closing_balance - expected_balance`  
> Nilai negatif berarti kas kurang, nilai positif berarti kas lebih.

**Response (404) — Kas Tidak Ditemukan:**
```json
{
  "code": "99",
  "status": false,
  "message": "Data kas tidak ditemukan"
}
```

**Response (409) — Kas Sudah Ditutup:**
```json
{
  "code": "99",
  "status": false,
  "message": "Kas sudah ditutup sebelumnya"
}
```

---

## GET /api/cash-drawer

**Deskripsi:** Mengambil riwayat seluruh kas dengan filter tanggal, user, dan status. Hanya dapat diakses oleh `owner` dan `admin`.

**Query Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `start_date` | string (YYYY-MM-DD) | Filter dari tanggal |
| `end_date` | string (YYYY-MM-DD) | Filter sampai tanggal |
| `user_id` | integer | Filter berdasarkan user/kasir |
| `status` | string | Filter status: `open` atau `closed` |
| `page` | integer | Halaman (default: 1) |
| `limit` | integer | Jumlah per halaman (default: 20) |

**Contoh Request:**
```
GET /api/cash-drawer?start_date=2024-01-01&end_date=2024-01-31&user_id=1&status=closed&page=1&limit=20
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
      "user_name": "Kasir Satu",
      "shift_name": "Pagi",
      "open_time": "2024-01-01T08:00:00Z",
      "close_time": "2024-01-01T16:00:00Z",
      "opening_balance": 500000,
      "closing_balance": 1645000,
      "expected_balance": 1650000,
      "difference": -5000,
      "total_sales": 1500000,
      "status": "closed"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 30
  }
}
```

---

## GET /api/cash-drawer/:id

**Deskripsi:** Mengambil detail satu record kas.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID cash drawer |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "user_id": 1,
    "user_name": "Kasir Satu",
    "shift_id": 1,
    "shift_name": "Pagi",
    "open_time": "2024-01-01T08:00:00Z",
    "close_time": "2024-01-01T16:00:00Z",
    "opening_balance": 500000,
    "closing_balance": 1645000,
    "expected_balance": 1650000,
    "difference": -5000,
    "total_sales": 1500000,
    "total_cash_sales": 1200000,
    "total_expenses": 50000,
    "notes": "Selisih karena uang kembalian",
    "status": "closed"
  }
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Data kas tidak ditemukan"
}
```

---

## PATCH /api/cash-drawer/:id/update-sales

**Deskripsi:** Memperbarui total penjualan pada kas yang sedang terbuka. Endpoint ini **dipanggil otomatis oleh sistem** setiap kali transaksi penjualan dibuat atau di-void — bukan dipanggil langsung oleh kasir.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID cash drawer |

**Request Body:**
```json
{
  "total_sales": 1500000,
  "total_cash_sales": 1200000
}
```

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `total_sales` | integer | Akumulasi total penjualan semua metode pembayaran |
| `total_cash_sales` | integer | Akumulasi total penjualan dengan pembayaran tunai saja |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Data penjualan kas berhasil diperbarui"
}
```

---

## PATCH /api/cash-drawer/:id/update-expenses

**Deskripsi:** Memperbarui total pengeluaran pada kas yang sedang terbuka. Endpoint ini **dipanggil otomatis oleh sistem** setiap kali pengeluaran dicatat — bukan dipanggil langsung oleh kasir.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID cash drawer |

**Request Body:**
```json
{
  "total_expenses": 50000
}
```

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `total_expenses` | integer | Akumulasi total pengeluaran pada kas ini |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Data pengeluaran kas berhasil diperbarui"
}
```

---

## Status Kas

| Status | Deskripsi |
|--------|-----------|
| `open` | Kas sedang terbuka / aktif |
| `closed` | Kas sudah ditutup |

---

## Rumus Kalkulasi

| Kalkulasi | Rumus |
|-----------|-------|
| Expected Balance | `opening_balance + total_cash_sales - total_expenses` |
| Difference | `closing_balance - expected_balance` |

> **Catatan:** Hanya penjualan tunai (`total_cash_sales`) yang memengaruhi `expected_balance`, karena penjualan non-tunai (transfer, QRIS, dll.) tidak masuk ke laci kas fisik.
