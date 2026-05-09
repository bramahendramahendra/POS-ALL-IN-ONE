'use strict';

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  requireRole('kasir', 'owner', 'admin');

  currentUser = getCurrentUser();

  const navNameEl = document.getElementById('navUsername');
  const navRoleEl = document.getElementById('navUserRole');
  if (navNameEl && currentUser) navNameEl.textContent = currentUser.full_name || currentUser.username;
  if (navRoleEl && currentUser) navRoleEl.textContent = currentUser.role;

  document.getElementById('btn-logout-nav').addEventListener('click', logout);

  setDefaultDateRange();
  setupEventListeners();
  await loadTransactions();
});

// ============================================
// STATE
// ============================================

let currentUser   = null;
let currentPage   = 1;
const PAGE_LIMIT  = 20;
let totalPages    = 1;

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  document.getElementById('btnApplyFilter').addEventListener('click', () => {
    currentPage = 1;
    loadTransactions();
  });

  document.getElementById('btnRefresh').addEventListener('click', () => {
    currentPage = 1;
    loadTransactions();
  });

  document.getElementById('btnPrevPage').addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; loadTransactions(); }
  });

  document.getElementById('btnNextPage').addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; loadTransactions(); }
  });

  document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);

  window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('detailModal')) closeDetailModal();
  });
}

function setDefaultDateRange() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  document.getElementById('filterStartDate').value = toISODate(firstDay);
  document.getElementById('filterEndDate').value   = toISODate(today);
}

// ============================================
// LOAD TRANSACTIONS
// ============================================

async function loadTransactions() {
  const tbody = document.getElementById('transactionsTableBody');
  tbody.innerHTML = `<tr><td colspan="9" class="text-center">Loading...</td></tr>`;

  const start_date     = document.getElementById('filterStartDate').value;
  const end_date       = document.getElementById('filterEndDate').value;
  const payment_method = document.getElementById('filterPaymentMethod').value;
  const device_source  = document.getElementById('filterDeviceSource').value;

  const params = { page: currentPage, limit: PAGE_LIMIT };
  if (start_date)     params.start_date     = start_date;
  if (end_date)       params.end_date       = end_date;
  if (payment_method) params.payment_method = payment_method;
  if (device_source)  params.device_source  = device_source;

  try {
    const result = await apiClient.get('/transactions', params);

    const transactions = result.transactions || result.data || (Array.isArray(result) ? result : []);
    const meta         = result.meta || result.pagination || {};
    totalPages         = meta.total_pages || meta.last_page || 1;

    renderTable(transactions);
    renderPagination();
    renderSummary(transactions);
  } catch (error) {
    console.error('Load transactions error:', error);
    tbody.innerHTML = `<tr><td colspan="9" class="text-center">Gagal memuat data transaksi</td></tr>`;
  }
}

// ============================================
// RENDER
// ============================================

function renderTable(transactions) {
  const tbody = document.getElementById('transactionsTableBody');

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center">Tidak ada data transaksi</td></tr>`;
    return;
  }

  tbody.innerHTML = transactions.map(t => {
    const isVoid    = t.is_void || t.status === 'void';
    const statusBadge = isVoid
      ? `<span class="badge badge-danger">VOID</span>`
      : `<span class="badge badge-success">Selesai</span>`;

    const platformBadge = platformLabel(t.device_source);
    const payLabel      = paymentLabel(t.payment_method);

    const canVoid = !isVoid && canDoVoid();

    return `
      <tr style="${isVoid ? 'opacity:0.6;' : ''}">
        <td><code>${escapeHtml(t.transaction_number || String(t.id))}</code></td>
        <td>${formatDateTime(t.created_at)}</td>
        <td>${escapeHtml(t.cashier_name || t.user_name || '-')}</td>
        <td>${escapeHtml(t.customer_name || '-')}</td>
        <td>${payLabel}</td>
        <td>${platformBadge}</td>
        <td style="font-weight:600;">${formatCurrency(t.total_amount)}</td>
        <td>${statusBadge}</td>
        <td class="action-buttons">
          <button class="btn-icon" onclick="openDetail(${t.id})" title="Detail">🔍</button>
          ${canVoid ? `<button class="btn-icon" onclick="confirmVoid(${t.id}, '${escapeHtml(t.transaction_number || String(t.id))}')" title="Void">🚫</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function renderPagination() {
  document.getElementById('pageInfo').textContent = `Halaman ${currentPage} / ${totalPages}`;
  document.getElementById('btnPrevPage').disabled = currentPage <= 1;
  document.getElementById('btnNextPage').disabled = currentPage >= totalPages;
}

function renderSummary(transactions) {
  const active = transactions.filter(t => !(t.is_void || t.status === 'void'));
  const total  = active.length;
  const revenue = active.reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0);
  const avg    = total > 0 ? revenue / total : 0;

  document.getElementById('summaryTotal').textContent   = total;
  document.getElementById('summaryRevenue').textContent = formatCurrency(revenue);
  document.getElementById('summaryAvg').textContent     = formatCurrency(avg);
}

// ============================================
// DETAIL MODAL
// ============================================

async function openDetail(transactionId) {
  const modal = document.getElementById('detailModal');
  const body  = document.getElementById('detailModalBody');

  body.innerHTML = '<p class="text-center">Loading...</p>';
  modal.style.display = 'flex';

  try {
    const result = await apiClient.get(`/transactions/${transactionId}`);
    const t = result.transaction || result;

    document.getElementById('detailModalTitle').textContent =
      `Detail — ${t.transaction_number || '#' + t.id}`;

    const isVoid = t.is_void || t.status === 'void';
    const canVoid = !isVoid && canDoVoid();

    const items = (t.items || t.transaction_items || []).map(item => `
      <tr>
        <td>${escapeHtml(item.product_name || item.name || '-')}</td>
        <td style="text-align:right;">${item.quantity}</td>
        <td style="text-align:right;">${formatCurrency(item.unit_price || item.price)}</td>
        <td style="text-align:right;">${formatCurrency(item.subtotal || (item.quantity * (item.unit_price || item.price)))}</td>
      </tr>
    `).join('');

    body.innerHTML = `
      ${isVoid ? `<div class="void-notice">⚠️ TRANSAKSI TELAH DIVOID</div>` : ''}

      <div class="detail-section">
        <div class="detail-section-title">Informasi Transaksi</div>
        <div class="detail-row">
          <span class="detail-label">No. Transaksi</span>
          <span class="detail-value"><code>${escapeHtml(t.transaction_number || String(t.id))}</code></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tanggal &amp; Waktu</span>
          <span class="detail-value">${formatDateTime(t.created_at)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Kasir</span>
          <span class="detail-value">${escapeHtml(t.cashier_name || t.user_name || '-')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pelanggan</span>
          <span class="detail-value">${escapeHtml(t.customer_name || '-')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Platform</span>
          <span class="detail-value">${platformLabel(t.device_source)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Metode Bayar</span>
          <span class="detail-value">${paymentLabel(t.payment_method)}</span>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Item Pembelian</div>
        <div style="overflow-x:auto;">
          <table class="data-table" style="font-size:13px;">
            <thead>
              <tr>
                <th>Produk</th>
                <th style="text-align:right;">Qty</th>
                <th style="text-align:right;">Harga Satuan</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${items || `<tr><td colspan="4" class="text-center">—</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Ringkasan Pembayaran</div>
        <div class="detail-row">
          <span class="detail-label">Subtotal</span>
          <span class="detail-value">${formatCurrency(t.subtotal || t.total_amount)}</span>
        </div>
        ${t.discount_amount ? `
        <div class="detail-row">
          <span class="detail-label">Diskon</span>
          <span class="detail-value" style="color:#dc2626;">- ${formatCurrency(t.discount_amount)}</span>
        </div>` : ''}
        ${t.tax_amount ? `
        <div class="detail-row">
          <span class="detail-label">Pajak</span>
          <span class="detail-value">${formatCurrency(t.tax_amount)}</span>
        </div>` : ''}
        <div class="detail-row" style="font-size:15px;">
          <span class="detail-label" style="font-weight:700;">Total</span>
          <span class="detail-value" style="font-size:16px;">${formatCurrency(t.total_amount)}</span>
        </div>
        ${t.payment_amount ? `
        <div class="detail-row">
          <span class="detail-label">Bayar</span>
          <span class="detail-value">${formatCurrency(t.payment_amount)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Kembalian</span>
          <span class="detail-value">${formatCurrency((t.payment_amount || 0) - (t.total_amount || 0))}</span>
        </div>` : ''}
      </div>

      ${isVoid && t.void_reason ? `
      <div class="detail-section">
        <div class="detail-section-title">Alasan Void</div>
        <p style="font-size:13px;color:#374151;margin:0;">${escapeHtml(t.void_reason)}</p>
      </div>` : ''}

      <div class="modal-footer" style="padding:0;">
        ${canVoid ? `<button class="btn btn-danger btn-sm" onclick="confirmVoid(${t.id}, '${escapeHtml(t.transaction_number || String(t.id))}')">🚫 Void Transaksi</button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="closeDetailModal()">Tutup</button>
      </div>
    `;
  } catch (error) {
    console.error('Open detail error:', error);
    body.innerHTML = '<p class="text-center">Gagal memuat detail transaksi</p>';
  }
}

function closeDetailModal() {
  document.getElementById('detailModal').style.display = 'none';
}

// ============================================
// VOID TRANSAKSI
// ============================================

function canDoVoid() {
  return currentUser && ['owner', 'admin'].includes(currentUser.role);
}

function confirmVoid(transactionId, transactionNumber) {
  const reason = window.prompt(
    `Void Transaksi #${transactionNumber}\n\nMasukkan alasan void (wajib diisi):`,
    ''
  );
  if (reason === null) return; // dibatalkan
  if (!reason.trim()) {
    showToast('Alasan void tidak boleh kosong', 'error');
    return;
  }
  if (window.confirm(`Yakin ingin mem-void transaksi #${transactionNumber}?\nTindakan ini tidak dapat dibatalkan.`)) {
    doVoid(transactionId, reason.trim());
  }
}

async function doVoid(transactionId, reason) {
  try {
    const result = await apiClient.post(`/transactions/${transactionId}/void`, { reason });
    if (result.success) {
      closeDetailModal();
      showToast('Transaksi berhasil di-void', 'success');
      await loadTransactions();
    } else {
      showToast(result.message || 'Gagal mem-void transaksi', 'error');
    }
  } catch (error) {
    console.error('Void error:', error);
    showToast('Terjadi kesalahan saat void transaksi', 'error');
  }
}

// ============================================
// UTILITY
// ============================================

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(amount || 0);
}

function formatDateTime(str) {
  if (!str) return '-';
  return new Date(str).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function platformLabel(source) {
  const map = {
    desktop: '<span class="badge badge-gray">🖥️ Desktop</span>',
    web:     '<span class="badge badge-info">🌐 Web</span>',
    android: '<span class="badge badge-success">📱 Android</span>',
  };
  return map[source] || `<span class="badge badge-gray">${escapeHtml(source || '-')}</span>`;
}

function paymentLabel(method) {
  const map = {
    cash:     'Cash',
    transfer: 'Transfer',
    qris:     'QRIS',
    card:     'Kartu',
    piutang:  'Piutang',
  };
  return escapeHtml(map[method] || method || '-');
}

function showToast(message, type = 'info') {
  const existing = document.getElementById('web-toast');
  if (existing) existing.remove();
  const colors = { success: '#059669', error: '#dc2626', warning: '#d97706', info: '#2563eb' };
  const toast = document.createElement('div');
  toast.id = 'web-toast';
  toast.style.cssText = `position:fixed;bottom:24px;right:24px;background:${colors[type] || colors.info};color:#fff;
    padding:12px 18px;border-radius:8px;font-size:14px;z-index:9999;
    box-shadow:0 4px 12px rgba(0,0,0,.2);max-width:320px`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
