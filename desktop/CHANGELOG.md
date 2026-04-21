# Changelog — POS Retail

Semua perubahan signifikan pada proyek ini dicatat di sini.

---

## [2.0.0] — 2026-04-19

### Ditambahkan
- **PIN Kasir** — keamanan sesi kasir dengan PIN sebelum mulai shift
- **Grafik Dashboard** — chart penjualan & laba harian/mingguan/bulanan di dashboard
- **Import Produk via Excel/CSV** — upload massal data produk dari file spreadsheet
- **Diskon per Item** — diskon individual per baris produk di kasir (selain diskon total)
- **Cetak Label Barcode** — halaman cetak label barcode produk (`barcode-label.html`)
- **Notifikasi Stok Otomatis** — notifikasi muncul otomatis saat stok produk di bawah minimum
- **Shift Management** — pencatatan & laporan shift kasir (pagi/siang/malam)
- **Piutang Pelanggan** — pencatatan piutang & pelunasan per pelanggan (`receivables.html`)
- **Manajemen Pelanggan** — CRUD data pelanggan (`customers.html`)
- **Manajemen Supplier** — CRUD supplier, purchase order, retur barang ke supplier
- **Konversi Satuan Pembelian** — harga satuan & konversi satuan saat pembelian dari supplier

### Diperbaiki
- Bug tombol edit di beberapa halaman
- Perbaikan filter custom range di laporan penjualan
- Perapian UI filter & konsistensi style CSS

---

## [1.0.0] — 2026-02-12

### Step 1 — Login & Dashboard Basic
- Login system dengan autentikasi bcrypt
- Dashboard dengan navbar dan sidebar dinamis
- Session management via localStorage
- Database SQLite auto-init dengan schema & seed data

### Step 2 — User Management
- CRUD user (owner, admin, kasir)
- Role-based menu visibility & access control
- Toggle status aktif/nonaktif

### Step 3 — Product & Category Management
- CRUD kategori produk
- CRUD produk: barcode, harga beli/jual, stok minimum
- Filter produk by nama, kategori, status stok
- Badge stok: aman / menipis / habis

### Step 4 — Kasir & Transaksi
- Antarmuka kasir: scan barcode, cart interaktif, +/- qty
- Diskon total (% atau Rp) dan pajak configurable
- Multi metode pembayaran: Cash, Debit, Kredit, Transfer, QRIS
- Cetak struk / receipt di window baru
- Riwayat transaksi: filter, detail, void, cetak ulang
- Keyboard shortcuts: F2, F8, F9, ESC

### Step 5 — Keuangan
- Kas harian per kasir: buka kas, tutup kas, selisih saldo
- Menu "Kas Saya" khusus kasir (isolasi antar kasir)
- Pengeluaran operasional: CRUD, filter, kategori
- Pembelian stok: Purchase Order, pembayaran parsial/lunas, update stok otomatis
- Dashboard keuangan: pendapatan, pengeluaran, laba kotor, laba bersih, top produk terlaris

### Step 6 — Laporan, Pengaturan & Final Polish
- Laporan Penjualan: filter, chart, pagination, export PDF/Excel, print
- Laporan Laba Rugi: COGS, gross profit, net profit, pie chart
- Laporan Stok: nilai inventori, alert stok menipis, export Excel
- Laporan Kasir: ranking kasir, bar chart, export PDF
- Settings: info toko, pajak, footer struk, upload logo
- Backup manual & auto backup harian
- Restore database dari file backup
- Global keyboard shortcuts (Ctrl+N/P/T/F/R/U/S/L)
- Toast notification system (success/error/warning/info)
- Loading overlay untuk operasi berat
- Application menu bar (File, View, Help)
- Build configuration untuk Windows & Linux installer
