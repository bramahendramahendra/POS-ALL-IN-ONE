# POS Retail — Backend API

Backend REST API untuk aplikasi Point of Sale (POS), dibangun dengan **Go** + **Gin** + **GORM** + **MySQL**.

---

## Prasyarat

Pastikan sudah terinstall:

- [Go](https://golang.org/dl/) versi **1.24.5** atau lebih baru
- **MySQL** versi 8.0 atau lebih baru
- Git

---

## Struktur Konfigurasi

| File | Keterangan |
|---|---|
| `.env` | Mode aplikasi (`dev` / `prod`) dan port |
| `config/config_dev.json` | Konfigurasi lengkap untuk environment development |
| `config/config_prod.json` | Konfigurasi lengkap untuk environment production |

---

## Cara Menjalankan (Pertama Kali / Fresh Setup)

### 1. Clone & Masuk ke Folder Backend

```bash
cd backend
```

### 2. Install Dependencies

```bash
go mod tidy
```

### 3. Buat Database MySQL

Login ke MySQL dan buat database:

```sql
CREATE DATABASE pos_retail_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Sesuaikan Konfigurasi

Edit file `config/config_dev.json`, sesuaikan bagian `Database`:

```json
"Database": {
    "Host": "127.0.0.1",
    "Port": "3306",
    "User": "root",
    "Password": "isi_password_mysql_kamu",
    "Database": "pos_retail_db"
}
```

Edit file `.env` jika perlu ganti port:

```env
RELEASE_MODE=dev
APP_PORT=8080
```

### 5. Jalankan Aplikasi

```bash
go run main.go
```

Saat pertama kali dijalankan, **migrasi database berjalan otomatis** — semua tabel dibuat secara berurutan dari folder `database/migrations/`.

Server berjalan di: `http://localhost:8080`

---

## Migrasi Database

### Cara Kerja Migrasi

Sistem migrasi bersifat **otomatis** — dijalankan setiap kali aplikasi start. Migrasi hanya akan dieksekusi untuk file SQL yang **belum pernah dijalankan** sebelumnya, menggunakan tabel `migrations_history` sebagai pencatat.

File migrasi berada di: `database/migrations/`

```
database/migrations/
├── 001_init_schema.sql   ← Seluruh schema DB (semua tabel, kolom final, index)
└── 002_seed_data.sql     ← Data awal (users default, satuan, pengaturan toko)
```

**Tabel yang dibuat oleh `001_init_schema.sql`** (28 tabel):

| Grup | Tabel |
|------|-------|
| Auth | `users`, `sessions` |
| Master | `categories`, `units`, `settings` |
| Produk | `products`, `product_units`, `product_prices` |
| Supplier | `suppliers`, `purchases`, `purchase_items`, `supplier_returns`, `supplier_return_items` |
| Pelanggan | `customers`, `receivables`, `receivable_payments` |
| Penjualan | `shifts`, `transactions`, `transaction_items` |
| Keuangan | `cash_drawer`, `expenses` |
| Stok | `stock_mutations` |
| Sistem | `app_versions` |
| Sync | `sync_conflicts`, `sync_queue`, `sync_history` |
| Log | `log_requests` |

### Menambahkan Perubahan Database Baru

Jika ada perubahan skema database (tambah tabel, tambah kolom, dll):

1. **Buat file SQL baru** dengan nomor urut berikutnya di folder `database/migrations/`:

```bash
# Contoh: perubahan ke-10
database/migrations/010_nama_perubahan.sql
```

2. **Isi file SQL** dengan perubahan yang diinginkan. Gunakan `IF NOT EXISTS` / `IF EXISTS` agar aman jika dijalankan ulang:

```sql
-- Contoh tambah tabel baru
CREATE TABLE IF NOT EXISTS nama_tabel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

-- Contoh tambah kolom ke tabel yang sudah ada
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3) NULL;
```

3. **Jalankan ulang aplikasi** — migrasi baru akan otomatis tereksekusi:

```bash
go run main.go
```

> **Catatan:** Jangan pernah mengedit file SQL yang sudah pernah dijalankan. Selalu buat file baru dengan nomor urut berikutnya.

---

## Reset Database (Migrasi Ulang dari Awal)

Gunakan langkah ini jika ingin menghapus seluruh data dan schema, lalu menjalankan ulang semua migrasi dari awal. Biasanya dibutuhkan saat development atau saat schema berubah besar-besaran.

> ⚠️ **Peringatan:** Seluruh data akan terhapus permanen. Jangan lakukan di environment production.

### Langkah Reset

**1. Stop aplikasi** jika sedang berjalan.

**2. Login ke MySQL dan drop database:**

```sql
DROP DATABASE pos_retail_db;
CREATE DATABASE pos_retail_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Atau jika ingin satu perintah (reset sekaligus):

```sql
DROP DATABASE IF EXISTS pos_retail_db;
CREATE DATABASE pos_retail_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**3. Jalankan ulang aplikasi:**

```bash
go run main.go
```

Semua file migrasi di `database/migrations/` akan dieksekusi ulang dari awal secara berurutan.

---

### Reset Sebagian (Hapus Tabel Tertentu Saja)

Jika hanya ingin mengulang migrasi tertentu tanpa drop seluruh database:

**1. Hapus entri dari tabel `migrations_history`:**

```sql
DELETE FROM migrations_history WHERE filename = '009_create_log_requests.sql';
```

**2. Drop tabel yang ingin dibuat ulang:**

```sql
DROP TABLE IF EXISTS log_requests;
```

**3. Jalankan ulang aplikasi** — migrasi yang dihapus dari history akan dieksekusi ulang:

```bash
go run main.go
```

---

### Reset Data Saja (Tanpa Ubah Schema)

Jika schema sudah benar tapi ingin membersihkan data:

```sql
-- Nonaktifkan foreign key check sementara
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE transactions;
TRUNCATE TABLE transaction_items;
TRUNCATE TABLE expenses;
-- tambahkan tabel lain sesuai kebutuhan

SET FOREIGN_KEY_CHECKS = 1;
```

---

## Environment

### Development

```bash
# .env
RELEASE_MODE=dev
APP_PORT=8080
```

### Production

```bash
# .env
RELEASE_MODE=prod
APP_PORT=8080
```

Pastikan `config/config_prod.json` sudah diisi dengan konfigurasi production yang benar sebelum deploy.

---

## Build untuk Production

```bash
go build -o pos_api main.go
```

Jalankan binary hasil build:

```bash
./pos_api
```

---

## Struktur Folder

```
backend/
├── config/             ← Konfigurasi aplikasi (dev & prod)
├── database/
│   └── migrations/     ← File SQL migrasi (dijalankan otomatis)
├── domain/             ← Business logic per domain (handler, service, repo, model, dto)
├── dto/                ← DTO global (response, error, log)
├── errors/             ← Custom error types
├── helper/             ← Utility functions (request, response, log, time, dll)
├── middleware/         ← Gin middleware (auth, cors, logging, error handler)
├── model/              ← Model global (shared antar domain)
├── pkg/                ← Package internal (database, logger, jwt, dll)
├── repository/         ← Repository global (shared antar domain)
├── routes/             ← Definisi routing (public & protected)
├── server/             ← Bootstrap aplikasi
├── validation/         ← Validator kustom
├── .env                ← Variabel environment
├── go.mod
├── go.sum
└── main.go
```

---

## Catatan Tambahan

- Semua request dan response API dicatat otomatis ke tabel `log_requests` — berguna untuk debugging jika ada masalah komunikasi antara frontend dan backend.
- Log file aplikasi tersimpan di folder `logs/` dan dibersihkan otomatis setelah 30 hari.
