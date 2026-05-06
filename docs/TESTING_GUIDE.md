# Testing Guide — POS Multi-Platform (Fase 0–3)

> Panduan ini mencakup semua yang perlu diuji setelah menyelesaikan Fase 0 (Setup), Fase 1 (API Contract), Fase 2 (Backend Go), dan Fase 3 (Desktop Electron + Offline/Sync).

---

## Prasyarat Sebelum Testing

| Kebutuhan | Detail |
|---|---|
| MySQL berjalan | Database `pos_db` sudah dibuat & migration dijalankan |
| Backend berjalan | `cd backend && go run main.go` → port `8080` |
| Desktop berjalan | `cd desktop && npm start` → Electron window terbuka |
| Tool API | [Postman](https://postman.com) atau [Bruno](https://usebruno.com) |
| Base URL Backend | `http://localhost:8080/api` |

---

## BLOK 1 — Struktur Project (Fase 0)

### Apa yang diuji
Memastikan folder, config, dan .gitignore sudah bersih.

### Cara testing

```
# 1. Cek folder ada
ls desktop/   → harus ada (bukan "destop")
ls web/       → folder kosong/placeholder
ls android/   → folder kosong/placeholder

# 2. Cek backend tidak ada import ESB/BRIGate/Minio
grep -r "ESB\|BRIGate\|Minio\|Bristars" backend/ --include="*.go"
# Hasilnya harus KOSONG

# 3. Cek .gitignore
cat .gitignore
# Harus ada: node_modules/, *.env, backend/config.json (prod), dll.
```

**Lulus jika:** tidak ada folder `destop`, tidak ada import yang dihapus, .gitignore lengkap.

---

## BLOK 2 — Database & Migration (Fase 1 & 2)

### Apa yang diuji
Semua tabel terbuat dengan relasi dan index yang benar.

### Cara testing

```sql
-- Jalankan di MySQL client (TablePlus / DBeaver / mysql CLI):
SHOW TABLES;

-- Tabel wajib ada:
-- users, sessions, pin_locks, categories, units, products,
-- product_units, product_prices, transactions, transaction_items,
-- cash_drawers, expenses, purchase_orders, purchase_order_items,
-- supplier_returns, suppliers, customers, receivables, shifts,
-- stock_mutations, settings, sync_queue, app_versions

-- Cek relasi contoh:
DESCRIBE transactions;
DESCRIBE transaction_items;
SHOW INDEX FROM products;
```

**Lulus jika:** semua tabel ada, foreign key terdefinisi, index pada kolom pencarian (barcode, name, created_at).

---

## BLOK 3 — Auth & Session (Fase 2 — domain/auth)

### Apa yang diuji
Login, logout, refresh token, dan single active session.

### Cara testing dengan Postman/Bruno

**3.1 Login berhasil**
```
POST http://localhost:8080/api/auth/login
Body JSON:
{
  "username": "admin",
  "password": "password123"
}
Expected: 200 OK
Response: { "token": "...", "refresh_token": "...", "user": {...} }
```

**3.2 Login gagal — password salah**
```
POST http://localhost:8080/api/auth/login
Body: { "username": "admin", "password": "salah" }
Expected: 401 Unauthorized
```

**3.3 Akses endpoint protected tanpa token**
```
GET http://localhost:8080/api/users
Header: (kosong)
Expected: 401 Unauthorized
```

**3.4 Akses dengan token valid**
```
GET http://localhost:8080/api/users
Header: Authorization: Bearer <token dari 3.1>
Expected: 200 OK
```

**3.5 Refresh token**
```
POST http://localhost:8080/api/auth/refresh
Body: { "refresh_token": "<refresh_token dari 3.1>" }
Expected: 200 OK, token baru
```

**3.6 Logout**
```
POST http://localhost:8080/api/auth/logout
Header: Authorization: Bearer <token>
Expected: 200 OK
```

**3.7 Token setelah logout tidak bisa dipakai**
```
GET http://localhost:8080/api/users
Header: Authorization: Bearer <token yang sudah logout>
Expected: 401 Unauthorized
```

---

## BLOK 4 — PIN Lock (Fase 2 — domain/pin)

### Cara testing

**4.1 Set PIN**
```
POST http://localhost:8080/api/pin/set
Header: Authorization: Bearer <token>
Body: { "pin": "1234" }
Expected: 200 OK
```

**4.2 Verifikasi PIN benar**
```
POST http://localhost:8080/api/pin/verify
Body: { "pin": "1234" }
Expected: 200 OK
```

**4.3 Verifikasi PIN salah**
```
POST http://localhost:8080/api/pin/verify
Body: { "pin": "9999" }
Expected: 400/401
```

---

## BLOK 5 — User Management (Fase 2 — domain/user)

### Cara testing

**5.1 List user**
```
GET http://localhost:8080/api/users
Header: Authorization: Bearer <token admin>
Expected: 200, array user
```

**5.2 Buat user baru**
```
POST http://localhost:8080/api/users
Body: { "name": "Kasir 1", "username": "kasir1", "password": "pass123", "role": "kasir" }
Expected: 201 Created
```

**5.3 Update user**
```
PUT http://localhost:8080/api/users/:id
Body: { "name": "Kasir Satu" }
Expected: 200 OK
```

**5.4 Toggle status user**
```
PATCH http://localhost:8080/api/users/:id/toggle
Expected: 200, status berubah aktif/nonaktif
```

**5.5 Role restriction — kasir tidak bisa akses user management**
```
Login sebagai kasir → ambil token
GET http://localhost:8080/api/users
Header: Authorization: Bearer <token kasir>
Expected: 403 Forbidden
```

---

## BLOK 6 — Produk (Fase 2 — domain/product)

### Cara testing

**6.1 Buat produk**
```
POST http://localhost:8080/api/products
Body: {
  "name": "Aqua 600ml",
  "barcode": "8999999001234",
  "category_id": 1,
  "unit_id": 1,
  "price": 3000,
  "stock": 100
}
Expected: 201 Created
```

**6.2 Search produk by nama**
```
GET http://localhost:8080/api/products?search=aqua
Expected: 200, list produk yang mengandung "aqua"
```

**6.3 Search by barcode**
```
GET http://localhost:8080/api/products?barcode=8999999001234
Expected: 200, 1 produk
```

**6.4 Low stock alert**
```
GET http://localhost:8080/api/products/low-stock
Expected: 200, produk dengan stok di bawah minimum
```

**6.5 Import bulk produk (CSV)**
```
POST http://localhost:8080/api/products/import
Content-Type: multipart/form-data
file: products_template.csv
Expected: 200, ringkasan import (berhasil/gagal per baris)
```

---

## BLOK 7 — Transaksi / Kasir (Fase 2 — domain/transaction)

### Cara testing

**7.1 Buat transaksi**
```
POST http://localhost:8080/api/transactions
Header: Authorization: Bearer <token>
Body: {
  "customer_id": null,
  "items": [
    { "product_id": 1, "qty": 2, "price": 3000 }
  ],
  "payment_method": "cash",
  "amount_paid": 10000
}
Expected: 201, { "transaction_id": "...", "change": 4000, ... }
```

**7.2 Cek stok berkurang**
```
GET http://localhost:8080/api/products/1
Expected: stock sebelumnya 100 → sekarang 98
```

**7.3 List transaksi**
```
GET http://localhost:8080/api/transactions?date=2026-05-05
Expected: 200, list transaksi hari ini
```

**7.4 Void transaksi**
```
DELETE http://localhost:8080/api/transactions/:id/void
Expected: 200, stok kembali ke semula
```

---

## BLOK 8 — Kas Harian, Pengeluaran, Shift (Fase 2)

**8.1 Buka kas**
```
POST http://localhost:8080/api/cash-drawers/open
Body: { "opening_balance": 500000 }
Expected: 200
```

**8.2 Buat pengeluaran**
```
POST http://localhost:8080/api/expenses
Body: { "description": "Beli plastik", "amount": 20000, "category": "operasional" }
Expected: 201
```

**8.3 Buka shift**
```
POST http://localhost:8080/api/shifts/open
Body: { "cashier_id": 2 }
Expected: 201
```

**8.4 Tutup shift**
```
POST http://localhost:8080/api/shifts/:id/close
Body: { "closing_balance": 1500000 }
Expected: 200, ringkasan shift
```

**8.5 Tutup kas**
```
POST http://localhost:8080/api/cash-drawers/close
Expected: 200, laporan kas harian
```

---

## BLOK 9 — Supplier, Pelanggan, Piutang (Fase 2)

**9.1 Buat supplier**
```
POST http://localhost:8080/api/suppliers
Body: { "name": "PT Sumber Air", "phone": "08123456789" }
Expected: 201
```

**9.2 Buat Purchase Order**
```
POST http://localhost:8080/api/purchase-orders
Body: {
  "supplier_id": 1,
  "items": [{ "product_id": 1, "qty": 50, "buy_price": 2000 }]
}
Expected: 201, stok produk bertambah
```

**9.3 Buat pelanggan**
```
POST http://localhost:8080/api/customers
Body: { "name": "Budi", "phone": "08111222333" }
Expected: 201
```

**9.4 Transaksi dengan piutang**
```
POST http://localhost:8080/api/transactions
Body: { ..., "payment_method": "piutang", "customer_id": 1 }
Expected: 201, piutang tercatat
```

**9.5 Bayar piutang**
```
POST http://localhost:8080/api/receivables/:id/pay
Body: { "amount": 50000 }
Expected: 200, sisa piutang berkurang
```

---

## BLOK 10 — Laporan & Dashboard (Fase 2)

**10.1 Laporan penjualan**
```
GET http://localhost:8080/api/reports/sales?start=2026-05-01&end=2026-05-05
Expected: 200, total omset, list transaksi
```

**10.2 Laporan laba rugi**
```
GET http://localhost:8080/api/reports/profit-loss?month=2026-05
Expected: 200, pendapatan - HPP - pengeluaran = laba
```

**10.3 Laporan stok**
```
GET http://localhost:8080/api/reports/stock
Expected: 200, stok saat ini + mutasi
```

**10.4 Dashboard**
```
GET http://localhost:8080/api/dashboard
Expected: 200, { today_sales, today_transactions, low_stock_count, ... }
```

---

## BLOK 11 — Desktop Electron: Tampilan & Navigasi (Fase 3)

### Cara testing (manual di Electron window)

| No | Langkah | Yang diharapkan |
|---|---|---|
| 11.1 | Buka app, belum login | Halaman login tampil |
| 11.2 | Login dengan kredensial benar | Masuk ke dashboard, token tersimpan |
| 11.3 | Klik setiap menu di sidebar | Halaman masing-masing terbuka tanpa error di console |
| 11.4 | Refresh halaman (Ctrl+R) | Tetap login, tidak kembali ke halaman login |
| 11.5 | Buka DevTools (F12) | Tidak ada error merah di Console tab |

---

## BLOK 12 — Desktop: Fitur Kasir (Fase 3)

| No | Langkah | Yang diharapkan |
|---|---|---|
| 12.1 | Buka halaman Kasir | Form transaksi tampil |
| 12.2 | Scan/ketik barcode produk | Produk masuk ke keranjang |
| 12.3 | Ubah qty di keranjang | Total harga update otomatis |
| 12.4 | Klik Bayar, isi nominal | Kembalian tampil |
| 12.5 | Konfirmasi bayar | Nota/struk muncul, transaksi tersimpan |
| 12.6 | Cek stok produk di halaman Produk | Stok berkurang sesuai qty terjual |

---

## BLOK 13 — Desktop: Offline Mode (Fase 3 — fase 3.23–3.24)

### Cara testing offline

```
1. Pastikan backend berjalan dan desktop dalam keadaan online
2. Lakukan 1 transaksi → berhasil normal

3. Matikan backend (Ctrl+C di terminal backend)
   ATAU: putus koneksi jaringan

4. Di desktop: cek apakah ada indikator "Offline" muncul di UI
   Expected: label/badge merah "Offline" tampil

5. Coba buat transaksi baru saat offline
   Expected: transaksi tersimpan ke SQLite lokal, BUKAN gagal error

6. Cek tabel SQLite lokal (bisa via DevTools → Storage → IndexedDB atau SQLite viewer)
   Expected: transaksi baru ada di tabel lokal

7. Jalankan kembali backend
   Expected: indikator berubah ke "Online" dalam ~30 detik
```

---

## BLOK 14 — Desktop: Antrian Sync & Sync Engine (Fase 3 — fase 3.25–3.28)

### Cara testing sync

```
1. Saat offline, buat beberapa transaksi (minimal 3)
2. Hidupkan kembali backend
3. Tunggu atau buka halaman Sync Center

Expected setelah koneksi pulih:
- Status "Memproses antrian..." tampil di Sync Center
- Setiap item antrian diproses satu per satu
- Status berubah: pending → processing → done
- Transaksi offline muncul di laporan backend

4. Cek di Postman/Bruno:
   GET http://localhost:8080/api/transactions
   Expected: transaksi yang dibuat offline sudah ada di backend
```

**Test Resume Sync (fase 3.28)**
```
1. Saat offline, buat 5 transaksi
2. Hidupkan backend → sync mulai berjalan
3. Di tengah proses, putus koneksi lagi
4. Hidupkan backend lagi
Expected: sync lanjut dari yang belum selesai, tidak duplikat
```

---

## BLOK 15 — Backup & Restore (Fase 2 — domain/backup)

**15.1 Backup database**
```
POST http://localhost:8080/api/backup
Expected: 200, file .sql atau .zip diunduh / path file di response
```

**15.2 Cek file backup ada**
```
Cek folder backup/ di server atau path yang dikembalikan response
```

**15.3 Restore (opsional, hati-hati di dev)**
```
POST http://localhost:8080/api/restore
Body: form-data, file: backup.sql
Expected: 200, data terestore
```

---

## BLOK 16 — Settings & Version Check (Fase 2)

**16.1 Ambil settings**
```
GET http://localhost:8080/api/settings
Expected: 200, { store_name, address, tax_percent, ... }
```

**16.2 Update settings**
```
PUT http://localhost:8080/api/settings
Body: { "store_name": "Toko Maju Jaya", "tax_percent": 11 }
Expected: 200
```

**16.3 Version check**
```
GET http://localhost:8080/api/version
Expected: 200, { version: "x.x.x", ... }
```

---

## Checklist Ringkas — Status Testing

Tandai dengan ✅ setelah tiap blok selesai diuji.

| Blok | Area | Status |
|---|---|---|
| 1 | Struktur Project (Fase 0) | ⬜ |
| 2 | Database & Migration | ⬜ |
| 3 | Auth & Session | ⬜ |
| 4 | PIN Lock | ⬜ |
| 5 | User Management | ⬜ |
| 6 | Produk | ⬜ |
| 7 | Transaksi / Kasir | ⬜ |
| 8 | Kas, Pengeluaran, Shift | ⬜ |
| 9 | Supplier, Pelanggan, Piutang | ⬜ |
| 10 | Laporan & Dashboard | ⬜ |
| 11 | Desktop: Tampilan & Navigasi | ⬜ |
| 12 | Desktop: Fitur Kasir | ⬜ |
| 13 | Desktop: Offline Mode | ⬜ |
| 14 | Desktop: Antrian Sync & Resume | ⬜ |
| 15 | Backup & Restore | ⬜ |
| 16 | Settings & Version Check | ⬜ |

---

## Tips Debugging Cepat

| Gejala | Cek ini |
|---|---|
| `401 Unauthorized` padahal sudah login | Token expired? Coba refresh token dulu |
| `500 Internal Server Error` | Lihat log terminal backend — ada stack trace |
| Desktop tidak konek ke backend | Pastikan `API_BASE_URL` di `desktop/src/js/api-client.js` = `http://localhost:8080/api` |
| Sync tidak jalan setelah online | Buka DevTools → Console, cari error di `sync-engine.js` |
| Stok tidak berkurang setelah transaksi | Cek handler transaksi apakah `stock_mutations` diinsert |
| Migration error | Jalankan `go run main.go` dan lihat error migration di log |
