# API Contract — Retur Supplier

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/supplier-returns` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/supplier-returns` | Semua | Daftar retur dengan filter tanggal, supplier, dan status |
| GET | `/api/supplier-returns/:id` | Semua | Detail satu retur beserta item-itemnya |
| GET | `/api/purchases/:purchase_id/items` | Semua | Ambil item PO untuk dipilih saat membuat retur |
| POST | `/api/supplier-returns` | owner, admin | Buat retur baru berdasarkan PO yang ada |
| PATCH | `/api/supplier-returns/:id/status` | owner, admin | Update status retur (approved / rejected) |
| DELETE | `/api/supplier-returns/:id` | owner, admin | Hapus retur (hanya jika belum approved) |

---

## Logika Bisnis

- Retur selalu berdasarkan Purchase Order (`purchase_id`) yang sudah ada.
- `return_code` di-generate otomatis oleh backend dengan format `RTR-YYYYMMDD-XXX`.
- `total_return_amount` dihitung dari penjumlahan semua `subtotal` item retur.
- Status awal retur adalah `pending`.
- Saat status diubah menjadi `approved`:
  - Stok setiap produk di retur dikurangi sesuai `quantity`.
  - Mutasi stok tipe `out` dicatat untuk setiap item.
- Retur **tidak bisa dihapus** jika sudah berstatus `approved`.
- `supplier_name` disimpan sebagai snapshot saat retur dibuat.

---

## GET /api/supplier-returns

**Deskripsi:** Mengambil daftar Retur Supplier dengan filter dan pagination.

**Query Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `start_date` | string (YYYY-MM-DD) | Filter dari tanggal retur |
| `end_date` | string (YYYY-MM-DD) | Filter sampai tanggal retur |
| `supplier_id` | integer | Filter berdasarkan supplier |
| `status` | string | Filter status: `pending`, `approved`, `rejected` |
| `page` | integer | Halaman (default: 1) |
| `limit` | integer | Jumlah per halaman (default: 20) |

**Contoh Request:**
```
GET /api/supplier-returns?start_date=2024-01-01&end_date=2024-01-31&supplier_id=1&status=pending&page=1&limit=20
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
      "return_code": "RTR-20240101-001",
      "supplier_name": "PT Sumber Makmur",
      "return_date": "2024-01-05",
      "total_return_amount": 160000,
      "status": "pending"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

---

## GET /api/supplier-returns/:id

**Deskripsi:** Mengambil detail satu Retur Supplier beserta daftar item.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Retur Supplier |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "return_code": "RTR-20240101-001",
    "purchase_id": 1,
    "purchase_code": "PO-20240101-001",
    "supplier_id": 1,
    "supplier_name": "PT Sumber Makmur",
    "return_date": "2024-01-05",
    "total_return_amount": 160000,
    "reason": "Produk rusak",
    "status": "pending",
    "notes": "",
    "items": [
      {
        "id": 1,
        "product_name": "Kopi Susu",
        "quantity": 20,
        "unit": "pcs",
        "purchase_price": 8000,
        "subtotal": 160000
      }
    ]
  }
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Retur Supplier tidak ditemukan"
}
```

---

## GET /api/purchases/:purchase_id/items

**Deskripsi:** Mengambil daftar item dari Purchase Order tertentu. Digunakan sebagai referensi saat user memilih item yang akan diretur.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `purchase_id` | integer | ID Purchase Order |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Kopi Susu",
      "quantity": 100,
      "unit": "pcs",
      "purchase_price": 8000
    }
  ]
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Purchase Order tidak ditemukan"
}
```

---

## POST /api/supplier-returns

**Deskripsi:** Membuat Retur Supplier baru berdasarkan Purchase Order yang sudah ada. Backend otomatis generate `return_code` dan hitung `total_return_amount`. Status awal adalah `pending`.

**Request Body:**
```json
{
  "purchase_id": 1,
  "supplier_id": 1,
  "supplier_name": "PT Sumber Makmur",
  "return_date": "2024-01-05",
  "reason": "Produk rusak",
  "notes": "",
  "items": [
    {
      "purchase_item_id": 1,
      "product_id": 1,
      "product_name": "Kopi Susu",
      "quantity": 20,
      "unit": "pcs",
      "purchase_price": 8000,
      "subtotal": 160000
    }
  ]
}
```

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `purchase_id` | integer | Ya | ID Purchase Order yang menjadi dasar retur |
| `supplier_id` | integer | Ya | ID supplier |
| `supplier_name` | string | Ya | Nama supplier (snapshot saat retur dibuat) |
| `return_date` | string (YYYY-MM-DD) | Ya | Tanggal retur |
| `reason` | string | Ya | Alasan retur |
| `notes` | string | Tidak | Catatan tambahan |
| `items` | array | Ya | Daftar item yang diretur (minimal 1 item) |
| `items[].purchase_item_id` | integer | Ya | ID item dari PO asal |
| `items[].product_id` | integer | Ya | ID produk |
| `items[].product_name` | string | Ya | Nama produk (snapshot) |
| `items[].quantity` | integer | Ya | Jumlah yang diretur (> 0) |
| `items[].unit` | string | Ya | Satuan produk |
| `items[].purchase_price` | integer | Ya | Harga beli per satuan (dari PO) |
| `items[].subtotal` | integer | Ya | `quantity × purchase_price` |

**Proses Backend:**
1. Validasi `purchase_id` ada dan valid
2. Generate `return_code` format `RTR-YYYYMMDD-XXX`
3. Hitung `total_return_amount` dari sum semua `subtotal`
4. Simpan retur header dan semua item dengan status `pending`

**Response (201):**
```json
{
  "code": "21",
  "status": true,
  "message": "Retur berhasil dibuat",
  "data": {
    "id": 1,
    "return_code": "RTR-20240101-001"
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
    "purchase_id": "Purchase Order wajib dipilih",
    "return_date": "Tanggal retur wajib diisi",
    "reason": "Alasan retur wajib diisi",
    "items": "Minimal satu item wajib diisi"
  }
}
```

**Response (404) — PO Tidak Ditemukan:**
```json
{
  "code": "99",
  "status": false,
  "message": "Purchase Order tidak ditemukan"
}
```

---

## PATCH /api/supplier-returns/:id/status

**Deskripsi:** Mengupdate status Retur Supplier menjadi `approved` atau `rejected`. Jika disetujui (`approved`), stok setiap produk dikurangi dan mutasi stok tipe `out` dicatat.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Retur Supplier |

**Request Body:**
```json
{
  "status": "approved",
  "notes": ""
}
```

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `status` | string | Ya | Status baru: `approved` atau `rejected` |
| `notes` | string | Tidak | Catatan keputusan |

**Proses Backend (jika `approved`):**
1. Validasi retur masih berstatus `pending`
2. Kurangi stok setiap produk sesuai `quantity` item retur
3. Catat mutasi stok tipe `out` untuk setiap item
4. Update status retur menjadi `approved`

**Proses Backend (jika `rejected`):**
1. Validasi retur masih berstatus `pending`
2. Update status retur menjadi `rejected` (tidak ada perubahan stok)

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Status retur berhasil diupdate"
}
```

**Response (409) — Status Sudah Final:**
```json
{
  "code": "99",
  "status": false,
  "message": "Status retur tidak dapat diubah karena sudah diproses"
}
```

**Response (422) — Nilai Status Tidak Valid:**
```json
{
  "code": "99",
  "status": false,
  "message": "Validasi gagal",
  "errors": {
    "status": "Status harus bernilai approved atau rejected"
  }
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Retur Supplier tidak ditemukan"
}
```

---

## DELETE /api/supplier-returns/:id

**Deskripsi:** Menghapus Retur Supplier. Tidak bisa dilakukan jika retur sudah berstatus `approved`.

**Path Params:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | ID Retur Supplier |

**Validasi:**
- Retur tidak boleh berstatus `approved`

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Retur berhasil dihapus"
}
```

**Response (409) — Sudah Approved:**
```json
{
  "code": "99",
  "status": false,
  "message": "Retur tidak dapat dihapus karena sudah disetujui"
}
```

**Response (404):**
```json
{
  "code": "99",
  "status": false,
  "message": "Retur Supplier tidak ditemukan"
}
```

---

## Status Retur

| Nilai | Deskripsi |
|-------|-----------|
| `pending` | Retur baru dibuat, menunggu keputusan |
| `approved` | Retur disetujui, stok sudah dikurangi |
| `rejected` | Retur ditolak, stok tidak berubah |

---

## Keterkaitan dengan Modul Lain

| Modul | Keterkaitan |
|-------|-------------|
| **Purchase Order** | `purchase_id` merujuk ke tabel `purchases`; retur harus berdasarkan PO yang ada |
| **Supplier** | `supplier_id` merujuk ke tabel `suppliers` |
| **Produk** | `product_id` merujuk ke tabel `products`; stok produk berkurang saat retur `approved` |
| **Stock Mutations** | Mutasi stok tipe `out` dicatat untuk setiap item saat retur berstatus `approved` |
