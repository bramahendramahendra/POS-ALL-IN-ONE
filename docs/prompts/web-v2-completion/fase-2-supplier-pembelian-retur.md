# Fase 2 — Supplier Sub-Menu: Pembelian & Retur

Kamu adalah senior React/TypeScript developer. Saya punya project web-v2 (React + TypeScript +
Vite + Zustand + React Query + React Router v6, Tailwind CSS + shadcn/ui).

## Context

Struktur project: `web-v2/src/features/<domain>/`
Pattern per feature:
- `*.api.ts`      → React Query hooks (useQuery/useMutation via apiClient)
- `*.types.ts`    → TypeScript types
- `components/`   → sub-komponen
- `*Page.tsx`     → halaman utama

API client import: `import { apiClient } from '@/shared/lib/api-client'`
Shared UI: `@/shared/components/ui/*`

## Existing Suppliers

- `/suppliers` → `SuppliersPage.tsx` sudah ada: CRUD master data supplier
- Referensi pattern: `web-v2/src/features/inventory/suppliers/`

## Task

Desktop punya 3 tab di Supplier: "Data Supplier", "Pembelian", "Retur Pembelian".
Di web-v2 kita buat sub-menu (nested route) bukan tab.

Buat 2 halaman baru:

---

### Halaman 1: Pembelian Supplier — `/suppliers/purchases`

Fitur:
- Tabel pembelian: kolom = Tanggal, No. Faktur, Supplier, Total, Status (lunas/hutang/partial), Sisa Hutang, Aksi (detail, bayar, hapus)
- Filter: date_from, date_to, supplier_id (select dari list supplier), status
- Tombol "Tambah Pembelian" → modal form
- Form tambah: tanggal, no_invoice, supplier (select), items (dynamic rows: produk, qty, harga satuan, subtotal), diskon nominal, notes, payment_status, paid_amount
- Tombol "Bayar" pada baris yang berstatus hutang/partial → modal bayar: input jumlah, catatan

API endpoints:
- `GET /supplier-purchases` — params: `date_from`, `date_to`, `supplier_id`, `status`, `page`, `page_size`
- `GET /supplier-purchases/:id`
- `POST /supplier-purchases`
- `DELETE /supplier-purchases/:id`
- `POST /supplier-purchases/:id/payments` — body: `{ amount, notes }`

Types untuk `supplier-purchases.types.ts`:
```ts
interface SupplierPurchase {
  id: number
  purchase_date: string
  invoice_number: string
  supplier_id: number
  supplier_name: string
  subtotal: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: 'lunas' | 'hutang' | 'partial'
  notes?: string
  items: SupplierPurchaseItem[]
}

interface SupplierPurchaseItem {
  product_id: number
  product_name: string
  quantity: number
  unit: string
  price: number
  subtotal: number
}

interface SupplierPurchasePayment {
  amount: number
  notes?: string
}
```

---

### Halaman 2: Retur Pembelian — `/suppliers/returns`

Fitur:
- Tabel retur: kolom = Tanggal, No. Faktur Pembelian, Supplier, Total Retur, Alasan, Aksi (hapus)
- Filter: date_from, date_to, supplier_id
- Tombol "Tambah Retur" → modal form
- Form: pilih pembelian (select dari list purchases), items yang diretur (checkbox + input qty), alasan, catatan

API endpoints:
- `GET /supplier-returns` — params: `date_from`, `date_to`, `supplier_id`, `page`, `page_size`
- `POST /supplier-returns` — body: `{ purchase_id, items: [{item_id, quantity}], reason, notes }`
- `DELETE /supplier-returns/:id`

Types untuk `supplier-returns.types.ts`:
```ts
interface SupplierReturn {
  id: number
  return_date: string
  purchase_id: number
  invoice_number: string
  supplier_name: string
  total_return: number
  reason: string
  notes?: string
  items: SupplierReturnItem[]
}

interface SupplierReturnItem {
  product_name: string
  quantity: number
  unit: string
  price: number
  subtotal: number
}

interface CreateSupplierReturnPayload {
  purchase_id: number
  items: { item_id: number; quantity: number }[]
  reason: string
  notes?: string
}
```

---

## Router & Navigation Changes

Di `web-v2/src/shared/constants/routes.ts` tambahkan:
```ts
SUPPLIER_PURCHASES: '/suppliers/purchases',
SUPPLIER_RETURNS:   '/suppliers/returns',
```

Di `web-v2/src/app/router.tsx` tambahkan ke protected MANAGEMENT_ROLES children:
```ts
{ path: ROUTES.SUPPLIER_PURCHASES, element: <LazyRoute><SupplierPurchasesPage /></LazyRoute> },
{ path: ROUTES.SUPPLIER_RETURNS,   element: <LazyRoute><SupplierReturnsPage /></LazyRoute> },
```

Di `web-v2/src/shared/constants/navigation.ts` tambahkan di group "Inventori":
```ts
{ label: 'Pembelian', path: ROUTES.SUPPLIER_PURCHASES, icon: ShoppingBag, allowedRoles: MANAGEMENT_ROLES, group: 'Inventori' },
{ label: 'Retur',     path: ROUTES.SUPPLIER_RETURNS,   icon: RotateCcw,   allowedRoles: MANAGEMENT_ROLES, group: 'Inventori' },
```

---

## Output yang Diharapkan

Buat file-file berikut (isi lengkap, siap pakai):

1. `web-v2/src/features/inventory/supplier-purchases/supplier-purchases.types.ts`
2. `web-v2/src/features/inventory/supplier-purchases/supplier-purchases.api.ts`
3. `web-v2/src/features/inventory/supplier-purchases/components/PurchaseTable.tsx`
4. `web-v2/src/features/inventory/supplier-purchases/components/PurchaseFormModal.tsx`
5. `web-v2/src/features/inventory/supplier-purchases/components/PaymentModal.tsx`
6. `web-v2/src/features/inventory/supplier-purchases/SupplierPurchasesPage.tsx`
7. `web-v2/src/features/inventory/supplier-returns/supplier-returns.types.ts`
8. `web-v2/src/features/inventory/supplier-returns/supplier-returns.api.ts`
9. `web-v2/src/features/inventory/supplier-returns/components/ReturnTable.tsx`
10. `web-v2/src/features/inventory/supplier-returns/components/ReturnFormModal.tsx`
11. `web-v2/src/features/inventory/supplier-returns/SupplierReturnsPage.tsx`
12. Update `web-v2/src/shared/constants/routes.ts`
13. Update `web-v2/src/shared/constants/navigation.ts`
14. Update `web-v2/src/app/router.tsx`

Jangan buat file lain selain yang disebutkan di atas.
Ikuti pattern yang sudah ada di `web-v2/src/features/inventory/suppliers/` sebagai referensi gaya kode.
