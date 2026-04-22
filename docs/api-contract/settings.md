# API Contract — Settings

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/settings` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/settings` | Semua role | Ambil semua settings toko |
| GET | `/api/settings/:key` | Semua role | Ambil satu setting berdasarkan key |
| POST | `/api/settings` | owner, admin | Simpan satu atau banyak settings (upsert) |
| POST | `/api/settings/reset` | admin | Reset semua settings ke nilai default |

---

## Daftar Key Settings

| Key | Default | Keterangan |
|-----|---------|------------|
| `store_name` | `Toko Retail` | Nama toko |
| `store_address` | _(kosong)_ | Alamat toko |
| `store_phone` | _(kosong)_ | Nomor telepon toko |
| `store_email` | _(kosong)_ | Email toko |
| `tax_enabled` | `0` | Pajak aktif: `0` = nonaktif, `1` = aktif |
| `tax_percent` | `11` | Persentase pajak (dalam persen) |
| `receipt_footer` | `Terima kasih` | Teks footer pada struk belanja |
| `stock_notification_enabled` | `1` | Notifikasi stok rendah: `0` = nonaktif, `1` = aktif |

---

## Logika Bisnis

- Semua settings disimpan sebagai pasangan key-value di tabel `settings`.
- Nilai settings selalu bertipe string meskipun secara semantik bernilai numerik atau boolean.
- Endpoint `POST /api/settings` bersifat upsert: jika key sudah ada maka nilainya diperbarui, jika belum ada maka dibuat baru.
- Key yang tidak dikenal (tidak terdapat dalam daftar key yang valid) diabaikan tanpa error.
- Endpoint `POST /api/settings/reset` mengembalikan semua key ke nilai default — perubahan yang ada sebelumnya akan ditimpa.
- `tax_enabled` dan `stock_notification_enabled` bernilai `"0"` atau `"1"` (string).

---

## GET /api/settings

**Deskripsi:** Mengambil semua settings toko dalam bentuk objek key-value.

**Role:** Semua role

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "store_name": "Toko Retail",
    "store_address": "Jl. Merdeka No. 1",
    "store_phone": "021-1234567",
    "store_email": "toko@email.com",
    "tax_enabled": "1",
    "tax_percent": "11",
    "receipt_footer": "Terima kasih telah berbelanja",
    "stock_notification_enabled": "1"
  }
}
```

**Keterangan Field `data`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `store_name` | string | Nama toko |
| `store_address` | string | Alamat toko (dapat kosong) |
| `store_phone` | string | Nomor telepon toko (dapat kosong) |
| `store_email` | string | Email toko (dapat kosong) |
| `tax_enabled` | string (`"0"` / `"1"`) | Status pajak aktif |
| `tax_percent` | string | Persentase pajak |
| `receipt_footer` | string | Teks footer struk |
| `stock_notification_enabled` | string (`"0"` / `"1"`) | Status notifikasi stok rendah |

**Response (401) — Token tidak valid:**
```json
{
  "code": "01",
  "status": false,
  "message": "Unauthorized"
}
```

---

## GET /api/settings/:key

**Deskripsi:** Mengambil satu setting berdasarkan key yang diberikan pada path parameter.

**Role:** Semua role

**Path Parameter:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `key` | string | Key setting yang ingin diambil (contoh: `store_name`) |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "key": "store_name",
    "value": "Toko Retail"
  }
}
```

**Keterangan Field `data`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `key` | string | Key setting |
| `value` | string | Nilai setting |

**Response (401) — Token tidak valid:**
```json
{
  "code": "01",
  "status": false,
  "message": "Unauthorized"
}
```

**Response (404) — Key tidak ditemukan:**
```json
{
  "code": "04",
  "status": false,
  "message": "Setting tidak ditemukan"
}
```

---

## POST /api/settings

**Deskripsi:** Menyimpan satu atau banyak settings sekaligus menggunakan mekanisme upsert. Hanya key yang dikenal yang akan diproses; key tidak dikenal diabaikan.

**Role:** owner, admin

**Request Body:**
```json
{
  "store_name": "Toko Makmur",
  "store_address": "Jl. Baru No. 5",
  "tax_enabled": "1",
  "tax_percent": "11"
}
```

**Keterangan Request Body:**

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `store_name` | string | Tidak | Nama toko |
| `store_address` | string | Tidak | Alamat toko |
| `store_phone` | string | Tidak | Nomor telepon toko |
| `store_email` | string | Tidak | Email toko |
| `tax_enabled` | string (`"0"` / `"1"`) | Tidak | Status pajak aktif |
| `tax_percent` | string | Tidak | Persentase pajak |
| `receipt_footer` | string | Tidak | Teks footer struk |
| `stock_notification_enabled` | string (`"0"` / `"1"`) | Tidak | Status notifikasi stok rendah |

> Minimal satu field harus disertakan. Request body kosong akan ditolak.

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Settings berhasil disimpan"
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

**Response (422) — Request body kosong:**
```json
{
  "code": "22",
  "status": false,
  "message": "Request tidak valid",
  "errors": {
    "body": "minimal satu field settings harus disertakan"
  }
}
```

---

## POST /api/settings/reset

**Deskripsi:** Mereset semua settings ke nilai default. Seluruh perubahan yang pernah disimpan akan ditimpa kembali ke nilai awal.

**Role:** admin

**Request Body:** _(tidak diperlukan)_

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Settings berhasil direset ke default"
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

---

## Catatan

- Semua nilai settings bertipe string, termasuk nilai numerik (`tax_percent`) dan boolean (`tax_enabled`, `stock_notification_enabled`).
- `tax_enabled` dan `stock_notification_enabled` menggunakan string `"0"` (nonaktif) dan `"1"` (aktif), bukan boolean JSON.
- Endpoint `GET /api/settings` selalu mengembalikan seluruh delapan key meskipun beberapa nilainya kosong.
- `POST /api/settings/reset` hanya dapat dilakukan oleh role `admin`; role `owner` tidak memiliki izin untuk melakukan reset.
- Key yang tidak valid pada request body `POST /api/settings` diabaikan secara diam-diam (tidak menghasilkan error).
