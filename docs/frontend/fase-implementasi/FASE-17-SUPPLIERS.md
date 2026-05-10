# FASE 17 — Inventory: Suppliers

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 16 sudah selesai: fitur Products lengkap sudah berjalan.

## Backend Endpoints
```
GET    /suppliers         → list supplier (pagination, filter: search)
POST   /suppliers         → tambah supplier
GET    /suppliers/:id     → detail supplier
PUT    /suppliers/:id     → update supplier
DELETE /suppliers/:id     → hapus supplier
```

## Standar Wajib
- Ikuti pola yang sama dengan Products (konsistensi)
- Gunakan komponen shared: DataTable, PageHeader, FormModal, ConfirmDialog
- Validasi Zod untuk form

## Tugas Fase Ini

### File 1: `src/features/inventory/suppliers/suppliers.types.ts`
```ts
export interface Supplier {
  id:           number
  name:         string
  contact_name?: string
  phone?:       string
  email?:       string
  address?:     string
  notes?:       string
  created_at:   string
}

export interface SupplierFilter {
  search?:    string
  page?:      number
  page_size?: number
}

export interface CreateSupplierPayload {
  name:          string
  contact_name?: string
  phone?:        string
  email?:        string
  address?:      string
  notes?:        string
}

export interface UpdateSupplierPayload extends Partial<CreateSupplierPayload> {}
```

### File 2: `src/features/inventory/suppliers/suppliers.api.ts`
**Queries:**
- `useSupplierListQuery(filter?: SupplierFilter)` → `PaginatedResponse<Supplier>`
- `useSupplierDetailQuery(id: number)` → `Supplier`

**Mutations:**
- `useCreateSupplierMutation()`
- `useUpdateSupplierMutation()`
- `useDeleteSupplierMutation()`

Semua onSuccess: invalidate `queryKeys.suppliers.all()`.
Semua onError: `toast.error(error.message)`.

### File 3: `src/features/inventory/suppliers/components/SupplierTable.tsx`
**Kolom:**
- Nama supplier (bold)
- Nama kontak
- No. telepon
- Email
- Aksi: Edit + Hapus (Hapus hanya owner)

**Props:**
```ts
interface SupplierTableProps {
  data:       Supplier[]
  isLoading:  boolean
  pagination: PaginationProps
}
```

### File 4: `src/features/inventory/suppliers/components/SupplierFormModal.tsx`
**Zod Schema:**
```ts
const supplierSchema = z.object({
  name:         z.string().min(1, 'Nama supplier wajib diisi'),
  contact_name: z.string().optional(),
  phone:        z.string().optional(),
  email:        z.string().email('Format email tidak valid').optional().or(z.literal('')),
  address:      z.string().optional(),
  notes:        z.string().optional(),
})
```

**Form fields:** nama, nama kontak, telepon, email, alamat (textarea), catatan (textarea).
**Mode tambah/edit** berdasarkan `supplierId` prop.

### File 5: `src/features/inventory/suppliers/SuppliersPage.tsx`
```tsx
<PageHeader
  title="Supplier"
  breadcrumbs={[{ label: 'Inventori' }, { label: 'Supplier' }]}
  actions={
    <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
      <Button onClick={openForm}><Plus /> Tambah Supplier</Button>
    </RoleGuard>
  }
/>
```

State: search, pagination, modal open, editing id, delete confirm.
Filter: search input dengan debounce 300ms.

### File 6: `src/features/inventory/suppliers/index.ts`
```ts
export { SuppliersPage } from './SuppliersPage'
```

### Update Router
Ganti placeholder `/suppliers` dengan `<SuppliersPage />`.

## Hasil yang Diharapkan
- `/suppliers` menampilkan list supplier
- CRUD supplier lengkap berfungsi
- Search supplier berfungsi
- Pagination berfungsi
- TypeScript tidak ada error
