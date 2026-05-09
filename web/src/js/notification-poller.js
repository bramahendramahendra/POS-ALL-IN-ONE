// ============================================
// CONFLICT NOTIFICATION POLLER — WEB
// Polling ringan 30 detik untuk notifikasi konflik sync baru.
// Hanya aktif untuk role owner dan admin.
// ============================================

(function () {
    const POLL_MS = 30000;

    let lastCount = 0;
    let intervalId = null;

    function getCurrentUserRole() {
        try {
            const raw = localStorage.getItem('user');
            if (!raw) return null;
            const u = JSON.parse(raw);
            return u && u.role ? u.role : null;
        } catch (_) {
            return null;
        }
    }

    function getToken() {
        return localStorage.getItem('access_token') || localStorage.getItem('token') || '';
    }

    async function fetchConflictCount() {
        const baseUrl = (window.APP_CONFIG && window.APP_CONFIG.backendUrl)
            ? window.APP_CONFIG.backendUrl
            : 'http://localhost:8080';

        const resp = await fetch(`${baseUrl}/api/sync/conflicts/count`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!resp.ok) throw new Error('fetch failed');
        const json = await resp.json();
        return (json.data && typeof json.data.count === 'number') ? json.data.count : 0;
    }

    function ensureBadge() {
        let badge = document.getElementById('syncCenterBadge');
        if (badge) return badge;

        // Cari menu item Sync Center dan sisipkan badge
        const syncLink = document.querySelector('a[href*="sync-center"]');
        if (!syncLink) return null;

        badge = document.createElement('span');
        badge.id = 'syncCenterBadge';
        badge.style.cssText = [
            'display:none',
            'background:#ef4444',
            'color:#fff',
            'border-radius:9999px',
            'padding:1px 6px',
            'font-size:11px',
            'margin-left:6px',
            'vertical-align:middle',
            'font-weight:700',
        ].join(';');
        syncLink.appendChild(badge);
        return badge;
    }

    function updateBadge(count) {
        const badge = ensureBadge();
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : String(count);
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }

    function showNotification(newCount) {
        if (typeof showToast === 'function') {
            showToast(`${newCount} konflik sync baru menunggu persetujuan`, 'warning');
        }
    }

    async function check() {
        try {
            const count = await fetchConflictCount();
            updateBadge(count);

            if (lastCount > 0 && count > lastCount) {
                showNotification(count - lastCount);
            }
            lastCount = count;
        } catch (_) {
            // abaikan error jaringan
        }
    }

    function start() {
        const role = getCurrentUserRole();
        if (!role || !['owner', 'admin'].includes(role)) return;

        check();
        intervalId = setInterval(check, POLL_MS);
    }

    function stop() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    // Ekspos ke global agar bisa dihentikan jika perlu
    window.conflictPoller = { start, stop };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
