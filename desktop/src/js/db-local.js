// ============================================
// DB LOCAL — Abstraksi SQLite lokal via IPC (window.localDB)
// Digunakan saat offline untuk transaksi kasir & cache produk.
// ============================================

const dbLocal = {
    /**
     * Simpan transaksi ke SQLite lokal (offline).
     * @param {Object} data - payload transaksi
     * @returns {Promise<{local_id: string}>}
     */
    saveTransaction(data) {
        return window.localDB.saveTransaction(data);
    },

    /**
     * Ambil semua transaksi offline yang belum disinkronkan.
     * @returns {Promise<Array>}
     */
    getPendingTransactions() {
        return window.localDB.getPendingTransactions();
    },

    /**
     * Simpan daftar produk ke cache lokal.
     * @param {Array} products
     * @returns {Promise<boolean>}
     */
    cacheProducts(products) {
        return window.localDB.cacheProducts(products);
    },

    /**
     * Baca produk dari cache lokal (digunakan saat offline).
     * @returns {Promise<Array>}
     */
    getCachedProducts() {
        return window.localDB.getCachedProducts();
    },

    /** Cek apakah localDB tersedia (hanya di Electron). */
    isAvailable() {
        return typeof window !== 'undefined' && !!window.localDB;
    }
};
