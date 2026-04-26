# API Contract — Version Check Android

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/version` |
| Auth | Publik (GET), Bearer Token role admin (POST) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role / Akses | Deskripsi |
|--------|----------|--------------|-----------|
| GET | `/api/version/android` | Publik (tanpa auth) | Cek apakah ada versi APK terbaru |
| POST | `/api/version/android` | admin | Upload info versi APK terbaru |

---

## Logika Bisnis

- Aplikasi Android mengecek versi saat dibuka dengan mengirimkan `current_version` ke server.
- Server membandingkan `current_version` dengan `latest_version` yang tersimpan di tabel `android_versions`.
- Jika berbeda, server mengembalikan `has_update: true` beserta `download_url` dan `release_notes`.
- Jika versi `is_mandatory: true`, aplikasi Android wajib update sebelum dapat digunakan.
- Endpoint POST digunakan oleh pipeline GitHub Actions setelah build APK selesai untuk mendaftarkan versi baru.
- Saat POST dipanggil, semua record lama di-set `is_latest = 0`, kemudian record baru di-insert dengan `is_latest = 1`.
- Hanya satu record yang aktif sebagai `is_latest` pada satu waktu.

---

## Schema Database

```sql
CREATE TABLE android_versions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  version       VARCHAR(20)   NOT NULL,
  download_url  VARCHAR(500)  NOT NULL,
  release_notes TEXT,
  is_mandatory  TINYINT(1)    NOT NULL DEFAULT 0,
  is_latest     TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_is_latest (is_latest)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## GET /api/version/android

**Deskripsi:** Mengecek apakah ada versi APK Android terbaru dibandingkan versi yang sedang dipakai user.

**Auth:** Tidak diperlukan (publik)

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `current_version` | string | Ya | Versi APK yang sedang digunakan user (contoh: `1.0.0`) |

**Response (200) — Ada Update:**

```json
{
  "code": "00",
  "status": true,
  "message": "Versi baru tersedia",
  "data": {
    "latest_version": "1.1.0",
    "current_version": "1.0.0",
    "has_update": true,
    "download_url": "https://example.com/releases/pos-v1.1.0.apk",
    "release_notes": "- Perbaikan bug kasir\n- Penambahan fitur laporan",
    "is_mandatory": false
  }
}
```

**Response (200) — Sudah Versi Terbaru:**

```json
{
  "code": "00",
  "status": true,
  "message": "Aplikasi sudah versi terbaru",
  "data": {
    "latest_version": "1.1.0",
    "current_version": "1.1.0",
    "has_update": false
  }
}
```

**Response (400) — Parameter Tidak Lengkap:**

```json
{
  "code": "40",
  "status": false,
  "message": "Parameter current_version wajib diisi"
}
```

**Response (404) — Belum Ada Data Versi:**

```json
{
  "code": "44",
  "status": false,
  "message": "Belum ada data versi tersedia"
}
```

---

## POST /api/version/android

**Deskripsi:** Mendaftarkan versi APK terbaru ke server. Biasanya dipanggil oleh GitHub Actions setelah build APK selesai.

**Auth:** Bearer Token | Role: admin

**Request Body:**

```json
{
  "version": "1.1.0",
  "download_url": "https://example.com/releases/pos-v1.1.0.apk",
  "release_notes": "- Perbaikan bug kasir\n- Penambahan fitur laporan",
  "is_mandatory": false
}
```

**Field Request Body:**

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `version` | string | Ya | Nomor versi APK format semver (contoh: `1.1.0`) |
| `download_url` | string | Ya | URL download file APK |
| `release_notes` | string | Tidak | Catatan perubahan versi ini |
| `is_mandatory` | boolean | Tidak | Apakah update wajib (default: `false`) |

**Proses:**

1. Validasi field wajib (`version`, `download_url`).
2. Set semua record di tabel `android_versions` menjadi `is_latest = 0`.
3. Insert record baru dengan `is_latest = 1`.

**Response (201) — Berhasil:**

```json
{
  "code": "21",
  "status": true,
  "message": "Versi berhasil diupdate"
}
```

**Response (400) — Validasi Gagal:**

```json
{
  "code": "40",
  "status": false,
  "message": "Field version dan download_url wajib diisi"
}
```

**Response (401) — Tidak Terautentikasi:**

```json
{
  "code": "41",
  "status": false,
  "message": "Unauthorized"
}
```

**Response (403) — Akses Ditolak:**

```json
{
  "code": "43",
  "status": false,
  "message": "Forbidden: hanya admin yang dapat mengakses endpoint ini"
}
```
