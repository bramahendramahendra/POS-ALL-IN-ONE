# API Contract — Laporan Kasir

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/reports/cashier` |
| Auth | Bearer Token (semua endpoint) |
| Role | owner, admin |
| Format | JSON (`application/json`) atau File Excel (export) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/reports/cashier` | owner, admin | Laporan performa kasir berdasarkan periode dan/atau kasir tertentu |
| GET | `/api/reports/cashier/export` | owner, admin | Export laporan kasir ke file Excel (.xlsx) |

---

## Logika Bisnis

- Data diambil dari tabel `transactions` dengan join ke tabel `users`.
- Filter `user_id` membatasi laporan hanya pada kasir tertentu.
- Filter `start_date` dan `end_date` memfilter berdasarkan `transactions.created_at` (tanggal transaksi selesai).
- Jika `start_date` dan `end_date` tidak diberikan, default ke bulan berjalan.
- **total_transactions** = jumlah transaksi dengan status `completed` oleh kasir tersebut pada periode yang dipilih.
- **total_sales** = total nilai transaksi (`grand_total`) yang diselesaikan oleh kasir.
- **total_cash** = total pembayaran dengan metode `cash`.
- **total_non_cash** = total pembayaran dengan metode selain `cash` (QRIS, transfer, dll).
- **avg_transaction** = `total_sales / total_transactions` (0 jika tidak ada transaksi).
- Transaksi yang dibatalkan (`status = cancelled`) tidak dihitung dalam laporan.
- Jika tidak ada kasir yang memiliki transaksi pada periode tersebut, `cashiers` dikembalikan sebagai array kosong.

---

## GET /api/reports/cashier

**Deskripsi:** Mengambil laporan performa kasir untuk periode tertentu. Dapat difilter berdasarkan kasir spesifik. Setiap elemen dalam array `cashiers` mewakili satu kasir beserta ringkasan aktivitasnya.

**Role:** owner, admin

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `start_date` | string (YYYY-MM-DD) | Tidak | Tanggal awal periode (default: awal bulan berjalan) |
| `end_date` | string (YYYY-MM-DD) | Tidak | Tanggal akhir periode (default: akhir bulan berjalan) |
| `user_id` | integer | Tidak | Filter laporan untuk kasir tertentu berdasarkan ID user |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "period": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "cashiers": [
      {
        "user_id": 1,
        "user_name": "Kasir Satu",
        "total_transactions": 45,
        "total_sales": 2500000,
        "total_cash": 1800000,
        "total_non_cash": 700000,
        "avg_transaction": 55556
      }
    ]
  }
}
```

**Keterangan Field `cashiers`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `user_id` | integer | ID user kasir |
| `user_name` | string | Nama kasir |
| `total_transactions` | integer | Jumlah transaksi selesai pada periode |
| `total_sales` | integer | Total nilai penjualan (Rp) |
| `total_cash` | integer | Total pembayaran tunai (Rp) |
| `total_non_cash` | integer | Total pembayaran non-tunai (Rp) |
| `avg_transaction` | integer | Rata-rata nilai transaksi (Rp), dibulatkan ke integer |

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

**Response (422) — Parameter tidak valid:**
```json
{
  "code": "22",
  "status": false,
  "message": "Parameter tidak valid",
  "errors": {
    "start_date": "start_date harus dalam format YYYY-MM-DD",
    "end_date": "end_date tidak boleh sebelum start_date",
    "user_id": "user_id harus berupa integer positif"
  }
}
```

---

## GET /api/reports/cashier/export

**Deskripsi:** Mengekspor laporan performa kasir ke file Excel (.xlsx). Filter yang berlaku sama dengan endpoint `/api/reports/cashier`. Seluruh data dikembalikan tanpa paginasi.

**Role:** owner, admin

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `start_date` | string (YYYY-MM-DD) | Tidak | Tanggal awal periode |
| `end_date` | string (YYYY-MM-DD) | Tidak | Tanggal akhir periode |
| `user_id` | integer | Tidak | Filter untuk kasir tertentu |

**Response Headers (200):**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="laporan-kasir-2024-01-01_2024-01-31.xlsx"
```

**Response Body:** Binary file (.xlsx) — bukan JSON.

**Sheet 1 — Informasi Periode:**

| Kolom | Keterangan |
|-------|------------|
| Periode | Tanggal awal s/d tanggal akhir laporan |
| Digenerate | Tanggal dan waktu server saat export |

**Sheet 2 — Detail Performa Kasir:**

| Kolom | Keterangan |
|-------|------------|
| No | Nomor urut |
| Nama Kasir | `user_name` |
| Total Transaksi | `total_transactions` |
| Total Penjualan | `total_sales` (Rp) |
| Total Tunai | `total_cash` (Rp) |
| Total Non-Tunai | `total_non_cash` (Rp) |
| Rata-rata Transaksi | `avg_transaction` (Rp) |

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

- Tidak ada tabel baru untuk laporan kasir — data diambil dari tabel `transactions` dengan join ke `users`.
- Hanya user dengan `role = cashier` (atau role yang memiliki akses kasir) yang muncul dalam daftar `cashiers`.
- `total_cash + total_non_cash` selalu sama dengan `total_sales`.
- Jika `user_id` yang diberikan tidak ditemukan atau tidak memiliki transaksi pada periode tersebut, `cashiers` dikembalikan sebagai array kosong (bukan error 404).
- Endpoint `/export` tidak dipaginasi — seluruh kasir sesuai filter dikembalikan dalam satu file.
- Filename pada export mencantumkan rentang tanggal periode yang dipilih.
- `avg_transaction` dibulatkan ke bawah ke integer terdekat (tidak mengandung desimal).
