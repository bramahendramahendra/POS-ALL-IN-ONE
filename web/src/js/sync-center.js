requireAuth();
requireRole('owner', 'admin');

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  conflicts: { page: 1, limit: 20, status: 'pending', total: 0, data: [] },
  history:   { page: 1, limit: 20, start_date: '', end_date: '', device_source: '', total: 0, data: [] },
  activeConflict: null,
};

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initTabs();
  initFilters();
  initModal();

  setDefaultDates();
  loadConflicts();
  loadHistory();

  document.getElementById('btnRefresh').addEventListener('click', () => {
    loadConflicts();
    loadHistory();
  });
});

function initNav() {
  const user = getUser();
  if (user) {
    document.getElementById('navUsername').textContent = user.username || user.name || '—';
    document.getElementById('navUserRole').textContent = user.role || '';
  }
  document.getElementById('btn-logout-nav').addEventListener('click', logout);
}

function setDefaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  document.getElementById('filterHistoryStart').value = toInputDate(start);
  document.getElementById('filterHistoryEnd').value   = toInputDate(now);
  state.history.start_date = toInputDate(start);
  state.history.end_date   = toInputDate(now);
}

function toInputDate(d) {
  return d.toISOString().slice(0, 10);
}

// ── Tabs ───────────────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

// ── Filters ────────────────────────────────────────────────────────────────
function initFilters() {
  document.getElementById('btnFilterConflict').addEventListener('click', () => {
    state.conflicts.status = document.getElementById('filterConflictStatus').value;
    state.conflicts.limit  = +document.getElementById('filterConflictLimit').value;
    state.conflicts.page   = 1;
    loadConflicts();
  });

  document.getElementById('btnFilterHistory').addEventListener('click', () => {
    state.history.start_date    = document.getElementById('filterHistoryStart').value;
    state.history.end_date      = document.getElementById('filterHistoryEnd').value;
    state.history.device_source = document.getElementById('filterHistoryDevice').value;
    state.history.limit         = +document.getElementById('filterHistoryLimit').value;
    state.history.page          = 1;
    loadHistory();
  });
}

// ── Konflik Transaksi ──────────────────────────────────────────────────────
async function loadConflicts() {
  const tbody = document.getElementById('conflictBody');
  tbody.innerHTML = '<tr class="empty-row"><td colspan="7"><span class="spinner-inline"></span> Memuat...</td></tr>';

  const { page, limit, status } = state.conflicts;
  const params = { page, limit };
  if (status) params.status = status;

  try {
    const res = await apiClient.get('/sync/conflicts', params);
    const items = res.data || res || [];
    state.conflicts.total = res.total || items.length;
    state.conflicts.data  = items;
    renderConflicts(items);
    renderPagination('conflictPagination', state.conflicts, loadConflicts);
    updateConflictBadge(items);
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7" style="color:#dc2626">Gagal memuat: ${e.message}</td></tr>`;
  }
}

function renderConflicts(items) {
  const tbody = document.getElementById('conflictBody');
  if (!items.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Tidak ada konflik</td></tr>';
    return;
  }
  const { page, limit } = state.conflicts;
  tbody.innerHTML = items.map((c, i) => {
    const no     = (page - 1) * limit + i + 1;
    const badge  = conflictStatusBadge(c.status);
    const isPending = c.status === 'pending';
    return `<tr>
      <td>${no}</td>
      <td>
        <div style="font-weight:600">${c.device_id || c.device_source || '—'}</div>
        <div class="conflict-detail">${c.device_name || ''}</div>
      </td>
      <td>
        <div style="font-weight:600">${c.entity_type || '—'}</div>
        <div class="conflict-detail">${c.entity_id ? 'ID: ' + c.entity_id : ''}</div>
      </td>
      <td>${c.conflict_type || c.action || '—'}</td>
      <td>${badge}</td>
      <td style="white-space:nowrap">${fmtDate(c.created_at)}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="openConflictModal(${c.id})">🔍 Detail</button>
          ${isPending ? `
            <button class="btn btn-success btn-sm" onclick="resolveConflict(${c.id},'approve')">✓</button>
            <button class="btn btn-danger btn-sm" onclick="resolveConflict(${c.id},'reject')">✗</button>
          ` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function updateConflictBadge(items) {
  const pending = items.filter(c => c.status === 'pending').length;
  const el = document.getElementById('conflictBadge');
  el.textContent = pending ? `(${pending})` : '';
  el.style.color = pending ? '#dc2626' : '';
}

function conflictStatusBadge(status) {
  const map = {
    pending:  '<span class="badge badge-warning">Pending</span>',
    approved: '<span class="badge badge-success">Approved</span>',
    rejected: '<span class="badge badge-danger">Rejected</span>',
  };
  return map[status] || `<span class="badge badge-gray">${status}</span>`;
}

// ── Modal Detail Konflik ───────────────────────────────────────────────────
function initModal() {
  document.getElementById('closeConflictModal').addEventListener('click',  closeModal);
  document.getElementById('closeConflictModal2').addEventListener('click', closeModal);
  document.getElementById('btnApproveConflict').addEventListener('click', () => {
    if (state.activeConflict) resolveConflict(state.activeConflict.id, 'approve');
  });
  document.getElementById('btnRejectConflict').addEventListener('click', () => {
    if (state.activeConflict) resolveConflict(state.activeConflict.id, 'reject');
  });
  document.getElementById('modalConflict').addEventListener('click', e => {
    if (e.target === document.getElementById('modalConflict')) closeModal();
  });
}

function openConflictModal(id) {
  const conflict = state.conflicts.data.find(c => c.id === id);
  if (!conflict) return;
  state.activeConflict = conflict;

  const grid = document.getElementById('conflictDetailGrid');
  grid.innerHTML = [
    ['ID Konflik',    conflict.id],
    ['Perangkat',     conflict.device_id || conflict.device_source || '—'],
    ['Nama Perangkat',conflict.device_name || '—'],
    ['Entitas',       conflict.entity_type || '—'],
    ['ID Entitas',    conflict.entity_id || '—'],
    ['Tipe Konflik',  conflict.conflict_type || conflict.action || '—'],
    ['Status',        conflictStatusBadge(conflict.status)],
    ['Waktu',         fmtDate(conflict.created_at)],
    ['Diselesaikan',  conflict.resolved_at ? fmtDate(conflict.resolved_at) : '—'],
    ['Oleh',          conflict.resolved_by || '—'],
  ].map(([l, v]) => `<span class="detail-label">${l}</span><span class="detail-value">${v}</span>`).join('');

  document.getElementById('conflictDataBox').textContent =
    conflict.conflict_data ? JSON.stringify(JSON.parse(conflict.conflict_data), null, 2) : '—';
  document.getElementById('serverDataBox').textContent =
    conflict.server_data ? JSON.stringify(JSON.parse(conflict.server_data), null, 2) : '—';

  const footer = document.getElementById('conflictModalFooter');
  const isPending = conflict.status === 'pending';
  document.getElementById('btnApproveConflict').style.display = isPending ? '' : 'none';
  document.getElementById('btnRejectConflict').style.display  = isPending ? '' : 'none';

  document.getElementById('modalConflict').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalConflict').style.display = 'none';
  state.activeConflict = null;
}

async function resolveConflict(id, action) {
  const label = action === 'approve' ? 'Menyetujui' : 'Menolak';
  try {
    await apiClient.post(`/sync/conflicts/${id}/resolve`, { action });
    showToast(`Konflik berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`, 'success');
    closeModal();
    loadConflicts();
  } catch (e) {
    showToast(`Gagal: ${e.message}`, 'error');
  }
}

// ── Riwayat Sync ──────────────────────────────────────────────────────────
async function loadHistory() {
  const tbody = document.getElementById('historyBody');
  tbody.innerHTML = '<tr class="empty-row"><td colspan="7"><span class="spinner-inline"></span> Memuat...</td></tr>';

  const { page, limit, start_date, end_date, device_source } = state.history;
  const params = { page, limit };
  if (start_date)    params.start_date    = start_date;
  if (end_date)      params.end_date      = end_date;
  if (device_source) params.device_source = device_source;

  try {
    const res = await apiClient.get('/sync/history', params);
    const items = res.data || res || [];
    state.history.total = res.total || items.length;
    state.history.data  = items;
    renderHistory(items);
    renderPagination('historyPagination', state.history, loadHistory);
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7" style="color:#dc2626">Gagal memuat: ${e.message}</td></tr>`;
  }
}

function renderHistory(items) {
  const tbody = document.getElementById('historyBody');
  if (!items.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Tidak ada riwayat sync</td></tr>';
    return;
  }
  const { page, limit } = state.history;
  tbody.innerHTML = items.map((h, i) => {
    const no      = (page - 1) * limit + i + 1;
    const device  = deviceLabel(h.device_source);
    const badge   = historyStatusBadge(h.status);
    const dur     = h.duration_ms ? (h.duration_ms / 1000).toFixed(1) + ' dtk' : '—';
    return `<tr>
      <td>${no}</td>
      <td style="white-space:nowrap">${fmtDate(h.synced_at || h.created_at)}</td>
      <td>${device}</td>
      <td style="text-align:center">${h.item_count ?? h.items_synced ?? '—'}</td>
      <td>${badge}</td>
      <td>${dur}</td>
      <td style="font-size:12px;color:#6b7280">${h.notes || h.message || '—'}</td>
    </tr>`;
  }).join('');
}

function deviceLabel(src) {
  const map = { desktop: '🖥️ Desktop', web: '🌐 Web', android: '📱 Android' };
  return map[src] || (src || '—');
}

function historyStatusBadge(status) {
  const map = {
    success:  '<span class="badge badge-success">Berhasil</span>',
    failed:   '<span class="badge badge-danger">Gagal</span>',
    partial:  '<span class="badge badge-warning">Sebagian</span>',
    pending:  '<span class="badge badge-info">Pending</span>',
  };
  return map[status] || `<span class="badge badge-gray">${status || '—'}</span>`;
}

// ── Pagination ─────────────────────────────────────────────────────────────
function renderPagination(containerId, s, loadFn) {
  const el = document.getElementById(containerId);
  if (!s.total) { el.innerHTML = ''; return; }

  const totalPages = Math.ceil(s.total / s.limit) || 1;
  const { page } = s;

  let html = `<button ${page <= 1 ? 'disabled' : ''} onclick="changePage('${containerId}',${page - 1})">‹ Prev</button>`;

  const start = Math.max(1, page - 2);
  const end   = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) {
    html += `<button class="${p === page ? 'active' : ''}" onclick="changePage('${containerId}',${p})">${p}</button>`;
  }
  html += `<button ${page >= totalPages ? 'disabled' : ''} onclick="changePage('${containerId}',${page + 1})">Next ›</button>`;
  html += `<span class="pagination-info">Total: ${s.total} record</span>`;

  el.innerHTML = html;
}

function changePage(containerId, newPage) {
  if (containerId === 'conflictPagination') {
    state.conflicts.page = newPage;
    loadConflicts();
  } else {
    state.history.page = newPage;
    loadHistory();
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
