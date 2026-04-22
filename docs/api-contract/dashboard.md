# API Contract — Dashboard

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/dashboard` |
| Auth | Bearer Token (semua endpoint) |
| Role | Semua role (owner, admin, cashier) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/dashboard/stats` | Semua role | Ringkasan statistik hari ini dan bulan ini |
| GET | `/api/dashboard/sales-trend` | Semua role | Tren penjualan berdasarkan periode |
| GET | `/api/dashboard/top-products` | Semua role | Produk terlaris berdasarkan rentang tanggal |
| GET | `/api/dashboard/top-categories` | Semua role | Kategori terlaris berdasarkan rentang tanggal |
| GET | `/api/dashboard/payment-methods` | Semua role | Distribusi metode pembayaran berdasarkan rentang tanggal |

---

## Logika Bisnis

- Semua endpoint dashboard hanya membaca data — tidak ada mutasi.
- Data bersumber dari tabel `transactions`, `transaction_items`, `products`, `categories`, `expenses`, `receivables`, dan `stocks`.
- Hanya transaksi dengan `status = completed` yang dihitung dalam statistik penjualan.
- **total_sales** = jumlah `grand_total` dari transaksi `completed`.
- **total_expenses** = jumlah pengeluaran dari tabel `expenses` pada periode yang sama.
- **gross_profit** = `total_sales - HPP` (Harga Pokok Penjualan); jika HPP tidak tersedia, dapat dihitung dari `cost_price * qty` pada `transaction_items`.
- **low_stock_count** = jumlah produk aktif yang stok saat ini ≤ `min_stock` (berdasarkan tabel `stocks` atau `products`).
- **open_receivables** = jumlah piutang dari tabel `receivables` dengan `status = open` atau `partial`.
- Untuk `sales-trend` dengan `period=7days`, label adalah nama hari singkat (Sen, Sel, Rab, Kam, Jum, Sab, Min).
- Untuk `period=30days`, label adalah tanggal (format `DD`).
- Untuk `period=12months`, label adalah nama bulan singkat (Jan, Feb, ..., Des).
- Jika tidak ada transaksi pada suatu titik waktu, nilai `total_sales` dan `total_transactions` diisi `0` (titik tetap ada dalam array respons).
- **percentage** pada `top-categories` dan `payment-methods` dihitung terhadap total penjualan/transaksi pada periode yang sama, dibulatkan dua desimal.

---

## GET /api/dashboard/stats

**Deskripsi:** Mengambil ringkasan statistik penjualan, pengeluaran, dan laba kotor untuk hari ini dan bulan berjalan. Juga menampilkan jumlah produk stok rendah dan piutang terbuka.

**Role:** Semua role

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `date` | string (YYYY-MM-DD) | Tidak | Tanggal referensi (default: hari ini di server) |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "today": {
      "total_transactions": 25,
      "total_sales": 1500000,
      "total_expenses": 50000,
      "gross_profit": 450000
    },
    "this_month": {
      "total_transactions": 450,
      "total_sales": 25000000,
      "total_expenses": 800000,
      "gross_profit": 7000000
    },
    "low_stock_count": 5,
    "open_receivables": 3
  }
}
```

**Keterangan Field:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `today.total_transactions` | integer | Jumlah transaksi selesai pada tanggal `date` |
| `today.total_sales` | integer | Total penjualan (Rp) pada tanggal `date` |
| `today.total_expenses` | integer | Total pengeluaran (Rp) pada tanggal `date` |
| `today.gross_profit` | integer | Laba kotor (Rp) pada tanggal `date` |
| `this_month.total_transactions` | integer | Jumlah transaksi selesai dalam bulan yang sama dengan `date` |
| `this_month.total_sales` | integer | Total penjualan (Rp) dalam bulan tersebut |
| `this_month.total_expenses` | integer | Total pengeluaran (Rp) dalam bulan tersebut |
| `this_month.gross_profit` | integer | Laba kotor (Rp) dalam bulan tersebut |
| `low_stock_count` | integer | Jumlah produk aktif dengan stok ≤ min_stock saat ini |
| `open_receivables` | integer | Jumlah piutang dengan status `open` atau `partial` |

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
    "date": "date harus dalam format YYYY-MM-DD"
  }
}
```

---

## GET /api/dashboard/sales-trend

**Deskripsi:** Mengambil tren penjualan dalam bentuk array titik waktu. Setiap elemen mewakili satu hari (7days/30days) atau satu bulan (12months).

**Role:** Semua role

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `period` | string | Tidak | Periode tren: `7days`, `30days`, `12months` (default: `7days`) |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    { "label": "Sen", "total_sales": 1500000, "total_transactions": 15 },
    { "label": "Sel", "total_sales": 1800000, "total_transactions": 18 },
    { "label": "Rab", "total_sales": 1200000, "total_transactions": 12 },
    { "label": "Kam", "total_sales": 2100000, "total_transactions": 21 },
    { "label": "Jum", "total_sales": 2500000, "total_transactions": 25 },
    { "label": "Sab", "total_sales": 3200000, "total_transactions": 32 },
    { "label": "Min", "total_sales": 0, "total_transactions": 0 }
  ]
}
```

**Keterangan Field per elemen `data`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `label` | string | Label titik waktu (nama hari, tanggal, atau bulan) |
| `total_sales` | integer | Total penjualan (Rp) pada titik waktu tersebut |
| `total_transactions` | integer | Jumlah transaksi selesai pada titik waktu tersebut |

**Format label per periode:**

| Period | Format Label | Contoh |
|--------|-------------|--------|
| `7days` | Nama hari singkat (Ind) | `Sen`, `Sel`, `Rab`, `Kam`, `Jum`, `Sab`, `Min` |
| `30days` | Tanggal dua digit | `01`, `02`, ..., `30` |
| `12months` | Nama bulan singkat (Ind) | `Jan`, `Feb`, ..., `Des` |

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
    "period": "period harus salah satu dari: 7days, 30days, 12months"
  }
}
```

---

## GET /api/dashboard/top-products

**Deskripsi:** Mengambil daftar produk terlaris berdasarkan rentang tanggal. Dapat diurutkan berdasarkan jumlah unit terjual (`quantity`) atau nilai penjualan (`value`).

**Role:** Semua role

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `start_date` | string (YYYY-MM-DD) | Tidak | Tanggal awal (default: awal bulan berjalan) |
| `end_date` | string (YYYY-MM-DD) | Tidak | Tanggal akhir (default: hari ini) |
| `sort_by` | string | Tidak | Urutan: `quantity` atau `value` (default: `quantity`) |
| `limit` | integer | Tidak | Jumlah produk yang ditampilkan (default: `10`, max: `50`) |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "product_id": 1,
      "product_name": "Kopi Susu",
      "total_qty": 250,
      "total_value": 3000000
    },
    {
      "product_id": 5,
      "product_name": "Es Teh Manis",
      "total_qty": 198,
      "total_value": 990000
    }
  ]
}
```

**Keterangan Field per elemen `data`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `product_id` | integer | ID produk |
| `product_name` | string | Nama produk |
| `total_qty` | integer | Total unit terjual pada periode |
| `total_value` | integer | Total nilai penjualan (Rp) pada periode |

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
    "start_date": "start_date harus dalam format YYYY-MM-DD",
    "end_date": "end_date tidak boleh sebelum start_date",
    "sort_by": "sort_by harus salah satu dari: quantity, value",
    "limit": "limit harus berupa integer positif maksimal 50"
  }
}
```

---

## GET /api/dashboard/top-categories

**Deskripsi:** Mengambil daftar kategori terlaris berdasarkan nilai penjualan pada rentang tanggal. Setiap elemen dilengkapi persentase kontribusi terhadap total penjualan.

**Role:** Semua role

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `start_date` | string (YYYY-MM-DD) | Tidak | Tanggal awal (default: awal bulan berjalan) |
| `end_date` | string (YYYY-MM-DD) | Tidak | Tanggal akhir (default: hari ini) |
| `limit` | integer | Tidak | Jumlah kategori yang ditampilkan (default: `5`, max: `20`) |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "category_id": 1,
      "category_name": "Minuman",
      "total_sales": 8000000,
      "percentage": 45.5
    },
    {
      "category_id": 2,
      "category_name": "Makanan",
      "total_sales": 5500000,
      "percentage": 31.25
    }
  ]
}
```

**Keterangan Field per elemen `data`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `category_id` | integer | ID kategori |
| `category_name` | string | Nama kategori |
| `total_sales` | integer | Total nilai penjualan (Rp) pada periode |
| `percentage` | float | Persentase kontribusi terhadap total penjualan semua kategori (2 desimal) |

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
    "start_date": "start_date harus dalam format YYYY-MM-DD",
    "end_date": "end_date tidak boleh sebelum start_date",
    "limit": "limit harus berupa integer positif maksimal 20"
  }
}
```

---

## GET /api/dashboard/payment-methods

**Deskripsi:** Mengambil distribusi metode pembayaran berdasarkan nilai total dan jumlah transaksi pada rentang tanggal. Setiap elemen dilengkapi persentase kontribusi terhadap total penjualan.

**Role:** Semua role

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `start_date` | string (YYYY-MM-DD) | Tidak | Tanggal awal (default: awal bulan berjalan) |
| `end_date` | string (YYYY-MM-DD) | Tidak | Tanggal akhir (default: hari ini) |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "payment_method": "cash",
      "total": 10000000,
      "count": 200,
      "percentage": 65.0
    },
    {
      "payment_method": "debit",
      "total": 3000000,
      "count": 50,
      "percentage": 20.0
    },
    {
      "payment_method": "qris",
      "total": 2000000,
      "count": 40,
      "percentage": 15.0
    }
  ]
}
```

**Keterangan Field per elemen `data`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `payment_method` | string | Kode metode pembayaran (`cash`, `debit`, `credit`, `qris`, `transfer`) |
| `total` | integer | Total nilai transaksi (Rp) dengan metode ini pada periode |
| `count` | integer | Jumlah transaksi dengan metode ini pada periode |
| `percentage` | float | Persentase nilai terhadap total semua metode pembayaran (2 desimal) |

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
    "start_date": "start_date harus dalam format YYYY-MM-DD",
    "end_date": "end_date tidak boleh sebelum start_date"
  }
}
```

---

## Catatan

- Semua nilai uang (`total_sales`, `total_expenses`, `gross_profit`, `total`, `total_value`) menggunakan tipe integer dalam satuan Rupiah (tanpa desimal).
- `percentage` pada `top-categories` dan `payment-methods` dibulatkan ke dua angka desimal.
- Jika tidak ada transaksi pada periode yang dipilih, semua nilai numerik dikembalikan sebagai `0` dan array `data` dikembalikan kosong.
- Endpoint `stats` selalu mengembalikan `low_stock_count` dan `open_receivables` berdasarkan kondisi stok dan piutang **saat ini** (bukan snapshot historis), tidak terpengaruh oleh parameter `date`.
- Data `sales-trend` selalu dikembalikan urut dari paling lama ke paling baru (kiri ke kanan pada grafik).
- `top-products` dan `top-categories` diurutkan descending berdasarkan nilai terbesar.
- `payment-methods` diurutkan descending berdasarkan `total` (nilai terbesar di atas).
- Jumlah seluruh `percentage` pada `payment-methods` mungkin tidak persis 100% akibat pembulatan desimal — ini adalah perilaku yang diterima.
