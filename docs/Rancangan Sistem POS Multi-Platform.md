# Rancangan Sistem POS Multi-Platform

---

## 1. Overview Sistem

Sistem POS terdiri dari **3 aplikasi terintegrasi** dengan satu backend terpusat:

| Platform | Tech | Mode | Pengguna |
|---|---|---|---|
| **Desktop** | Electron + HTML/CSS/JS | Offline + Online | Kasir, Owner, Admin |
| **Web** | HTML/CSS/JS (browser) | Online | Kasir, Owner, Admin |
| **Android** | Capacitor APK (GitHub Actions) | Online | Kasir, Owner, Admin |

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Shared Codebase)                   │
│                      HTML / CSS / JS                            │
│                                                                 │
│  ┌───────────────┐   ┌─────────────┐   ┌─────────────────────┐ │
│  │    DESKTOP    │   │     WEB     │   │      ANDROID        │ │
│  │   Electron    │   │   Browser   │   │  Capacitor APK      │ │
│  │               │   │             │   │  Build: GitHub CI   │ │
│  │ Kasir         │   │ Kasir       │   │ Kasir               │ │
│  │ Owner         │   │ Owner       │   │ Owner               │ │
│  │ Admin         │   │ Admin       │   │ Admin               │ │
│  │               │   │             │   │                     │ │
│  │ Online ───────┼───┼─────────────┼───┼──── REST API        │ │
│  │ Offline       │   │             │   │                     │ │
│  │  └─ SQLite ───┼───┼─── Sync ────┼───┼──→ MySQL            │ │
│  └───────────────┘   └─────────────┘   └─────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST API / WebSocket
                ┌──────────────▼──────────────┐
                │       Backend: Go GIN        │
                │                              │
                │  Auth + JWT + Session        │
                │  Produk & Stok               │
                │  Transaksi / Kasir           │
                │  Shift & Karyawan            │
                │  Pelanggan & Supplier        │
                │  Keuangan / Kas              │
                │  Laporan & Grafik            │
                │  Sync Center Engine          │
                │  Version Check (Android)     │
                └──────────────┬───────────────┘
                               │
                ┌──────────────▼───────────────┐
                │       MySQL (Global DB)       │
                │       VPS / Cloud             │
                └───────────────────────────────┘
```

---

## 3. Pembagian Role & Akses

| Menu | Kasir | Owner | Admin |
|---|---|---|---|
| Kasir / Transaksi | ✅ | ✅ | ✅ |
| Manajemen Produk | ✅ | ✅ | ✅ |
| Laporan & Grafik | ✅ | ✅ | ✅ |
| Shift Kasir | ✅ | ✅ | ✅ |
| Pelanggan & Supplier | ✅ | ✅ | ✅ |
| Keuangan / Kas | ✅ | ✅ | ✅ |
| Manajemen User | ❌ | ✅ | ✅ |
| **Sync Center** | ❌ | ✅ | ✅ |
| Setting Sistem | ❌ | ⚠️ Terbatas | ✅ |

---

## 4. Fitur Per Platform

| Fitur | Desktop | Web | Android |
|---|---|---|---|
| Login / Auth | ✅ | ✅ | ✅ |
| Kasir / Transaksi | ✅ | ✅ | ✅ |
| Manajemen Produk | ✅ | ✅ | ✅ |
| Laporan & Grafik | ✅ | ✅ | ✅ |
| Manajemen User | ✅ | ✅ | ✅ |
| Shift Kasir | ✅ | ✅ | ✅ |
| Pelanggan & Supplier | ✅ | ✅ | ✅ |
| Keuangan / Kas | ✅ | ✅ | ✅ |
| Cetak Struk | ✅ | ✅ | ✅ Bluetooth |
| Cetak Label Barcode | ✅ | ✅ | ⚠️ Terbatas |
| Upload Foto Produk | ✅ File picker | ✅ File picker | ✅ Kamera/Galeri |
| Backup DB | ✅ | ⚠️ Export file | ❌ Backend handle |
| **Sync Center** | ✅ | ✅ | ✅ |
| **Mode Offline** | ✅ | ❌ | ❌ |

---

## 5. Sync Center (Owner & Admin)

Menu khusus menyelesaikan **konflik data** dan **transaksi bermasalah** antara Desktop offline vs Online.

```
Sync Center
├── Tab: Konflik Produk
│         → Pilih versi Desktop atau Online yang benar
│
├── Tab: Konflik Harga
│         → Pilih versi Desktop atau Online yang benar
│
├── Tab: Konflik Transaksi
│         → Ditampilkan per hari
│         ├── APPROVE → stok tetap berkurang (final)
│         └── REJECT  → stok kembali otomatis + notifikasi kasir
│
├── Tab: Antrian Sync
│         → Monitor status sync tiap item per device
│         → Status: PENDING / SYNCING / SYNCED / FAILED
│         → Tombol [Retry] untuk item FAILED
│
└── Tab: Riwayat Sync
          → Log semua aktivitas sync per device
```

### Tampilan Item Konflik
```
┌─────────────────────────────────────────────────┐
│ KONFLIK: Produk "Kopi Susu"                     │
├─────────────────┬───────────────────────────────┤
│ Versi Desktop   │ Versi Online (Web/Android)    │
│ Nama: Kopi Susu │ Nama: Kopi Susu Gula          │
│ Harga: 15.000   │ Harga: 18.000                 │
│ Waktu: 08:30    │ Waktu: 09:15                  │
├─────────────────┴───────────────────────────────┤
│ [✅ Pakai Versi Desktop]  [✅ Pakai Versi Online] │
└─────────────────────────────────────────────────┘
```

### Tampilan Antrian Sync
```
┌──────────────────────────────────────────────────┐
│ Antrian Sync                                     │
├───────────────────────┬──────────┬───────────────┤
│ Data                  │ Status   │ Action        │
├───────────────────────┼──────────┼───────────────┤
│ Transaksi DSK-001     │ SYNCED   │ -             │
│ Edit Produk Kopi Susu │ SYNCED   │ -             │
│ Transaksi DSK-002     │ FAILED   │ [Retry]       │
│ Edit Harga Teh Manis  │ PENDING  │ -             │
└───────────────────────┴──────────┴───────────────┘
```

---

## 6. Mekanisme Sync Desktop

### Alur Normal
```
Offline : User Action → SQLite lokal → Antrian Sync (PENDING)
Online  : Sync Engine → proses antrian satu per satu
          → Tidak ada konflik : SYNCED, lanjut item berikutnya
          → Ada konflik       : ditahan → masuk Sync Center
```

### Alur Jika Koneksi Terputus di Tengah Sync
```
Item 1 → SYNCED ✅
Item 2 → SYNCED ✅
Item 3 → SYNCING → koneksi putus → rollback Item 3 saja → PENDING
Item 4 → PENDING
Item 5 → PENDING
        ↓
Desktop online kembali → lanjut dari Item 3
Item 1 & 2 dilewati (sudah SYNCED)
```

### Prioritas Urutan Sync
```
1. Master Data  → Produk, Harga, Pelanggan, Supplier
2. Transaksi    → setelah master data tersync
3. Keuangan     → pengeluaran kas, penyesuaian
```

---

## 7. Alur Data

### Online (Web & Android)
```
User Action → fetch() → Go GIN API → MySQL → Response → Update UI
```

### Offline → Online (Desktop)
```
Offline : User Action → SQLite lokal → Antrian Sync
Online  : Sync Engine → Go GIN API → MySQL
          → Tidak ada konflik : langsung diterapkan
          → Ada konflik       : ditahan → Sync Center
```

---

## 8. Solusi Semua Issue Integrasi

| # | Issue | Solusi |
|---|---|---|
| 1 | Konflik data sync offline | Timestamp-based + Owner/Admin resolve via Sync Center |
| 2 | Duplikat nomor transaksi | Prefix per device (`DSK-001`, `WEB-001`, `AND-001`) |
| 3 | Stok negatif / race condition | Approve/Reject transaksi harian di Sync Center → reject otomatis kembalikan stok |
| 4 | JWT expired di tengah shift | Refresh token otomatis di background |
| 5 | Cetak struk Android | Capacitor Bluetooth plugin |
| 6 | Upload foto produk | Satu endpoint upload backend, input masing-masing per platform |
| 7 | APK tidak auto-update | Version check saat app buka + notifikasi download APK baru |
| 8 | Session multi-device | Single Active Session — login baru otomatis logout device lama |
| 9 | Performa laporan data besar | Pagination + lazy loading di semua endpoint laporan |
| 10 | Sync gagal / koneksi terputus | Flag per item — rollback item yang terputus saja, lanjut dari item tersebut |

---

## 9. Session Management

**Aturan: 1 Akun = 1 Device Aktif**

```
Login Device Baru
      ↓
Backend invalidate token lama di MySQL
      ↓
Generate token baru untuk device baru
      ↓
Device lama → request berikutnya → 401 Unauthorized
      ↓
Device lama otomatis logout + notifikasi:
"Sesi Anda berakhir karena login di perangkat lain"
```

### Tabel Sessions di MySQL
```sql
CREATE TABLE sessions (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    user_id     INT NOT NULL,
    token       VARCHAR(500) NOT NULL,
    device_info VARCHAR(255),     -- "Desktop", "Android", "Web"
    ip_address  VARCHAR(50),
    created_at  DATETIME,
    expires_at  DATETIME,

    UNIQUE KEY unique_user (user_id)  -- 1 user hanya 1 baris aktif
);
```

---

## 10. Stack Teknologi Lengkap

```
Frontend  : HTML, CSS, Vanilla JS (shared semua platform)
Desktop   : Electron v28
Android   : Capacitor + GitHub Actions CI/CD
Web       : Static files served dari VPS
Backend   : Go + GIN Framework
DB Global : MySQL (VPS / Cloud)
DB Lokal  : SQLite (desktop offline only)
Auth      : JWT + Refresh Token + Single Active Session
Build CI  : GitHub Actions (APK + deploy web)
Hosting   : VPS / Railway / Render
```

---

## 11. Urutan Pengerjaan

```
Fase 1 │ Desain API Contract
       │ Semua endpoint, request & response format
       │ ← FONDASI UTAMA, harus selesai sebelum fase lain
       ↓
Fase 2 │ Backend Go GIN + MySQL
       │ Auth, Produk, Transaksi, Session, Sync Engine
       ↓
Fase 3 │ Refactor Frontend Desktop
       │ Ganti window.electronAPI → fetch() ke backend
       ↓
Fase 4 │ Web App
       │ Deploy ke VPS, aktifkan Sync Center untuk Owner & Admin
       ↓
Fase 5 │ Android APK via Capacitor + GitHub Actions
       ↓
Fase 6 │ Offline Sync Engine Desktop
       │ ← Dikerjakan terakhir, paling kompleks
```
