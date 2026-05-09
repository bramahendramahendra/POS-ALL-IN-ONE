'use strict';

// ============================================
// STATE
// ============================================

const { apiClient } = window;

let currentUser      = null;
let allSuppliers     = [];
let editingSupplierId = null;

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  requireRole('owner', 'admin');

  currentUser = getCurrentUser();

  const navNameEl = document.getElementById('navUsername');
  const navRoleEl = document.getElementById('navUserRole');
  if (navNameEl && currentUser) navNameEl.textContent = currentUser.full_name || currentUser.username;
  if (navRoleEl && currentUser) navRoleEl.textContent = currentUser.role;

  document.getElementById('btn-logout-nav').addEventListener('click', logout);

  setupTabBar();
  setupEventListeners();
  await loadSuppliers();
});

// ============================================
// TAB BAR
// ============================================

function setupTabBar() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
    });
  });
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Supplier tab
  document.getElementById('btnAddSupplier').addEventListener('click', openAddModal);
  document.getElementById('closeSupplierModal').addEventListener('click', closeSupplierModal);
  document.getElementById('btnCancelSupplier').addEventListener('click', closeSupplierModal);
  document.getElementById('supplierForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);
  document.getElementById('btnCloseDetail').addEventListener('click', closeDetailModal);
  document.getElementById('searchInput').addEventListener('input', handleFilter);
  document.getElementById('filterStatus').addEventListener('change', handleFilter);
  document.getElementById('btnApplyFilter').addEventListener('click', loadSuppliers);
  document.getElementById('btnResetFilter').addEventListener('click', resetFilter);

  // Retur tab
  document.getElementById('btnReturFilter').addEventListener('click', loadRetur);
  document.getElementById('btnReturReset').addEventListener('click', resetReturFilter);
  document.getElementById('closeReturDetailModal').addEventListener('click', closeReturDetailModal);
  document.getElementById('btnCloseReturDetail').addEventListener('click', closeReturDetailModal);

  window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('supplierModal')) closeSupplierModal();
    if (e.target === document.getElementById('supplierDetailModal')) closeDetailModal();
    if (e.target === document.getElementById('returDetailModal')) closeReturDetailModal();
  });
}

// ============================================
// LOAD & RENDER — SUPPLIER
// ============================================

async function loadSuppliers() {
  try {
    const result = await apiClient.get('/suppliers', {
      search: document.getElementById('searchInput').value.trim() || undefined,
      is_active: document.getElementById('filterStatus').value !== ''
        ? document.getElementById('filterStatus').value
        : undefined
    });

    if (result.success) {
      allSuppliers = result.suppliers;
      renderSuppliersTable(allSuppliers);
      updateStats(allSuppliers);
    } else {
      showToast('Gagal memuat data supplier', 'error');
    }
  } catch (error) {
    console.error('loadSuppliers error:', error);
    showToast('Terjadi kesalahan saat memuat data', 'error');
  }
}

function renderSuppliersTable(suppliers) {
  const tbody = document.getElementById('suppliersTableBody');

  if (suppliers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data supplier</td></tr>';
    return;
  }

  tbody.innerHTML = suppliers.map(s => `
    <tr>
      <td><code>${escapeHtml(s.supplier_code)}</code></td>
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td>${escapeHtml(s.contact_person || '-')}</td>
      <td>${escapeHtml(s.phone || '-')}</td>
      <td>${escapeHtml(s.email || '-')}</td>
      <td>
        <span class="badge ${s.is_active ? 'badge-success' : 'badge-danger'}">
          ${s.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      </td>
      <td class="action-buttons">
        <button class="btn-icon" onclick="openDetailModal(${s.id})" title="Detail">👁️</button>
        <button class="btn-icon" onclick="editSupplier(${s.id})" title="Edit">✏️</button>
        <button class="btn-icon" onclick="toggleSupplierStatus(${s.id}, ${s.is_active})"
          title="${s.is_active ? 'Nonaktifkan' : 'Aktifkan'}">
          ${s.is_active ? '🔓' : '🔒'}
        </button>
        <button class="btn-icon" onclick="confirmDeleteSupplier(${s.id}, '${escapeHtml(s.name)}')" title="Hapus">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function updateStats(suppliers) {
  const active = suppliers.filter(s => s.is_active === 1 || s.is_active === true).length;
  document.getElementById('statTotal').textContent    = suppliers.length;
  document.getElementById('statActive').textContent   = active;
  document.getElementById('statInactive').textContent = suppliers.length - active;
}

// ============================================
// FILTER & SEARCH
// ============================================

function handleFilter() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;

  let filtered = allSuppliers;

  if (search) {
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(search) ||
      s.supplier_code.toLowerCase().includes(search) ||
      (s.phone && s.phone.toLowerCase().includes(search)) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(search))
    );
  }

  if (status !== '') {
    filtered = filtered.filter(s => String(s.is_active) === status || s.is_active === parseInt(status));
  }

  renderSuppliersTable(filtered);
  updateStats(filtered);
}

function resetFilter() {
  document.getElementById('searchInput').value   = '';
  document.getElementById('filterStatus').value  = '';
  renderSuppliersTable(allSuppliers);
  updateStats(allSuppliers);
}

// ============================================
// MODAL ADD / EDIT
// ============================================

function openAddModal() {
  editingSupplierId = null;
  document.getElementById('supplierModalTitle').textContent     = 'Tambah Supplier';
  document.getElementById('supplierForm').reset();
  document.getElementById('supplierCode').value                 = '';
  document.getElementById('supplierFormError').classList.add('hidden');
  document.getElementById('btnSubmitSupplierText').textContent  = 'Simpan';
  document.getElementById('btnSubmitSupplier').disabled         = false;
  document.getElementById('supplierModal').style.display        = 'flex';
  setTimeout(() => document.getElementById('supplierName').focus(), 100);
}

async function editSupplier(id) {
  try {
    const result = await apiClient.get(`/suppliers/${id}`);
    if (!result.success) { showToast('Gagal memuat data supplier', 'error'); return; }

    const s = result.supplier;
    editingSupplierId = id;

    document.getElementById('supplierModalTitle').textContent    = 'Edit Supplier';
    document.getElementById('supplierId').value                  = s.id;
    document.getElementById('supplierCode').value                = s.supplier_code;
    document.getElementById('supplierName').value                = s.name;
    document.getElementById('supplierPhone').value               = s.phone || '';
    document.getElementById('supplierEmail').value               = s.email || '';
    document.getElementById('supplierContact').value             = s.contact_person || '';
    document.getElementById('supplierAddress').value             = s.address || '';
    document.getElementById('supplierNotes').value               = s.notes || '';
    document.getElementById('supplierFormError').classList.add('hidden');
    document.getElementById('btnSubmitSupplierText').textContent = 'Update';
    document.getElementById('btnSubmitSupplier').disabled        = false;
    document.getElementById('supplierModal').style.display       = 'flex';
    setTimeout(() => document.getElementById('supplierName').focus(), 100);
  } catch (error) {
    console.error('editSupplier error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function closeSupplierModal() {
  document.getElementById('supplierModal').style.display = 'none';
  document.getElementById('supplierForm').reset();
  document.getElementById('btnSubmitSupplier').disabled        = false;
  document.getElementById('btnSubmitSupplierText').textContent = 'Simpan';
  editingSupplierId = null;
}

// ============================================
// FORM SUBMIT
// ============================================

async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = {
    name:           document.getElementById('supplierName').value.trim(),
    phone:          document.getElementById('supplierPhone').value.trim(),
    email:          document.getElementById('supplierEmail').value.trim(),
    contact_person: document.getElementById('supplierContact').value.trim(),
    address:        document.getElementById('supplierAddress').value.trim(),
    notes:          document.getElementById('supplierNotes').value.trim()
  };

  const validation = validateSupplierForm(formData);
  if (!validation.valid) { showSupplierFormError(validation.message); return; }

  const actionText = editingSupplierId ? 'mengupdate' : 'menambahkan';
  showConfirm(
    'Konfirmasi Simpan',
    `Yakin ingin ${actionText} supplier "${formData.name}"?`,
    async () => { await saveSupplier(formData); }
  );
}

async function saveSupplier(formData) {
  const btn     = document.getElementById('btnSubmitSupplier');
  const btnText = document.getElementById('btnSubmitSupplierText');
  const origText = btnText.textContent;

  btn.disabled      = true;
  btnText.textContent = 'Menyimpan...';

  try {
    const result = editingSupplierId
      ? await apiClient.put(`/suppliers/${editingSupplierId}`, formData)
      : await apiClient.post('/suppliers', formData);

    if (result.success) {
      closeSupplierModal();
      await loadSuppliers();
      showToast(
        editingSupplierId
          ? 'Supplier berhasil diupdate'
          : `Supplier berhasil ditambahkan (${result.supplier_code})`,
        'success'
      );
    } else {
      showSupplierFormError(result.message || 'Gagal menyimpan supplier');
      btn.disabled        = false;
      btnText.textContent = origText;
    }
  } catch (error) {
    console.error('saveSupplier error:', error);
    showSupplierFormError('Terjadi kesalahan saat menyimpan');
    btn.disabled        = false;
    btnText.textContent = origText;
  }
}

function validateSupplierForm(data) {
  if (!data.name)             return { valid: false, message: 'Nama supplier harus diisi' };
  if (data.name.length < 2)   return { valid: false, message: 'Nama supplier minimal 2 karakter' };
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { valid: false, message: 'Format email tidak valid' };
  }
  return { valid: true };
}

function showSupplierFormError(message) {
  const el = document.getElementById('supplierFormError');
  el.textContent = message;
  el.classList.remove('hidden');
}

// ============================================
// TOGGLE STATUS
// ============================================

async function toggleSupplierStatus(id, currentStatus) {
  try {
    const result = await apiClient.patch(`/suppliers/${id}/toggle-status`);
    if (result.success) {
      await loadSuppliers();
      showToast(`Supplier berhasil ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}`, 'success');
    } else {
      showToast('Gagal mengubah status supplier', 'error');
    }
  } catch (error) {
    console.error('toggleSupplierStatus error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

// ============================================
// DELETE
// ============================================

function confirmDeleteSupplier(id, name) {
  showConfirm(
    'Konfirmasi Hapus',
    `Yakin ingin menghapus supplier "${name}"? Supplier yang sudah digunakan di pembelian tidak dapat dihapus.`,
    async () => { await deleteSupplier(id); }
  );
}

async function deleteSupplier(id) {
  try {
    const result = await apiClient.delete(`/suppliers/${id}`);
    if (result.success) {
      await loadSuppliers();
      showToast('Supplier berhasil dihapus', 'success');
    } else {
      showToast(result.message || 'Gagal menghapus supplier', 'error');
    }
  } catch (error) {
    console.error('deleteSupplier error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

// ============================================
// DETAIL MODAL
// ============================================

async function openDetailModal(id) {
  try {
    document.getElementById('detailPurchaseBody').innerHTML =
      '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
    document.getElementById('supplierDetailModal').style.display = 'flex';

    const result = await apiClient.get(`/suppliers/${id}`);
    if (!result.success) {
      showToast('Gagal memuat detail supplier', 'error');
      closeDetailModal();
      return;
    }

    const { supplier, purchases, total_debt, stats } = result;
    document.getElementById('detailModalTitle').textContent = `Detail: ${supplier.name}`;

    document.getElementById('detailInfoSection').innerHTML = `
      <h3 class="detail-section-title">Informasi Supplier</h3>
      <div class="detail-info-grid">
        <div class="detail-item">
          <span class="detail-field-label">KODE SUPPLIER</span>
          <span><code>${escapeHtml(supplier.supplier_code)}</code></span>
        </div>
        <div class="detail-item">
          <span class="detail-field-label">NAMA</span>
          <span><strong>${escapeHtml(supplier.name)}</strong></span>
        </div>
        <div class="detail-item">
          <span class="detail-field-label">KONTAK PERSON</span>
          <span>${escapeHtml(supplier.contact_person || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-field-label">TELEPON</span>
          <span>${escapeHtml(supplier.phone || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-field-label">EMAIL</span>
          <span>${escapeHtml(supplier.email || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-field-label">STATUS</span>
          <span>
            <span class="badge ${supplier.is_active ? 'badge-success' : 'badge-danger'}">
              ${supplier.is_active ? 'Aktif' : 'Nonaktif'}
            </span>
          </span>
        </div>
        <div class="detail-item detail-item-full">
          <span class="detail-field-label">ALAMAT</span>
          <span>${escapeHtml(supplier.address || '-')}</span>
        </div>
        ${supplier.notes ? `
        <div class="detail-item detail-item-full">
          <span class="detail-field-label">KETERANGAN</span>
          <span>${escapeHtml(supplier.notes)}</span>
        </div>` : ''}
      </div>
    `;

    document.getElementById('detailDebtSection').innerHTML = `
      <div class="debt-summary-grid">
        <div class="debt-stat-card">
          <div class="debt-stat-label">TOTAL PEMBELIAN</div>
          <div class="debt-stat-value">${stats ? stats.total_purchases : 0}x</div>
          <div class="debt-stat-sub">${formatCurrency(stats ? stats.total_amount : 0)}</div>
        </div>
        <div class="debt-stat-card ${total_debt > 0 ? 'debt-stat-card--has-debt' : 'debt-stat-card--no-debt'}">
          <div class="debt-stat-label">TOTAL HUTANG BELUM LUNAS</div>
          <div class="debt-stat-value ${total_debt > 0 ? 'text-danger' : 'text-success'}">
            ${formatCurrency(total_debt)}
          </div>
          <div class="debt-stat-note">${total_debt > 0 ? 'Masih ada hutang' : 'Semua lunas'}</div>
        </div>
      </div>
    `;

    renderDetailPurchases(purchases);
  } catch (error) {
    console.error('openDetailModal error:', error);
    showToast('Terjadi kesalahan', 'error');
    closeDetailModal();
  }
}

function renderDetailPurchases(purchases) {
  const tbody = document.getElementById('detailPurchaseBody');

  if (!purchases || purchases.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada riwayat pembelian dari supplier ini</td></tr>';
    return;
  }

  tbody.innerHTML = purchases.map(p => `
    <tr>
      <td><code>${escapeHtml(p.purchase_code)}</code></td>
      <td>${formatDateOnly(p.purchase_date)}</td>
      <td><strong>${formatCurrency(p.total_amount)}</strong></td>
      <td><span class="text-success">${formatCurrency(p.paid_amount)}</span></td>
      <td>
        ${p.remaining_amount > 0
          ? `<strong class="text-danger">${formatCurrency(p.remaining_amount)}</strong>`
          : '<span class="text-muted">-</span>'}
      </td>
      <td>
        <span class="badge ${getPaymentStatusClass(p.payment_status)}">
          ${getPaymentStatusLabel(p.payment_status)}
        </span>
      </td>
    </tr>
  `).join('');
}

function getPaymentStatusClass(status) {
  if (status === 'paid')    return 'badge-success';
  if (status === 'partial') return 'badge-warning';
  return 'badge-danger';
}

function getPaymentStatusLabel(status) {
  if (status === 'paid')    return 'Lunas';
  if (status === 'partial') return 'Sebagian';
  return 'Belum Bayar';
}

function closeDetailModal() {
  document.getElementById('supplierDetailModal').style.display = 'none';
}

// ============================================
// RETUR SUPPLIER
// ============================================

async function loadRetur() {
  const search   = document.getElementById('returSearch').value.trim();
  const dateFrom = document.getElementById('returDateFrom').value;
  const dateTo   = document.getElementById('returDateTo').value;
  const tbody    = document.getElementById('returTableBody');

  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Memuat data...</td></tr>';

  try {
    const params = {};
    if (search)   params.search    = search;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo)   params.date_to   = dateTo;

    const result = await apiClient.get('/supplier-returns', params);

    if (!result.success) {
      showToast('Gagal memuat data retur', 'error');
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Gagal memuat data</td></tr>';
      return;
    }

    const returns = result.returns || [];
    renderReturTable(returns);
    updateReturStats(returns);
  } catch (error) {
    console.error('loadRetur error:', error);
    showToast('Terjadi kesalahan saat memuat data retur', 'error');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Terjadi kesalahan</td></tr>';
  }
}

function renderReturTable(returns) {
  const tbody = document.getElementById('returTableBody');

  if (returns.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data retur</td></tr>';
    return;
  }

  tbody.innerHTML = returns.map(r => `
    <tr>
      <td><code>${escapeHtml(r.return_code)}</code></td>
      <td>${formatDateOnly(r.return_date)}</td>
      <td>${escapeHtml(r.supplier_name || '-')}</td>
      <td><code>${escapeHtml(r.purchase_code || '-')}</code></td>
      <td><strong class="text-danger">${formatCurrency(r.total_amount)}</strong></td>
      <td>${escapeHtml(r.reason || '-')}</td>
      <td>
        <button class="btn-icon" onclick="openReturDetail(${r.id})" title="Detail">👁️</button>
      </td>
    </tr>
  `).join('');
}

function updateReturStats(returns) {
  const total = returns.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  document.getElementById('returStatTotal').textContent = returns.length;
  document.getElementById('returStatValue').textContent = formatCurrency(total);
}

function resetReturFilter() {
  document.getElementById('returSearch').value  = '';
  document.getElementById('returDateFrom').value = '';
  document.getElementById('returDateTo').value   = '';
  document.getElementById('returTableBody').innerHTML =
    '<tr><td colspan="7" class="text-center">Gunakan filter untuk menampilkan data retur</td></tr>';
  document.getElementById('returStatTotal').textContent = '0';
  document.getElementById('returStatValue').textContent = 'Rp 0';
}

async function openReturDetail(id) {
  try {
    document.getElementById('returDetailBody').innerHTML = '<p class="text-center">Memuat...</p>';
    document.getElementById('returDetailModal').style.display = 'flex';

    const result = await apiClient.get(`/supplier-returns/${id}`);
    if (!result.success) {
      showToast('Gagal memuat detail retur', 'error');
      closeReturDetailModal();
      return;
    }

    const r = result.return || result;
    document.getElementById('returDetailTitle').textContent = `Detail Retur: ${r.return_code || ''}`;

    const items = r.items || [];
    document.getElementById('returDetailBody').innerHTML = `
      <div class="detail-info-grid" style="margin-bottom:14px;">
        <div class="detail-item">
          <span class="detail-field-label">KODE RETUR</span>
          <span><code>${escapeHtml(r.return_code || '-')}</code></span>
        </div>
        <div class="detail-item">
          <span class="detail-field-label">TANGGAL</span>
          <span>${formatDateOnly(r.return_date)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-field-label">SUPPLIER</span>
          <span>${escapeHtml(r.supplier_name || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-field-label">KODE PO</span>
          <span><code>${escapeHtml(r.purchase_code || '-')}</code></span>
        </div>
        <div class="detail-item detail-item-full">
          <span class="detail-field-label">ALASAN</span>
          <span>${escapeHtml(r.reason || '-')}</span>
        </div>
      </div>
      ${items.length > 0 ? `
      <h3 class="detail-section-title">Item Retur</h3>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${escapeHtml(item.product_name || '-')}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td><strong>${formatCurrency(item.subtotal)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      <div style="text-align:right;margin-top:12px;font-size:15px;font-weight:700;">
        Total: <span class="text-danger">${formatCurrency(r.total_amount)}</span>
      </div>
    `;
  } catch (error) {
    console.error('openReturDetail error:', error);
    showToast('Terjadi kesalahan', 'error');
    closeReturDetailModal();
  }
}

function closeReturDetailModal() {
  document.getElementById('returDetailModal').style.display = 'none';
}

// ============================================
// HELPERS
// ============================================

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return 'Rp ' + num.toLocaleString('id-ID');
}

function formatDateOnly(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
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

function showConfirm(title, message, onConfirm) {
  if (window.confirm(`${title}\n\n${message}`)) {
    onConfirm();
  }
}
