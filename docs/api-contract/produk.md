# API Contract — Produk

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/products` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`), kecuali import |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/products` | Semua | List produk dengan filter & paginasi |
| GET | `/api/products/:id` | Semua | Detail produk by ID |
| GET | `/api/products/barcode/:barcode` | Semua | Cari produk by barcode (kasir scan) |
| GET | `/api/products/search` | Semua | Autocomplete produk by nama |
| POST | `/api/products` | owner, admin | Tambah produk baru |
| PUT | `/api/products/:id` | owner, admin | Update produk |
| DELETE | `/api/products/:id` | owner, admin | Hapus produk |
| PATCH | `/api/products/:id/toggle-status` | owner, admin | Aktif/nonaktif produk |
| POST | `/api/products/import` | owner, admin | Import produk dari Excel/CSV |

---

## GET /api/products

List semua produk dengan dukungan filter, pencarian, dan paginasi.

**Auth:** Bearer Token | Semua role

### Query Parameters

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `search` | string | Tidak | Cari berdasarkan nama atau barcode |
| `category_id` | integer | Tidak | Filter berdasarkan kategori |
| `is_active` | integer (0/1) | Tidak | Filter status aktif |
| `low_stock` | integer (1) | Tidak | Hanya produk dengan stok < min_stock |
| `page` | integer | Tidak | Halaman (default: 1) |
| `limit` | integer | Tidak | Jumlah per halaman (default: 20) |

### Response 200 — OK

```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "barcode": "8991234567890",
      "name": "Kopi Susu",
      "category_id": 1,
      "category_name": "Minuman",
      "purchase_price": 8000,
      "selling_price": 12000,
      "stock": 50,
      "min_stock": 10,
      "unit": "pcs",
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

## GET /api/products/:id

Detail produk berdasarkan ID.

**Auth:** Bearer Token | Semua role

### Path Parameter

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | integer | ID produk |

### Response 200 — OK

```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "barcode": "8991234567890",
    "name": "Kopi Susu",
    "category_id": 1,
    "category_name": "Minuman",
    "purchase_price": 8000,
    "selling_price": 12000,
    "stock": 50,
    "min_stock": 10,
    "unit": "pcs",
    "is_active": true
  }
}
```

### Response 404 — Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "Produk tidak ditemukan"
}
```

---

## GET /api/products/barcode/:barcode

Cari produk berdasarkan barcode. Digunakan saat kasir melakukan scan barcode.

**Auth:** Bearer Token | Semua role

### Path Parameter

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `barcode` | string | Kode barcode produk |

### Response 200 — OK

```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "barcode": "8991234567890",
    "name": "Kopi Susu",
    "category_id": 1,
    "category_name": "Minuman",
    "purchase_price": 8000,
    "selling_price": 12000,
    "stock": 50,
    "min_stock": 10,
    "unit": "pcs",
    "is_active": true
  }
}
```

### Response 404 — Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "Produk tidak ditemukan"
}
```

---

## GET /api/products/search

Pencarian produk berdasarkan nama untuk keperluan autocomplete di kasir.

**Auth:** Bearer Token | Semua role

### Query Parameters

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `q` | string | Ya | Kata kunci pencarian nama produk |
| `limit` | integer | Tidak | Jumlah hasil (default: 10) |

### Response 200 — OK

```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Kopi Susu",
      "barcode": "8991234567890",
      "selling_price": 12000,
      "stock": 50,
      "unit": "pcs"
    }
  ]
}
```

> Respons menggunakan field minimal untuk efisiensi autocomplete di UI kasir.

---

## POST /api/products

Tambah produk baru.

**Auth:** Bearer Token | Role: owner, admin

### Request Body

```json
{
  "barcode": "8991234567890",
  "name": "Kopi Susu",
  "category_id": 1,
  "purchase_price": 8000,
  "selling_price": 12000,
  "stock": 50,
  "min_stock": 10,
  "unit": "pcs"
}
```

### Field

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `barcode` | string | Tidak | Opsional, jika diisi harus unik |
| `name` | string | **Ya** | Nama produk |
| `category_id` | integer | Tidak | ID kategori |
| `purchase_price` | integer | Tidak | Harga beli (dalam rupiah) |
| `selling_price` | integer | **Ya** | Harga jual (>= 0) |
| `stock` | integer | Tidak | Stok awal (default: 0) |
| `min_stock` | integer | Tidak | Stok minimum untuk alert |
| `unit` | string | Tidak | Satuan produk (misal: pcs, kg, liter) |

### Validasi

- `name`: wajib diisi
- `selling_price`: wajib diisi, nilai >= 0
- `barcode`: opsional; jika diisi, harus unik di seluruh produk

### Response 201 — Created

```json
{
  "code": "21",
  "status": true,
  "message": "Produk berhasil ditambahkan",
  "data": {
    "id": 1
  }
}
```

### Response 400 — Validation Error

```json
{
  "code": "40",
  "status": false,
  "message": "Validasi gagal",
  "errors": {
    "name": "Nama produk wajib diisi",
    "selling_price": "Harga jual wajib diisi"
  }
}
```

### Response 409 — Conflict

```json
{
  "code": "49",
  "status": false,
  "message": "Barcode sudah digunakan produk lain"
}
```

---

## PUT /api/products/:id

Update data produk.

**Auth:** Bearer Token | Role: owner, admin

### Path Parameter

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | integer | ID produk |

### Request Body

Sama dengan POST `/api/products`.

### Validasi

Sama dengan POST `/api/products`. Jika `barcode` diisi, harus unik kecuali barcode milik produk itu sendiri.

### Response 200 — OK

```json
{
  "code": "00",
  "status": true,
  "message": "Produk berhasil diupdate"
}
```

### Response 404 — Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "Produk tidak ditemukan"
}
```

---

## DELETE /api/products/:id

Hapus produk. Tidak bisa menghapus produk yang sudah pernah digunakan dalam transaksi.

**Auth:** Bearer Token | Role: owner, admin

### Path Parameter

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | integer | ID produk |

### Response 200 — OK

```json
{
  "code": "00",
  "status": true,
  "message": "Produk berhasil dihapus"
}
```

### Response 404 — Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "Produk tidak ditemukan"
}
```

### Response 409 — Conflict

```json
{
  "code": "49",
  "status": false,
  "message": "Produk tidak dapat dihapus karena sudah digunakan dalam transaksi"
}
```

---

## PATCH /api/products/:id/toggle-status

Aktifkan atau nonaktifkan produk. Status dibalik dari nilai saat ini.

**Auth:** Bearer Token | Role: owner, admin

### Path Parameter

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | integer | ID produk |

### Response 200 — OK

```json
{
  "code": "00",
  "status": true,
  "message": "Status produk berhasil diubah",
  "data": {
    "is_active": false
  }
}
```

### Response 404 — Not Found

```json
{
  "code": "44",
  "status": false,
  "message": "Produk tidak ditemukan"
}
```

---

## POST /api/products/import

Import produk massal dari file Excel atau CSV.

**Auth:** Bearer Token | Role: owner, admin  
**Content-Type:** `multipart/form-data`

### Form Data

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `file` | file | **Ya** | File Excel (.xlsx) atau CSV (.csv) |

### Format Kolom File

| Kolom | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `barcode` | string | Tidak | Harus unik jika diisi |
| `name` | string | **Ya** | Nama produk |
| `category` | string | Tidak | Nama kategori (bukan ID) |
| `purchase_price` | integer | Tidak | Harga beli |
| `selling_price` | integer | **Ya** | Harga jual >= 0 |
| `stock` | integer | Tidak | Stok awal |
| `min_stock` | integer | Tidak | Stok minimum alert |
| `unit` | string | Tidak | Satuan produk |

**Urutan kolom di file:**
```
barcode | name | category | purchase_price | selling_price | stock | min_stock | unit
```

### Behavior Import

- Baris yang gagal validasi (nama kosong, harga jual kosong, barcode duplikat) akan dilewati dan dicatat di `errors`.
- Baris yang berhasil tetap disimpan meskipun ada baris lain yang gagal.
- `category` dicocokkan berdasarkan nama (case-insensitive). Jika tidak ditemukan, produk disimpan tanpa kategori.

### Response 200 — OK

```json
{
  "code": "00",
  "status": true,
  "message": "Import selesai",
  "data": {
    "success": 45,
    "failed": 2,
    "errors": [
      { "row": 3, "message": "Barcode duplikat" },
      { "row": 7, "message": "Nama produk wajib diisi" }
    ]
  }
}
```

### Response 400 — Bad Request

```json
{
  "code": "40",
  "status": false,
  "message": "Format file tidak valid. Gunakan .xlsx atau .csv"
}
```

---

## Kode Respons

| Code | HTTP Status | Keterangan |
|------|-------------|------------|
| `00` | 200 | Sukses |
| `21` | 201 | Data berhasil dibuat |
| `40` | 400 | Request tidak valid / validasi gagal |
| `44` | 404 | Data tidak ditemukan |
| `49` | 409 | Konflik data (barcode duplikat, produk dipakai transaksi) |
| `43` | 403 | Akses ditolak (role tidak sesuai) |
| `41` | 401 | Token tidak valid atau expired |

---

## Catatan Bisnis

- **Stok** dikelola otomatis oleh sistem saat transaksi penjualan, pembelian, dan retur. Endpoint ini hanya untuk stok awal dan koreksi manual.
- **Barcode** bersifat opsional. Produk tanpa barcode tetap bisa dicari via nama di endpoint `/search`.
- **Produk nonaktif** (`is_active: false`) tidak muncul di endpoint kasir (search & barcode scan) tetapi masih tersimpan di database untuk keperluan histori transaksi.
- **Harga beli** (`purchase_price`) hanya terlihat oleh role owner dan admin untuk keperluan laporan margin.
