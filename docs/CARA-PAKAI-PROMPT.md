# Cara Pakai Prompt Fase

Pilih template sesuai fase yang sedang dikerjakan, **ganti nomor di nama file**, lalu paste ke Claude AI.

---

## Fase 0 — Setup & Cleanup

```
Kamu adalah senior software engineer yang mengerjakan proyek POS Multi-Platform.

Baca dan kerjakan instruksi di file ini:
docs/prompts/fase-0/0.1-rapikan-struktur-folder.md

Kerjakan persis sesuai instruksi. Jangan ubah file lain di luar yang disebutkan di prompt.
```

> Ganti `0.1-rapikan-struktur-folder` dengan nama file prompt yang ingin dikerjakan.

---

## Fase 1 — API Contract

```
Kamu adalah senior software engineer yang mengerjakan proyek POS Multi-Platform.

Baca dan kerjakan instruksi di file ini:
docs/prompts/fase-1/1.1-skema-database-mysql.md

Catatan:
- Fase ini hanya mendokumentasikan API Contract, bukan implementasi kode
- Output berupa file markdown dokumentasi atau SQL schema
- Jangan buat kode Go dulu di fase ini
```

> Ganti `1.1-skema-database-mysql` dengan nama file prompt yang ingin dikerjakan.

---

## Fase 2 — Backend Go GIN

```
Kamu adalah senior software engineer yang mengerjakan proyek POS Multi-Platform.

Baca dan kerjakan instruksi di file ini:
docs/prompts/fase-2/2.1-migration-database-mysql.md

Konteks backend yang wajib diikuti:
- Framework: Go GIN
- Struktur wajib per domain: handler/ service/ repo/ model/ dto/
- Query menggunakan raw SQL, bukan GORM auto-generate
- Lihat domain yang sudah ada di backend/domain/ sebagai referensi pola
- Jangan ubah domain lain yang sudah ada
```

> Ganti `2.1-migration-database-mysql` dengan nama file prompt yang ingin dikerjakan.

---

## Fase 3 — Refactor Desktop

```
Kamu adalah senior software engineer yang mengerjakan proyek POS Multi-Platform.

Baca dan kerjakan instruksi di file ini:
docs/prompts/fase-3/3.1-setup-api-client-desktop.md

Konteks desktop yang wajib diikuti:
- Platform: Electron
- Semua window.api.* (IPC) diganti dengan apiClient.* (HTTP fetch ke backend)
- File api-client.js ada di desktop/src/js/api-client.js — gunakan instance ini
- Jangan hapus atau ubah fitur yang ada, hanya ganti cara pemanggilan API-nya
- Jangan ubah file lain di luar yang disebutkan di prompt
```

> Ganti `3.1-setup-api-client-desktop` dengan nama file prompt yang ingin dikerjakan.

---

## Fase 4 — Web App

```
Kamu adalah senior software engineer yang mengerjakan proyek POS Multi-Platform.

Baca dan kerjakan instruksi di file ini:
docs/prompts/fase-4/4.1-setup-web-app.md

Konteks web yang wajib diikuti:
- Folder target: web/
- Tidak ada mode offline — web selalu terhubung ke backend
- HTML/CSS/JS diport dari desktop/, disesuaikan untuk browser biasa
- Gunakan api-client.js yang sama dengan desktop (salin apa adanya)
- device_source untuk transaksi dari web adalah 'web'
```

> Ganti `4.1-setup-web-app` dengan nama file prompt yang ingin dikerjakan.

---

## Fase 5 — Android APK

```
Kamu adalah senior software engineer yang mengerjakan proyek POS Multi-Platform.

Baca dan kerjakan instruksi di file ini:
docs/prompts/fase-5/5.1-setup-capacitor.md

Konteks Android yang wajib diikuti:
- Folder target: android/
- Build APK menggunakan GitHub Actions, bukan Android Studio
- Capacitor digunakan sebagai jembatan antara web app dan native Android
- device_source untuk transaksi dari Android adalah 'android'
- Tidak ada mode offline di Android
```

> Ganti `5.1-setup-capacitor` dengan nama file prompt yang ingin dikerjakan.

---

## Fase 6 — Offline Sync Engine

```
Kamu adalah senior software engineer yang mengerjakan proyek POS Multi-Platform.

Baca dan kerjakan instruksi di file ini:
docs/prompts/fase-6/6.1-deteksi-konflik-backend.md

Konteks Sync Engine yang wajib diikuti:
- Konflik terjadi saat data desktop (offline) berbeda dengan data online di MySQL
- Resolve approve = terapkan versi desktop ke MySQL
- Resolve reject = pertahankan versi online, kembalikan stok jika transaksi
- Setiap perubahan stok wajib dicatat di tabel stock_mutations
- Fase ini adalah yang paling kompleks, ikuti instruksi dengan teliti
```

> Ganti `6.1-deteksi-konflik-backend` dengan nama file prompt yang ingin dikerjakan.

---

## Tips

- Kerjakan **urut dari atas ke bawah** — setiap prompt bergantung pada prompt sebelumnya
- Jika Claude berhenti di tengah: *"Lanjutkan dari bagian [nama bagian]"*
- Jika ada error: *"Error ini muncul setelah mengerjakan prompt [X.Y]: [paste error]"*
