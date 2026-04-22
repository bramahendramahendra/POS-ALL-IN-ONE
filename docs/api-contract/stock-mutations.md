# API Contract — Stock Mutations

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL | `/api/stock-mutations` |
| Auth | Bearer Token (semua endpoint) |
| Format | JSON (`application/json`) |

---

## Daftar Endpoint

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/stock-mutations` | owner, admin | List mutasi stok dengan filter opsional |
| GET | `/api/stock-mutations/product/:product_id` | owner, admin | Riwayat mutasi stok satu produk |

---

## Logika Bisnis

- Tabel `stock_mutations` bersifat **append-only (log)** — tidak ada operasi update atau delete.
- Mutasi stok dibuat **otomatis oleh backend** saat operasi berikut terjadi:
  - **Transaksi** penjualan → mutasi `out`
  - **Void transaksi** → mutasi `void` (rollback stok)
  - **Purchase Order** diterima (status `received`) → mutasi `in`
  - **Retur Supplier** disetujui (status `approved`) → mutasi `return`
  - **Penyesuaian stok manual** oleh admin → mutasi `adjustment`
- Tidak ada endpoint POST / PUT / DELETE untuk stock mutations.
- `stock_before` dan `stock_after` mencatat kondisi stok sebelum dan sesudah mutasi terjadi.
- `reference_type` dan `reference_id` menunjuk ke entitas sumber mutasi (polymorphic reference).

---

## Tipe Mutasi

| Tipe | Keterangan | Efek Stok |
|------|------------|-----------|
| `in` | Stok masuk dari pembelian (PO diterima) | + (tambah) |
| `out` | Stok keluar karena transaksi penjualan | - (kurang) |
| `adjustment` | Penyesuaian stok manual oleh admin | +/- (tergantung nilai) |
| `void` | Void transaksi — rollback stok yang keluar | + (tambah kembali) |
| `return` | Retur ke supplier yang disetujui | - (kurang) |

---

## GET /api/stock-mutations

**Deskripsi:** Mengambil daftar mutasi stok. Mendukung filter berdasarkan produk, tipe mutasi, dan rentang tanggal.

**Role:** owner, admin

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `product_id` | integer | Tidak | Filter berdasarkan produk tertentu |
| `mutation_type` | string | Tidak | Filter tipe mutasi: `in`, `out`, `adjustment`, `void`, `return` |
| `start_date` | string (YYYY-MM-DD) | Tidak | Tanggal awal filter |
| `end_date` | string (YYYY-MM-DD) | Tidak | Tanggal akhir filter |
| `page` | integer | Tidak | Nomor halaman (default: 1) |
| `limit` | integer | Tidak | Jumlah data per halaman (default: 20) |

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
      "mutation_type": "out",
      "quantity": 2,
      "stock_before": 52,
      "stock_after": 50,
      "reference_type": "transaction",
      "reference_id": 1,
      "notes": "Transaksi WEB-20240101-001",
      "user_name": "Kasir Satu",
      "created_at": "2024-01-01T10:00:00Z"
    },
    {
      "id": 2,
      "product_id": 1,
      "product_name": "Kopi Susu",
      "mutation_type": "in",
      "quantity": 10,
      "stock_before": 50,
      "stock_after": 60,
      "reference_type": "purchase_order",
      "reference_id": 5,
      "notes": "PO-20240101-005 diterima",
      "user_name": "Admin",
      "created_at": "2024-01-01T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 200
  }
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

## GET /api/stock-mutations/product/:product_id

**Deskripsi:** Mengambil riwayat mutasi stok untuk satu produk tertentu. Diurutkan dari terbaru.

**Role:** owner, admin

**Query Parameters:**

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `page` | integer | Tidak | Nomor halaman (default: 1) |
| `limit` | integer | Tidak | Jumlah data per halaman (default: 20) |

**Response (200):**
```json
{
  "code": "00",
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 5,
      "product_id": 3,
      "product_name": "Teh Manis",
      "mutation_type": "adjustment",
      "quantity": 5,
      "stock_before": 20,
      "stock_after": 25,
      "reference_type": "adjustment",
      "reference_id": null,
      "notes": "Penyesuaian stok opname",
      "user_name": "Admin",
      "created_at": "2024-01-15T09:30:00Z"
    },
    {
      "id": 3,
      "product_id": 3,
      "product_name": "Teh Manis",
      "mutation_type": "out",
      "quantity": 1,
      "stock_before": 21,
      "stock_after": 20,
      "reference_type": "transaction",
      "reference_id": 12,
      "notes": "Transaksi WEB-20240110-012",
      "user_name": "Kasir Dua",
      "created_at": "2024-01-10T11:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

**Response (404) — Produk tidak ditemukan:**
```json
{
  "code": "04",
  "status": false,
  "message": "Produk tidak ditemukan"
}
```

---

## SQL Schema

```sql
CREATE TABLE stock_mutations (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id      BIGINT UNSIGNED NOT NULL,
    mutation_type   ENUM('in','out','adjustment','void','return') NOT NULL,
    quantity        INT             NOT NULL,
    stock_before    INT             NOT NULL DEFAULT 0,
    stock_after     INT             NOT NULL DEFAULT 0,
    reference_type  VARCHAR(50)     NULL COMMENT 'transaction | purchase_order | return_supplier | adjustment',
    reference_id    BIGINT UNSIGNED NULL,
    notes           VARCHAR(255)    NULL,
    created_by      BIGINT UNSIGNED NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_stock_mutations_product_id   (product_id),
    KEY idx_stock_mutations_mutation_type (mutation_type),
    KEY idx_stock_mutations_created_at   (created_at),
    KEY idx_stock_mutations_reference    (reference_type, reference_id),

    CONSTRAINT fk_stock_mutations_product
        FOREIGN KEY (product_id) REFERENCES products (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_stock_mutations_user
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relasi

| Tabel | Kolom | Keterangan |
|-------|-------|------------|
| `products` | `id` | Produk yang mengalami mutasi stok |
| `users` | `id` | User yang memicu atau mencatat mutasi |
| `transactions` | `id` | Referensi transaksi penjualan (`reference_type = 'transaction'`) |
| `purchase_orders` | `id` | Referensi purchase order (`reference_type = 'purchase_order'`) |
| `supplier_returns` | `id` | Referensi retur supplier (`reference_type = 'return_supplier'`) |

### Catatan Schema

- Tabel ini **tidak memiliki** kolom `updated_at` karena bersifat append-only; data tidak pernah diubah setelah dibuat.
- `reference_type` dan `reference_id` menggunakan pola **polymorphic reference** — bukan foreign key constraint — karena merujuk ke beberapa tabel berbeda.
- `quantity` selalu positif; efek penambahan atau pengurangan stok ditentukan dari `stock_before` vs `stock_after`.
- Index pada `(reference_type, reference_id)` untuk mendukung query balik: "mutasi apa saja yang terjadi dari transaksi X?".
- `created_by` nullable untuk mengakomodasi mutasi yang dipicu oleh sistem secara otomatis tanpa user spesifik.
