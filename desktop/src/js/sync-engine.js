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

        // Reset item yang tertinggal di SYNCING dari sesi sebelumnya yang terputus
        if (typeof window.syncQueue !== 'undefined') {
            await window.syncQueue.resetSyncing();
        }

        this.isRunning = true;
        window.dispatchEvent(new CustomEvent('sync:started'));

        try {
            // Ambil pending, urutkan prioritas: cash_drawer:open → transaction → expense → cash_drawer:close
            const allPending = await window.syncQueue.getPending();
            const ordered    = this._sortByPriority(allPending);

            for (const item of ordered) {
                if (!connectionMonitor.isOnline) break; // berhenti jika offline lagi
                // ordered diteruskan agar _processItem bisa patch server_id item close
                // secara in-memory setelah open berhasil — menghindari stale null dari snapshot awal.
                await this._processItem(item, ordered);
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

    async _processItem(item, allItems = []) {
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

                // Update kas harian jika transaksi tunai.
                // Gunakan cash_drawer_id dari payload jika tersedia (tersimpan saat offline).
                // Fallback ke GET current hanya jika null — terjadi saat kas juga dibuka offline
                // dan sudah tersync duluan (prioritas 0), sehingga GET current mengembalikan sesi yang benar.
                if (payload.payment_method === 'cash' && payload.total_amount) {
                    try {
                        let drawerId = payload.cash_drawer_id || null;
                        if (!drawerId) {
                            const drawerRes = await apiClient.get('/cash-drawer/current');
                            drawerId = drawerRes.success ? (drawerRes.data?.id || null) : null;
                        }
                        if (drawerId) {
                            await apiClient.patch(`/cash-drawer/${drawerId}/update-sales`, {
                                total_sales:      payload.total_amount,
                                total_cash_sales: payload.total_amount,
                            });
                        }
                    } catch (e) {
                        console.error('Failed to update cash drawer after sync:', e);
                    }
                }
            }

            // Setelah cash_drawer:open berhasil, teruskan server_id ke item cash_drawer:close
            // yang memiliki local_id yang sama agar URL endpoint-nya bisa dibangun dengan benar.
            // Patch juga objek di array allItems agar _getEndpoint tidak membaca server_id null
            // dari snapshot awal yang diambil sebelum open tersinkronisasi.
            if (item.entity === 'cash_drawer' && item.action === 'open' && item.local_id) {
                const serverId = response?.id ?? null;
                if (serverId) {
                    await window.syncQueue.updateServerId({ localId: item.local_id, serverId });
                    const closeItem = allItems.find(
                        i => i.entity === 'cash_drawer' && i.action === 'close' && i.local_id === item.local_id
                    );
                    if (closeItem) closeItem.server_id = serverId;
                }
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
