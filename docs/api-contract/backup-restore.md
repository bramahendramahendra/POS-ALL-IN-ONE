# API Contract — Backup & Restore

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) kecuali endpoint download |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/backup` | owner, admin | Buat backup database MySQL |
| GET | `/api/backup/list` | owner, admin | Lihat daftar file backup yang tersedia |
| GET | `/api/backup/download/:filename` | owner, admin | Download file backup |
| POST | `/api/restore` | admin | Restore database dari file backup |

---

## Logika Bisnis

- Backup mencakup seluruh data database MySQL pada server.
- Di platform desktop, backup juga dapat mencakup SQLite lokal (dikelola secara terpisah di sisi klien).
- File backup disimpan di server dengan nama berformat `backup_YYYYMMDD_HHmmss.sql`.
- File backup dapat diunduh langsung sebagai attachment oleh role yang berwenang.
- Restore hanya boleh dilakukan oleh role `admin` — endpoint ini bersifat destruktif dan tidak dapat dibatalkan.
- Frontend wajib menampilkan konfirmasi eksplisit sebelum memanggil endpoint restore.

---

## POST /api/backup

**Deskripsi:** Membuat backup database MySQL dan menyimpan hasilnya di server.

**Role:** owner, admin

**Request Body:** _(tidak diperlukan)_

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Backup berhasil dibuat",
  "data": {
    "filename": "backup_20240101_100000.sql",
    "size": "2.5 MB",
    "created_at": "2024-01-01T10:00:00Z"
  }
}
```

**Keterangan Field `data`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `filename` | string | Nama file backup yang dihasilkan |
| `size` | string | Ukuran file backup dalam format human-readable |
| `created_at` | string (ISO 8601) | Waktu pembuatan backup |

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

**Response (500) — Gagal membuat backup:**
```json
{
  "code": "99",
  "status": false,
  "message": "Gagal membuat backup database"
}
```

---

## GET /api/backup/list

**Deskripsi:** Mengambil daftar file backup yang tersedia di server, diurutkan dari yang terbaru.

**Role:** owner, admin

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "filename": "backup_20240101_100000.sql",
      "size": "2.5 MB",
      "created_at": "2024-01-01T10:00:00Z"
    },
    {
      "filename": "backup_20231231_090000.sql",
      "size": "2.4 MB",
      "created_at": "2023-12-31T09:00:00Z"
    }
  ]
}
```

**Keterangan Field item `data`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `filename` | string | Nama file backup |
| `size` | string | Ukuran file backup dalam format human-readable |
| `created_at` | string (ISO 8601) | Waktu pembuatan backup |

> Jika belum ada file backup, `data` berisi array kosong `[]`.

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

## GET /api/backup/download/:filename

**Deskripsi:** Mendownload file backup sebagai attachment. Response bukan JSON melainkan file SQL langsung.

**Role:** owner, admin

**Path Parameter:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `filename` | string | Nama file backup (contoh: `backup_20240101_100000.sql`) |

**Response (200):**

- **Content-Type:** `application/octet-stream`
- **Content-Disposition:** `attachment; filename="backup_20240101_100000.sql"`
- **Body:** Isi file SQL sebagai binary stream

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

**Response (404) — File tidak ditemukan:**
```json
{
  "code": "04",
  "status": false,
  "message": "File backup tidak ditemukan"
}
```

---

## POST /api/restore

**Deskripsi:** Merestore database dari file backup yang diunggah. Operasi ini bersifat destruktif — seluruh data yang ada akan ditimpa oleh isi file backup.

**Role:** admin

**Content-Type:** `multipart/form-data`

**Form Data:**

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `file` | file (`.sql`) | Ya | File SQL backup yang akan direstore |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Restore database berhasil"
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

**Response (422) — File tidak disertakan atau format tidak valid:**
```json
{
  "code": "22",
  "status": false,
  "message": "Request tidak valid",
  "errors": {
    "file": "file backup wajib disertakan dan harus berformat .sql"
  }
}
```

**Response (500) — Gagal melakukan restore:**
```json
{
  "code": "99",
  "status": false,
  "message": "Gagal melakukan restore database"
}
```

---

## Catatan Keamanan

- Endpoint `POST /api/restore` adalah operasi yang **tidak dapat dibatalkan** — seluruh data yang ada akan ditimpa.
- Hanya role `admin` yang dapat mengakses endpoint restore; role `owner` tidak diizinkan.
- Frontend wajib menampilkan dialog konfirmasi eksplisit sebelum mengirim request restore.
- Nama file pada endpoint download divalidasi di server untuk mencegah path traversal (karakter seperti `../` harus ditolak).
- File backup disimpan di direktori terisolasi di server dan tidak dapat diakses langsung melalui URL publik.
