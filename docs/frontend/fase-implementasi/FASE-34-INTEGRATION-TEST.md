# FASE 34 — Integration Review & End-to-End Test Manual

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 33 sudah selesai: semua kode bersih, TypeScript aman, build berhasil.
Fase ini adalah review integrasi — memastikan semua alur bisnis berjalan end-to-end.

## Tugas Fase Ini

Fase ini adalah **review dan perbaikan**, bukan implementasi fitur baru.
Jalankan semua skenario berikut dengan backend yang berjalan di localhost:8080.

---

### Skenario 1: Alur Login & Auth
```
1. Buka http://localhost:3000
   → Redirect otomatis ke /login ✓

2. Login dengan username/password salah
   → Toast error muncul ✓

3. Login sebagai kasir
   → Redirect ke /kasir ✓
   → Sidebar hanya tampil menu "Kasir" ✓

4. Login sebagai owner
   → Redirect ke /dashboard ✓
   → Semua menu sidebar tampil ✓

5. Akses /settings sebagai admin
   → Redirect ke /dashboard ✓

6. Biarkan token expired (atau manipulasi localStorage)
   → Request berikutnya refresh token otomatis ✓
   → Jika refresh gagal → redirect /login ✓

7. Klik logout
   → ConfirmDialog muncul ✓
   → Konfirmasi → redirect /login ✓
   → Akses /dashboard → redirect /login ✓
```

### Skenario 2: Alur Kasir (End-to-End Transaksi)
```
1. Login sebagai kasir/owner
2. Buka shift (jika belum ada)
3. Masuk ke /kasir
4. Search produk: ketik "kopi"
   → Hasil muncul setelah debounce 300ms ✓
5. Klik produk dengan 1 unit
   → Langsung masuk cart ✓
6. Klik produk dengan beberapa unit
   → UnitSelectModal muncul ✓
   → Pilih unit → masuk cart ✓
7. Scan barcode (ketik kode + Enter)
   → Produk masuk cart ✓
8. Adjust qty di cart (+ dan −)
   → Subtotal item update ✓
9. Set diskon 10% persen
   → Nominal diskon update real-time ✓
10. Set pajak 11%
    → Nominal pajak update real-time ✓
11. Pilih pelanggan
12. Klik "Bayar"
    → PaymentModal terbuka dengan total benar ✓
13. Pilih metode "Tunai"
14. Input jumlah bayar (lebih dari total)
    → Kembalian terhitung ✓
15. Klik "Proses Bayar"
    → ReceiptPrint tampil ✓
16. Klik "Cetak Struk" → print dialog ✓
17. Klik "Transaksi Baru"
    → Cart kosong ✓
18. Refresh browser
    → Cart tetap kosong (sudah di-clear setelah checkout) ✓
```

### Skenario 3: Products CRUD
```
1. Buka /products
2. Tambah kategori baru → berhasil ✓
3. Tambah unit baru → berhasil ✓
4. Tambah produk baru dengan kategori yang baru dibuat ✓
5. Edit produk → berhasil ✓
6. Tambah price tier ke produk ✓
7. Cari produk via search → hasil filter benar ✓
8. Filter by kategori → benar ✓
9. Hapus produk (sebagai owner) → berhasil ✓
10. Coba hapus kategori yang masih dipakai → error toast muncul ✓
```

### Skenario 4: Alur Piutang
```
1. Buat transaksi dengan pelanggan (di kasir)
2. Buka /receivables
   → Piutang dari transaksi muncul ✓
3. Klik "Bayar" → PaymentRecordModal ✓
4. Klik "Bayar Lunas" → nominal terisi otomatis ✓
5. Submit → sisa piutang jadi 0 → status "Lunas" ✓
```

### Skenario 5: Error Handling
```
1. Matikan backend server
2. Coba login → toast error koneksi muncul ✓
3. Matikan internet (airplane mode browser)
   → Banner offline muncul ✓
4. Nyalakan kembali → banner hilang ✓
5. Nyalakan backend
6. Navigasikan ke halaman yang data-nya gagal load
   → EmptyState tampil (bukan crash) ✓
```

---

## Apa yang Perlu Diperbaiki

Untuk setiap skenario yang GAGAL:
1. Identifikasi komponen/file yang bermasalah
2. Baca error di browser console
3. Fix di file yang tepat
4. Test ulang skenario tersebut

## Checklist Akhir

Setelah semua skenario berhasil, centang:
- [ ] Semua skenario auth berjalan
- [ ] Alur transaksi kasir end-to-end berjalan
- [ ] CRUD produk (dengan kategori, unit, price tier) berjalan
- [ ] Piutang alur lengkap berjalan
- [ ] Filter, search, pagination berjalan di semua halaman
- [ ] Error handling (toast error, empty state) konsisten
- [ ] Offline detection berjalan
- [ ] Sidebar role-based filter benar
- [ ] Tidak ada console.error yang tidak di-handle

## Hasil yang Diharapkan
- Semua skenario berhasil
- Tidak ada regression (fitur lama tidak rusak karena fitur baru)
- Aplikasi siap untuk production deployment
