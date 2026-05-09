'use strict';

// ============================================
// STATE
// ============================================

let currentUser = null;

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  requireRole('kasir', 'owner', 'admin');

  currentUser = getCurrentUser();

  const navNameEl = document.getElementById('navUsername');
  const navRoleEl = document.getElementById('navUserRole');
  if (navNameEl && currentUser) navNameEl.textContent = currentUser.full_name || currentUser.username;
  if (navRoleEl && currentUser) navRoleEl.textContent = currentUser.role;

  document.getElementById('btn-logout-nav').addEventListener('click', logout);

  setupTabs();
  setupEventListeners();
  loadSummary();
  loadCustomerDropdown();
});

// ============================================
// TABS
// ============================================

function setupTabs() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById(`${tab}-tab`).classList.add('active');
      if (tab === 'summary') loadSummary();
      if (tab === 'detail')  loadDetail();
    });
  });
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  document.getElementById('btnFilterSummary').addEventListener('click', loadSummary);
  document.getElementById('searchSummary').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadSummary();
  });

  document.getElementById('btnFilterDetail').addEventListener('click', loadDetail);

  document.getElementById('closePaymentModal').addEventListener('click', closePayModal);
  document.getElementById('btnCancelPay').addEventListener('click', closePayModal);
  document.getElementById('btnProcessPay').addEventListener('click', processPay);

  document.getElementById('payAmount').addEventListener('input', updateSisaPreview);

  document.addEventListener('click', (e) => {
    if (e.target === document.getElementById('paymentModal')) closePayModal();
  });
}

// ============================================
// RINGKASAN PER PELANGGAN
// ============================================

async function loadSummary() {
  try {
    const result = await apiClient.get('/receivables/summary');
    const search = document.getElementById('searchSummary').value.trim().toLowerCase();

    let data = result.items || result.summary || (Array.isArray(result) ? result : []);
    if (search) {
      data = data.filter(r =>
        (r.name || '').toLowerCase().includes(search) ||
        (r.customer_code || '').toLowerCase().includes(search)
      );
    }
    renderSummary(data);
  } catch (error) {
    console.error('loadSummary error:', error);
    showToast('Gagal memuat ringkasan piutang', 'error');
  }
}

function renderSummary(data) {
  const tbody = document.getElementById('summaryTableBody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data piutang</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(r => {
    const limitDisplay = (r.credit_limit || 0) > 0
      ? formatCurrency(r.credit_limit)
      : '<span class="text-muted">Tak terbatas</span>';
    const outStyle = (r.outstanding || 0) > 0 ? 'color:#e74c3c;font-weight:600;' : '';
    return `
      <tr>
        <td><code>${escapeHtml(r.customer_code)}</code></td>
        <td><strong>${escapeHtml(r.name)}</strong></td>
        <td>${escapeHtml(r.phone || '-')}</td>
        <td>${limitDisplay}</td>
        <td style="${outStyle}">${formatCurrency(r.outstanding)}</td>
        <td class="text-center">${(r.count_unpaid || 0) > 0 ? `<span class="badge badge-danger">${r.count_unpaid}</span>` : '-'}</td>
        <td class="text-center">${(r.count_partial || 0) > 0 ? `<span class="badge badge-warning">${r.count_partial}</span>` : '-'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewCustomerDetail(${r.id})">Detail</button>
        </td>
      </tr>
    `;
  }).join('');
}

function viewCustomerDetail(customerId) {
  document.querySelector('[data-tab="detail"]').click();
  document.getElementById('filterDetailCustomer').value = customerId;
  loadDetail();
}

// ============================================
// DETAIL PIUTANG
// ============================================

async function loadCustomerDropdown() {
  try {
    const result    = await apiClient.get('/customers/active');
    const customers = result.items || result.customers || (Array.isArray(result) ? result : []);
    const select    = document.getElementById('filterDetailCustomer');
    customers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.customer_code} - ${c.name}`;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error('loadCustomerDropdown error:', error);
  }
}

async function loadDetail() {
  const customer_id = document.getElementById('filterDetailCustomer').value;
  const status      = document.getElementById('filterDetailStatus').value;

  const params = {};
  if (customer_id) params.customer_id = parseInt(customer_id);
  if (status)      params.status      = status;

  try {
    const result      = await apiClient.get('/receivables', params);
    const receivables = result.items || result.receivables || (Array.isArray(result) ? result : []);
    renderDetail(receivables);
  } catch (error) {
    console.error('loadDetail error:', error);
    showToast('Gagal memuat detail piutang', 'error');
  }
}

function renderDetail(data) {
  const tbody = document.getElementById('detailTableBody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data piutang</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(r => {
    const statusBadge = getStatusBadge(r.status);
    const date        = r.transaction_date
      ? new Date(r.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '-';
    const canPay = r.status !== 'paid';
    return `
      <tr>
        <td><code>${escapeHtml(r.transaction_code || r.transaction_number || '-')}</code></td>
        <td>${escapeHtml(r.customer_name)}</td>
        <td>${date}</td>
        <td>${formatCurrency(r.total_amount)}</td>
        <td>${formatCurrency(r.paid_amount || 0)}</td>
        <td><strong style="${(r.remaining_amount || 0) > 0 ? 'color:#e74c3c;' : ''}">${formatCurrency(r.remaining_amount)}</strong></td>
        <td>${statusBadge}</td>
        <td>
          ${canPay ? `<button class="btn btn-sm btn-success" onclick="openPayModal(${r.id})">Bayar</button>` : ''}
          <button class="btn btn-sm btn-secondary" onclick="openPayModal(${r.id}, true)">Detail</button>
        </td>
      </tr>
    `;
  }).join('');
}

function getStatusBadge(status) {
  if (status === 'paid')    return '<span class="badge badge-success">Lunas</span>';
  if (status === 'partial') return '<span class="badge badge-warning">Bayar Sebagian</span>';
  return '<span class="badge badge-danger">Belum Bayar</span>';
}

// ============================================
// MODAL PEMBAYARAN
// ============================================

async function openPayModal(receivableId, viewOnly = false) {
  try {
    const result    = await apiClient.get(`/receivables/${receivableId}`);
    const r         = result.receivable || result;
    const payments  = result.payments || r.payments || [];

    document.getElementById('payReceivableId').value             = receivableId;
    document.getElementById('payCustomerName').textContent       = r.customer_name;
    document.getElementById('payTransactionCode').textContent    = r.transaction_code || r.transaction_number || '-';
    document.getElementById('payTotalAmount').textContent        = formatCurrency(r.total_amount);
    document.getElementById('payPaidAmount').textContent         = formatCurrency(r.paid_amount || 0);
    document.getElementById('payRemainingAmount').textContent    = formatCurrency(r.remaining_amount || 0);

    const formSection = document.getElementById('payFormSection');
    if (r.status === 'paid' || viewOnly) {
      formSection.style.display = 'none';
    } else {
      formSection.style.display = 'block';
      document.getElementById('payAmount').value                 = '';
      document.getElementById('payAmount').dataset.remaining     = r.remaining_amount || 0;
      document.getElementById('payMethod').value                 = 'cash';
      document.getElementById('payNotes').value                  = '';
      document.getElementById('paySisaPreview').textContent      = '';
    }

    renderPaymentHistory(payments);
    document.getElementById('paymentModal').style.display = 'flex';
  } catch (error) {
    console.error('openPayModal error:', error);
    showToast('Gagal memuat data piutang', 'error');
  }
}

function renderPaymentHistory(payments) {
  const container = document.getElementById('paymentHistory');
  if (!payments || !payments.length) {
    container.innerHTML = '<p class="text-muted text-center" style="font-size:13px;">Belum ada pembayaran</p>';
    return;
  }

  container.innerHTML = `
    <table class="data-table" style="font-size:13px;">
      <thead>
        <tr>
          <th>Tanggal</th><th>Jumlah</th><th>Metode</th><th>Kasir</th><th>Catatan</th>
        </tr>
      </thead>
      <tbody>
        ${payments.map(p => {
          const date = new Date(p.payment_date).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
          return `
            <tr>
              <td>${date}</td>
              <td><strong>${formatCurrency(p.amount)}</strong></td>
              <td>${escapeHtml(p.payment_method)}</td>
              <td>${escapeHtml(p.user_name || '-')}</td>
              <td>${escapeHtml(p.notes || '-')}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function updateSisaPreview() {
  const remaining = parseFloat(document.getElementById('payAmount').dataset.remaining) || 0;
  const amount    = parseFloat(document.getElementById('payAmount').value) || 0;
  const sisa      = remaining - amount;
  const el        = document.getElementById('paySisaPreview');

  if (amount > 0) {
    if (amount > remaining) {
      el.textContent = '⚠️ Jumlah melebihi sisa piutang';
      el.style.color = '#e74c3c';
    } else {
      el.textContent = `Sisa setelah bayar: ${formatCurrency(sisa)}`;
      el.style.color = sisa === 0 ? '#27ae60' : '#f39c12';
    }
  } else {
    el.textContent = '';
  }
}

function closePayModal() {
  document.getElementById('paymentModal').style.display = 'none';
}

async function processPay() {
  const receivableId = parseInt(document.getElementById('payReceivableId').value);
  const amount       = parseFloat(document.getElementById('payAmount').value);
  const remaining    = parseFloat(document.getElementById('payAmount').dataset.remaining) || 0;

  if (!amount || amount <= 0) { showToast('Masukkan jumlah pembayaran', 'error'); return; }
  if (amount > remaining)     { showToast('Jumlah melebihi sisa piutang', 'error'); return; }

  const paymentData = {
    amount,
    payment_method: document.getElementById('payMethod').value,
    notes:          document.getElementById('payNotes').value.trim()
  };

  const btn = document.getElementById('btnProcessPay');
  btn.disabled    = true;
  btn.textContent = 'Memproses...';

  try {
    await apiClient.post(`/receivables/${receivableId}/pay`, paymentData);
    showToast('Pembayaran berhasil dicatat', 'success');
    closePayModal();
    loadSummary();
    loadDetail();
  } catch (error) {
    console.error('processPay error:', error);
    showToast(error.message || 'Gagal memproses pembayaran', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = '✓ Proses Pembayaran';
  }
}

// ============================================
// UTILITY
// ============================================

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(message, type = 'info') {
  const existing = document.getElementById('web-toast');
  if (existing) existing.remove();
  const colors = { success: '#059669', error: '#dc2626', warning: '#d97706', info: '#2563eb' };
  const toast  = document.createElement('div');
  toast.id = 'web-toast';
  toast.style.cssText = `position:fixed;bottom:24px;right:24px;background:${colors[type] || colors.info};color:#fff;
    padding:12px 18px;border-radius:8px;font-size:14px;z-index:9999;
    box-shadow:0 4px 12px rgba(0,0,0,.2);max-width:320px`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
