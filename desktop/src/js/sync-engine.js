// ============================================
// SYNC ENGINE
// Memproses antrian PENDING satu per satu (FIFO) saat koneksi pulih.
// Dijalankan otomatis via event 'connection:restored' dan bisa dipicu manual.
// ============================================

class SyncEngine {
    constructor() {
        this.isRunning = false;
    }

    // Endpoint map per entity:action — urutan prioritas ditentukan di getPending (ORDER BY created_at)
    // cash_drawer:open harus lebih dulu, sehingga saat offline user membuka kas SEBELUM transaksi
    _getEndpoint(entity, action, item) {
        const map = {
            'transaction:create':  { method: 'POST', url: '/transactions' },
            'expense:create':      { method: 'POST', url: '/expenses' },
            'cash_drawer:open':    { method: 'POST', url: '/cash-drawer/open' },
            'cash_drawer:close':   { method: 'POST', url: `/cash-drawer/${item.server_id}/close` },
        };
        return map[`${entity}:${action}`] || null;
    }

    async start() {
        if (this.isRunning) return;
        if (!connectionMonitor.isOnline) return;

        this.isRunning = true;
        window.dispatchEvent(new CustomEvent('sync:started'));

        try {
            // Ambil pending, urutkan prioritas: cash_drawer:open → transaction → expense → cash_drawer:close
            const allPending = await window.syncQueue.getPending();
            const ordered    = this._sortByPriority(allPending);

            for (const item of ordered) {
                if (!connectionMonitor.isOnline) break; // berhenti jika offline lagi
                await this._processItem(item);
            }
        } finally {
            this.isRunning = false;
            window.dispatchEvent(new CustomEvent('sync:completed'));
        }
    }

    _sortByPriority(items) {
        const PRIORITY = {
            'cash_drawer:open':   0,
            'transaction:create': 1,
            'expense:create':     2,
            'cash_drawer:close':  3,
        };
        return [...items].sort((a, b) => {
            const pa = PRIORITY[`${a.entity}:${a.action}`] ?? 99;
            const pb = PRIORITY[`${b.entity}:${b.action}`] ?? 99;
            if (pa !== pb) return pa - pb;
            // Dalam prioritas sama, urut by created_at ASC (FIFO)
            return (a.created_at < b.created_at ? -1 : 1);
        });
    }

    async _processItem(item) {
        // Tandai sebagai SYNCING
        await window.syncQueue.updateStatus({ id: item.id, status: 'SYNCING' });

        const endpoint = this._getEndpoint(item.entity, item.action, item);
        if (!endpoint) {
            await window.syncQueue.updateStatus({
                id:       item.id,
                status:   'FAILED',
                errorMsg: 'Unknown entity/action',
            });
            return;
        }

        try {
            const payload  = typeof item.payload === 'string'
                ? JSON.parse(item.payload)
                : item.payload;

            const response = await apiClient[endpoint.method.toLowerCase()](endpoint.url, payload);

            // Tandai local_transaction sebagai SYNCED jika ada
            if (item.entity === 'transaction' && item.local_id) {
                await window.localDB.markTransactionSynced({
                    localId:  item.local_id,
                    serverId: response?.id || response?.transaction_id || null,
                });
            }

            await window.syncQueue.updateStatus({ id: item.id, status: 'SYNCED' });

        } catch (error) {
            // increment retry_count, ubah status sesuai threshold
            const retryCount = (item.retry_count || 0) + 1;
            const newStatus  = retryCount >= 3 ? 'FAILED' : 'PENDING';
            await window.syncQueue.updateStatus({
                id:            item.id,
                status:        newStatus,
                errorMsg:      error.message || 'Sync failed',
                incrementRetry: true,
            });
            // Item gagal tidak memblokir item berikutnya — lanjut loop
        }
    }
}

const syncEngine = new SyncEngine();

// Jalankan otomatis saat koneksi pulih (delay 1 detik agar koneksi stabil)
window.addEventListener('connection:restored', () => {
    setTimeout(() => syncEngine.start(), 1000);
});
