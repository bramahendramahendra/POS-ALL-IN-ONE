# FASE 11 — Shared Hooks

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 0-10 sudah selesai: semua shared components sudah ada.

## Standar Wajib
- Semua hooks adalah pure React hooks — tidak ada side effect ke luar React lifecycle
- Hooks masuk `shared/hooks/` hanya jika dipakai minimal 2 fitur berbeda
- TypeScript generic untuk hooks yang menerima tipe data dinamis
- Tidak ada `any`

## Tugas Fase Ini

### File 1: `src/shared/hooks/useDebounce.ts`
Delay eksekusi value — dipakai di search input semua fitur:
```ts
function useDebounce<T>(value: T, delay: number): T
```
- Saat `value` berubah, tunggu `delay` ms sebelum update return value
- Kalau `value` berubah lagi sebelum delay habis, reset timer
- Dipakai di: `ProductSearch`, `CustomerSearch`, `SupplierSearch`, dll

### File 2: `src/shared/hooks/usePagination.ts`
State management untuk server-side pagination:
```ts
interface UsePaginationOptions {
  initialPage?:     number    // default: 1
  initialPageSize?: number    // default: 10
}

interface UsePaginationReturn {
  page:             number
  pageSize:         number
  onPageChange:     (page: number) => void
  onPageSizeChange: (size: number) => void
  reset:            () => void   // reset ke page 1
}

function usePagination(options?: UsePaginationOptions): UsePaginationReturn
```
- `reset()` dipanggil saat filter berubah (agar tidak stuck di page 5 saat hasil filter hanya 1 halaman)
- Dipakai di: semua halaman yang punya DataTable dengan pagination

### File 3: `src/shared/hooks/useDisclosure.ts`
State management untuk buka/tutup modal/dialog:
```ts
interface UseDisclosureReturn {
  isOpen:  boolean
  open:    () => void
  close:   () => void
  toggle:  () => void
}

function useDisclosure(initialState?: boolean): UseDisclosureReturn
```
- Dipakai di: semua halaman yang punya FormModal atau ConfirmDialog
- Menggantikan pattern `const [isOpen, setIsOpen] = useState(false)` yang berulang

### File 4: `src/shared/hooks/usePermission.ts`
Centralized permission check berdasarkan role:
```ts
interface UsePermissionReturn {
  isOwner:  boolean
  isAdmin:  boolean
  isKasir:  boolean
  hasRole:  (roles: Role[]) => boolean
  canEdit:  boolean    // owner atau admin
  canDelete: boolean   // hanya owner
}

function usePermission(): UsePermissionReturn
```
- Ambil role dari `useAuth()`
- `canEdit`: owner atau admin
- `canDelete`: hanya owner
- Dipakai di: RoleGuard, tombol aksi di tabel, conditional render

### File 5: `src/shared/hooks/useLocalStorage.ts`
Typed localStorage access dengan React state sync:
```ts
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void]
// return: [value, setValue, removeValue]
```
- Sinkron dengan localStorage
- Type-safe: T menentukan tipe yang disimpan
- `removeValue()`: hapus key dari localStorage
- Dipakai di: cashier draft, filter preferences, dll

### File 6: `src/shared/hooks/useTableSelection.ts`
State management untuk row selection di DataTable:
```ts
function useTableSelection<T extends { id: number | string }>(): {
  selectedKeys:    Set<number | string>
  selectedItems:   T[]
  isSelected:      (key: number | string) => boolean
  toggle:          (key: number | string) => void
  selectAll:       (items: T[]) => void
  clearSelection:  () => void
  hasSelection:    boolean
  count:           number
}
```
- Dipakai di: Products (bulk action), Transactions, dll

### File 7: `src/shared/hooks/index.ts`
```ts
export { useDebounce }        from './useDebounce'
export { usePagination }      from './usePagination'
export { useDisclosure }      from './useDisclosure'
export { usePermission }      from './usePermission'
export { useLocalStorage }    from './useLocalStorage'
export { useTableSelection }  from './useTableSelection'
```

## Hasil yang Diharapkan
- Semua hooks bisa diimport dari `@/shared/hooks`
- `useDebounce('search', 300)` berfungsi — value delay 300ms
- `usePagination()` return page state yang bisa dipakai langsung di DataTable
- `useDisclosure()` menggantikan manual `useState(false)` untuk modal
- `usePermission()` return `isOwner`, `canEdit`, dll berdasarkan user yang login
- TypeScript generic bekerja dengan benar
- Tidak ada `any`
