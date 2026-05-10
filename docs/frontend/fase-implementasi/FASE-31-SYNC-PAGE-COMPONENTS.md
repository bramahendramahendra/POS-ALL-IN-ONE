# FASE 31 — Sync: SyncCenterPage + Components

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 30 sudah selesai: sync types, store, api sudah ada.

## Tugas Fase Ini

### File 1: `src/features/sync/components/SyncStatusCard.tsx`
Kartu status sinkronisasi di atas halaman:
```
┌──────────────────────────────────────────────────────────────┐
│ Status Sinkronisasi                     [🔄 Sync Manual]     │
│                                                              │
│  ✅ Tersinkronisasi                                          │
│  Terakhir sync: 15 Jan 2024, 10:30                           │
│  Pending: 0 data  │  Konflik: 2 item                        │
└──────────────────────────────────────────────────────────────┘
```

**Props:** tidak perlu — akses dari `useSyncStatus()`

**Fitur:**
- Icon dan warna berubah sesuai status:
  - `idle` + conflict_count > 0 → oranye + icon warning
  - `syncing` → biru + spinner
  - `success` → hijau + centang
  - `error` → merah + X
- Tombol "Sync Manual" → `useTriggerSyncMutation()`
- Tombol disabled saat `isSyncing`

### File 2: `src/features/sync/components/ConflictList.tsx`
List konflik yang perlu diselesaikan:

**Tampilan per konflik:**
```
┌────────────────────────────────────────────────────────────────┐
│ ⚠️  KONFLIK PRODUK — Kopi Hitam             [Detail]          │
│ Perangkat: Desktop App · 15 Jan 2024                          │
│                                                               │
│  Data Server:              Data Lokal:                        │
│  Stok: 100                 Stok: 85                          │
│  Harga: Rp 5.000           Harga: Rp 5.500                   │
│                                                               │
│                      [✗ Tolak]  [✓ Terima Server]            │
└────────────────────────────────────────────────────────────────┘
```

**Fitur:**
- Tampil diff antara data server vs data lokal
- Tombol "Terima Server" → `useApproveConflictMutation()`
  - Artinya: pakai data server, buang data lokal
- Tombol "Tolak" → `useRejectConflictMutation()`
  - Artinya: pakai data lokal, buang data server
- Konfirmasi sebelum resolve (ConfirmDialog)
- Tampil `EmptyState` jika tidak ada konflik

**Data diff rendering:**
Render `server_data` vs `local_data` sebagai tabel perbandingan.
Highlight baris yang berbeda (warna kuning).

### File 3: `src/features/sync/components/SyncHistoryTable.tsx`
Tabel riwayat sinkronisasi:

**Kolom:**
- Waktu sync
- Perangkat (`device_info`)
- Status badge (success/partial/error)
- Data tersync (`synced_count`)
- Error (`error_count`)
- Pesan error (collapsed, expand saat klik)

### File 4: `src/features/sync/SyncCenterPage.tsx`
```tsx
<PageHeader title="Sync Center" breadcrumbs={[{ label: 'Operasional' }, { label: 'Sync Center' }]} />

{/* Status Card */}
<SyncStatusCard />

{/* 2 section */}
{hasConflicts && (
  <section>
    <h3>Konflik yang Perlu Diselesaikan ({conflictCount})</h3>
    <ConflictList />
  </section>
)}

<section>
  <h3>Riwayat Sinkronisasi</h3>
  <SyncHistoryTable />
</section>
```

### Update Navbar: Badge Notifikasi Sync
Di `Navbar.tsx`, tambahkan badge pada icon bell:
```tsx
const { conflictCount } = useSyncStatus()

// Icon bell dengan badge
<div className="relative">
  <Bell className="h-5 w-5" />
  {conflictCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
      {conflictCount > 9 ? '9+' : conflictCount}
    </span>
  )}
</div>
```

### Update Router
Ganti placeholder `/sync` dengan `<SyncCenterPage />`.

## Hasil yang Diharapkan
- `/sync` menampilkan status sync terkini
- Polling berjalan — status update setiap 30 detik tanpa refresh manual
- Konflik ditampilkan dengan diff yang jelas
- Approve/reject konflik berfungsi dengan ConfirmDialog
- Riwayat sync tampil dengan pagination
- Badge di navbar menampilkan jumlah konflik aktif
- TypeScript tidak ada error
