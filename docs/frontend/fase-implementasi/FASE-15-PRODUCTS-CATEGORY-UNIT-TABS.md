# FASE 15 — Products: CategoryTab + UnitTab

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 14 sudah selesai: ProductFormModal sudah berfungsi.
Tab Kategori dan Unit masih placeholder — fase ini mengisinya.

## Standar Wajib
- Pola CRUD sama persis dengan tab Produk (konsistensi UI)
- Gunakan `DataTable`, `FormModal`, `ConfirmDialog` dari shared
- Validasi Zod untuk setiap form
- Hapus kategori/unit yang masih dipakai produk → backend akan return error → tampil via toast

## Desain Tab Kategori
```
┌────────────────────────────────────────────┐
│                        [+ Tambah Kategori] │
├────────────────────────────────────────────┤
│ [🔍 Cari kategori...]                      │
├────────────────────────────────────────────┤
│ Nama Kategori     │ Jumlah Produk │ Aksi   │
│ Makanan           │ 15            │ ✏ 🗑   │
│ Minuman           │ 8             │ ✏ 🗑   │
├────────────────────────────────────────────┤
│ Menampilkan 2 dari 2 data                  │
└────────────────────────────────────────────┘
```

## Tugas Fase Ini

### File 1: `src/features/inventory/products/components/CategoryTab.tsx`
Komponen tab kategori lengkap:

**State lokal:**
```ts
const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 300)
const { isOpen: formOpen, open: openForm, close: closeForm } = useDisclosure()
const { isOpen: deleteOpen, open: openDelete, close: closeDelete } = useDisclosure()
const [editingId, setEditingId] = useState<number | null>(null)
const [deletingId, setDeletingId] = useState<number | null>(null)
```

**Query & Mutation:**
- `useCategoryListQuery()` → list kategori
- `useCreateCategoryMutation()`
- `useUpdateCategoryMutation()`
- `useDeleteCategoryMutation()`

**Kolom tabel:**
- Nama kategori
- Aksi: Edit + Hapus (Hapus hanya untuk owner via RoleGuard)

**Form modal kategori:**
- Zod schema: `{ name: z.string().min(1, 'Nama wajib diisi') }`
- Input: nama kategori
- Mode tambah vs edit berdasarkan `editingId`
- Prefill saat edit dari data kategori yang ada

**ConfirmDialog hapus:**
- "Hapus Kategori — Kategori yang dihapus tidak bisa dikembalikan."

**Filter:**
- Search input dengan debounce
- Filter dilakukan client-side (kategori biasanya sedikit)

### File 2: `src/features/inventory/products/components/UnitTab.tsx`
Komponen tab unit — pola identik dengan CategoryTab:

**State, query, mutation:** sama persis, ganti Category dengan Unit.

**Kolom tabel:**
- Nama unit (Pcs, Lusin, Kardus, dll)
- Aksi: Edit + Hapus

**Form modal unit:**
- Zod schema: `{ name: z.string().min(1, 'Nama unit wajib diisi') }`
- Input: nama unit

**ConfirmDialog hapus:**
- "Hapus Unit — Unit yang dihapus tidak bisa dikembalikan."

### Update File 3: `src/features/inventory/products/ProductsPage.tsx`
Ganti placeholder tab konten:
```tsx
// Tab "Kategori"
{activeTab === 'categories' && <CategoryTab />}

// Tab "Unit"
{activeTab === 'units' && <UnitTab />}
```

## Pola yang Harus Konsisten
Tampilan error saat hapus gagal (contoh: kategori masih dipakai produk):
- Backend return error message
- Interceptor throw `ApiError`
- `onError` di mutation: `toast.error(error.message)`
- Modal delete tetap terbuka — user bisa tutup manual

## Hasil yang Diharapkan
- Tab "Kategori" menampilkan list kategori dengan CRUD lengkap
- Tab "Unit" menampilkan list unit dengan CRUD lengkap
- Tambah/edit/hapus kategori berfungsi
- Tambah/edit/hapus unit berfungsi
- Tombol hapus hanya tampil untuk owner
- Toast sukses/error muncul dengan benar
- TypeScript tidak ada error
