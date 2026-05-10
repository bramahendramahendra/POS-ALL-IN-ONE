# FASE 12 — Products: Types, API & Store

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 0-11 sudah selesai: semua foundation, auth, layout, shared components & hooks sudah ada.
Mulai masuk ke feature layer. Products adalah fitur pertama di domain Inventory.

## Backend Endpoints Products
```
GET    /products              → list produk (pagination, filter: search, category_id, is_active)
POST   /products              → tambah produk
GET    /products/:id          → detail produk
PUT    /products/:id          → update produk
DELETE /products/:id          → hapus produk
GET    /products/barcode/:code → cari produk via barcode

GET    /categories            → list kategori
POST   /categories            → tambah kategori
PUT    /categories/:id        → update kategori
DELETE /categories/:id        → hapus kategori

GET    /units                 → list unit
POST   /units                 → tambah unit
PUT    /units/:id             → update unit
DELETE /units/:id             → hapus unit

GET    /products/:id/units    → unit-unit yang dimiliki produk
POST   /products/:id/units    → tambah unit ke produk
PUT    /products/:id/units/:unitId → update unit produk
DELETE /products/:id/units/:unitId → hapus unit produk

GET    /products/:id/prices   → price tier produk
POST   /products/:id/prices   → tambah price tier
PUT    /products/:id/prices/:priceId → update price tier
DELETE /products/:id/prices/:priceId → hapus price tier
```

## Standar Wajib
- Semua API call menggunakan `api` dari `@/services`
- Semua query key dari `queryKeys` di `@/shared/constants`
- Store Zustand hanya untuk UI state — bukan data dari server
- `onSuccess` mutation selalu invalidate query yang relevan
- `onError` mutation selalu `toast.error(error.message)`

## Tugas Fase Ini

### File 1: `src/features/inventory/products/products.types.ts`
```ts
// Master data
export interface Category {
  id:         number
  name:       string
  created_at: string
}

export interface Unit {
  id:         number
  name:       string
  created_at: string
}

// Product unit (relasi produk-unit dengan harga pokok)
export interface ProductUnit {
  id:          number
  product_id:  number
  unit_id:     number
  unit_name:   string
  barcode?:    string
  cost_price:  number
  is_default:  boolean
}

// Price tier per produk per unit
export interface PriceTier {
  id:         number
  product_id: number
  unit_id:    number
  unit_name:  string
  tier_name:  string    // contoh: "Retail", "Grosir", "Member"
  min_qty:    number
  price:      number
}

// Produk utama
export interface Product {
  id:          number
  name:        string
  sku?:        string
  category_id?: number
  category_name?: string
  description?: string
  is_active:   boolean
  created_at:  string
  units:       ProductUnit[]
  prices:      PriceTier[]
}

// Filter
export interface ProductFilter {
  search?:      string
  category_id?: number
  is_active?:   boolean
  page?:        number
  page_size?:   number
}

// Payloads untuk create/update
export interface CreateProductPayload {
  name:         string
  sku?:         string
  category_id?: number
  description?: string
  is_active:    boolean
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {}

export interface CreateCategoryPayload  { name: string }
export interface CreateUnitPayload      { name: string }

export interface CreateProductUnitPayload {
  unit_id:     number
  barcode?:    string
  cost_price:  number
  is_default:  boolean
}

export interface CreatePriceTierPayload {
  unit_id:   number
  tier_name: string
  min_qty:   number
  price:     number
}
```

### File 2: `src/features/inventory/products/products.api.ts`
TanStack Query hooks:

**Queries:**
- `useProductListQuery(filter?: ProductFilter)` → `PaginatedResponse<Product>`
- `useProductDetailQuery(id: number)` → `Product`
- `useProductBarcodeQuery(code: string, enabled: boolean)` → `{ product: Product }`
- `useCategoryListQuery()` → `Category[]`
- `useUnitListQuery()` → `Unit[]`
- `useProductUnitsQuery(productId: number)` → `ProductUnit[]`
- `useProductPricesQuery(productId: number)` → `PriceTier[]`

**Mutations:**
- `useCreateProductMutation()` → onSuccess: invalidate `queryKeys.products.all()`
- `useUpdateProductMutation()` → onSuccess: invalidate `queryKeys.products.all()` + `detail(id)`
- `useDeleteProductMutation()` → onSuccess: invalidate `queryKeys.products.all()`
- `useCreateCategoryMutation()` → onSuccess: invalidate `queryKeys.categories.all()`
- `useUpdateCategoryMutation()` → onSuccess: invalidate `queryKeys.categories.all()`
- `useDeleteCategoryMutation()` → onSuccess: invalidate `queryKeys.categories.all()`
- `useCreateUnitMutation()` → onSuccess: invalidate `queryKeys.units.all()`
- `useUpdateUnitMutation()` → onSuccess: invalidate `queryKeys.units.all()`
- `useDeleteUnitMutation()` → onSuccess: invalidate `queryKeys.units.all()`
- `useAddProductUnitMutation(productId)` → onSuccess: invalidate product detail
- `useUpdateProductUnitMutation(productId)` → onSuccess: invalidate product detail
- `useDeleteProductUnitMutation(productId)` → onSuccess: invalidate product detail
- `useAddPriceTierMutation(productId)` → onSuccess: invalidate product prices
- `useUpdatePriceTierMutation(productId)` → onSuccess: invalidate product prices
- `useDeletePriceTierMutation(productId)` → onSuccess: invalidate product prices

Semua mutation `onError`: `toast.error(error.message)`

### File 3: `src/features/inventory/products/products.store.ts`
UI state yang tidak dari server:
```ts
interface ProductsState {
  activeTab:       'products' | 'categories' | 'units'
  editingProductId: number | null
  editingCategoryId: number | null
  editingUnitId:    number | null

  // Modal states
  productModalOpen:  boolean
  categoryModalOpen: boolean
  unitModalOpen:     boolean
  deleteConfirmOpen: boolean
  deleteTarget:      { type: 'product' | 'category' | 'unit', id: number } | null

  // Actions
  setActiveTab:         (tab: ProductsState['activeTab']) => void
  openProductModal:     (id?: number) => void
  closeProductModal:    () => void
  openCategoryModal:    (id?: number) => void
  closeCategoryModal:   () => void
  openUnitModal:        (id?: number) => void
  closeUnitModal:       () => void
  openDeleteConfirm:    (target: ProductsState['deleteTarget']) => void
  closeDeleteConfirm:   () => void
}
```

### File 4: `src/features/inventory/products/products.utils.ts`
```ts
// Validasi baris import CSV
export const validateImportRow = (row: unknown): { valid: boolean, errors: string[] }

// Hitung harga yang berlaku berdasarkan qty
export const getApplicablePrice = (prices: PriceTier[], unitId: number, qty: number): number | null

// Format display nama unit+barcode
export const formatProductUnit = (unit: ProductUnit): string
```

### File 5: `src/features/inventory/products/index.ts`
```ts
export { useProductsStore }     from './products.store'
export { useProductListQuery, useCreateProductMutation } from './products.api'
export type { Product, Category, Unit, ProductFilter }  from './products.types'
```

## Hasil yang Diharapkan
- 5 file baru dibuat
- Semua types tersedia dan type-safe
- Query hooks bisa dipanggil dari komponen
- Store bisa diakses dari komponen
- TypeScript tidak ada error
