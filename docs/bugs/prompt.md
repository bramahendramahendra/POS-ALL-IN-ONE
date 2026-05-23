Kamu adalah senior developer. Lakukan debugging menyeluruh pada fitur menu "Kategori", "Unit", dan "Produk" di aplikasi web-v2.

## Format Laporan
Untuk setiap bug yang ditemukan:
- 🔴/🟡/🟢 Tingkat keparahan
- Deskripsi masalah & dampaknya
- ✅ Seharusnya: [jelaskan secara logika bisnis, bukan kode]



=============================================

Perbaiki semua bug dari laporan debugging semua fitur.

Sebelum mulai, baca konvensi kode yang sudah ada di folder `web-v2/` dan `backend/` — ikuti standar masing-masing, jangan asumsikan.

Untuk setiap bug:
- Sebutkan file yang diubah
- Pastikan perubahan di desktop dan backend tetap konsisten satu sama lain

Jangan refactor, tambah fitur, atau ubah kode di luar cakupan bug yang disebutkan.
menururt anda


=============================================

Saya ingin membandingkan fitur antara dua versi aplikasi.

Aplikasi 1 (Lama/Referensi): Desktop
Aplikasi 2 (Baru/Target): Web-v2

Fokus analisis pada modul: [NAMA MODUL, contoh: Produk, Kategori, Satuan]

Lakukan hal berikut:
1. Baca dan analisis kode dari kedua aplikasi secara menyeluruh — termasuk form fields, validasi, logika bisnis, fitur UI (search, filter, pagination, export, import, print), dan CRUD operations.
2. Bandingkan kedua aplikasi.
3. Tampilkan hasil dalam 2 tabel saja:

Tabel 1 — Fitur yang Ada di APLIKASI 1 tapi TIDAK Ada di APLIKASI 2
Kolom: No | Fitur | Keterangan

Tabel 2 — Fitur yang Ada di APLIKASI 2 tapi TIDAK Ada di APLIKASI 1
Kolom: No | Fitur | Keterangan

Jangan tampilkan analisis panjang, langsung ke 2 tabel.

======================================================

Pada Web-v2 tambahkan beberapa fitur berikut berdasarkan laporan yang anda berikan.
- Generate Barcode
- Barcode wajib diisi
- Search by barcode
- Filter Stok Menipis

Sebelum mulai, baca konvensi kode yang sudah ada di folder `web-v2/` dan `backend/` — ikuti standar masing-masing, jangan asumsikan.

Untuk setiap fitur:
- Sebutkan file yang diubah
- Pastikan perubahan di web-v2 dan backend tetap konsisten satu sama lain

Jangan refactor, tambah fitur, atau ubah kode di luar cakupan yang disebutkan.


