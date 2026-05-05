// ============================================
// SYNC CENTER
// ============================================

const LIMIT = 20;

const state = {
  conflicts: { page: 1, total: 0, data: [] },
  queue:     { page: 1, total: 0, data: [] },
  history:   { page: 1, total: 0, data: [] },
};

// ─── Connection status ────────────────────────────────────────────────────────

async function checkConnection() {
  const el     = document.getElementById('connectionStatus');
  const dot    = document.getElementById('statusDot');
  const text   = document.getElementById('statusText');

  try {
    await apiClient.get('/health');
    el.className   = 'connection-status online';
    dot.className  = 'status-dot online';
    text.textContent = 'Online';
  } catch {
    el.className   = 'connection-status offline';
    dot.className  = 'status-dot offline';
    text.textContent = 'Offline';
  }
}

// ─── Tab switching ─────────────────────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById(`${tab}-tab`).style.display = 'block';
    });
  });
}

// ─── KONFLIK TRANSAKSI ─────────────────────────────────────────────────────────

async function loadConflicts() {
  const status = document.getElementById('conflictStatusFilter').value;
  const params = { page: state.conflicts.page, limit: LIMIT };
  if (status) params.status = status;

  try {
    const res = await apiClient.get('/sync/conflicts', params);
    // res may be array or { data, total }
    const items = Array.isArray(res) ? res : (res?.data ?? []);
    const total = res?.total ?? items.length;
    state.conflicts.data  = items;
    state.conflicts.total = total;
    renderConflicts(items);
    updatePagination('conflicts', total);
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

function renderConflicts(items) {
  const container = document.getElementById('conflictsList');

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <p>Tidak ada konflik transaksi</p>
      </div>`;
    return;
  }

  // Group by date
  const grouped = {};
  items.forEach(c => {
    const date = (c.transaction_date ?? c.date ?? '').substring(0, 10);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(c);
  });

  container.innerHTML = Object.entries(grouped).map(([date, conflicts]) => `
    <div class="conflict-group">
      <div class="conflict-group-header">
        <h4>📅 ${formatDate(date)} — ${conflicts.length} konflik transaksi</h4>
        <div class="conflict-group-actions">
          <button class="btn btn-success btn-sm" onclick="approveAll(${JSON.stringify(conflicts.map(c => c.id))})">
            ✓ Approve Semua
          </button>
          <button class="btn btn-danger btn-sm" onclick="rejectAll(${JSON.stringify(conflicts.map(c => c.id))})">
            ✗ Reject Semua
          </button>
        </div>
      </div>
      <table class="conflict-detail-table">
        <thead>
          <tr>
            <th>ID Transaksi</th>
            <th>Field</th>
            <th>Versi Desktop</th>
            <th>Versi Online</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${conflicts.map(c => `
            <tr>
              <td>${escapeHtml(String(c.transaction_id ?? c.id))}</td>
              <td>
                <div>Total: <strong>${formatCurrency(c.desktop_total ?? 0)}</strong> vs <strong>${formatCurrency(c.online_total ?? 0)}</strong></div>
                <div>Item: ${c.desktop_items ?? '-'} vs ${c.online_items ?? '-'}</div>
                <div>Waktu: ${c.desktop_time ?? '-'} vs ${c.online_time ?? '-'}</div>
              </td>
              <td>${formatCurrency(c.desktop_total ?? 0)}</td>
              <td>${formatCurrency(c.online_total ?? 0)}</td>
              <td>
                <div class="conflict-item-actions">
                  <button class="btn btn-success btn-sm" onclick="resolveConflict(${c.id}, 'approve')">✓ Desktop</button>
                  <button class="btn btn-danger btn-sm" onclick="resolveConflict(${c.id}, 'reject')">✗ Online</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');
}

async function resolveConflict(conflictId, action) {
  try {
    await apiClient.post(`/sync/conflicts/${conflictId}/resolve`, { action });
    showNotification(`Konflik berhasil di-${action === 'approve' ? 'approve' : 'reject'}`, 'success');
    loadConflicts();
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

async function approveAll(ids) {
  try {
    await Promise.all(ids.map(id => apiClient.post(`/sync/conflicts/${id}/resolve`, { action: 'approve' })));
    showNotification('Semua konflik berhasil di-approve', 'success');
    loadConflicts();
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

async function rejectAll(ids) {
  try {
    await Promise.all(ids.map(id => apiClient.post(`/sync/conflicts/${id}/resolve`, { action: 'reject' })));
    showNotification('Semua konflik berhasil di-reject', 'success');
    loadConflicts();
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

// ─── ANTRIAN SYNC ─────────────────────────────────────────────────────────────

async function loadQueue() {
  const status = document.getElementById('queueStatusFilter').value;
  const params = { page: state.queue.page, limit: LIMIT };
  if (status) params.status = status;

  try {
    const res   = await apiClient.get('/sync/queue', params);
    const items = Array.isArray(res) ? res : (res?.data ?? []);
    const total = res?.total ?? items.length;
    state.queue.data  = items;
    state.queue.total = total;
    renderQueue(items);
    updatePagination('queue', total);
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

function statusBadge(status) {
  const map = {
    pending: 'badge-pending',
    syncing: 'badge-syncing syncing-pulse',
    synced:  'badge-synced',
    failed:  'badge-failed',
  };
  const cls = map[status?.toLowerCase()] ?? '';
  return `<span class="sync-badge ${cls}">${escapeHtml(status ?? '-')}</span>`;
}

function renderQueue(items) {
  const container = document.getElementById('queueList');

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔄</div>
        <p>Antrian kosong</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Tipe</th>
          <th>Referensi</th>
          <th>Status</th>
          <th>Waktu Dibuat</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, i) => `
          <tr>
            <td>${(state.queue.page - 1) * LIMIT + i + 1}</td>
            <td>${escapeHtml(item.type ?? '-')}</td>
            <td>${escapeHtml(String(item.reference_id ?? item.ref ?? '-'))}</td>
            <td>${statusBadge(item.status)}</td>
            <td>${formatDateTime(item.created_at)}</td>
            <td>
              ${item.status === 'failed' ? `<button class="btn btn-warning btn-sm" onclick="retryQueueItem(${item.id})">🔁 Retry</button>` : '-'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

async function retryQueueItem(itemId) {
  try {
    await apiClient.post(`/sync/queue/${itemId}/retry`);
    showNotification('Item berhasil dimasukkan ulang ke antrian', 'success');
    loadQueue();
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

async function triggerManualSync() {
  const btn = document.getElementById('btnManualSync');
  btn.disabled = true;
  btn.textContent = '⏳ Syncing...';
  try {
    await apiClient.post('/sync/push');
    showNotification('Sync manual berhasil dipicu', 'success');
    await checkConnection();
    loadQueue();
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '☁️ Sync Manual';
  }
}

// ─── RIWAYAT SYNC ─────────────────────────────────────────────────────────────

async function loadHistory() {
  const start = document.getElementById('historyStartDate').value;
  const end   = document.getElementById('historyEndDate').value;
  const params = { page: state.history.page, limit: LIMIT };
  if (start) params.start_date = start;
  if (end)   params.end_date   = end;

  try {
    const res   = await apiClient.get('/sync/history', params);
    const items = Array.isArray(res) ? res : (res?.data ?? []);
    const total = res?.total ?? items.length;
    state.history.data  = items;
    state.history.total = total;
    renderHistory(items);
    updatePagination('history', total);
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

function renderHistory(items) {
  const tbody = document.getElementById('historyTableBody');

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:#9ca3af;">Tidak ada riwayat sync pada periode ini</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(h => `
    <tr>
      <td>${formatDateTime(h.synced_at ?? h.created_at)}</td>
      <td>${escapeHtml(h.device ?? h.device_id ?? '-')}</td>
      <td>${h.item_count ?? 0}</td>
      <td>${statusBadge(h.status)}</td>
      <td>${h.duration_ms != null ? `${h.duration_ms} ms` : (h.duration ?? '-')}</td>
    </tr>
  `).join('');
}

// ─── PAGINATION ────────────────────────────────────────────────────────────────

function updatePagination(key, total) {
  const page     = state[key].page;
  const totalPages = Math.ceil(total / LIMIT) || 1;
  const paginationEl = document.getElementById(`${key}Pagination`);
  const infoEl       = document.getElementById(`${key}PaginationInfo`);
  const prevBtn      = document.getElementById(`${key}PrevBtn`);
  const nextBtn      = document.getElementById(`${key}NextBtn`);

  paginationEl.style.display = total > LIMIT ? 'flex' : 'none';
  infoEl.textContent = `Halaman ${page} dari ${totalPages} (${total} item)`;
  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= totalPages;
}

function prevPage(key, loader) {
  if (state[key].page > 1) {
    state[key].page--;
    loader();
  }
}

function nextPage(key, loader) {
  const totalPages = Math.ceil(state[key].total / LIMIT);
  if (state[key].page < totalPages) {
    state[key].page++;
    loader();
  }
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function formatDate(str) {
  if (!str) return '-';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(str) {
  if (!str) return '-';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleString('id-ID');
}

function formatCurrency(val) {
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (!initializePageLayout('sync-center')) return;

  initTabs();
  checkConnection();
  // Re-check koneksi setiap 30 detik
  setInterval(checkConnection, 30_000);

  // Conflicts
  document.getElementById('btnLoadConflicts').addEventListener('click', () => {
    state.conflicts.page = 1;
    loadConflicts();
  });
  document.getElementById('conflictsPrevBtn').addEventListener('click', () => prevPage('conflicts', loadConflicts));
  document.getElementById('conflictsNextBtn').addEventListener('click', () => nextPage('conflicts', loadConflicts));

  // Queue
  document.getElementById('btnLoadQueue').addEventListener('click', () => {
    state.queue.page = 1;
    loadQueue();
  });
  document.getElementById('btnManualSync').addEventListener('click', triggerManualSync);
  document.getElementById('queuePrevBtn').addEventListener('click', () => prevPage('queue', loadQueue));
  document.getElementById('queueNextBtn').addEventListener('click', () => nextPage('queue', loadQueue));

  // History — set default date range (bulan ini)
  const now = new Date();
  const y   = now.getFullYear();
  const m   = String(now.getMonth() + 1).padStart(2, '0');
  document.getElementById('historyStartDate').value = `${y}-${m}-01`;
  document.getElementById('historyEndDate').value   = now.toISOString().substring(0, 10);

  document.getElementById('btnLoadHistory').addEventListener('click', () => {
    state.history.page = 1;
    loadHistory();
  });
  document.getElementById('historyPrevBtn').addEventListener('click', () => prevPage('history', loadHistory));
  document.getElementById('historyNextBtn').addEventListener('click', () => nextPage('history', loadHistory));

  // Modal close
  document.getElementById('conflictModalClose')?.addEventListener('click', () => {
    document.getElementById('conflictModal').style.display = 'none';
  });
  document.getElementById('conflictModalOverlay')?.addEventListener('click', () => {
    document.getElementById('conflictModal').style.display = 'none';
  });
});
