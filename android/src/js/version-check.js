const CURRENT_VERSION = '1.0.0'; // update setiap build baru

async function checkForUpdate() {
    try {
        const res = await apiClient.get('/app/version/android');
        const { latest_version, download_url, is_mandatory, release_notes } = res;

        if (compareVersion(latest_version, CURRENT_VERSION) > 0) {
            showUpdateDialog({
                latestVersion: latest_version,
                currentVersion: CURRENT_VERSION,
                downloadUrl: download_url,
                isMandatory: is_mandatory,
                releaseNotes: release_notes,
            });
        }
    } catch {
        // Gagal cek versi — lanjut tanpa notifikasi
    }
}

function compareVersion(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if (pa[i] > pb[i]) return 1;
        if (pa[i] < pb[i]) return -1;
    }
    return 0;
}

function showUpdateDialog({ latestVersion, currentVersion, downloadUrl, isMandatory, releaseNotes }) {
    const existing = document.querySelector('.update-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'update-modal';
    modal.innerHTML = `
        <div class="update-modal-content">
            <h3>Update Tersedia</h3>
            <p>Versi baru: <strong>${latestVersion}</strong> (saat ini: ${currentVersion})</p>
            ${releaseNotes ? `<p>${releaseNotes}</p>` : ''}
            <div class="update-actions">
                <a href="${downloadUrl}" target="_blank" class="btn-primary">Download APK</a>
                ${!isMandatory ? `<button onclick="this.closest('.update-modal').remove()">Nanti</button>` : ''}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

if (window.APP_CONFIG?.platform === 'android') {
    checkForUpdate();
}
