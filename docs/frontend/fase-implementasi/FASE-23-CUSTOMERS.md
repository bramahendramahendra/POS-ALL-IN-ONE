# FASE 23 — Customers

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 22 sudah selesai: Transactions selesai.

## Backend Endpoints
```
GET    /customers        → list (pagination, filter: search)
POST   /customers        → tambah
GET    /customers/:id    → detail
PUT    /customers/:id    → update
DELETE /customers/:id    → hapus
```

## Tugas Fase Ini

### File 1: `src/features/customers/customers.types.ts`
```ts
export interface Customer {
  id:         number
  name:       string
  phone?:     string
  email?:     string
  address?:   string
  notes?:     string
  created_at: string
}

export interface CustomerFilter {
  search?:    string
  page?:      number
  page_size?: number
}

export interface CreateCustomerPayload {
  name:     string
  phone?:   string
  email?:   string
  address?: string
  notes?:   string
}

export interface UpdateCustomerPayload extends Partial<CreateCustomerPayload> {}
```

### File 2: `src/features/customers/customers.api.ts`
- `useCustomerListQuery(filter?)` → `PaginatedResponse<Customer>`
- `useCustomerDetailQuery(id)` → `Customer`
- `useCreateCustomerMutation()` → onSuccess: invalidate `queryKeys.customers.all()`
- `useUpdateCustomerMutation()` → onSuccess: invalidate list + detail
- `useDeleteCustomerMutation()` → onSuccess: invalidate `queryKeys.customers.all()`

### File 3: `src/features/customers/components/CustomerTable.tsx`
Kolom: Nama, Telepon, Email, Aksi (Edit + Hapus — Hapus hanya owner).

### File 4: `src/features/customers/components/CustomerFormModal.tsx`
Zod schema:
```ts
const customerSchema = z.object({
  name:    z.string().min(1, 'Nama pelanggan wajib diisi'),
  phone:   z.string().optional(),
  email:   z.string().email('Format email tidak valid').optional().or(z.literal('')),
  address: z.string().optional(),
  notes:   z.string().optional(),
})
```
Mode tambah/edit berdasarkan `customerId` prop.

### File 5: `src/features/customers/CustomersPage.tsx`
PageHeader, filter search, CustomerTable, CustomerFormModal, ConfirmDialog hapus.

### File 6: `src/features/customers/index.ts`
```ts
export { CustomersPage } from './CustomersPage'
export { useCustomerListQuery } from './customers.api'
export type { Customer } from './customers.types'
```

Catatan: `useCustomerListQuery` di-export karena dipakai di cashier.api.ts.

### Update Router
Ganti placeholder `/customers` dengan `<CustomersPage />`.

## Hasil yang Diharapkan
- CRUD pelanggan lengkap berfungsi
- Search pelanggan berfungsi
- TypeScript tidak ada error
