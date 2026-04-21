# POS Retail — Aplikasi Kasir Desktop

Aplikasi Point of Sale (POS) desktop untuk toko retail, dibangun dengan **Electron + Vanilla JavaScript + SQLite**.

---

## Teknologi Stack

| Teknologi        | Versi      | Kegunaan                        |
|------------------|------------|---------------------------------|
| Electron         | ^28.0.0    | Desktop app framework           |
| sql.js           | ^1.8.0     | SQLite di renderer process      |
| bcryptjs         | ^2.4.3     | Hash password                   |
| Chart.js         | ^4.4.0     | Grafik (via CDN)                |
| jsPDF            | ^2.5.1     | Export PDF (via CDN)            |
| jsPDF-AutoTable  | ^3.8.0     | Tabel di PDF (via CDN)          |
| SheetJS (xlsx)   | ^0.18.5    | Export/Import Excel (via CDN)   |
| electron-builder | ^24.9.1    | Build installer                 |

---

## Fitur Lengkap

### Autentikasi & Pengguna
- Login dengan enkripsi bcrypt
- PIN kasir untuk keamanan shift
- Multi-user dengan role: **Owner**, **Admin**, **Kasir**
- Role-based access control (menu & halaman)

### Dashboard
- Statistik real-time: penjualan hari ini, stok menipis, piutang
- Grafik penjualan & laba harian/mingguan/bulanan
- Quick action cards

### Produk & Kategori
- CRUD produk & kategori
- Generate & cetak label barcode
- Harga beli/jual, stok minimum, multi satuan dengan konversi
- Filter produk, badge stok (aman/menipis/habis)
- Import produk via Excel / CSV
- Notifikasi stok otomatis saat stok di bawah minimum

### Kasir & Transaksi
- Antarmuka kasir: scan barcode, cart interaktif
- Diskon per item & diskon total (% atau Rp)
- Pajak configurable
- Multi metode pembayaran: Cash, Debit, Kredit, Transfer, QRIS
- Cetak struk / receipt
- Riwayat transaksi: filter, detail, void, cetak ulang

### Manajemen Supplier
- CRUD supplier
- Pembelian stok dari supplier (Purchase Order)
- Retur barang ke supplier
- Harga satuan & konversi satuan pembelian
- Pelunasan hutang pembelian (partial & lunas)

### Manajemen Pelanggan
- CRUD data pelanggan
- Piutang pelanggan: pencatatan & pelunasan
- Riwayat transaksi per pelanggan

### Keuangan
- Kas harian per kasir (buka/tutup kas)
- Pengeluaran operasional
- Dashboard keuangan: pendapatan, pengeluaran, laba kotor, laba bersih

### Shift Management
- Manajemen shift kasir (pagi/siang/malam)
- Laporan per shift

### Laporan
- Laporan Penjualan (filter, chart, pagination, export PDF/Excel, print)
- Laporan Laba Rugi (COGS, gross profit, net profit, pie chart)
- Laporan Stok (nilai inventori, alert stok menipis, export Excel)
- Laporan Kasir (ranking, bar chart, export PDF)

### Pengaturan & Utilitas
- Konfigurasi info toko, pajak, footer struk, logo
- Backup manual & auto backup harian
- Restore database dari file backup
- Global keyboard shortcuts
- Toast notification system
- Loading overlay untuk operasi berat

---

## Instalasi & Menjalankan

### Prasyarat
- Node.js >= 16.x
- npm >= 8.x

### 1. Clone / Download Project
```bash
cd pos-retail
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Jalankan Aplikasi

```bash
# Mode normal
npm start

# Mode development (dengan DevTools)
npm run dev
```

---

## Login Default

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | owner |

---

## Keyboard Shortcuts

| Shortcut       | Fungsi     |
|----------------|------------|
| Ctrl+N         | Kasir      |
| Ctrl+P         | Produk     |
| Ctrl+T         | Transaksi  |
| Ctrl+F         | Keuangan   |
| Ctrl+Shift+R   | Laporan    |
| Ctrl+U         | Pengguna   |
| Ctrl+Shift+S   | Pengaturan |
| Ctrl+L         | Logout     |
| F2             | Fokus search produk (kasir) |
| F8             | Buka modal pembayaran (kasir) |
| F9             | Simpan draft (kasir) |
| ESC            | Batal transaksi (kasir) |

---

## Build untuk Distribusi

```bash
# Build Windows installer (.exe)
npm run build:win

# Build Linux AppImage
npm run build:linux

# Output ada di folder: dist/
```

> **Catatan:** Pastikan folder `assets/` berisi `icon.ico` (Windows) dan `icon.png` (Linux) sebelum build.

---

## Struktur Folder

```
pos-retail/
├── package.json
├── main.js                    # Electron main process
├── preload.js                 # Context bridge IPC
├── pos-retail.db              # SQLite database (auto-generated)
├── database/
│   ├── db.js                  # Database helper (sql.js)
│   └── init.js                # Schema & seed data
├── src/
│   ├── views/
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── users.html
│   │   ├── products.html
│   │   ├── barcode-label.html
│   │   ├── kasir.html
│   │   ├── receipt.html
│   │   ├── transactions.html
│   │   ├── suppliers.html
│   │   ├── customers.html
│   │   ├── receivables.html
│   │   ├── finance.html
│   │   ├── my-cash.html
│   │   ├── shifts.html
│   │   ├── reports.html
│   │   └── settings.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── utils.js
│       ├── auth.js
│       ├── menu.js
│       ├── notification.js
│       ├── dashboard.js
│       ├── users.js
│       ├── products.js
│       ├── kasir.js
│       ├── receipt.js
│       ├── transactions.js
│       ├── suppliers.js
│       ├── customers.js
│       ├── receivables.js
│       ├── finance.js
│       ├── my-cash.js
│       ├── shifts.js
│       ├── reports.js
│       └── settings.js
└── assets/
    ├── icon.png
    └── icon.ico
```

---

## Troubleshooting

**Error saat `npm install`**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Login gagal terus**
- Gunakan kredensial default: `admin` / `admin123`
- Hapus `pos-retail.db` → restart app → database dibuat ulang

**Database error**
- Hapus file `pos-retail.db`, jalankan ulang aplikasi

**Export PDF/Excel tidak berjalan**
- Pastikan ada koneksi internet (Chart.js, jsPDF, XLSX di-load via CDN)
- Atau simpan library secara lokal di `src/lib/`

**Build error: icon tidak ditemukan**
- Sediakan `assets/icon.ico` (256×256) untuk Windows
- Sediakan `assets/icon.png` (512×512) untuk Linux

---

## License

MIT — Free to use and modify.

**Version:** 2.0.0  
**Last Updated:** 2026-04-19
