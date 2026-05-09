// ============================================
// CONFLICT NOTIFICATION POLLER
// Polling ringan 30 detik untuk notifikasi konflik sync baru.
// Hanya aktif untuk role owner dan admin.
// ============================================

class ConflictNotificationPoller {
    constructor() {
        this.lastCount = 0;
        this.interval  = null;
        this.POLL_MS   = 30000; // 30 detik
    }

    start() {
        const user = getCurrentUser();
        if (!user || !['owner', 'admin'].includes(user.role)) return;

        this._check();
        this.interval = setInterval(() => this._check(), this.POLL_MS);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    async _check() {
        if (typeof connectionMonitor !== 'undefined' && !connectionMonitor.isOnline) return;

        try {
            const res = await apiClient.get('/sync/conflicts/count');
            const count = (res && res.data && typeof res.data.count === 'number')
                ? res.data.count
                : 0;

            this._updateBadge(count);

            // Tampilkan toast hanya jika jumlah bertambah (bukan saat pertama load)
            if (this.lastCount > 0 && count > this.lastCount) {
                this._showNotification(count - this.lastCount);
            }
            this.lastCount = count;
        } catch (_) {
            // abaikan error jaringan
        }
    }

    _updateBadge(count) {
        const badge = document.getElementById('syncCenterBadge');
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : String(count);
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    }

    _showNotification(newCount) {
        const msg = `${newCount} konflik sync baru menunggu persetujuan`;
        if (typeof showToast === 'function') {
            showToast(msg, 'warning');
        }

        // Klik area notifikasi → arahkan ke Sync Center
        const toasts = document.querySelectorAll('#toast-container > div');
        const lastToast = toasts[toasts.length - 1];
        if (lastToast) {
            lastToast.style.cursor = 'pointer';
            lastToast.addEventListener('click', () => {
                window.location.href = 'sync-center.html';
            }, { once: true });
        }
    }
}

const conflictPoller = new ConflictNotificationPoller();

// Mulai polling setelah halaman siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => conflictPoller.start());
} else {
    conflictPoller.start();
}
