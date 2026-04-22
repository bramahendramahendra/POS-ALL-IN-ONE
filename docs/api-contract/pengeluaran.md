# API Contract — Pengeluaran (Expenses)

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/expenses` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/expenses` | Semua | Daftar pengeluaran dengan filter tanggal dan kategori |
| GET | `/api/expenses/:id` | Semua | Detail satu pengeluaran |
| POST | `/api/expenses` | Semua | Tambah pengeluaran baru |
| PUT | `/api/expenses/:id` | owner, admin | Update pengeluaran |
| DELETE | `/api/expenses/:id` | owner, admin | Hapus pengeluaran |

---

## Logika Bisnis

- Setiap pengeluaran **terhubung ke kas harian yang sedang terbuka** milik user yang login.
- Saat pengeluaran berhasil dicatat, sistem secara otomatis memperbarui `total_expenses` pada kas terkait via `PATCH /api/cash-drawer/:id/update-expenses`.
- `payment_method` default ke `cash` jika tidak diisi.
- Pengeluaran hanya bisa diedit atau dihapus oleh role `owner` dan `admin`.

---

## GET /api/expenses

**Deskripsi:** Mengambil daftar pengeluaran dengan filter tanggal, kategori, dan pagination.

**Query Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `start_date` | string (YYYY-MM-DD) | Filter dari tanggal |
| `end_date` | string (YYYY-MM-DD) | Filter sampai tanggal |
| `category` | string | Filter berdasarkan kategori |
| `page` | integer | Halaman (default: 1) |
| `limit` | integer | Jumlah per halaman (default: 20) |

**Contoh Request:**
```
GET /api/expenses?start_date=2024-01-01&end_date=2024-01-31&category=operasional&page=1&limit=20
```

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "expense_date": "2024-01-01",
      "category": "Operasional",
      "description": "Beli sabun cuci",
      "amount": 25000,
      "payment_method": "cash",
      "user_name": "Admin",
      "notes": ""
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

---

## GET /api/expenses/:id

**Deskripsi:** Mengambil detail satu pengeluaran berdasarkan ID.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID pengeluaran |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "cash_drawer_id": 1,
    "expense_date": "2024-01-01",
    "category": "Operasional",
    "description": "Beli sabun cuci",
    "amount": 25000,
    "payment_method": "cash",
    "user_id": 1,
    "user_name": "Admin",
    "notes": "",
    "created_at": "2024-01-01T09:00:00Z"
  }
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Data pengeluaran tidak ditemukan"
}
```

---

## POST /api/expenses

**Deskripsi:** Menambah pengeluaran baru. Secara otomatis dikaitkan ke kas harian yang sedang terbuka milik user login.

**Request Body:**
```json
{
  "expense_date": "2024-01-01",
  "category": "Operasional",
  "description": "Beli sabun cuci",
  "amount": 25000,
  "payment_method": "cash",
  "notes": ""
}
```

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `expense_date` | string (YYYY-MM-DD) | Ya | Tanggal pengeluaran |
| `category` | string | Ya | Kategori pengeluaran (misal: Operasional, Listrik, Air) |
| `description` | string | Tidak | Keterangan singkat pengeluaran |
| `amount` | integer | Ya | Nominal pengeluaran (> 0, dalam rupiah) |
| `payment_method` | string | Tidak | Metode pembayaran: `cash`, `transfer` (default: `cash`) |
| `notes` | string | Tidak | Catatan tambahan |

**Validasi:**
- `expense_date`: wajib diisi
- `category`: wajib diisi
- `amount`: wajib diisi, harus > 0

**Response (201):**
```json
{
  "code": "21",
  "status": true,
  "message": "Pengeluaran berhasil ditambahkan",
  "data": {
    "id": 1
  }
}
```

**Response (422) — Validasi Gagal:**
```json
{
  "code": "99",
  "status": false,
  "message": "Validasi gagal",
  "errors": {
    "expense_date": "Tanggal pengeluaran wajib diisi",
    "category": "Kategori wajib diisi",
    "amount": "Nominal harus lebih dari 0"
  }
}
```

---

## PUT /api/expenses/:id

**Deskripsi:** Mengupdate data pengeluaran yang sudah ada. Hanya dapat dilakukan oleh role `owner` atau `admin`.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID pengeluaran |

**Request Body:**
```json
{
  "expense_date": "2024-01-01",
  "category": "Operasional",
  "description": "Beli sabun cuci piring",
  "amount": 30000,
  "payment_method": "cash",
  "notes": "Dikoreksi oleh admin"
}
```

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `expense_date` | string (YYYY-MM-DD) | Ya | Tanggal pengeluaran |
| `category` | string | Ya | Kategori pengeluaran |
| `description` | string | Tidak | Keterangan singkat pengeluaran |
| `amount` | integer | Ya | Nominal pengeluaran (> 0) |
| `payment_method` | string | Tidak | Metode pembayaran |
| `notes` | string | Tidak | Catatan tambahan |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Pengeluaran berhasil diupdate"
}
```

**Response (403) — Akses Ditolak:**
```json
{
  "code": "99",
  "status": false,
  "message": "Akses ditolak"
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Data pengeluaran tidak ditemukan"
}
```

---

## DELETE /api/expenses/:id

**Deskripsi:** Menghapus pengeluaran. Hanya dapat dilakukan oleh role `owner` atau `admin`. Sistem otomatis memperbarui `total_expenses` pada kas terkait setelah penghapusan.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID pengeluaran |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Pengeluaran berhasil dihapus"
}
```

**Response (403) — Akses Ditolak:**
```json
{
  "code": "99",
  "status": false,
  "message": "Akses ditolak"
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Data pengeluaran tidak ditemukan"
}
```

---

## Metode Pembayaran

| Nilai | Deskripsi |
|-------|-----------|
| `cash` | Tunai (default) |
| `transfer` | Transfer bank / non-tunai |

---

## Keterkaitan dengan Kas Harian

Pengeluaran memiliki relasi langsung ke kas harian (`cash_drawer_id`):

- **POST /api/expenses** → sistem otomatis memanggil `PATCH /api/cash-drawer/:id/update-expenses` untuk memperbarui `total_expenses` pada kas yang terbuka.
- **DELETE /api/expenses/:id** → sistem otomatis mengurangi `total_expenses` pada kas terkait.
- **PUT /api/expenses/:id** → jika `amount` berubah, sistem otomatis menyesuaikan `total_expenses` pada kas terkait.
