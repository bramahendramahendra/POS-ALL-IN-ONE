# API Contract — Sync Center

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/sync` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role / Akses | Deskripsi |
|--------|----------|--------------|-----------|
| GET | `/api/sync/conflicts` | owner, admin | List konflik yang belum diselesaikan |
| POST | `/api/sync/conflicts/:id/resolve` | owner, admin | Selesaikan konflik dengan memilih versi data |
| GET | `/api/sync/queue` | owner, admin | List antrian sync dari semua device desktop |
| POST | `/api/sync/push` | Device Desktop (Bearer Token) | Desktop mengirim antrian sync ke server |
| GET | `/api/sync/history` | owner, admin | Riwayat aktivitas sync per device |

---

## Logika Bisnis

- **Konflik** terjadi ketika data yang sama diedit di desktop offline dan di server online secara bersamaan sebelum sync dilakukan.
- Server mendeteksi konflik saat menerima push dari desktop — jika `entity_type` + `entity_id` yang masuk sudah dimodifikasi di server setelah `desktop_time`, maka konflik dicatat.
- Penyelesaian konflik bersifat **manual** — owner/admin memilih versi mana yang dipakai (`desktop` atau `online`).
- **Antrian sync** adalah daftar item perubahan dari device desktop yang sudah diterima server tetapi belum diproses, atau sedang menunggu resolusi konflik.
- Setiap device desktop diidentifikasi dengan `device_id` unik yang terdaftar di sistem.
- Endpoint `POST /api/sync/push` digunakan oleh aplikasi desktop saat koneksi kembali aktif (online).
- Item push yang menghasilkan konflik tidak langsung diterapkan ke database — ditahan di tabel konflik sampai diselesaikan.
- Riwayat sync (`/history`) mencatat semua aktivitas yang sudah selesai (status `synced`) maupun yang gagal (`failed`).

---

## GET /api/sync/conflicts

**Deskripsi:** Mengambil daftar konflik data yang belum diselesaikan antara versi desktop offline dan server online.

**Role:** owner, admin

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `entity_type` | string | Tidak | Filter berdasarkan jenis entitas (contoh: `product`, `transaction`) |
| `status` | string | Tidak | Filter berdasarkan status: `pending`, `resolved` |
| `page` | integer | Tidak | Halaman (default: `1`) |
| `limit` | integer | Tidak | Jumlah item per halaman (default: `20`) |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "entity_type": "product",
      "entity_id": 5,
      "desktop_data": {
        "name": "Kopi Susu",
        "selling_price": 15000
      },
      "online_data": {
        "name": "Kopi Susu Gula",
        "selling_price": 18000
      },
      "desktop_time": "2024-01-01T08:30:00Z",
      "online_time": "2024-01-01T09:15:00Z",
      "status": "pending"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3
  }
}
```

**Keterangan Field item `data`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID unik konflik |
| `entity_type` | string | Jenis entitas yang konflik (contoh: `product`, `transaction`) |
| `entity_id` | integer | ID entitas yang bersangkutan di tabel asalnya |
| `desktop_data` | object | Snapshot data versi desktop offline |
| `online_data` | object | Snapshot data versi server online |
| `desktop_time` | string (ISO 8601) | Waktu perubahan dilakukan di desktop |
| `online_time` | string (ISO 8601) | Waktu perubahan dilakukan di server |
| `status` | string | Status konflik: `pending` atau `resolved` |

> Jika tidak ada konflik, `data` berisi array kosong `[]`.

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

## POST /api/sync/conflicts/:id/resolve

**Deskripsi:** Menyelesaikan konflik dengan memilih versi data yang akan dipertahankan — versi desktop atau versi online.

**Role:** owner, admin

**Path Parameter:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | integer | ID konflik yang akan diselesaikan |

**Request Body:**
```json
{
  "resolution": "desktop"
}
```

**Keterangan Field Request:**

| Field | Tipe | Wajib | Nilai yang Valid | Deskripsi |
|-------|------|-------|-----------------|-----------|
| `resolution` | string | Ya | `desktop`, `online` | Versi data yang dipilih sebagai hasil akhir |

**Proses Resolusi:**

- `desktop` → data dari `desktop_data` diterapkan ke tabel MySQL yang bersangkutan.
- `online` → `desktop_data` diabaikan, data server tetap berlaku tanpa perubahan.
- Status konflik diperbarui menjadi `resolved`.
- Waktu resolusi dan identitas user yang menyelesaikan dicatat di sistem.

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Konflik berhasil diselesaikan"
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

**Response (404) — Konflik tidak ditemukan:**
```json
{
  "code": "04",
  "status": false,
  "message": "Konflik tidak ditemukan"
}
```

**Response (409) — Konflik sudah pernah diselesaikan:**
```json
{
  "code": "09",
  "status": false,
  "message": "Konflik ini sudah diselesaikan sebelumnya"
}
```

**Response (422) — Body tidak valid:**
```json
{
  "code": "22",
  "status": false,
  "message": "Request tidak valid",
  "errors": {
    "resolution": "resolution wajib diisi dan harus bernilai 'desktop' atau 'online'"
  }
}
```

---

## GET /api/sync/queue

**Deskripsi:** Mengambil daftar antrian sync dari semua device desktop yang terdaftar, beserta statusnya.

**Role:** owner, admin

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `device_id` | string | Tidak | Filter berdasarkan ID device desktop |
| `status` | string | Tidak | Filter berdasarkan status: `pending`, `processing`, `synced`, `failed`, `conflict` |
| `page` | integer | Tidak | Halaman (default: `1`) |
| `limit` | integer | Tidak | Jumlah item per halaman (default: `20`) |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "device_id": "desktop-001",
      "entity_type": "product",
      "entity_id": 5,
      "action": "update",
      "status": "pending",
      "retry_count": 0,
      "created_at": "2024-01-01T08:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

**Keterangan Field item `data`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID unik item antrian |
| `device_id` | string | Identifikasi device desktop pengirim |
| `entity_type` | string | Jenis entitas (contoh: `product`, `transaction`) |
| `entity_id` | integer / null | ID entitas; `null` jika aksi adalah `create` (belum punya ID server) |
| `action` | string | Jenis aksi: `create`, `update`, `delete` |
| `status` | string | Status item: `pending`, `processing`, `synced`, `failed`, `conflict` |
| `retry_count` | integer | Jumlah percobaan ulang yang sudah dilakukan |
| `created_at` | string (ISO 8601) | Waktu item masuk ke antrian |

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

## POST /api/sync/push

**Deskripsi:** Desktop mengirimkan batch perubahan data ke server untuk disinkronkan. Endpoint ini dipanggil oleh aplikasi desktop saat koneksi internet kembali aktif.

**Auth:** Bearer Token (device desktop yang sudah login)

**Request Body:**
```json
{
  "device_id": "desktop-001",
  "items": [
    {
      "entity_type": "transaction",
      "entity_id": null,
      "action": "create",
      "payload": {
        "transaction_code": "DSK-20240101-001",
        "total": 45000,
        "created_at": "2024-01-01T08:00:00Z"
      }
    },
    {
      "entity_type": "product",
      "entity_id": 5,
      "action": "update",
      "payload": {
        "selling_price": 15000
      }
    }
  ]
}
```

**Keterangan Field Request:**

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `device_id` | string | Ya | ID unik device desktop pengirim |
| `items` | array | Ya | Daftar item perubahan yang akan disinkronkan |
| `items[].entity_type` | string | Ya | Jenis entitas (contoh: `transaction`, `product`) |
| `items[].entity_id` | integer / null | Ya | ID entitas di server; `null` untuk aksi `create` |
| `items[].action` | string | Ya | Jenis aksi: `create`, `update`, `delete` |
| `items[].payload` | object | Ya | Data lengkap atau sebagian entitas yang dikirim |

**Proses di Server:**

1. Setiap item dimasukkan ke tabel antrian sync dengan status `pending`.
2. Server memproses setiap item secara berurutan:
   - **create** → insert record baru ke tabel tujuan.
   - **update** → bandingkan timestamp; jika server lebih baru → tandai sebagai konflik. Jika tidak → terapkan perubahan.
   - **delete** → soft delete atau hard delete sesuai konfigurasi entitas.
3. Item yang menimbulkan konflik masuk ke tabel konflik dengan status `pending`.
4. Ringkasan hasil dikembalikan ke desktop.

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Sync diterima",
  "data": {
    "processed": 3,
    "conflicts": 1,
    "failed": 0
  }
}
```

**Keterangan Field `data`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `processed` | integer | Jumlah item yang berhasil diproses dan diterapkan |
| `conflicts` | integer | Jumlah item yang menghasilkan konflik dan perlu diselesaikan manual |
| `failed` | integer | Jumlah item yang gagal diproses karena error |

**Response (401) — Token tidak valid:**
```json
{
  "code": "01",
  "status": false,
  "message": "Unauthorized"
}
```

**Response (422) — Body tidak valid:**
```json
{
  "code": "22",
  "status": false,
  "message": "Request tidak valid",
  "errors": {
    "device_id": "device_id wajib diisi",
    "items": "items tidak boleh kosong"
  }
}
```

**Response (500) — Gagal memproses sync:**
```json
{
  "code": "99",
  "status": false,
  "message": "Gagal memproses antrian sync"
}
```

---

## GET /api/sync/history

**Deskripsi:** Mengambil riwayat seluruh aktivitas sync yang sudah selesai atau gagal, diurutkan dari yang terbaru.

**Role:** owner, admin

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `device_id` | string | Tidak | Filter berdasarkan ID device desktop |
| `start_date` | string (YYYY-MM-DD) | Tidak | Filter dari tanggal tertentu |
| `end_date` | string (YYYY-MM-DD) | Tidak | Filter sampai tanggal tertentu |
| `page` | integer | Tidak | Halaman (default: `1`) |
| `limit` | integer | Tidak | Jumlah item per halaman (default: `20`) |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "device_id": "desktop-001",
      "entity_type": "product",
      "action": "update",
      "status": "synced",
      "synced_at": "2024-01-01T09:00:00Z"
    },
    {
      "id": 2,
      "device_id": "desktop-001",
      "entity_type": "transaction",
      "action": "create",
      "status": "failed",
      "synced_at": "2024-01-01T09:01:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25
  }
}
```

**Keterangan Field item `data`:**

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID unik entri riwayat |
| `device_id` | string | ID device yang melakukan sync |
| `entity_type` | string | Jenis entitas yang disinkronkan |
| `action` | string | Jenis aksi: `create`, `update`, `delete` |
| `status` | string | Hasil akhir: `synced` (berhasil) atau `failed` (gagal) |
| `synced_at` | string (ISO 8601) | Waktu sync selesai diproses |

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

## Catatan Tambahan

- `entity_type` yang didukung untuk sync antara lain: `product`, `transaction`, `expense`, `purchase_order`, `stock_mutation`. Entitas yang bersifat master (seperti `category`, `unit`) biasanya tidak di-sync dua arah — perubahan hanya dari server ke desktop.
- `device_id` harus terdaftar terlebih dahulu di sistem sebelum dapat melakukan push. Jika `device_id` tidak dikenal, server menolak request.
- Konflik yang belum diselesaikan (`status: pending`) tidak memblokir item lain dari device yang sama — item non-konflik tetap diproses.
- Antrian yang gagal (`failed`) dengan `retry_count` di bawah batas maksimum dapat dicoba ulang secara otomatis oleh engine sync di desktop.
