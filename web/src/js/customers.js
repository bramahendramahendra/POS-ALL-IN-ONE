'use strict';

// ============================================
// STATE
// ============================================

let currentUser    = null;
let deleteTargetId = null;

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  requireRole('owner', 'admin');

  currentUser = getCurrentUser();

  const navNameEl = document.getElementById('navUsername');
  const navRoleEl = document.getElementById('navUserRole');
  if (navNameEl && currentUser) navNameEl.textContent = currentUser.full_name || currentUser.username;
  if (navRoleEl && currentUser) navRoleEl.textContent = currentUser.role;

  document.getElementById('btn-logout-nav').addEventListener('click', logout);

  setupEventListeners();
  loadCustomers();
});

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  document.getElementById('btnAddCustomer').addEventListener('click', openAddModal);
  document.getElementById('btnFilter').addEventListener('click', loadCustomers);
  document.getElementById('searchCustomer').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadCustomers();
  });

  document.getElementById('closeCustomerModal').addEventListener('click', closeCustomerModal);
  document.getElementById('btnCancelCustomer').addEventListener('click', closeCustomerModal);
  document.getElementById('customerForm').addEventListener('submit', saveCustomer);

  document.getElementById('closeDeleteCustomerModal').addEventListener('click', closeDeleteModal);
  document.getElementById('btnCancelDelete').addEventListener('click', closeDeleteModal);
  document.getElementById('btnConfirmDelete').addEventListener('click', confirmDelete);

  document.addEventListener('click', (e) => {
    if (e.target === document.getElementById('customerModal'))       closeCustomerModal();
    if (e.target === document.getElementById('deleteCustomerModal')) closeDeleteModal();
  });
}

// ============================================
// LOAD & RENDER
// ============================================

async function loadCustomers() {
  const search    = document.getElementById('searchCustomer').value.trim();
  const is_active = document.getElementById('filterStatus').value;

  try {
    const params = {};
    if (search)       params.search    = search;
    if (is_active !== '') params.is_active = parseInt(is_active);

    const result    = await apiClient.get('/customers', params);
    const customers = result.items || result.customers || (Array.isArray(result) ? result : []);
    renderTable(customers);
  } catch (error) {
    console.error('loadCustomers error:', error);
    showToast('Gagal memuat data pelanggan', 'error');
  }
}

function renderTable(customers) {
  const tbody = document.getElementById('customerTableBody');

  if (!customers.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Belum ada data pelanggan</td></tr>';
    return;
  }

  tbody.innerHTML = customers.map(c => {
    const statusBadge = c.is_active
      ? '<span class="badge badge-success">Aktif</span>'
      : '<span class="badge badge-danger">Nonaktif</span>';
    const limitDisplay = (c.credit_limit || 0) > 0
      ? formatCurrency(c.credit_limit)
      : '<span class="text-muted">Tak terbatas</span>';
    const outstandingDisplay = (c.outstanding || 0) > 0
      ? `<span style="color:#e74c3c;font-weight:600;">${formatCurrency(c.outstanding)}</span>`
      : '<span class="text-muted">0</span>';

    return `
      <tr>
        <td><code>${escapeHtml(c.customer_code)}</code></td>
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td>${escapeHtml(c.phone || '-')}</td>
        <td>${escapeHtml(c.address || '-')}</td>
        <td>${limitDisplay}</td>
        <td>${outstandingDisplay}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="openEditModal(${c.id})">Edit</button>
          <button class="btn btn-sm ${c.is_active ? 'btn-warning' : 'btn-success'}" onclick="toggleStatus(${c.id})">
            ${c.is_active ? 'Nonaktif' : 'Aktifkan'}
          </button>
          <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${c.id}, '${escapeHtml(c.name)}')">Hapus</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================
// MODAL ADD / EDIT
// ============================================

function openAddModal() {
  document.getElementById('customerModalTitle').textContent = 'Tambah Pelanggan';
  document.getElementById('customerId').value = '';
  document.getElementById('customerForm').reset();
  generateCustomerCode();
  document.getElementById('customerModal').style.display = 'flex';
}

async function openEditModal(id) {
  try {
    const result = await apiClient.get(`/customers/${id}`);
    const c      = result.customer || result;

    document.getElementById('customerModalTitle').textContent = 'Edit Pelanggan';
    document.getElementById('customerId').value           = c.id;
    document.getElementById('customerCode').value         = c.customer_code;
    document.getElementById('customerName').value         = c.name;
    document.getElementById('customerPhone').value        = c.phone || '';
    document.getElementById('customerAddress').value      = c.address || '';
    document.getElementById('customerCreditLimit').value  = c.credit_limit || 0;
    document.getElementById('customerNotes').value        = c.notes || '';
    document.getElementById('customerModal').style.display = 'flex';
  } catch (error) {
    console.error('openEditModal error:', error);
    showToast('Gagal memuat data pelanggan', 'error');
  }
}

function closeCustomerModal() {
  document.getElementById('customerModal').style.display = 'none';
}

async function generateCustomerCode() {
  try {
    const result    = await apiClient.get('/customers');
    const customers = result.items || result.customers || (Array.isArray(result) ? result : []);
    const count     = customers.length + 1;
    document.getElementById('customerCode').value = `PLG-${String(count).padStart(3, '0')}`;
  } catch (e) {
    document.getElementById('customerCode').value = 'PLG-001';
  }
}

async function saveCustomer(e) {
  e.preventDefault();

  const id   = document.getElementById('customerId').value;
  const data = {
    customer_code: document.getElementById('customerCode').value.trim(),
    name:          document.getElementById('customerName').value.trim(),
    phone:         document.getElementById('customerPhone').value.trim(),
    address:       document.getElementById('customerAddress').value.trim(),
    credit_limit:  parseFloat(document.getElementById('customerCreditLimit').value) || 0,
    notes:         document.getElementById('customerNotes').value.trim()
  };

  if (!data.customer_code || !data.name) {
    showToast('Kode dan nama pelanggan wajib diisi', 'error');
    return;
  }

  const btn = document.getElementById('btnSaveCustomer');
  btn.disabled    = true;
  btn.textContent = 'Menyimpan...';

  try {
    if (id) {
      await apiClient.put(`/customers/${parseInt(id)}`, data);
    } else {
      await apiClient.post('/customers', data);
    }
    showToast(id ? 'Pelanggan berhasil diupdate' : 'Pelanggan berhasil ditambahkan', 'success');
    closeCustomerModal();
    loadCustomers();
  } catch (error) {
    console.error('saveCustomer error:', error);
    showToast(error.message || 'Gagal menyimpan pelanggan', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Simpan';
  }
}

// ============================================
// TOGGLE STATUS
// ============================================

async function toggleStatus(id) {
  try {
    await apiClient.patch(`/customers/${id}/toggle-status`);
    showToast('Status pelanggan berhasil diubah', 'success');
    loadCustomers();
  } catch (error) {
    console.error('toggleStatus error:', error);
    showToast('Gagal mengubah status', 'error');
  }
}

// ============================================
// DELETE
// ============================================

function openDeleteModal(id, name) {
  deleteTargetId = id;
  document.getElementById('deleteCustomerName').textContent = name;
  document.getElementById('deleteCustomerModal').style.display = 'flex';
}

function closeDeleteModal() {
  document.getElementById('deleteCustomerModal').style.display = 'none';
  deleteTargetId = null;
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  try {
    await apiClient.delete(`/customers/${deleteTargetId}`);
    showToast('Pelanggan berhasil dihapus', 'success');
    closeDeleteModal();
    loadCustomers();
  } catch (error) {
    console.error('confirmDelete error:', error);
    showToast(error.message || 'Gagal menghapus pelanggan', 'error');
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
