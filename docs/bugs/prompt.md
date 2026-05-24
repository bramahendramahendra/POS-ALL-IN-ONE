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

Fokus analisis pada modul: Produk, Kategori, Satuan

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
- 	Jumlah cetak label per produk
- 	Pilihan ukuran label lebih banyak


Sebelum mulai, baca konvensi kode yang sudah ada di folder `web-v2/` dan `backend/` — ikuti standar masing-masing, jangan asumsikan.

Untuk setiap fitur:
- Sebutkan file yang diubah
- Pastikan perubahan di web-v2 dan backend tetap konsisten satu sama lain

Jangan refactor, tambah fitur, atau ubah kode di luar cakupan yang disebutkan.

===============================================

Terjadi bug pada web-v2 sebagai berikut.
Menu Produk :
1. Pada Form Tambah Produk. untuk form status hilangkan. Jadi pas submit otomatis aktif.
2. Pada Form Tambah Produk. Form kategori dan satuan tidak muncul dropdownnya.
3. Pada Form Tambah Produk. Pada Barcode ketika saya klik generate pada form input tidak muncul barcode nya.
4. Pada Form Tambah Produk. Form input Deskripsi hapus.
5. Pada Form Tambah Produk. Pada Stok minumum kasih penjelasan itu untuk apa.

Menu Kategori :
1. Pada menu kategori terdapat tambahan aktif dan nonaktif. Di list kategori untuk process mengubah aktif dan nonaktif ikutin menu unit cara ubah statusnya. 

Untuk seluruh form inputan yang terdapat nominl uang. BUat agar berbentuk format rupiah. contoh bisa lihat di desktop.

Perhatian untuk perbaikan diatas. Pastikan untuk menganalisis seluruh kodingan terlebih dahulu. Karena harus megikutin standart kodingan dan struktur kodingan pada masing-masing aplikasi web-v2 dan backend.