# List Fase Pengerjaan POS Multi-Platform

---

## Catatan Penting

### Kondisi Saat Ini
- **Backend Go GIN** : Sudah ada — production-ready dengan arsitektur Domain-Driven Design
- **Desktop Electron** : Sudah ada — fitur lengkap dengan SQLite lokal
- **Web & Android**   : Belum dikerjakan

### Pola Backend Yang Harus Diikuti
Backend menggunakan pola **Layered Architecture + DDD**:
```
domain/[feature]/
├── handler/    → HTTP handlers (validasi input, response)
├── service/    → Business logic + interface
├── repo/       → Raw SQL queries + interface
├── model/      → GORM model / struct database
├── dto/        → Request & response struct
└── utils/      → Helper khusus domain (jika perlu)
```
**Semua prompt backend harus mengikuti pola ini.**

---

## FASE 0 — Setup & Bersihkan Project

| Kode | Prompt | Keterangan |
|---|---|---|
| 0.1 | Rapikan Struktur Folder | Rename folder `destop` → `desktop`, buat folder `web/` & `android/` |
| 0.2 | Bersihkan Backend | Hapus integrasi yang tidak dipakai (ESB, BRIGate, Minio, Bristars) dari config & bootstrap |
| 0.3 | Sesuaikan Config Backend | Sesuaikan config.json untuk kebutuhan POS (hapus field bank, tambah field POS) |
| 0.4 | Setup .gitignore | Konfigurasi .gitignore untuk semua platform |

---

## FASE 1 — Desain Database & API Contract

| Kode | Prompt | Keterangan |
|---|---|---|
| 1.1 | Skema Database MySQL | Semua tabel, relasi, index — migration dari SQLite ke MySQL |
| 1.2 | API Contract Auth & Session | Endpoint login, logout, refresh token, single active session |
| 1.3 | API Contract PIN Lock | Endpoint set PIN, verifikasi PIN, ubah PIN kasir |
| 1.4 | API Contract User Management | Endpoint CRUD user, toggle status, role |
| 1.5 | API Contract Kategori & Satuan | Endpoint CRUD kategori, CRUD satuan master |
| 1.6 | API Contract Produk | Endpoint CRUD produk, barcode, search, toggle, low stock, import bulk |
| 1.7 | API Contract Product Units & Harga Tier | Endpoint satuan alternatif per produk & harga tier/grosir |
| 1.8 | API Contract Transaksi | Endpoint create, list, detail, void transaksi |
| 1.9 | API Contract Kas Harian | Endpoint buka/tutup kas, history, update sales & expenses |
| 1.10 | API Contract Pengeluaran | Endpoint CRUD pengeluaran operasional |
| 1.11 | API Contract Purchase Order | Endpoint create PO, list, detail, pembayaran parsial, delete |
| 1.12 | API Contract Retur Supplier | Endpoint create retur, list, detail, update status, delete |
| 1.13 | API Contract Supplier | Endpoint CRUD supplier, toggle status, detail dengan riwayat |
| 1.14 | API Contract Pelanggan | Endpoint CRUD pelanggan, toggle status, credit limit |
| 1.15 | API Contract Piutang | Endpoint list, detail, bayar, riwayat pembayaran, summary per pelanggan |
| 1.16 | API Contract Shift | Endpoint CRUD shift, toggle status, summary shift |
| 1.17 | API Contract Stock Mutations | Endpoint log mutasi stok, riwayat perubahan stok per produk |
| 1.18 | API Contract Laporan Penjualan | Endpoint filter date/user/payment, chart data, export |
| 1.19 | API Contract Laporan Laba Rugi | Endpoint COGS, gross profit, summary |
| 1.20 | API Contract Laporan Stok | Endpoint inventori, nilai stok, stok menipis |
| 1.21 | API Contract Laporan Kasir | Endpoint ranking & summary per kasir |
| 1.22 | API Contract Dashboard | Endpoint stats, sales trend, top categories, top products |
| 1.23 | API Contract Settings | Endpoint get all, get by key, save, reset |
| 1.24 | API Contract Backup & Restore | Endpoint export & import database |
| 1.25 | API Contract Sync Center | Endpoint detect konflik, list, resolve, antrian sync, riwayat |
| 1.26 | API Contract Version Check | Endpoint cek & simpan versi APK terbaru untuk Android |

---

## FASE 2 — Backend Go GIN (Tambah Domain ke Struktur yang Ada)

> Semua domain baru dibuat mengikuti pola `domain/[feature]/handler/service/repo/model/dto`
> Gunakan sample domain (`domain/sample/`) sebagai referensi template

| Kode | Prompt | Keterangan |
|---|---|---|
| 2.1 | Migration Database MySQL | Buat semua tabel MySQL, jalankan migration awal |
| 2.2 | Domain Auth & JWT | Sesuaikan auth handler untuk POS: login by username/password, JWT, refresh token |
| 2.3 | Single Active Session | Tabel sessions, invalidate token lama, middleware cek session aktif |
| 2.4 | Middleware Role-Based Access | Middleware role: kasir, owner, admin — restrict akses per endpoint |
| 2.5 | Domain PIN Lock | Handler set PIN, verifikasi PIN, ubah PIN kasir |
| 2.6 | Domain User Management | Handler CRUD user, toggle status, role management |
| 2.7 | Domain Kategori & Satuan | Handler CRUD kategori dan satuan master |
| 2.8 | Domain Produk | Handler CRUD produk, barcode, search, toggle, low stock |
| 2.9 | Domain Import Bulk Produk | Handler import Excel/CSV ke produk (gunakan excelize yang sudah ada) |
| 2.10 | Domain Product Units & Harga Tier | Handler satuan alternatif dan harga tier per produk |
| 2.11 | Domain Transaksi | Handler create transaksi + update stok otomatis, list, detail, void |
| 2.12 | Domain Kas Harian | Handler buka/tutup kas, history, update sales & expenses |
| 2.13 | Domain Pengeluaran | Handler CRUD pengeluaran operasional |
| 2.14 | Domain Purchase Order | Handler create PO, items, pembayaran parsial, update stok |
| 2.15 | Domain Retur Supplier | Handler create retur, items, update status, update stok |
| 2.16 | Domain Supplier | Handler CRUD supplier, toggle, detail dengan riwayat pembelian |
| 2.17 | Domain Pelanggan | Handler CRUD pelanggan, toggle, credit limit |
| 2.18 | Domain Piutang & Pembayaran | Handler piutang, bayar parsial/lunas, riwayat, summary per pelanggan |
| 2.19 | Domain Shift | Handler CRUD shift, toggle, summary shift |
| 2.20 | Domain Stock Mutations | Handler log mutasi stok otomatis setiap perubahan stok |
| 2.21 | Domain Laporan Penjualan | Handler laporan penjualan dengan filter & chart data |
| 2.22 | Domain Laporan Laba Rugi | Handler COGS, gross profit, net profit, summary |
| 2.23 | Domain Laporan Stok | Handler inventori, nilai stok, stok menipis |
| 2.24 | Domain Laporan Kasir | Handler ranking & summary per kasir |
| 2.25 | Domain Dashboard | Handler stats harian, trend penjualan, top categories, top products |
| 2.26 | Domain Settings | Handler get/save/reset pengaturan toko |
| 2.27 | Domain Backup & Restore | Handler export/import database |
| 2.28 | Domain Sync Center | Handler detect konflik, simpan antrian, resolve konflik approve/reject |
| 2.29 | Domain Version Check Android | Handler simpan & cek versi APK terbaru |
| 2.30 | Registrasi Semua Routes | Daftarkan semua domain ke router (public & protected routes) |

---

## FASE 3 — Refactor Frontend Desktop

> Ganti semua `window.electronAPI.*` / `window.api.*` → `fetch()` ke backend Go GIN
> Pertahankan mode offline dengan SQLite lokal

| Kode | Prompt | Keterangan |
|---|---|---|
| 3.1 | Setup API Client Desktop | Buat HTTP client wrapper, base URL config, token management |
| 3.2 | Interceptor & Token Refresh | Interceptor untuk auto-attach JWT, handle 401 → refresh token / logout |
| 3.3 | Refactor Auth & Session | Ganti IPC auth → fetch ke backend, JWT storage di localStorage |
| 3.4 | Refactor PIN Lock | Ganti IPC pinLock → fetch ke backend |
| 3.5 | Refactor User Management | Ganti IPC users → fetch ke backend |
| 3.6 | Refactor Kategori & Satuan | Ganti IPC categories/units → fetch ke backend |
| 3.7 | Refactor Produk | Ganti IPC products → fetch ke backend |
| 3.8 | Refactor Import Bulk Produk | Ganti IPC importBulk → fetch ke backend |
| 3.9 | Refactor Product Units & Harga Tier | Ganti IPC productUnits/productPrices → fetch ke backend |
| 3.10 | Refactor Kasir / Transaksi | Ganti IPC transactions → fetch ke backend |
| 3.11 | Refactor Kas Harian | Ganti IPC cashDrawer → fetch ke backend |
| 3.12 | Refactor Pengeluaran | Ganti IPC expenses → fetch ke backend |
| 3.13 | Refactor Purchase Order | Ganti IPC purchases → fetch ke backend |
| 3.14 | Refactor Retur Supplier | Ganti IPC supplierReturns → fetch ke backend |
| 3.15 | Refactor Supplier | Ganti IPC suppliers → fetch ke backend |
| 3.16 | Refactor Pelanggan | Ganti IPC customers → fetch ke backend |
| 3.17 | Refactor Piutang | Ganti IPC receivables → fetch ke backend |
| 3.18 | Refactor Shift | Ganti IPC shifts → fetch ke backend |
| 3.19 | Refactor Laporan | Ganti IPC reports → fetch ke backend |
| 3.20 | Refactor Dashboard | Ganti IPC dashboard → fetch ke backend |
| 3.21 | Refactor Settings | Ganti IPC settings → fetch ke backend |
| 3.22 | Refactor Backup & Restore | Sesuaikan backup untuk mode online/offline |
| 3.23 | Refactor Barcode Label Print | Sesuaikan cetak barcode untuk multi-platform |
| 3.24 | Halaman Sync Center Desktop | Buat halaman Sync Center di desktop (konflik, antrian, riwayat) |
| 3.25 | Offline Mode — Deteksi Koneksi | Deteksi online/offline otomatis, tampilkan indikator status |
| 3.26 | Offline Mode — SQLite Lokal | Gunakan SQLite saat offline untuk semua operasi |
| 3.27 | Antrian Sync — Struktur Tabel | Tabel sync_queue di SQLite: id, entity, action, data, status, timestamp |
| 3.28 | Antrian Sync — Simpan ke Antrian | Setiap operasi offline masuk ke sync_queue dengan status PENDING |
| 3.29 | Sync Engine — Proses Antrian | Loop PENDING → kirim ke backend → update SYNCED, prioritas urutan |
| 3.30 | Sync Engine — Resume Jika Terputus | Rollback item SYNCING → PENDING, lanjut dari item tersebut |

---

## FASE 4 — Web App

> Port halaman desktop ke web browser
> Gunakan kode HTML/CSS/JS yang sama, sesuaikan untuk web

| Kode | Prompt | Keterangan |
|---|---|---|
| 4.1 | Setup Web App & Routing | Struktur folder web, setup HTTP client, client-side routing |
| 4.2 | Web Auth & Session | Login, logout, JWT, redirect berdasarkan role |
| 4.3 | Web Halaman Dashboard | Port dashboard.html ke web |
| 4.4 | Web Halaman Kasir | Port kasir.html ke web |
| 4.5 | Web Halaman Produk | Port products.html ke web |
| 4.6 | Web Halaman Transaksi | Port transactions.html ke web |
| 4.7 | Web Halaman Keuangan | Port finance.html ke web |
| 4.8 | Web Halaman Pelanggan & Piutang | Port customers.html & receivables.html ke web |
| 4.9 | Web Halaman Supplier | Port suppliers.html ke web |
| 4.10 | Web Halaman Shift | Port shifts.html ke web |
| 4.11 | Web Halaman Laporan | Port reports.html ke web |
| 4.12 | Web Halaman Settings | Port settings.html ke web |
| 4.13 | Web Halaman Sync Center | Buat halaman Sync Center (konflik, antrian, riwayat) |
| 4.14 | Deploy ke VPS | Konfigurasi server, nginx, SSL, env production |

---

## FASE 5 — Android APK via Capacitor

| Kode | Prompt | Keterangan |
|---|---|---|
| 5.1 | Setup Capacitor | Install Capacitor, konfigurasi awal, link ke web app |
| 5.2 | Konfigurasi Capacitor Android | capacitor.config.json, permissions, splash screen, icon |
| 5.3 | Plugin Bluetooth Printer | Setup Capacitor plugin cetak struk via Bluetooth |
| 5.4 | Plugin Kamera & Galeri | Setup Capacitor plugin upload foto produk |
| 5.5 | GitHub Actions Build APK | Workflow YAML: setup Java 17, Node 20, build APK, upload artifact |
| 5.6 | Version Check & Notifikasi Update | Cek versi saat buka app, tampilkan notifikasi download APK baru |

---

## FASE 6 — Offline Sync Engine Desktop (Paling Kompleks)

> Dikerjakan terakhir — bergantung pada semua fase sebelumnya

| Kode | Prompt | Keterangan |
|---|---|---|
| 6.1 | Deteksi Konflik di Backend | Backend bandingkan timestamp data desktop vs online, tandai konflik |
| 6.2 | Simpan Konflik ke Sync Center | Data konflik masuk ke tabel konflik, menunggu resolve dari Owner/Admin |
| 6.3 | Resolve Konflik — Approve | Terapkan versi yang dipilih ke MySQL, hapus konflik |
| 6.4 | Resolve Konflik — Reject | Batalkan versi yang ditolak, kembalikan data ke kondisi sebelumnya |
| 6.5 | Sinkronisasi Stok dari Transaksi | Reject transaksi → stok dikembalikan otomatis |
| 6.6 | Riwayat Sync | Log semua aktivitas sync per device, tampil di Sync Center |
| 6.7 | Notifikasi Konflik ke Owner/Admin | Notifikasi realtime (WebSocket/polling) jika ada konflik baru |

---

## Ringkasan Total Prompt

| Fase | Jumlah Prompt |
|---|---|
| Fase 0 — Setup & Bersihkan Project | 4 |
| Fase 1 — Desain Database & API Contract | 26 |
| Fase 2 — Backend Go GIN | 30 |
| Fase 3 — Refactor Frontend Desktop | 30 |
| Fase 4 — Web App | 14 |
| Fase 5 — Android APK | 6 |
| Fase 6 — Offline Sync Engine | 7 |
| **Total** | **117 prompt** |

---

> **Urutan wajib diikuti:**
> Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6
>
> **Fase 1 adalah fondasi utama** — API Contract harus selesai sebelum Fase 2 & 3 dimulai.
>
> **Fase 6 paling kompleks** — Jangan mulai sebelum Fase 3 selesai sempurna.
