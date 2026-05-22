# Fase 5 — Settings: Tab Printer & Wire Import CSV

Kamu adalah senior React/TypeScript developer. Saya punya project web-v2 (React + TypeScript +
Vite + Zustand + React Query + React Router v6, Tailwind CSS + shadcn/ui).

## Context

Struktur project: `web-v2/src/features/<domain>/`
Pattern per feature:
- `*.api.ts`      → React Query hooks
- `*.types.ts`    → TypeScript types
- `components/`   → sub-komponen
- `*Page.tsx`     → halaman utama

API client import: `import { apiClient } from '@/shared/lib/api-client'`
Shared UI: `@/shared/components/ui/*`

File yang relevan:
- `web-v2/src/features/settings/SettingsPage.tsx`            → halaman settings dengan tab
- `web-v2/src/features/settings/settings.api.ts`             → React Query hooks
- `web-v2/src/features/settings/components/StoreProfileForm.tsx`
- `web-v2/src/features/settings/components/UserManagementTab.tsx`
- `web-v2/src/features/settings/components/AppVersionTab.tsx`
- `web-v2/src/features/inventory/products/ProductsPage.tsx`
- `web-v2/src/features/inventory/products/products.api.ts`
- `web-v2/src/features/inventory/products/components/ImportCsvModal.tsx`

**Baca semua file di atas sebelum mulai coding.**

---

## Task 1: Tab Pengaturan Printer

Di desktop, Settings punya tab "Printer" untuk konfigurasi printer thermal receipt.
Di web-v2 (web app) kita tidak bisa akses printer hardware langsung, tapi bisa simpan preferensi
dan gunakan window.print() untuk test print.

### Tambahkan tab baru "Printer" di SettingsPage

Tab ini berisi form:
- **Paper Size**: Select (58mm / 80mm) — ukuran kertas printer thermal
- **Header Receipt**: Input text — nama/teks yang tampil di atas struk
- **Footer Receipt**: Textarea — teks bawah struk (misal: "Terima kasih telah berbelanja!")
- **Tampilkan Logo**: Toggle/Switch — apakah logo toko tampil di struk
- **Auto Print**: Toggle/Switch — langsung print struk setelah transaksi selesai
- Tombol **"Test Print"** → buka window.print() dengan preview struk sederhana
- Tombol **"Simpan"** → simpan ke API

### API endpoints

- `GET /settings/printer`
  Response: `{ success, data: PrinterSettings }`
- `PUT /settings/printer`
  Body: `PrinterSettings`

### Types untuk `settings.api.ts`

```ts
interface PrinterSettings {
  paper_size: '58mm' | '80mm'
  receipt_header: string
  receipt_footer: string
  show_logo: boolean
  auto_print: boolean
}
```

### Perubahan di `settings.api.ts`

Tambahkan:
```ts
export function usePrinterSettingsQuery() // GET /settings/printer
export function useUpdatePrinterSettingsMutation() // PUT /settings/printer
```

### Perubahan di `SettingsPage.tsx`

Tambahkan tab "Printer" menggunakan `PrinterSettingsTab` component.

---

## Task 2: Wire Import CSV di Products

`ImportCsvModal.tsx` sudah ada di `web-v2/src/features/inventory/products/components/`
tapi belum di-wire ke `ProductsPage.tsx`.

### Perubahan di `products.api.ts`

Tambahkan mutation:
```ts
export function useImportProductsCsvMutation()
// POST /products/import
// Body: FormData dengan field "file" berisi file CSV
// Response: { success, data: { imported: number, failed: number, errors?: string[] } }
```

### Perubahan di `ProductsPage.tsx`

- Tambahkan state: `const [showImport, setShowImport] = useState(false)`
- Tambahkan tombol "Import CSV" di area header/action bar (sebelah tombol "Tambah Produk")
- Render `<ImportCsvModal open={showImport} onClose={() => setShowImport(false)} />`
- Pastikan setelah import berhasil: refresh/invalidate query products

### Perhatikan di `ImportCsvModal.tsx`

Baca isi file ini dulu. Sesuaikan props dan callback yang dibutuhkan.
Jika modal belum punya prop `open` dan `onClose`, tambahkan.
Jika belum ada logic upload, tambahkan panggilan ke `useImportProductsCsvMutation`.

---

## Output yang Diharapkan

1. `web-v2/src/features/settings/components/PrinterSettingsTab.tsx` (file baru)
2. Update `web-v2/src/features/settings/settings.api.ts`
3. Update `web-v2/src/features/settings/SettingsPage.tsx`
4. Update `web-v2/src/features/inventory/products/products.api.ts`
5. Update `web-v2/src/features/inventory/products/ProductsPage.tsx`
6. Update `web-v2/src/features/inventory/products/components/ImportCsvModal.tsx` (jika perlu)

Jangan buat file lain selain yang disebutkan di atas.
Baca isi setiap file sebelum mengedit agar tidak kehilangan kode yang sudah ada.
