# API Contract — Shift

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/shifts` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/shifts` | Semua | List semua shift dengan filter opsional |
| GET | `/api/shifts/active` | Semua | List shift aktif saja (untuk dropdown) |
| GET | `/api/shifts/summary` | owner, admin | Summary transaksi per shift |
| GET | `/api/shifts/:id` | Semua | Detail satu shift |
| POST | `/api/shifts` | owner, admin | Tambah shift baru |
| PUT | `/api/shifts/:id` | owner, admin | Update data shift |
| DELETE | `/api/shifts/:id` | owner, admin | Hapus shift |
| PATCH | `/api/shifts/:id/toggle-status` | owner, admin | Toggle status aktif/nonaktif shift |

---

## Logika Bisnis

- Shift mendefinisikan jam kerja kasir (contoh: Pagi 07:00–15:00, Siang 15:00–22:00).
- Shift digunakan sebagai referensi saat kasir membuka **Kas Harian** di awal shift.
- Shift yang sedang digunakan pada kas harian **tidak dapat dihapus**.
- Hanya shift dengan `is_active = true` yang muncul di dropdown pemilihan shift saat buka kas.
- `start_time` dan `end_time` disimpan dalam format `HH:MM` (24 jam).
- Nama shift harus **unik** di seluruh toko.

---

## GET /api/shifts

**Deskripsi:** Mengambil daftar semua shift. Mendukung filter `is_active`.

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `is_active` | integer (0/1) | Tidak | Filter berdasarkan status aktif |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Pagi",
      "start_time": "07:00",
      "end_time": "15:00",
      "is_active": true
    },
    {
      "id": 2,
      "name": "Siang",
      "start_time": "15:00",
      "end_time": "22:00",
      "is_active": true
    }
  ]
}
```

---

## GET /api/shifts/active

**Deskripsi:** Mengambil daftar shift yang aktif saja. Digunakan untuk dropdown pemilihan shift saat buka kas harian.

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Pagi",
      "start_time": "07:00",
      "end_time": "15:00"
    },
    {
      "id": 2,
      "name": "Siang",
      "start_time": "15:00",
      "end_time": "22:00"
    }
  ]
}
```

---

## GET /api/shifts/:id

**Deskripsi:** Mengambil detail satu shift berdasarkan ID.

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Pagi",
    "start_time": "07:00",
    "end_time": "15:00",
    "is_active": true
  }
}
```

**Response (404) — Shift tidak ditemukan:**
```json
{
  "code": "04",
  "status": false,
  "message": "Shift tidak ditemukan"
}
```

---

## POST /api/shifts

**Deskripsi:** Menambahkan shift baru.

**Role:** owner, admin

**Request Body:**
```json
{
  "name": "Pagi",
  "start_time": "07:00",
  "end_time": "15:00"
}
```

**Validasi:**

| Field | Aturan |
|-------|--------|
| `name` | required, string, unik |
| `start_time` | required, format HH:MM (24 jam) |
| `end_time` | required, format HH:MM (24 jam) |

**Response (201):**
```json
{
  "code": "21",
  "status": true,
  "message": "Shift berhasil ditambahkan",
  "data": {
    "id": 3
  }
}
```

**Response (422) — Nama sudah digunakan:**
```json
{
  "code": "22",
  "status": false,
  "message": "Nama shift sudah digunakan"
}
```

**Response (422) — Validasi gagal:**
```json
{
  "code": "22",
  "status": false,
  "message": "Validasi gagal",
  "errors": {
    "name": "Nama shift wajib diisi",
    "start_time": "Format waktu tidak valid, gunakan HH:MM",
    "end_time": "Format waktu tidak valid, gunakan HH:MM"
  }
}
```

---

## PUT /api/shifts/:id

**Deskripsi:** Mengupdate data shift yang sudah ada.

**Role:** owner, admin

**Request Body:** Sama dengan POST

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Shift berhasil diupdate"
}
```

**Response (404) — Shift tidak ditemukan:**
```json
{
  "code": "04",
  "status": false,
  "message": "Shift tidak ditemukan"
}
```

**Response (422) — Nama sudah digunakan shift lain:**
```json
{
  "code": "22",
  "status": false,
  "message": "Nama shift sudah digunakan"
}
```

---

## DELETE /api/shifts/:id

**Deskripsi:** Menghapus shift. Tidak dapat dihapus jika shift masih digunakan oleh kas harian.

**Role:** owner, admin

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Shift berhasil dihapus"
}
```

**Response (404) — Shift tidak ditemukan:**
```json
{
  "code": "04",
  "status": false,
  "message": "Shift tidak ditemukan"
}
```

**Response (409) — Shift masih digunakan:**
```json
{
  "code": "09",
  "status": false,
  "message": "Shift tidak dapat dihapus karena masih digunakan pada kas harian"
}
```

---

## PATCH /api/shifts/:id/toggle-status

**Deskripsi:** Mengubah status aktif/nonaktif shift.

**Role:** owner, admin

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Status shift berhasil diubah",
  "data": {
    "is_active": false
  }
}
```

**Response (404) — Shift tidak ditemukan:**
```json
{
  "code": "04",
  "status": false,
  "message": "Shift tidak ditemukan"
}
```

---

## GET /api/shifts/summary

**Deskripsi:** Mengambil ringkasan transaksi yang dikelompokkan per shift dalam rentang tanggal tertentu.

**Role:** owner, admin

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `start_date` | string (YYYY-MM-DD) | Tidak | Tanggal mulai filter |
| `end_date` | string (YYYY-MM-DD) | Tidak | Tanggal akhir filter |
| `shift_id` | integer | Tidak | Filter ke satu shift tertentu |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "shift_id": 1,
      "shift_name": "Pagi",
      "total_transactions": 45,
      "total_sales": 2500000,
      "total_cash": 1800000,
      "total_non_cash": 700000
    },
    {
      "shift_id": 2,
      "shift_name": "Siang",
      "total_transactions": 32,
      "total_sales": 1750000,
      "total_cash": 1200000,
      "total_non_cash": 550000
    }
  ]
}
```

---

## SQL Schema

```sql
CREATE TABLE shifts (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)     NOT NULL,
    start_time  TIME            NOT NULL,
    end_time    TIME            NOT NULL,
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_shifts_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data awal
INSERT INTO shifts (name, start_time, end_time, is_active) VALUES
    ('Pagi',  '07:00:00', '15:00:00', 1),
    ('Siang', '15:00:00', '22:00:00', 1),
    ('Malam', '22:00:00', '07:00:00', 1);
```

### Relasi

| Tabel | Kolom | Keterangan |
|-------|-------|------------|
| `cash_drawers` | `shift_id` | Kas harian mencatat shift yang sedang aktif saat kas dibuka |

### Catatan Schema

- `start_time` dan `end_time` menggunakan tipe `TIME` MySQL agar mendukung shift lintas tengah malam (misal: Malam 22:00–07:00).
- Kolom `name` diberi constraint `UNIQUE` untuk menjamin tidak ada nama shift duplikat.
- Tabel ini bersifat **master data** — tidak memiliki kolom `deleted_at` (soft delete); penghapusan hanya diizinkan jika tidak ada relasi aktif.
