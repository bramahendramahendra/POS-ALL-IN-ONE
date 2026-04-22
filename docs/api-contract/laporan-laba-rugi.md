# API Contract — Laporan Laba Rugi

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/reports/profit-loss` |
| Auth | Bearer Token (semua endpoint) |
| Role | owner, admin |
| Format | JSON (`application/json`) atau File Excel (export) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/reports/profit-loss` | owner, admin | Laporan laba rugi dalam rentang periode tertentu |
| GET | `/api/reports/profit-loss/export` | owner, admin | Export laporan laba rugi ke file Excel (.xlsx) |

---

## Logika Bisnis

- Laporan hanya mencakup transaksi dengan status `completed`.
- **Gross Sales** = total `transactions.total_amount` dalam periode.
- **Discount** = total `transactions.discount` dalam periode.
- **Net Sales** = `gross_sales - discount`.
- **COGS (Cost of Goods Sold)** = jumlah `purchase_price × qty_sold` per produk, dihitung dari `transaction_items` join `products`.
- **Gross Profit** = `net_sales - total_cogs`.
- **Expenses** = total pengeluaran dari tabel `expenses` dalam periode, dikelompokkan per `category`.
- **Net Profit** = `gross_profit - total_expenses`.
- **Gross Margin %** = `(gross_profit / net_sales) × 100`, dibulatkan 2 desimal.
- **Net Margin %** = `(net_profit / net_sales) × 100`, dibulatkan 2 desimal.
- Jika `net_sales = 0`, maka `gross_margin_percent` dan `net_margin_percent` dikembalikan sebagai `0`.
- Semua filter tanggal menggunakan format `YYYY-MM-DD` dan diinterpretasikan sebagai rentang inklusif.

---

## GET /api/reports/profit-loss

**Deskripsi:** Mengambil laporan laba rugi lengkap dalam rentang periode tertentu, mencakup pendapatan, HPP, laba kotor, beban operasional, dan laba bersih.

**Role:** owner, admin

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `start_date` | string (YYYY-MM-DD) | Tidak | Tanggal awal periode |
| `end_date` | string (YYYY-MM-DD) | Tidak | Tanggal akhir periode |

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
    "revenue": {
      "gross_sales": 15000000,
      "discount": 500000,
      "net_sales": 14500000
    },
    "cogs": {
      "total_cogs": 9000000,
      "details": [
        {
          "product_name": "Kopi Susu",
          "qty_sold": 200,
          "purchase_price": 8000,
          "total_cogs": 1600000
        }
      ]
    },
    "gross_profit": 5500000,
    "expenses": {
      "total_expenses": 800000,
      "details": [
        { "category": "Operasional", "total": 500000 },
        { "category": "Gaji", "total": 300000 }
      ]
    },
    "net_profit": 4700000,
    "gross_margin_percent": 37.93,
    "net_margin_percent": 32.41
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
    "start_date": "Format tanggal harus YYYY-MM-DD",
    "end_date": "end_date tidak boleh lebih awal dari start_date"
  }
}
```

---

## GET /api/reports/profit-loss/export

**Deskripsi:** Mengekspor laporan laba rugi ke file Excel (.xlsx). Filter yang berlaku sama dengan endpoint `/api/reports/profit-loss`.

**Role:** owner, admin

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `start_date` | string (YYYY-MM-DD) | Tidak | Tanggal awal periode |
| `end_date` | string (YYYY-MM-DD) | Tidak | Tanggal akhir periode |

**Response Headers (200):**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="laporan-laba-rugi-2024-01-01_2024-01-31.xlsx"
```

**Response Body:** Binary file (.xlsx) — bukan JSON.

**Sheet 1 — Ringkasan:**

| Kolom | Keterangan |
|-------|------------|
| Periode | Rentang tanggal laporan |
| Gross Sales | Total penjualan kotor |
| Diskon | Total diskon |
| Net Sales | Penjualan bersih |
| Total HPP | Total Cost of Goods Sold |
| Laba Kotor | Gross profit |
| Total Beban | Total pengeluaran/expenses |
| Laba Bersih | Net profit |
| Gross Margin % | Persentase laba kotor |
| Net Margin % | Persentase laba bersih |

**Sheet 2 — Detail HPP per Produk:**

| Kolom | Keterangan |
|-------|------------|
| No | Nomor urut |
| Nama Produk | `product_name` |
| Qty Terjual | `qty_sold` |
| Harga Beli | `purchase_price` |
| Total HPP | `total_cogs` |

**Sheet 3 — Detail Beban per Kategori:**

| Kolom | Keterangan |
|-------|------------|
| No | Nomor urut |
| Kategori | `category` |
| Total | `total` |

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

- Tidak ada tabel baru untuk laporan laba rugi — data dihitung dari `transactions`, `transaction_items`, `products`, dan `expenses`.
- COGS dihitung menggunakan `purchase_price` dari tabel `products` pada saat laporan dibuat (bukan harga historis).
- Endpoint `/export` menghasilkan file multi-sheet: Ringkasan, Detail HPP, dan Detail Beban.
- Endpoint `/export` tidak dipaginasi — seluruh data dalam rentang filter dikembalikan dalam satu file.
- Rentang tanggal maksimum yang disarankan untuk export adalah 3 bulan untuk menjaga performa query.
- Jika tidak ada transaksi dalam periode yang dipilih, semua nilai numerik dikembalikan sebagai `0`.
