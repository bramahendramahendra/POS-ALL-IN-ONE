# API Contract — Laporan Penjualan

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/reports/sales` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) atau File Excel (export) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/reports/sales` | Semua role | List transaksi penjualan dengan filter dan ringkasan |
| GET | `/api/reports/sales/chart` | Semua role | Data chart penjualan per periode (daily/weekly/monthly) |
| GET | `/api/reports/sales/export` | owner, admin | Export laporan penjualan ke file Excel (.xlsx) |

---

## Logika Bisnis

- Laporan penjualan hanya mencakup transaksi dengan status `completed`.
- Filter `user_id` memungkinkan owner/admin melihat laporan per kasir.
- Kolom `net_sales` dihitung sebagai `total_sales - total_discount`.
- `total_tax` dicadangkan untuk pengembangan fitur pajak di masa depan; sementara ini selalu `0`.
- Endpoint `/chart` mengagregasi data berdasarkan `period`: `daily`, `weekly`, atau `monthly`.
- Endpoint `/export` menghasilkan file `.xlsx` — bukan JSON — dengan kolom yang sama seperti laporan list.
- Semua filter tanggal menggunakan format `YYYY-MM-DD` dan diinterpretasikan sebagai rentang inklusif.

---

## GET /api/reports/sales

**Deskripsi:** Mengambil daftar transaksi penjualan beserta ringkasan total dalam rentang tanggal tertentu.

**Role:** Semua role

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `start_date` | string (YYYY-MM-DD) | Tidak | Tanggal awal filter |
| `end_date` | string (YYYY-MM-DD) | Tidak | Tanggal akhir filter |
| `user_id` | integer | Tidak | Filter berdasarkan kasir tertentu |
| `payment_method` | string | Tidak | Filter metode pembayaran: `cash`, `transfer`, `qris` |
| `page` | integer | Tidak | Nomor halaman (default: 1) |
| `limit` | integer | Tidak | Jumlah data per halaman (default: 20) |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "summary": {
      "total_transactions": 150,
      "total_sales": 15000000,
      "total_discount": 500000,
      "total_tax": 0,
      "net_sales": 14500000
    },
    "transactions": [
      {
        "id": 1,
        "transaction_code": "WEB-20240101-001",
        "transaction_date": "2024-01-01T10:00:00Z",
        "user_name": "Kasir Satu",
        "total_amount": 35000,
        "discount": 0,
        "payment_method": "cash",
        "status": "completed"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150
    }
  }
}
```

**Response (401) — Token tidak valid:**
```json
{
  "code": "01",
  "status": false,
  "message": "Unauthorized"
}
```

**Response (422) — Parameter tidak valid:**
```json
{
  "code": "22",
  "status": false,
  "message": "Parameter tidak valid",
  "errors": {
    "start_date": "Format tanggal harus YYYY-MM-DD",
    "end_date": "end_date tidak boleh lebih awal dari start_date"
  }
}
```

---

## GET /api/reports/sales/chart

**Deskripsi:** Mengambil data agregasi penjualan per periode untuk kebutuhan visualisasi chart.

**Role:** Semua role

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `start_date` | string (YYYY-MM-DD) | Ya | Tanggal awal rentang chart |
| `end_date` | string (YYYY-MM-DD) | Ya | Tanggal akhir rentang chart |
| `period` | string | Tidak | Granularitas agregasi: `daily` (default), `weekly`, `monthly` |

**Keterangan nilai `label` per period:**

| Period | Format Label | Contoh |
|--------|-------------|--------|
| `daily` | `YYYY-MM-DD` | `2024-01-01` |
| `weekly` | `YYYY-Www` | `2024-W01` |
| `monthly` | `YYYY-MM` | `2024-01` |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "label": "2024-01-01",
      "total_sales": 1500000,
      "total_transactions": 15
    },
    {
      "label": "2024-01-02",
      "total_sales": 1800000,
      "total_transactions": 18
    }
  ]
}
```

**Response (401) — Token tidak valid:**
```json
{
  "code": "01",
  "status": false,
  "message": "Unauthorized"
}
```

**Response (422) — Parameter tidak valid:**
```json
{
  "code": "22",
  "status": false,
  "message": "Parameter tidak valid",
  "errors": {
    "start_date": "start_date wajib diisi",
    "end_date": "end_date wajib diisi"
  }
}
```

---

## GET /api/reports/sales/export

**Deskripsi:** Mengekspor laporan penjualan ke file Excel (.xlsx). Filter yang berlaku sama dengan endpoint `/api/reports/sales`.

**Role:** owner, admin

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `start_date` | string (YYYY-MM-DD) | Tidak | Tanggal awal filter |
| `end_date` | string (YYYY-MM-DD) | Tidak | Tanggal akhir filter |
| `user_id` | integer | Tidak | Filter berdasarkan kasir tertentu |
| `payment_method` | string | Tidak | Filter metode pembayaran: `cash`, `transfer`, `qris` |

**Response Headers (200):**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="laporan-penjualan-2024-01-01_2024-01-31.xlsx"
```

**Response Body:** Binary file (.xlsx) — bukan JSON.

**Kolom di file Excel:**

| Kolom | Keterangan |
|-------|------------|
| No | Nomor urut |
| Kode Transaksi | `transaction_code` |
| Tanggal | `transaction_date` |
| Kasir | `user_name` |
| Total Penjualan | `total_amount` |
| Diskon | `discount` |
| Metode Bayar | `payment_method` |
| Status | `status` |

**Response (401) — Token tidak valid:**
```json
{
  "code": "01",
  "status": false,
  "message": "Unauthorized"
}
```

**Response (403) — Role tidak diizinkan:**
```json
{
  "code": "03",
  "status": false,
  "message": "Forbidden"
}
```

---

## Catatan

- Tidak ada tabel baru untuk laporan penjualan — data diambil langsung dari tabel `transactions` (join `users`).
- Summary (`total_transactions`, `total_sales`, dll.) dihitung dari keseluruhan hasil filter, bukan hanya halaman saat ini.
- Endpoint `/export` tidak dipaginasi — seluruh data dalam rentang filter dikembalikan dalam satu file.
- Rentang tanggal maksimum yang disarankan untuk export adalah 3 bulan untuk menjaga performa query.
