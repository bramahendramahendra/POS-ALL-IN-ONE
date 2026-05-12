# Testing Guide — POS Multi-Platform

> Gunakan dokumen ini sebagai checklist testing. Baca dari atas ke bawah, satu blok per sesi.
>
> **Urutan testing:**
> 1. **Backend API** (Blok 1–10) — via Postman
> 2. **Desktop Electron** (Blok 11–14) — test manual di app
> 3. **Web** (Blok 17) — via browser
> 4. **Android** (Blok 18) — via emulator / device
>
> **Prasyarat sebelum mulai:** lihat [CARA_MENJALANKAN_APLIKASI.md](CARA_MENJALANKAN_APLIKASI.md) untuk setup MySQL, backend, dan desktop.

---

## Persiapan Sebelum Testing

Pastikan semua ini sudah berjalan sebelum memulai:

```
✅ MySQL berjalan
✅ Backend: cd backend && go run main.go  →  port 8080 aktif
✅ Desktop: cd desktop && npm start       →  window Electron terbuka
✅ Postman atau Bruno terinstall (untuk test API)
```

**Base URL API:** `http://localhost:8080/api`

**Akun default:**
| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | admin |
| owner    | owner123  | owner |

---

## Cara Menggunakan Dokumen Ini

- Tandai `[x]` setiap item yang sudah diuji
- Tulis di kolom **Hasil**: `✅ Lulus` atau `❌ Gagal — [deskripsi masalah]`
- Setiap blok bisa diuji secara independen
- Blok 1–10: test API via Postman/Bruno
- Blok 11–14: test manual di window Electron

---

## BLOK 1 — Verifikasi Struktur & Startup

### Tujuan
Memastikan backend dan database berhasil berjalan dari nol.

### Langkah

```powershell
# 1. Jalankan backend
cd backend
go run main.go
```

| # | Yang diuji | Cara cek | Hasil |
|---|---|---|---|
| 1.1 | Backend berhasil start | Terminal menampilkan `Listening and serving HTTP on :8080` | ✅ |
| 1.2 | Migration berjalan otomatis | Tidak ada pesan error `migration failed` di terminal | ✅ |
| 1.3 | Endpoint version aktif | `GET http://localhost:8080/api/version/android?current_version=1.0.0` → 200 OK | ✅ |
| 1.4 | Semua tabel terbuat | Buka MySQL: `SHOW TABLES;` → minimal 15+ tabel | ✅ |
| 1.5 | Data seed tersedia | `SHOW TABLES;` lalu cek: `SELECT * FROM users;` → ada 2 akun default | ✅ |

**Tabel yang wajib ada setelah migration:**
```sql
SHOW TABLES;
-- Harus ada minimal:
-- users, sessions, categories, units, products, product_units,
-- product_prices, transactions, transaction_items, cash_drawers,
-- expenses, purchase_orders, suppliers, customers, receivables,
-- shifts, stock_mutations, settings, sync_queue
```

---

## BLOK 2 — Autentikasi & Session

### Setup
Buka Postman/Bruno. Semua request ke `http://localhost:8080/api`.

### Test Cases

**2.1 Login berhasil (admin)**
```
POST /auth/login
Body (JSON):
{
  "username": "admin",
  "password": "admin123",
  "device_info": "desktop"
}
```
> `device_info` wajib diisi: `desktop`, `web`, atau `android`

| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | ✅ |
| Response berisi field `token` | ✅ |
| Response berisi field `refresh_token` | ✅ |
| Response berisi field `user` dengan role `admin` | ✅ |

> **Simpan token dari response ini** — dipakai di semua test selanjutnya.

**2.2 Login berhasil (owner)**
```
POST /auth/login
Body: { "username": "owner", "password": "owner123", "device_info": "desktop" }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | ✅ |
| field `role` di response = `owner` | ✅ |

**2.3 Login gagal — password salah**
```
POST /auth/login
Body: { "username": "admin", "password": "salah123", "device_info": "desktop" }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 401 Unauthorized | ✅ |
| Response berisi pesan error | ✅ |

**2.4 Login gagal — username tidak ada**
```
POST /auth/login
Body: { "username": "tidakada", "password": "abc", "device_info": "desktop" }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 401 atau 404 | ✅ |

**2.5 Akses endpoint protected tanpa token**
```
GET /users
Header: (kosong, tidak ada Authorization)
```
| Ekspektasi | Hasil |
|---|---|
| Status: 401 Unauthorized | ✅ |

**2.6 Akses endpoint protected dengan token valid**
```
GET /users
Header: Authorization: Bearer <token dari 2.1>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | ✅ |
| Response berisi array user | ✅ |

**2.7 Refresh token**
```
POST /auth/refresh
Body: { "refresh_token": "<refresh_token dari 2.1>" }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Response berisi token baru | ✅ |

**2.8 Logout**
```
POST /auth/logout
Header: Authorization: Bearer <token>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | ✅ |

**2.9 Token bekas logout tidak bisa dipakai**
```
GET /users
Header: Authorization: Bearer <token yang sudah logout>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 401 Unauthorized | ✅ |

---

## BLOK 3 — User Management

> Gunakan token **owner** untuk blok ini (owner punya akses penuh).

**3.1 List semua user**
```
GET /users
Header: Authorization: Bearer <token owner>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | ✅ |
| Response array minimal 2 user | ✅ |

**3.2 Buat user baru (kasir)**
```
POST /users
Header: Authorization: Bearer <token owner>
Body:
{
  "full_name": "Kasir Test",
  "username": "kasirtest",
  "password": "kasir123",
  "role": "kasir"
}
```
| Ekspektasi | Hasil |
|---|---|
| Status: 201 Created | ✅ |
| Response berisi data user baru | ✅ |

> **Catat ID user baru** dari response — dipakai di test berikutnya.

**3.3 Update user**
```
PUT /users/<id>
Header: Authorization: Bearer <token owner>
Body: { "full_name": "Kasir Testing Satu", "role": "kasir" }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | ✅ |
| Nama berubah di response | ✅ |

**3.4 Kasir tidak bisa akses user management**
```
# Login sebagai kasir dulu:
POST /auth/login
Body: 
{
    "username": "kasirtest",
    "password": "kasir123",
    "device_info": "desktop"
}
# Ambil token kasir, lalu:

GET /users
Header: Authorization: Bearer <token kasir>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 403 Forbidden | ✅ |

---

## BLOK 4 — Kategori & Satuan (Master Data)

**4.1 List kategori**
```
GET /categories
Header: Authorization: Bearer <token>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |

**4.2 Buat kategori baru**
```
POST /categories
Header: Authorization: Bearer <token>
Body: { "name": "Minuman" }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 201 Created | |

**4.3 List satuan**
```
GET /units
Header: Authorization: Bearer <token>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |

**4.4 Buat satuan baru**
```
POST /units
Header: Authorization: Bearer <token>
Body: { "name": "Pcs", "abbreviation": "pcs" }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 201 Created | |

---

## BLOK 5 — Produk

> Catat `category_id` dan `unit_id` dari blok sebelumnya.

**5.1 Buat produk baru**
```
POST /products
Header: Authorization: Bearer <token admin/owner>
Body:
{
  "name": "Aqua 600ml",
  "barcode": "8999999001234",
  "category_id": 1,
  "unit": "botol",
  "purchase_price": 2500,
  "selling_price": 3500,
  "stock": 100,
  "min_stock": 10
}
```
> Field wajib: `name`, `selling_price`, `unit`. Sisanya opsional.

| Ekspektasi | Hasil |
|---|---|
| Status: 201 Created | |
| Response berisi ID produk | |

> **Catat product_id** dari response.

**5.2 Buat produk kedua**
```
POST /products
Body:
{
  "name": "Indomie Goreng",
  "barcode": "8886000001234",
  "category_id": 1,
  "unit": "pcs",
  "purchase_price": 2800,
  "selling_price": 3500,
  "stock": 50,
  "min_stock": 5
}
```
| Ekspektasi | Hasil |
|---|---|
| Status: 201 Created | |

**5.3 Duplikat barcode harus ditolak**
```
POST /products
Body: { "name": "Test", "barcode": "8999999001234", "selling_price": 1000, "unit": "pcs" }
(barcode sama dengan produk pertama)
```
| Ekspektasi | Hasil |
|---|---|
| Status: 400 atau 409 Conflict | |
| Ada pesan error barcode duplikat | |

**5.4 Search produk by nama**
```
GET /products?search=aqua
Header: Authorization: Bearer <token>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Hanya produk "Aqua 600ml" yang muncul | |

**5.5 Search produk by barcode**
```
GET /products/barcode/8999999001234
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Tepat 1 produk di response | |

**5.6 List produk stok rendah**
```
GET /products?low_stock=1
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |

**5.7 Update produk**
```
PUT /products/<id>
Body:
{
  "name": "Aqua 600ml",
  "unit": "botol",
  "selling_price": 4000,
  "purchase_price": 2500,
  "stock": 100,
  "min_stock": 10
}
```
> PUT harus kirim semua field (bukan partial update)

| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Harga jual berubah saat `GET /products/<id>` | |

---

## BLOK 6 — Supplier & Purchase Order

**6.1 Buat supplier**
```
POST /suppliers
Header: Authorization: Bearer <token>
Body:
{
  "name": "PT Sumber Air Jaya",
  "phone": "08123456789",
  "address": "Jl. Raya No. 1"
}
```
| Ekspektasi | Hasil |
|---|---|
| Status: 201 Created | |

> **Catat supplier_id.**

**6.2 Buat Purchase Order (stok masuk)**
```
POST /purchase-orders
Header: Authorization: Bearer <token>
Body:
{
  "supplier_id": 1,
  "items": [
    { "product_id": 1, "qty": 50, "buy_price": 2500 }
  ],
  "notes": "PO Test"
}
```
| Ekspektasi | Hasil |
|---|---|
| Status: 201 Created | |

**6.3 Verifikasi stok bertambah**
```
GET /products/1
```
| Ekspektasi | Hasil |
|---|---|
| Stock sekarang = 100 + 50 = 150 | |

---

## BLOK 7 — Pelanggan & Piutang

**7.1 Buat pelanggan**
```
POST /customers
Header: Authorization: Bearer <token>
Body:
{
  "name": "Budi Santoso",
  "phone": "08111222333",
  "address": "Jl. Mawar No. 5"
}
```
| Ekspektasi | Hasil |
|---|---|
| Status: 201 Created | |

> **Catat customer_id.**

**7.2 List pelanggan**
```
GET /customers
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Budi Santoso ada di list | |

---

## BLOK 8 — Transaksi Penjualan (Core Feature)

### 8.1 Buka Kas Harian

```
POST /cash-drawers/open
Header: Authorization: Bearer <token>
Body: { "opening_balance": 500000 }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 atau 201 | |

### 8.2 Buat Transaksi Tunai

```
POST /transactions
Header: Authorization: Bearer <token>
Body:
{
  "subtotal": 17500,
  "discount": 0,
  "tax": 0,
  "total_amount": 17500,
  "payment_method": "cash",
  "payment_amount": 20000,
  "change_amount": 2500,
  "device_source": "desktop",
  "items": [
    {
      "product_id": 1,
      "product_name": "Aqua 600ml",
      "quantity": 2,
      "unit": "botol",
      "price": 3500,
      "subtotal": 7000,
      "discount_item": 0,
      "conversion_qty": 1
    },
    {
      "product_id": 2,
      "product_name": "Indomie Goreng",
      "quantity": 3,
      "unit": "pcs",
      "price": 3500,
      "subtotal": 10500,
      "discount_item": 0,
      "conversion_qty": 1
    }
  ]
}
```
> `payment_method`: `cash`, `transfer`, `qris`, atau `credit`
> `device_source`: `desktop`, `web`, atau `android`

| Ekspektasi | Hasil |
|---|---|
| Status: 201 Created | |
| Response berisi `transaction_code` | |
| `change_amount` = 2500 (20000 - 17500) | |

> **Catat transaction_id.**

### 8.3 Verifikasi Stok Berkurang

```
GET /products/1
```
| Ekspektasi | Hasil |
|---|---|
| Stok berkurang 2 (150 → 148) | |

```
GET /products/2
```
| Ekspektasi | Hasil |
|---|---|
| Stok berkurang 3 (50 → 47) | |

### 8.4 List Transaksi

```
GET /transactions
Header: Authorization: Bearer <token>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Transaksi yang baru dibuat ada di list | |

### 8.5 Detail Transaksi

```
GET /transactions/<transaction_id>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Items dan total sesuai | |

### 8.6 Transaksi dengan Pelanggan Terdaftar

```
POST /transactions
Body:
{
  "customer_id": 1,
  "subtotal": 3500,
  "discount": 0,
  "tax": 0,
  "total_amount": 3500,
  "payment_method": "cash",
  "payment_amount": 5000,
  "change_amount": 1500,
  "device_source": "desktop",
  "items": [
    {
      "product_id": 1,
      "product_name": "Aqua 600ml",
      "quantity": 1,
      "unit": "botol",
      "price": 3500,
      "subtotal": 3500,
      "discount_item": 0,
      "conversion_qty": 1
    }
  ]
}
```
| Ekspektasi | Hasil |
|---|---|
| Status: 201 Created | |
| customer_id tercatat di transaksi | |

### 8.7 Transaksi dengan Piutang (Kredit)

```
POST /transactions
Body:
{
  "customer_id": 1,
  "subtotal": 17500,
  "discount": 0,
  "tax": 0,
  "total_amount": 17500,
  "payment_method": "credit",
  "payment_amount": 0,
  "change_amount": 0,
  "is_credit": true,
  "device_source": "desktop",
  "items": [
    {
      "product_id": 1,
      "product_name": "Aqua 600ml",
      "quantity": 5,
      "unit": "botol",
      "price": 3500,
      "subtotal": 17500,
      "discount_item": 0,
      "conversion_qty": 1
    }
  ]
}
```
| Ekspektasi | Hasil |
|---|---|
| Status: 201 Created | |
| Piutang tercatat di tabel receivables | |

### 8.8 Bayar Piutang

```
GET /receivables
(Cari ID piutang pelanggan Budi)

POST /receivables/<id>/pay
Body: { "amount": 10000 }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Sisa piutang berkurang | |

### 8.9 Void Transaksi

```
PATCH /transactions/<transaction_id>/void
Header: Authorization: Bearer <token owner>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Stok produk kembali ke jumlah sebelum transaksi | |

---

## BLOK 9 — Kas Harian, Pengeluaran & Shift

**9.1 Catat pengeluaran**
```
POST /expenses
Header: Authorization: Bearer <token>
Body:
{
  "description": "Beli kantong plastik",
  "amount": 25000,
  "category": "operasional"
}
```
| Ekspektasi | Hasil |
|---|---|
| Status: 201 Created | |

**9.2 Buka shift**
```
POST /shifts/open
Header: Authorization: Bearer <token>
Body: { "shift_name": "Pagi", "cashier_id": 1 }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 201 Created | |

> **Catat shift_id.**

**9.3 Tutup shift**
```
POST /shifts/<shift_id>/close
Body: { "closing_balance": 600000 }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Response berisi ringkasan shift | |

**9.4 Tutup kas harian**
```
POST /cash-drawers/close
Header: Authorization: Bearer <token>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Response berisi laporan kas | |

---

## BLOK 10 — Laporan & Dashboard

**10.1 Dashboard**
```
GET /dashboard
Header: Authorization: Bearer <token>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Ada field: today_sales, today_transactions, low_stock_count | |

**10.2 Laporan penjualan**
```
GET /reports/sales?start=2026-05-01&end=2026-05-31
Header: Authorization: Bearer <token>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Data penjualan yang baru dibuat muncul | |

**10.3 Laporan laba rugi**
```
GET /reports/profit-loss?month=2026-05
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Ada field: revenue, cogs, gross_profit, expenses, net_profit | |

**10.4 Laporan stok**
```
GET /reports/stock
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Stok produk sesuai dengan yang tersisa | |

**10.5 Settings toko**
```
GET /settings
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Ada field: store_name, tax_percent, dll. | |

**10.6 Update settings**
```
PUT /settings
Body: { "store_name": "Toko Maju Jaya", "tax_percent": 11 }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |

---

## BLOK 11 — Desktop Electron: Tampilan & Navigasi

> Test manual di window Electron. Buka DevTools dengan F12 untuk monitor error.

| # | Langkah | Yang diharapkan | Hasil |
|---|---|---|---|
| 11.1 | Buka aplikasi saat backend belum jalan | Muncul indikator error/offline, bukan crash | |
| 11.2 | Jalankan backend, buka aplikasi | Halaman login tampil | |
| 11.3 | Login dengan username/password salah | Muncul pesan error, tidak masuk | |
| 11.4 | Login dengan `admin` / `admin123` | Masuk ke halaman Dashboard | |
| 11.5 | Klik setiap menu di sidebar (satu per satu) | Halaman terbuka, tidak ada error merah di DevTools Console | |
| 11.6 | Logout | Kembali ke halaman Login | |
| 11.7 | Login sebagai kasir (`kasirtest`/`kasir123`) | Masuk, menu Laporan & Pengguna tidak tampil | |
| 11.8 | Buka DevTools (F12) → tab Console | Tidak ada error merah (error kuning oke) | |

---

## BLOK 12 — Desktop: Fitur Kasir

| # | Langkah | Yang diharapkan | Hasil |
|---|---|---|---|
| 12.1 | Buka menu Kasir | Halaman kasir tampil dengan form transaksi | |
| 12.2 | Ketik nama produk di kolom pencarian | Autocomplete/list produk muncul | |
| 12.3 | Ketik barcode produk (misal `8999999001234`) | Produk langsung masuk ke keranjang | |
| 12.4 | Tambah item yang sama dua kali | Qty bertambah, tidak ditambah sebagai item baru | |
| 12.5 | Ubah qty di keranjang (ketik angka) | Total harga update otomatis | |
| 12.6 | Hapus satu item dari keranjang | Item hilang, total direcalculate | |
| 12.7 | Klik tombol Bayar | Modal/form pembayaran muncul | |
| 12.8 | Isi nominal bayar lebih dari total | Kembalian tampil dengan benar | |
| 12.9 | Konfirmasi pembayaran | Transaksi berhasil, keranjang kosong, muncul notifikasi sukses | |
| 12.10 | Buka halaman Transaksi | Transaksi yang baru dibuat ada di list | |
| 12.11 | Buka halaman Produk | Stok produk berkurang sesuai yang dijual | |
| 12.12 | Klik tombol Cetak Struk | Preview struk/receipt muncul | |

---

## BLOK 13 — Desktop: Fitur Produk

| # | Langkah | Yang diharapkan | Hasil |
|---|---|---|---|
| 13.1 | Buka menu Produk | List produk tampil | |
| 13.2 | Klik Tambah Produk → isi semua field → simpan | Produk baru muncul di list | |
| 13.3 | Tambah produk dengan barcode duplikat | Muncul pesan error duplikat | |
| 13.4 | Klik Edit pada produk → ubah harga → simpan | Harga berubah di list | |
| 13.5 | Cari produk by nama di search box | List filter sesuai pencarian | |
| 13.6 | Filter produk by kategori | Hanya produk kategori itu yang tampil | |
| 13.7 | Klik Cetak Label Barcode | Preview label muncul / print dialog terbuka | |
| 13.8 | Import produk via file Excel/CSV | Produk baru muncul di list | |

---

## BLOK 14 — Desktop: Offline Mode & Sync

### Cara Test Offline

```
1. Pastikan backend berjalan dan desktop online
2. Buat 1 transaksi sukses → konfirmasi berhasil normal

3. Matikan backend: tekan Ctrl+C di terminal backend

4. Perhatikan UI desktop:
   Expected: ada indikator "Offline" atau badge merah muncul

5. Buat transaksi baru saat offline
   Expected: transaksi tersimpan lokal (BUKAN error gagal)

6. Buka Sync Center
   Expected: ada item dengan status "pending" / antrian

7. Jalankan kembali backend: go run main.go

8. Perhatikan UI desktop:
   Expected: indikator berubah ke "Online" dalam ~30 detik

9. Buka Sync Center
   Expected: status item berubah dari pending → processing → done
```

| # | Yang diuji | Hasil |
|---|---|---|
| 14.1 | Indikator Offline muncul saat backend mati | |
| 14.2 | Transaksi offline tersimpan (tidak error) | |
| 14.3 | Antrian sync terbentuk di Sync Center | |
| 14.4 | Indikator Online muncul setelah backend hidup | |
| 14.5 | Item antrian diproses (pending → done) | |
| 14.6 | Data offline muncul di backend setelah sync (cek via Postman) | |
| 14.7 | Tidak ada data duplikat setelah sync | |

### Test Resume Sync (Lanjut dari Putus Tengah Jalan)

```
1. Saat offline, buat 5 transaksi offline
2. Jalankan backend → sync mulai berjalan
3. Di tengah proses sync, matikan backend lagi
4. Jalankan backend lagi
Expected: sync lanjut dari yang belum selesai, tidak ada duplikat
```

| # | Yang diuji | Hasil |
|---|---|---|
| 14.8 | Sync resume dari posisi terakhir (tidak mengulang dari awal) | |
| 14.9 | Tidak ada duplikat transaksi setelah resume | |

---

## BLOK 15 — Backup & Restore

**15.1 Backup manual**
```
POST /backup
Header: Authorization: Bearer <token owner>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Response berisi path file backup atau file terdownload | |

**15.2 Cek file backup ada**
```
# Cek folder backup/ di dalam project backend/
ls backend/backups/
# atau path sesuai response
```
| Ekspektasi | Hasil |
|---|---|
| File .sql atau .zip ada dengan timestamp terbaru | |

**15.3 Restore (opsional — hati-hati, data akan tertimpa)**
```
POST /restore
Header: Authorization: Bearer <token owner>
Body: form-data
  file: <file backup.sql>
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |
| Data terestore setelah restart backend | |

---

## BLOK 16 — Notifikasi & PIN Lock

**16.1 Set PIN**
```
POST /pin/set
Header: Authorization: Bearer <token>
Body: { "pin": "1234" }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |

**16.2 Verifikasi PIN benar**
```
POST /pin/verify
Body: { "pin": "1234" }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 200 OK | |

**16.3 Verifikasi PIN salah**
```
POST /pin/verify
Body: { "pin": "9999" }
```
| Ekspektasi | Hasil |
|---|---|
| Status: 400 atau 401 | |

**16.4 Test notifikasi stok rendah**
```
# Buat transaksi yang menguras stok sampai di bawah min_stock

# Produk dengan min_stock = 10, stok saat ini = 12:
POST /transactions
Body: { "items": [{ "product_id": 1, "qty": 5, "price": 3500 }], ... }
# Ulangi sampai stok < 10

# Lalu:
GET /products/low-stock
```
| Ekspektasi | Hasil |
|---|---|
| Produk muncul di endpoint low-stock | |
| Di desktop: muncul notifikasi/badge stok rendah | |

---

## Ringkasan Progress Testing

Tandai ✅ setelah tiap blok selesai.

| Blok | Area | Jumlah Test | Status |
|---|---|---|---|
| 1 | Verifikasi Startup & Database | 5 | ⬜ |
| 2 | Autentikasi & Session | 9 | ⬜ |
| 3 | User Management | 4 | ⬜ |
| 4 | Kategori & Satuan | 4 | ⬜ |
| 5 | Produk | 7 | ⬜ |
| 6 | Supplier & Purchase Order | 3 | ⬜ |
| 7 | Pelanggan | 2 | ⬜ |
| 8 | Transaksi Penjualan | 9 | ⬜ |
| 9 | Kas, Pengeluaran & Shift | 4 | ⬜ |
| 10 | Laporan & Dashboard | 6 | ⬜ |
| 11 | Desktop: Tampilan & Navigasi | 8 | ⬜ |
| 12 | Desktop: Fitur Kasir | 12 | ⬜ |
| 13 | Desktop: Fitur Produk | 8 | ⬜ |
| 14 | Desktop: Offline Mode & Sync | 9 | ⬜ |
| 15 | Backup & Restore | 3 | ⬜ |
| 16 | Notifikasi & PIN Lock | 4 | ⬜ |
| 17 | Web App | 4 | ⬜ |
| 18 | Android App | 4 | ⬜ |
| **TOTAL** | | **115** | |

---

## Tips Debugging Cepat

| Gejala | Yang Perlu Dicek |
|---|---|
| `401 Unauthorized` padahal sudah login | Token expired? Copy ulang token dari response login terbaru |
| `403 Forbidden` | Role user tidak punya akses ke endpoint itu — login sebagai owner |
| `500 Internal Server Error` | Lihat terminal backend — ada stack trace di sana |
| Desktop blank / tidak load | Buka DevTools F12 → Console, cari error merah |
| Desktop tidak konek ke backend | Cek `desktop/src/js/config.js` — pastikan `API_BASE_URL` = `http://localhost:8080/api` |
| Stok tidak berkurang setelah transaksi | Cek handler transaksi — apakah `stock_mutations` diinsert |
| Sync tidak berjalan | DevTools → Console, cari error di `sync-engine.js` |
| Migration error saat `go run main.go` | Pesan error akan muncul di terminal — biasanya masalah koneksi DB atau SQL syntax |
| Data seed tidak ada (tabel users kosong) | Hapus database, buat ulang, jalankan `go run main.go` lagi |
| `Cannot connect to MySQL` | Cek password di `config_dev.json`, pastikan MySQL jalan |

---

## BLOK 17 — Web App

> Pastikan backend sudah berjalan di port 8080.

| # | Langkah | Yang diharapkan | Hasil |
|---|---|---|---|
| 17.1 | Buka `http://localhost:3000` (atau port web app) di browser | Halaman login tampil | |
| 17.2 | Login dengan `admin` / `admin123` | Masuk ke dashboard | |
| 17.3 | Fitur dasar (produk, transaksi) bisa diakses | Tidak ada error di browser console | |
| 17.4 | Logout | Kembali ke halaman login | |

> Blok ini akan diperbarui setelah Web App selesai dikembangkan.

---

## BLOK 18 — Android App

> Pastikan backend dapat diakses dari device/emulator (gunakan IP lokal, bukan `localhost`).

| # | Langkah | Yang diharapkan | Hasil |
|---|---|---|---|
| 18.1 | Install APK di emulator atau device | App terbuka tanpa crash | |
| 18.2 | Login dengan akun valid, `device_info: "android"` | Masuk ke halaman utama | |
| 18.3 | Buat transaksi dari app | Transaksi muncul di backend (`GET /transactions`) | |
| 18.4 | Cek endpoint versi: `GET /api/version/android?current_version=1.0.0` | Response menunjukkan update atau "sudah terbaru" | |

> Blok ini akan diperbarui setelah Android App selesai dikembangkan.
