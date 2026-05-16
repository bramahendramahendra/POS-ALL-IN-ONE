// ============================================
// CONNECTION MONITOR
// Deteksi koneksi realtime: browser event + ping backend setiap 30 detik.
// Dispatch CustomEvent 'connection:restored' saat kembali online.
// ============================================

class ConnectionMonitor {
    constructor() {
        this.isOnline    = navigator.onLine;
        this.backendUrl  = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.API_BASE_URL)
            ? APP_CONFIG.API_BASE_URL.replace('/api', '')
            : 'http://localhost:8080';
        this.checkInterval = null;
        this.listeners     = [];
    }

    start() {
        window.addEventListener('online',  () => this._handleChange(true));
        window.addEventListener('offline', () => this._handleChange(false));

        // Ping backend setiap 30 detik untuk cek koneksi real
        this.checkInterval = setInterval(() => this._pingBackend(), 30_000);
        this._pingBackend(); // cek awal
    }

    async _pingBackend() {
        try {
            const res = await fetch(`${this.backendUrl}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            // Backend reachable jika ada response (status apapun), bukan network error
            this._handleChange(res.status < 500);
        } catch {
            this._handleChange(false);
        }
    }

    _handleChange(online) {
        const changed  = this.isOnline !== online;
        this.isOnline  = online;
        this._updateUI();
        if (changed) {
            this.listeners.forEach(fn => fn(online));
            if (online) {
                window.dispatchEvent(new CustomEvent('connection:restored'));
            }
        }
    }

    _updateUI() {
        const indicator = document.getElementById('connection-indicator');
        if (!indicator) return;
        indicator.className   = this.isOnline ? 'status-online' : 'status-offline';
        indicator.textContent = this.isOnline ? '● Online' : '● Offline';
    }

    onChange(fn) {
        this.listeners.push(fn);
    }

    stop() {
        clearInterval(this.checkInterval);
    }
}

const connectionMonitor = new ConnectionMonitor();
connectionMonitor.start();
