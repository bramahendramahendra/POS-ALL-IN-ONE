# Cara Menjalankan Aplikasi POS

> Dokumen ini menjelaskan cara menjalankan aplikasi POS dari nol — mulai dari install software, setup database, hingga membuka desktop app.

---

## Arsitektur Aplikasi

```
┌─────────────────────────────────┐
│  Desktop (Electron)             │  ← yang kamu buka / pakai sehari-hari
│  desktop/                       │
└────────────┬────────────────────┘
             │ HTTP (localhost:8080)
┌────────────▼────────────────────┐
│  Backend API (Go + Gin)         │  ← server lokal, harus jalan di background
│  backend/                       │
└────────────┬────────────────────┘
             │ SQL
┌────────────▼────────────────────┐
│  Database MySQL                 │  ← penyimpanan data permanen
└─────────────────────────────────┘
```

**Urutan start yang wajib diikuti:** MySQL → Backend → Desktop

---

## Bagian 1 — Prasyarat: Install Software

### 1.1 Node.js

Dibutuhkan untuk menjalankan aplikasi Desktop (Electron).

1. Buka [nodejs.org](https://nodejs.org/) → download versi **LTS** (misal 20.x atau 22.x)
2. Install dengan pengaturan default
3. Verifikasi:
   ```powershell
   node -v   # harus muncul: v20.x.x atau lebih baru
   npm -v    # harus muncul: 10.x.x atau lebih baru
   ```

### 1.2 Go (Golang)

Dibutuhkan untuk menjalankan Backend API.

1. Buka [go.dev/dl](https://go.dev/dl/) → download installer Windows (misal `go1.22.x.windows-amd64.msi`)
2. Install dengan pengaturan default
3. Verifikasi:
   ```powershell
   go version   # harus muncul: go version go1.21.x atau lebih baru
   ```

### 1.3 MySQL

Dibutuhkan sebagai database. **Pilih salah satu:**

**Opsi A — XAMPP (Lebih mudah untuk pemula)**
1. Download XAMPP dari [apachefriends.org](https://www.apachefriends.org/)
2. Install, lalu buka **XAMPP Control Panel**
3. Klik **Start** di baris **MySQL**
4. MySQL berjalan di port `3306`, user `root`, tanpa password

**Opsi B — MySQL Standalone**
1. Download dari [dev.mysql.com/downloads/mysql](https://dev.mysql.com/downloads/mysql/)
2. Saat install, catat password yang kamu set untuk user `root`

---

## Bagian 2 — Setup Pertama Kali (Hanya Sekali)

### 2.1 Buat Database

Buka MySQL client. Bisa menggunakan salah satu:
- **XAMPP**: klik **phpMyAdmin** di XAMPP Control Panel → buka browser
- **Terminal/PowerShell**:
  ```powershell
  mysql -u root -p
  ```
- **Tools**: TablePlus, DBeaver, HeidiSQL

Jalankan perintah ini:
```sql
CREATE DATABASE pos_retail_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Verifikasi:
```sql
SHOW DATABASES;
-- harus ada: pos_retail_db
```

### 2.2 Konfigurasi Backend

Buka file [backend/config/config_dev.json](../backend/config/config_dev.json), sesuaikan bagian `Database`:

```json
"Database": {
  "Host": "127.0.0.1",
  "Port": "3306",
  "User": "root",
  "Password": "",
  "Database": "pos_retail_db"
}
```

> Jika MySQL-mu punya password untuk user root, isi di field `"Password"`.
> Jika pakai XAMPP default, biarkan `"Password": ""` (kosong).

### 2.3 Install Dependency Desktop

Buka terminal/PowerShell, masuk ke folder `desktop/`:

```powershell
cd d:\Develop\Destop\Project_POS\desktop
npm install
```

> Proses ini memakan waktu 1–5 menit. Lakukan **sekali saja** saat pertama kali.
> Tidak perlu diulang kecuali ada perubahan di `package.json`.

---

## Bagian 3 — Cara Menjalankan Setiap Hari

### Terminal 1 — Jalankan Backend

Buka PowerShell/terminal, arahkan ke folder `backend/`:

```powershell
cd d:\Develop\Destop\Project_POS\backend
go run main.go
```

**Pertama kali jalan**, backend otomatis:
- Membuat semua tabel (migration)
- Mengisi data awal: akun default, satuan, kategori dasar, pengaturan toko

Output normal yang muncul:
```
[GIN-debug] [WARNING] Creating an Engine instance with the Logger and Recovery middleware already attached.
[GIN-debug] Listening and serving HTTP on :8080
```

> **Jangan tutup terminal ini.** Backend harus tetap berjalan selama kamu pakai aplikasi.

### Terminal 2 — Jalankan Desktop

Buka terminal **baru** (jangan tutup terminal backend), masuk ke folder `desktop/`:

```powershell
cd d:\Develop\Destop\Project_POS\desktop
npm start
```

Window Electron akan terbuka dalam beberapa detik.

---

## Bagian 4 — Login Pertama Kali

Setelah window Electron terbuka, gunakan akun default:

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | admin |
| owner    | owner123  | owner |

> Disarankan segera ganti password setelah login pertama kali via menu **Pengaturan → Pengguna**.

---

## Bagian 5 — Verifikasi Backend Berjalan

Untuk memastikan backend aktif, buka browser atau jalankan curl berikut:

```powershell
curl "http://localhost:8080/api/version/android?current_version=1.0.0"
```

Harus muncul response JSON seperti:
```json
{
  "code": "00",
  "status": true,
  "message": "Aplikasi sudah versi terbaru",
  "data": { ... }
}
```

Jika muncul `connection refused` atau tidak ada response sama sekali, berarti backend belum jalan. Lihat bagian Troubleshooting.

---

## Bagian 5b — Uji API dengan Postman

Gunakan [Postman](https://www.postman.com/downloads/) untuk mencoba endpoint backend secara langsung tanpa membuka Desktop app.

### Setup Awal di Postman

1. Buat **Collection** baru, beri nama misalnya `POS API`
2. Di tab **Variables** pada Collection, tambahkan variable:

   | Variable      | Initial Value           |
   |---------------|-------------------------|
   | `base_url`    | `http://localhost:8080/api` |
   | `token`       | *(kosong dulu)*         |

3. Di tab **Authorization** pada Collection, pilih type **Bearer Token** dan isi Token dengan `{{token}}`

---

### Langkah 1 — Login (Dapatkan Token)

Semua endpoint kecuali login membutuhkan token. Login dulu untuk mendapatkannya.

- **Method:** `POST`
- **URL:** `{{base_url}}/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body** (raw JSON):

```json
{
  "username": "admin",
  "password": "admin123",
  "device_info": "desktop"
}
```

> `device_info` wajib diisi salah satu: `desktop`, `web`, atau `android`

**Response sukses:**
```json
{
  "status": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_at": "2026-05-10T12:00:00Z",
    "user": {
      "id": 1,
      "username": "admin",
      "full_name": "Administrator",
      "role": "admin"
    }
  }
}
```

**Simpan token secara otomatis** — tambahkan script ini di tab **Tests** pada request Login:

```javascript
const res = pm.response.json();
if (res.data && res.data.token) {
  pm.collectionVariables.set("token", res.data.token);
}
```

Setelah script ini, setiap request berikutnya dalam Collection ini otomatis menggunakan token yang baru.

---

### Langkah 2 — Cek Data User Login

- **Method:** `GET`
- **URL:** `{{base_url}}/auth/me`
- **Authorization:** inherit dari Collection (Bearer Token `{{token}}`)

**Response:**
```json
{
  "status": true,
  "data": {
    "id": 1,
    "username": "admin",
    "full_name": "Administrator",
    "role": "admin"
  }
}
```

---

### Langkah 3 — Ambil Daftar Produk

- **Method:** `GET`
- **URL:** `{{base_url}}/products`
- **Query Params (opsional):**

  | Key          | Contoh Nilai | Keterangan                        |
  |--------------|--------------|-----------------------------------|
  | `search`     | `mie`        | Filter nama produk                |
  | `category_id`| `2`          | Filter kategori                   |
  | `is_active`  | `1`          | `1` = aktif, `0` = nonaktif       |
  | `low_stock`  | `1`          | Tampilkan produk stok menipis     |
  | `page`       | `1`          | Halaman (default: 1)              |
  | `limit`      | `20`         | Jumlah per halaman (default: 20)  |

**Response:**
```json
{
  "status": true,
  "message": "Daftar produk",
  "data": {
    "items": [
      {
        "id": 1,
        "barcode": "8991001",
        "name": "Indomie Goreng",
        "category_name": "Makanan",
        "purchase_price": 2500,
        "selling_price": 3000,
        "stock": 100,
        "min_stock": 10,
        "unit": "pcs",
        "is_active": true
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

---

### Langkah 4 — Tambah Produk Baru

> Hanya bisa dilakukan oleh role `owner` atau `admin`

- **Method:** `POST`
- **URL:** `{{base_url}}/products`
- **Body** (raw JSON):

```json
{
  "barcode": "8991002",
  "name": "Aqua Botol 600ml",
  "category_id": 2,
  "purchase_price": 2000,
  "selling_price": 3000,
  "stock": 50,
  "min_stock": 5,
  "unit": "botol"
}
```

> `name`, `selling_price`, dan `unit` adalah field wajib. Field lain opsional.

**Response:**
```json
{
  "status": true,
  "message": "Produk berhasil dibuat",
  "data": {
    "id": 2,
    "barcode": "8991002",
    "name": "Aqua Botol 600ml",
    ...
  }
}
```

---

### Langkah 5 — Buat Transaksi Penjualan

- **Method:** `POST`
- **URL:** `{{base_url}}/transactions`
- **Body** (raw JSON):

```json
{
  "subtotal": 6000,
  "discount": 0,
  "tax": 0,
  "total_amount": 6000,
  "payment_method": "cash",
  "payment_amount": 10000,
  "change_amount": 4000,
  "device_source": "desktop",
  "items": [
    {
      "product_id": 1,
      "product_name": "Indomie Goreng",
      "quantity": 2,
      "unit": "pcs",
      "price": 3000,
      "subtotal": 6000,
      "discount_item": 0,
      "conversion_qty": 1
    }
  ]
}
```

> `payment_method` wajib salah satu: `cash`, `transfer`, `qris`, `credit`  
> `device_source` wajib salah satu: `desktop`, `web`, `android`

**Response:**
```json
{
  "status": true,
  "message": "Transaksi berhasil",
  "data": {
    "id": 1,
    "transaction_code": "TRX-20260510-0001",
    "total_amount": 6000,
    "payment_method": "cash",
    "status": "completed",
    ...
  }
}
```

---

### Referensi Cepat Endpoint

| Method   | Endpoint                              | Keterangan                    | Role           |
|----------|---------------------------------------|-------------------------------|----------------|
| `POST`   | `/api/auth/login`                     | Login, dapatkan token         | Public         |
| `POST`   | `/api/auth/refresh`                   | Perbarui token                | Public         |
| `GET`    | `/api/auth/me`                        | Info user yang login          | Semua          |
| `POST`   | `/api/auth/logout`                    | Logout                        | Semua          |
| `GET`    | `/api/products`                       | Daftar produk (+ filter)      | Semua          |
| `GET`    | `/api/products/search?q=keyword`      | Cari produk cepat             | Semua          |
| `GET`    | `/api/products/barcode/:barcode`      | Cari produk by barcode        | Semua          |
| `GET`    | `/api/products/:id`                   | Detail satu produk            | Semua          |
| `POST`   | `/api/products`                       | Tambah produk baru            | owner, admin   |
| `PUT`    | `/api/products/:id`                   | Edit produk                   | owner, admin   |
| `DELETE` | `/api/products/:id`                   | Hapus produk                  | owner, admin   |
| `PATCH`  | `/api/products/:id/toggle-status`     | Aktif/nonaktifkan produk      | owner, admin   |
| `GET`    | `/api/transactions`                   | Daftar transaksi              | Semua          |
| `GET`    | `/api/transactions/:id`               | Detail transaksi              | Semua          |
| `POST`   | `/api/transactions`                   | Buat transaksi penjualan      | Semua          |
| `PATCH`  | `/api/transactions/:id/void`          | Batalkan transaksi            | owner, admin   |

---

## Bagian 6 — Ringkasan Urutan Setiap Hari

```
SETIAP KALI INGIN MEMAKAI APLIKASI:

Langkah 1 — Start MySQL
  • XAMPP: klik Start pada MySQL di Control Panel
  • Standalone: biasanya sudah otomatis jalan sebagai service Windows

Langkah 2 — Jalankan Backend (Terminal 1)
  cd d:\Develop\Destop\Project_POS\backend
  go run main.go
  Tunggu hingga muncul: "Listening and serving HTTP on :8080"

Langkah 3 — Jalankan Desktop (Terminal 2 — baru)
  cd d:\Develop\Destop\Project_POS\desktop
  npm start

Langkah 4 — Login
  Username: admin | Password: admin123
```

---

## Bagian 7 — Mode Development (Opsional)

Jika ingin membuka DevTools Electron untuk debugging:

```powershell
cd desktop
npm run dev
```

Shortcut keyboard di dalam app:
- `F12` → buka/tutup DevTools
- `Ctrl+R` → reload halaman
- `Ctrl+Shift+I` → buka DevTools (alternatif)

---

## Bagian 8 — Troubleshooting

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| `Error: dial tcp 127.0.0.1:3306: connection refused` | MySQL belum jalan | Start MySQL / XAMPP dulu |
| `panic: DB Initialization failed` | Konfigurasi database salah | Cek `backend/config/config_dev.json` — password/nama database |
| `Unknown database 'pos_retail_db'` | Database belum dibuat | Jalankan `CREATE DATABASE pos_retail_db ...` di MySQL |
| `go: command not found` | Go belum terinstall | Install dari go.dev/dl |
| Desktop blank / loading terus | Backend belum jalan atau error | Pastikan terminal backend menampilkan port 8080, cek error di terminal |
| `npm: command not found` | Node.js belum terinstall | Install dari nodejs.org |
| `Port 8080 already in use` | Ada proses lain di port 8080 | Ubah `"AppPort": "8081"` di config_dev.json, atau tutup proses lain |
| `Cannot find module` (desktop) | Dependencies belum terinstall | Jalankan `npm install` di folder `desktop/` |
| Login gagal dengan kredensial default | Database belum ter-seed | Hapus database, buat ulang, jalankan `go run main.go` lagi |

---

## Bagian 9 — Menghentikan Aplikasi

1. Tutup window Electron (klik X)
2. Di terminal backend, tekan `Ctrl+C`
3. Stop MySQL (opsional, bisa dibiarkan jalan)

---

## Lampiran — Struktur Folder Project

```
Project_POS/
├── backend/              ← Go API server
│   ├── config/
│   │   └── config_dev.json    ← konfigurasi DB & port
│   ├── database/
│   │   └── migrations/        ← file SQL migration (otomatis dijalankan)
│   ├── domain/                ← logic bisnis (auth, produk, transaksi, dll.)
│   └── main.go                ← entry point backend
├── desktop/              ← Electron app
│   ├── src/
│   │   ├── views/             ← halaman HTML
│   │   ├── js/                ← logic tiap halaman
│   │   └── css/               ← styling
│   ├── package.json
│   └── main.js                ← entry point Electron
├── web/                  ← Web app (fase 4, akses via browser)
├── android/              ← Android app (Capacitor)
└── docs/                 ← dokumentasi project ini
```
