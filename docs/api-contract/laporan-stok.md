# API Contract — Laporan Stok

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/reports/stock` |
| Auth | Bearer Token (semua endpoint) |
| Role | Semua role (GET), owner/admin (export) |
| Format | JSON (`application/json`) atau File Excel (export) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/reports/stock` | Semua role | Laporan stok produk dengan ringkasan dan detail per produk |
| GET | `/api/reports/stock/export` | owner, admin | Export laporan stok ke file Excel (.xlsx) |

---

## Logika Bisnis

- Data stok diambil dari kolom `stock` pada tabel `products`.
- **Stock Value** per produk = `purchase_price × stock`.
- **Total Stock Value** = jumlah `stock_value` seluruh produk yang ditampilkan.
- **is_low_stock** = `true` jika `stock < min_stock`.
- **Low Stock Count** = jumlah produk dengan `is_low_stock = true` dari seluruh dataset (sebelum paginasi).
- Filter `low_stock=1` hanya menampilkan produk di mana `stock < min_stock`.
- Filter `category_id` memfilter berdasarkan `products.category_id`.
- `total_products` dalam summary mencerminkan jumlah total produk yang cocok dengan filter (bukan jumlah per halaman).
- Produk yang dinonaktifkan (`is_active = false`) tidak diikutsertakan dalam laporan.

---

## GET /api/reports/stock

**Deskripsi:** Mengambil laporan stok seluruh produk aktif, dilengkapi ringkasan nilai stok dan daftar produk yang dapat difilter berdasarkan kategori atau kondisi stok rendah.

**Role:** Semua role

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `category_id` | integer | Tidak | Filter berdasarkan ID kategori produk |
| `low_stock` | integer (0/1) | Tidak | `1` = hanya tampilkan produk di bawah `min_stock` |
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
      "total_products": 120,
      "total_stock_value": 45000000,
      "low_stock_count": 8
    },
    "products": [
      {
        "id": 1,
        "name": "Kopi Susu",
        "category_name": "Minuman",
        "stock": 50,
        "min_stock": 10,
        "unit": "pcs",
        "purchase_price": 8000,
        "stock_value": 400000,
        "is_low_stock": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 120
    }
  }
}
```

**Keterangan Field `products`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID produk |
| `name` | string | Nama produk |
| `category_name` | string | Nama kategori produk |
| `stock` | integer | Jumlah stok saat ini |
| `min_stock` | integer | Batas minimum stok |
| `unit` | string | Satuan produk |
| `purchase_price` | integer | Harga beli produk (Rp) |
| `stock_value` | integer | Nilai stok = `purchase_price × stock` (Rp) |
| `is_low_stock` | boolean | `true` jika `stock < min_stock` |

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
    "category_id": "category_id harus berupa integer positif",
    "low_stock": "low_stock hanya menerima nilai 0 atau 1"
  }
}
```

---

## GET /api/reports/stock/export

**Deskripsi:** Mengekspor laporan stok ke file Excel (.xlsx). Filter yang berlaku sama dengan endpoint `/api/reports/stock`. Seluruh data dikembalikan tanpa paginasi.

**Role:** owner, admin

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `category_id` | integer | Tidak | Filter berdasarkan ID kategori produk |
| `low_stock` | integer (0/1) | Tidak | `1` = hanya ekspor produk di bawah `min_stock` |

**Response Headers (200):**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="laporan-stok-2024-01-31.xlsx"
```

**Response Body:** Binary file (.xlsx) — bukan JSON.

**Sheet 1 — Ringkasan:**

| Kolom | Keterangan |
|-------|------------|
| Total Produk | Jumlah total produk aktif (sesuai filter) |
| Total Nilai Stok | Total nilai stok seluruh produk (Rp) |
| Produk Stok Rendah | Jumlah produk di bawah minimum stok |

**Sheet 2 — Detail Stok per Produk:**

| Kolom | Keterangan |
|-------|------------|
| No | Nomor urut |
| Nama Produk | `name` |
| Kategori | `category_name` |
| Stok | `stock` |
| Min Stok | `min_stock` |
| Satuan | `unit` |
| Harga Beli | `purchase_price` (Rp) |
| Nilai Stok | `stock_value` (Rp) |
| Status | `Stok Rendah` jika `is_low_stock = true`, kosong jika normal |

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

- Tidak ada tabel baru untuk laporan stok — data diambil langsung dari tabel `products` dengan join ke `categories`.
- `total_stock_value` dan `low_stock_count` dalam summary selalu dihitung dari seluruh produk yang cocok dengan filter, bukan hanya produk pada halaman yang sedang ditampilkan.
- Endpoint `/export` tidak dipaginasi — seluruh data sesuai filter dikembalikan dalam satu file.
- Filename pada export menggunakan tanggal server saat request dilakukan.
- Jika tidak ada produk yang cocok dengan filter, `products` dikembalikan sebagai array kosong dan semua nilai summary adalah `0`.
