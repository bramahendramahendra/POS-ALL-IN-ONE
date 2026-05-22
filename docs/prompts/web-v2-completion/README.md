# Prompts: Web-v2 Completion

Kumpulan prompt untuk melengkapi fitur web-v2 dari desktop app.

**Aturan umum saat menggunakan prompt ini:**
- Jalankan satu prompt per sesi Claude (untuk menghindari context limit)
- Selesaikan sepenuhnya sebelum lanjut ke fase berikutnya
- Baca file yang disebutkan di "Context" sebelum coding dimulai

---

## Urutan Pengerjaan

| File | Fase | Fitur | Prioritas |
|------|------|-------|-----------|
| [fase-1a-finance-kas-harian-pengeluaran.md](./fase-1a-finance-kas-harian-pengeluaran.md) | 1A | Finance: Kas Harian + Pengeluaran | Tinggi |
| [fase-1b-finance-kas-saya.md](./fase-1b-finance-kas-saya.md) | 1B | Finance: Kas Saya (untuk kasir) | Tinggi |
| [fase-2-supplier-pembelian-retur.md](./fase-2-supplier-pembelian-retur.md) | 2 | Supplier: Pembelian + Retur | Tinggi |
| [fase-4-kasir-kredit-diskon-item.md](./fase-4-kasir-kredit-diskon-item.md) | 4 | Kasir: Mode Kredit + Diskon Per Item | Sedang |
| [fase-3-laporan-lengkap.md](./fase-3-laporan-lengkap.md) | 3 | Laporan: Penjualan, L/R, Stok, Kasir | Sedang |
| [fase-5-settings-polish.md](./fase-5-settings-polish.md) | 5 | Settings: Tab Printer + Wire Import CSV | Rendah |

> **Catatan urutan**: Fase 4 (kasir kredit) dikerjakan sebelum Fase 3 (laporan) karena
> data piutang dari kredit perlu ada terlebih dahulu agar laporan laba rugi akurat.
> Fase 3 bisa dipecah dua sesi jika terlalu panjang (tab 1-2 dulu, lalu tab 3-4).
