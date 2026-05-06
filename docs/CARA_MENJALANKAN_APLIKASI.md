# Cara Menjalankan Aplikasi POS

---

## Prasyarat — Install Dulu Ini

| Software | Versi Minimum | Cek di Terminal |
|---|---|---|
| [Go](https://golang.org/dl/) | 1.21+ | `go version` |
| [MySQL](https://dev.mysql.com/downloads/) | 8.0+ | `mysql --version` |
| [Node.js](https://nodejs.org/) | 18+ | `node -v` |

> Boleh pakai **XAMPP** sebagai pengganti instalasi MySQL mandiri.

---

## Langkah 1 — Buat Database MySQL

Buka MySQL client (TablePlus / DBeaver / phpMyAdmin / terminal):

```sql
CREATE DATABASE pos_retail_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## Langkah 2 — Sesuaikan Config Backend

Buka file `backend/config/config_dev.json`, ubah bagian `Database`:

```json
"Database": {
  "Host": "127.0.0.1",
  "Port": "3306",
  "User": "root",
  "Password": "",
  "Database": "pos_retail_db"
}
```

> Isi `Password` sesuai password MySQL kamu. Kosongkan jika tidak ada password.

---

## Langkah 3 — Jalankan Backend (Go)

Buka terminal di folder `backend/`:

```powershell
cd backend
go run main.go
```

Saat pertama kali jalan, backend otomatis:
- Menjalankan semua migration (membuat tabel)
- Mengisi data awal (seed): user default, satuan, settings

Output normal yang muncul:
```
[GIN-debug] Listening and serving HTTP on :8080
```

### Akun default yang sudah tersedia

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin123 | admin |
| owner    | owner123 | owner |

---

## Langkah 4 — Jalankan Desktop (Electron)

Buka terminal **baru** (jangan tutup terminal backend), masuk ke folder `desktop/`:

```powershell
cd desktop
npm install
npm start
```

> `npm install` hanya perlu dijalankan **sekali** saat pertama kali.

Window Electron akan terbuka. Login dengan akun `admin` / `admin123`.

---

## Langkah 5 — Verifikasi Backend Berjalan

Buka browser atau Postman, akses:

```
GET http://localhost:8080/api/version
```

Harus muncul response `200 OK`. Jika tidak, berarti backend belum jalan.

---

## Urutan Wajib Setiap Kali Mau Pakai

```
1. Jalankan MySQL
   (kalau pakai XAMPP: klik Start pada Apache + MySQL)

2. Jalankan backend:
   cd backend
   go run main.go

3. Jalankan desktop:
   cd desktop
   npm start
```

> Backend **harus jalan lebih dulu** sebelum membuka desktop,
> karena desktop langsung konek ke `localhost:8080` saat startup.

---

## Troubleshooting

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| `Error: dial tcp: connection refused` | MySQL belum jalan | Start MySQL / XAMPP dulu |
| `panic: DB Initialization failed` | Password/database salah di config | Cek `config_dev.json` |
| `go: command not found` | Go belum terinstall | Install dari golang.org/dl |
| Desktop blank / tidak bisa login | Backend belum jalan | Jalankan `go run main.go` dulu |
| `npm: command not found` | Node.js belum terinstall | Install dari nodejs.org |
| Port 8080 sudah dipakai | Ada proses lain di port tersebut | Ubah `AppPort` di `config_dev.json` |
