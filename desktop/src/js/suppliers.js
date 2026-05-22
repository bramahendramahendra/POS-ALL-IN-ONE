// ============================================
// SUPPLIER MANAGEMENT
// src/js/suppliers.js
// ============================================


let currentUser = null;
let allSuppliers = [];
let editingSupplierId = null;

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Suppliers page loaded');

  if (!initializePageLayout('supplier')) return;

  currentUser = getCurrentUser();

  if (currentUser.role === 'kasir') {
    showToast('Anda tidak memiliki akses ke halaman ini', 'error');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
    return;
  }

  setupEventListeners();
  await loadSuppliers();
  await loadProducts();
  await loadReturnSupplierFilter();
});

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

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

  // Purchases tab
  document.getElementById('btnAddPurchase').addEventListener('click', openAddPurchaseModal);
  document.getElementById('btnApplyPurchaseFilter').addEventListener('click', loadPurchases);
  document.getElementById('closePurchaseModal').addEventListener('click', closePurchaseModal);
  document.getElementById('btnCancelPurchase').addEventListener('click', closePurchaseModal);
  document.getElementById('purchaseForm').addEventListener('submit', handlePurchaseFormSubmit);
  document.getElementById('btnAddPurchaseItem').addEventListener('click', openAddItemModal);
  document.getElementById('closeAddItemModal').addEventListener('click', closeAddItemModal);
  document.getElementById('btnCancelAddItem').addEventListener('click', closeAddItemModal);
  document.getElementById('addPurchaseItemForm').addEventListener('submit', handleAddPurchaseItem);
  document.getElementById('itemProduct').addEventListener('change', handleProductSelect);
  document.getElementById('itemQuantity').addEventListener('input', calculateItemSubtotal);
  setupRupiahInput('itemPurchasePrice');
  document.getElementById('itemPurchasePrice').addEventListener('input', calculateItemSubtotal);
  setupRupiahInput('paidAmount');
  setupRupiahInput('payAmount');
  document.getElementById('paymentStatus').addEventListener('change', handlePaymentStatusChange);
  document.getElementById('paidAmount').addEventListener('input', calculateRemainingAmount);
  document.getElementById('closePayPurchaseModal').addEventListener('click', closePayPurchaseModal);
  document.getElementById('btnCancelPay').addEventListener('click', closePayPurchaseModal);
  document.getElementById('payPurchaseForm').addEventListener('submit', handlePayPurchase);
  document.getElementById('payAmount').addEventListener('input', calculatePayAfter);
  document.getElementById('closeDetailPurchaseModal').addEventListener('click', closeDetailPurchaseModal);
  document.getElementById('btnCloseDetailPurchase').addEventListener('click', closeDetailPurchaseModal);

  // Returns tab
  document.getElementById('btnAddReturn').addEventListener('click', openAddReturnModal);
  document.getElementById('btnApplyReturnFilter').addEventListener('click', loadReturns);
  document.getElementById('closeReturnModal').addEventListener('click', closeReturnModal);
  document.getElementById('btnCancelReturn').addEventListener('click', closeReturnModal);
  document.getElementById('returnForm').addEventListener('submit', handleReturnFormSubmit);
  document.getElementById('returnPurchaseId').addEventListener('change', handleReturnPurchaseChange);
  document.getElementById('closeDetailReturnModal').addEventListener('click', closeDetailReturnModal);
  document.getElementById('btnCloseDetailReturn').addEventListener('click', closeDetailReturnModal);
  document.getElementById('btnApproveReturn').addEventListener('click', () => updateReturnStatus('approved'));
  document.getElementById('btnRejectReturn').addEventListener('click', () => updateReturnStatus('rejected'));

  window.addEventListener('click', (e) => {
    const modals = ['supplierModal', 'supplierDetailModal', 'purchaseModal', 'addPurchaseItemModal', 'payPurchaseModal', 'detailPurchaseModal', 'returnModal', 'detailReturnModal'];
    modals.forEach(id => {
      const modal = document.getElementById(id);
      if (e.target === modal) modal.style.display = 'none';
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');

  if (tabName === 'purchases') {
    loadPurchases();
  } else if (tabName === 'supplier-returns') {
    loadReturnSupplierFilter();
    loadReturns();
  }
}

// ============================================
// LOAD & RENDER
// ============================================

async function loadSuppliers() {
  try {
    const filters = {
      search: document.getElementById('searchInput').value.trim(),
      status: document.getElementById('filterStatus').value
    };

    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.status !== '') params.is_active = filters.status;

    const result = await apiClient.get('/suppliers', params);

    if (result.success) {
      allSuppliers = result.data.items ?? result.data ?? [];
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
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">Tidak ada data supplier</td>
      </tr>
    `;
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
        <button class="btn-icon" onclick="openDetailModal(${s.id})" title="Detail">
          👁️
        </button>
        <button class="btn-icon" onclick="editSupplier(${s.id})" title="Edit">
          ✏️
        </button>
        <button
          class="btn-icon"
          onclick="toggleSupplierStatus(${s.id}, ${s.is_active})"
          title="${s.is_active ? 'Nonaktifkan' : 'Aktifkan'}"
        >
          ${s.is_active ? '🔓' : '🔒'}
        </button>
        <button
          class="btn-icon"
          onclick="confirmDeleteSupplier(${s.id})"
          data-name="${escapeHtml(s.name)}"
          title="Hapus"
        >
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

function updateStats(suppliers) {
  const active = suppliers.filter(s => !!s.is_active).length;
  document.getElementById('statTotal').textContent = suppliers.length;
  document.getElementById('statActive').textContent = active;
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
    filtered = filtered.filter(s => s.is_active == parseInt(status));
  }

  renderSuppliersTable(filtered);
  updateStats(filtered);
}

function resetFilter() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterStatus').value = '';
  renderSuppliersTable(allSuppliers);
  updateStats(allSuppliers);
}

// ============================================
// MODAL ADD / EDIT
// ============================================

function openAddModal() {
  editingSupplierId = null;

  document.getElementById('supplierModalTitle').textContent = 'Tambah Supplier';
  document.getElementById('supplierForm').reset();
  document.getElementById('supplierCode').value = '';
  document.getElementById('supplierFormError').style.display = 'none';
  document.getElementById('btnSubmitSupplierText').textContent = 'Simpan';
  document.getElementById('btnSubmitSupplier').disabled = false;

  document.getElementById('supplierModal').style.display = 'flex';
  setTimeout(() => { document.getElementById('supplierName').focus(); }, 100);
}

async function editSupplier(id) {
  try {
    const result = await apiClient.get(`/suppliers/${id}`);

    if (!result.success) {
      showToast('Gagal memuat data supplier', 'error');
      return;
    }

    const s = result.data;
    editingSupplierId = id;

    document.getElementById('supplierModalTitle').textContent = 'Edit Supplier';
    document.getElementById('supplierId').value = s.id;
    document.getElementById('supplierCode').value = s.supplier_code;
    document.getElementById('supplierName').value = s.name;
    document.getElementById('supplierPhone').value = s.phone || '';
    document.getElementById('supplierEmail').value = s.email || '';
    document.getElementById('supplierContact').value = s.contact_person || '';
    document.getElementById('supplierAddress').value = s.address || '';
    document.getElementById('supplierNotes').value = s.notes || '';
    document.getElementById('supplierFormError').style.display = 'none';
    document.getElementById('btnSubmitSupplierText').textContent = 'Update';
    document.getElementById('btnSubmitSupplier').disabled = false;

    document.getElementById('supplierModal').style.display = 'flex';
    setTimeout(() => { document.getElementById('supplierName').focus(); }, 100);
  } catch (error) {
    console.error('editSupplier error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function closeSupplierModal() {
  document.getElementById('supplierModal').style.display = 'none';
  document.getElementById('supplierForm').reset();
  document.getElementById('btnSubmitSupplier').disabled = false;
  document.getElementById('btnSubmitSupplierText').textContent = 'Simpan';
  editingSupplierId = null;
}

// ============================================
// FORM SUBMIT
// ============================================

async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('supplierName').value.trim(),
    phone: document.getElementById('supplierPhone').value.trim(),
    email: document.getElementById('supplierEmail').value.trim(),
    contact_person: document.getElementById('supplierContact').value.trim(),
    address: document.getElementById('supplierAddress').value.trim(),
    notes: document.getElementById('supplierNotes').value.trim()
  };

  const validation = validateSupplierForm(formData);
  if (!validation.valid) {
    showSupplierFormError(validation.message);
    return;
  }

  const actionText = editingSupplierId ? 'mengupdate' : 'menambahkan';
  showConfirm(
    'Konfirmasi Simpan',
    `Yakin ingin ${actionText} supplier "${formData.name}"?`,
    async () => { await saveSupplier(formData); }
  );
}

async function saveSupplier(formData) {
  const btn = document.getElementById('btnSubmitSupplier');
  const btnText = document.getElementById('btnSubmitSupplierText');
  const originalText = btnText.textContent;

  btn.disabled = true;
  btnText.textContent = 'Menyimpan...';

  try {
    let result;
    if (editingSupplierId) {
      result = await apiClient.put(`/suppliers/${editingSupplierId}`, formData);
    } else {
      result = await apiClient.post('/suppliers', formData);
    }

    if (result.success) {
      closeSupplierModal();
      await loadSuppliers();
      showToast(
        editingSupplierId ? 'Supplier berhasil diupdate' : `Supplier berhasil ditambahkan (${result.data?.supplier_code ?? ''})`,
        'success'
      );
    } else {
      showSupplierFormError(result.message || 'Gagal menyimpan supplier');
      btn.disabled = false;
      btnText.textContent = originalText;
    }
  } catch (error) {
    console.error('saveSupplier error:', error);
    showSupplierFormError('Terjadi kesalahan saat menyimpan');
    btn.disabled = false;
    btnText.textContent = originalText;
  }
}

function validateSupplierForm(formData) {
  if (!formData.name) return { valid: false, message: 'Nama supplier harus diisi' };
  if (formData.name.length < 2) return { valid: false, message: 'Nama supplier minimal 2 karakter' };
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    return { valid: false, message: 'Format email tidak valid' };
  }
  return { valid: true };
}

function showSupplierFormError(message) {
  const el = document.getElementById('supplierFormError');
  el.textContent = message;
  el.style.display = 'block';
}

// ============================================
// TOGGLE STATUS
// ============================================

async function toggleSupplierStatus(id, currentStatus) {
  try {
    const result = await apiClient.patch(`/suppliers/${id}/toggle-status`);
    if (result.success) {
      await loadSuppliers();
      showToast(
        `Supplier berhasil ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}`,
        'success'
      );
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
  const displayName = name
    || document.querySelector(`[onclick="confirmDeleteSupplier(${id})"]`)?.dataset?.name
    || '';
  showConfirm(
    'Konfirmasi Hapus',
    `Yakin ingin menghapus supplier "${displayName}"? Supplier yang sudah digunakan di pembelian tidak dapat dihapus.`,
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

    const supplier = result.data;
    const purchases = supplier.purchase_history ?? [];
    const totalDebt = purchases.reduce((sum, p) => sum + (p.remaining_amount || 0), 0);
    const totalAmount = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);

    document.getElementById('detailModalTitle').textContent = `Detail: ${supplier.name}`;

    // Info supplier
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

    // Ringkasan & hutang
    document.getElementById('detailDebtSection').innerHTML = `
      <div class="debt-summary-grid">
        <div class="debt-stat-card">
          <div class="debt-stat-label">TOTAL PEMBELIAN</div>
          <div class="debt-stat-value">${purchases.length}x</div>
          <div class="debt-stat-sub">${formatCurrency(totalAmount)}</div>
        </div>
        <div class="debt-stat-card ${totalDebt > 0 ? 'debt-stat-card--has-debt' : 'debt-stat-card--no-debt'}">
          <div class="debt-stat-label">TOTAL HUTANG BELUM LUNAS</div>
          <div class="debt-stat-value ${totalDebt > 0 ? 'text-danger' : 'text-success'}">
            ${formatCurrency(totalDebt)}
          </div>
          <div class="debt-stat-note">${totalDebt > 0 ? 'Masih ada hutang' : 'Semua lunas'}</div>
        </div>
      </div>
    `;

    // Riwayat pembelian
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
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">Belum ada riwayat pembelian dari supplier ini</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = purchases.map(p => `
    <tr>
      <td><code>${escapeHtml(p.purchase_code)}</code></td>
      <td>${formatDateOnly(p.purchase_date)}</td>
      <td><strong>${formatCurrency(p.total_amount)}</strong></td>
      <td>
        <span class="badge ${getPaymentStatusClass(p.payment_status)}">
          ${getPaymentStatusLabel(p.payment_status)}
        </span>
      </td>
    </tr>
  `).join('');
}

function getPaymentStatusClass(status) {
  if (status === 'paid') return 'badge-success';
  if (status === 'partial') return 'badge-warning';
  return 'badge-danger';
}

function getPaymentStatusLabel(status) {
  if (status === 'paid') return 'Lunas';
  if (status === 'partial') return 'Sebagian';
  return 'Belum Bayar';
}

function closeDetailModal() {
  document.getElementById('supplierDetailModal').style.display = 'none';
}

// ============================================
// PURCHASES
// ============================================

let allPurchases = [];
let allProducts = [];
let purchaseItems = [];
let editingPurchaseId = null;

async function loadProducts() {
  try {
    const result = await apiClient.get('/products', { limit: 1000 });
    if (result.success) {
      const items = result.data.items ?? result.data;
      allProducts = items.filter(p => p.is_active === 1 || p.is_active === true);
      populateProductDropdown();
    }
  } catch (error) {
    console.error('Load products error:', error);
  }
}

function populateProductDropdown() {
  const select = document.getElementById('itemProduct');
  select.innerHTML = '<option value="">Pilih Produk</option>';
  allProducts.forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = `${product.name} (${product.barcode})`;
    option.dataset.unit = product.unit;
    option.dataset.purchasePrice = product.purchase_price;
    select.appendChild(option);
  });
}

function populateSupplierDropdown(selectedId = null) {
  const select = document.getElementById('supplierSelect');
  if (!select) return;
  const currentVal = selectedId !== null ? selectedId : select.value;
  select.innerHTML = '<option value="">-- Pilih Supplier (opsional) --</option>';
  allSuppliers.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `[${s.supplier_code}] ${s.name}`;
    if (String(s.id) === String(currentVal)) opt.selected = true;
    select.appendChild(opt);
  });
}

async function loadPurchases() {
  try {
    const filters = {
      startDate: document.getElementById('purchaseFilterStartDate').value,
      endDate: document.getElementById('purchaseFilterEndDate').value,
      paymentStatus: document.getElementById('purchaseFilterStatus').value
    };

    if (!filters.startDate || !filters.endDate) {
      const monthRange = getCurrentMonthRange();
      document.getElementById('purchaseFilterStartDate').value = monthRange.startDate;
      document.getElementById('purchaseFilterEndDate').value = monthRange.endDate;
      filters.startDate = monthRange.startDate;
      filters.endDate = monthRange.endDate;
    }

    const params = { start_date: filters.startDate, end_date: filters.endDate };
    if (filters.paymentStatus) params.payment_status = filters.paymentStatus;

    const result = await apiClient.get('/purchases', params);

    if (result.success) {
      allPurchases = result.data.items ?? result.data ?? [];
      renderPurchasesTable(allPurchases);
      updatePurchasesSummary(allPurchases);
    } else {
      showToast('Gagal memuat data pembelian', 'error');
    }
  } catch (error) {
    console.error('Load purchases error:', error);
    showToast('Terjadi kesalahan saat memuat data', 'error');
  }
}

function renderPurchasesTable(purchases) {
  const tbody = document.getElementById('purchasesTableBody');

  if (purchases.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data pembelian</td></tr>';
    return;
  }

  tbody.innerHTML = purchases.map(purchase => `
    <tr>
      <td><code>${escapeHtml(purchase.purchase_code)}</code></td>
      <td>${formatDateOnly(purchase.purchase_date)}</td>
      <td>🏭 ${escapeHtml(purchase.supplier_name || '-')}</td>
      <td><strong>${formatCurrency(purchase.total_amount)}</strong></td>
      <td>
        <span class="badge ${getPaymentStatusClass(purchase.payment_status)}">
          ${getPaymentStatusLabel(purchase.payment_status)}
        </span>
      </td>
      <td>
        ${purchase.remaining_amount > 0
          ? `<strong class="text-danger">${formatCurrency(purchase.remaining_amount)}</strong>`
          : '-'}
      </td>
      <td class="action-buttons">
        <button class="btn-icon" onclick="openDetailPurchase(${purchase.id})" title="Detail">👁️</button>
        ${purchase.payment_status !== 'paid' ? `
          <button class="btn-icon" onclick="openPayPurchaseModal(${purchase.id})" title="Bayar">💰</button>
        ` : ''}
        ${purchase.paid_amount === 0 ? `
          <button class="btn-icon" onclick="confirmDeletePurchase(${purchase.id}, '${escapeHtml(purchase.purchase_code)}')" title="Hapus">🗑️</button>
        ` : ''}
      </td>
    </tr>
  `).join('');
}

function updatePurchasesSummary(purchases) {
  const total = purchases.reduce((sum, p) => sum + p.total_amount, 0);
  const debt = purchases.reduce((sum, p) => sum + (p.remaining_amount || 0), 0);
  document.getElementById('purchasesTotal').textContent = formatCurrency(total);
  document.getElementById('purchasesDebt').textContent = formatCurrency(debt);
}

function openAddPurchaseModal() {
  editingPurchaseId = null;
  purchaseItems = [];
  document.getElementById('purchaseModalTitle').textContent = 'Tambah Pembelian';
  document.getElementById('purchaseForm').reset();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('purchaseDate').value = today;
  document.getElementById('purchaseCode').value = generatePurchaseCode();
  populateSupplierDropdown(null);
  document.getElementById('paymentStatus').value = 'unpaid';
  document.getElementById('paidAmount').value = '';
  document.getElementById('paidAmount').disabled = true;
  renderPurchaseItemsTable();
  updatePurchaseTotal();
  document.getElementById('purchaseFormError').style.display = 'none';
  document.getElementById('btnSubmitPurchaseText').textContent = 'Simpan';
  document.getElementById('purchaseModal').style.display = 'flex';
  setTimeout(() => { document.getElementById('purchaseDate').focus(); }, 100);
}

function closePurchaseModal() {
  document.getElementById('purchaseModal').style.display = 'none';
  editingPurchaseId = null;
  purchaseItems = [];
}

function renderPurchaseItemsTable() {
  const tbody = document.getElementById('purchaseItemsTableBody');
  if (purchaseItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada item. Klik "Tambah Item" untuk menambahkan.</td></tr>';
    return;
  }
  tbody.innerHTML = purchaseItems.map((item, index) => `
    <tr>
      <td>${escapeHtml(item.product_name)}</td>
      <td>${item.quantity}</td>
      <td>${item.unit}</td>
      <td>${formatCurrency(item.purchase_price)}</td>
      <td><strong>${formatCurrency(item.subtotal)}</strong></td>
      <td>
        <button class="btn-remove" onclick="removePurchaseItem(${index})" title="Hapus">❌</button>
      </td>
    </tr>
  `).join('');
}

function removePurchaseItem(index) {
  purchaseItems.splice(index, 1);
  renderPurchaseItemsTable();
  updatePurchaseTotal();
}

function updatePurchaseTotal() {
  const total = purchaseItems.reduce((sum, item) => sum + item.subtotal, 0);
  document.getElementById('purchaseTotalAmount').textContent = formatCurrency(total);
  calculateRemainingAmount();
}

function handlePaymentStatusChange() {
  const status = document.getElementById('paymentStatus').value;
  const paidAmountInput = document.getElementById('paidAmount');
  if (status === 'unpaid') {
    paidAmountInput.value = '';
    paidAmountInput.disabled = true;
  } else {
    paidAmountInput.disabled = false;
    if (status === 'paid') {
      const total = purchaseItems.reduce((sum, item) => sum + item.subtotal, 0);
      setRupiahInput('paidAmount', total);
    }
  }
  calculateRemainingAmount();
}

function calculateRemainingAmount() {
  const total = purchaseItems.reduce((sum, item) => sum + item.subtotal, 0);
  const paid = parseRupiahInput('paidAmount');
  document.getElementById('remainingAmount').value = formatCurrency(total - paid);
}

function openAddItemModal() {
  document.getElementById('addPurchaseItemForm').reset();
  document.getElementById('itemUnit').value = '';
  document.getElementById('itemSubtotal').value = 'Rp 0';
  document.getElementById('addPurchaseItemModal').style.display = 'flex';
  setTimeout(() => { document.getElementById('itemProduct').focus(); }, 100);
}

function closeAddItemModal() {
  document.getElementById('addPurchaseItemModal').style.display = 'none';
}

function handleProductSelect() {
  const select = document.getElementById('itemProduct');
  const selectedOption = select.options[select.selectedIndex];
  if (selectedOption.value) {
    document.getElementById('itemUnit').value = selectedOption.dataset.unit || 'pcs';
    setRupiahInput('itemPurchasePrice', selectedOption.dataset.purchasePrice || 0);
    calculateItemSubtotal();
  } else {
    document.getElementById('itemUnit').value = '';
    document.getElementById('itemPurchasePrice').value = '';
    document.getElementById('itemSubtotal').value = 'Rp 0';

  }
}

function calculateItemSubtotal() {
  const quantity = parseFloat(document.getElementById('itemQuantity').value) || 0;
  const price = parseRupiahInput('itemPurchasePrice');
  document.getElementById('itemSubtotal').value = formatCurrency(quantity * price);
}

async function handleAddPurchaseItem(e) {
  e.preventDefault();
  const productId = parseInt(document.getElementById('itemProduct').value);
  const quantity = parseFloat(document.getElementById('itemQuantity').value);
  const purchasePrice = parseRupiahInput('itemPurchasePrice');

  if (!productId || quantity <= 0 || purchasePrice < 0) {
    showToast('Isi semua field dengan benar', 'error');
    return;
  }

  const product = allProducts.find(p => p.id === productId);
  if (!product) { showToast('Produk tidak ditemukan', 'error'); return; }

  if (purchaseItems.find(item => item.product_id === productId)) {
    showToast('Produk sudah ada dalam daftar', 'error');
    return;
  }

  purchaseItems.push({
    product_id: productId,
    product_name: product.name,
    quantity,
    unit: product.unit,
    purchase_price: purchasePrice,
    subtotal: quantity * purchasePrice
  });

  closeAddItemModal();
  renderPurchaseItemsTable();
  updatePurchaseTotal();
}

async function handlePurchaseFormSubmit(e) {
  e.preventDefault();

  if (purchaseItems.length === 0) {
    showPurchaseFormError('Tambahkan minimal 1 item pembelian');
    return;
  }

  const total = purchaseItems.reduce((sum, item) => sum + item.subtotal, 0);
  const paidAmount = parseRupiahInput('paidAmount');

  if (paidAmount > total) {
    showPurchaseFormError('Jumlah dibayar tidak boleh melebihi total');
    return;
  }

  const supplierSelect = document.getElementById('supplierSelect');
  const supplierIdVal = supplierSelect.value ? parseInt(supplierSelect.value) : null;
  const supplierNameVal = supplierIdVal
    ? supplierSelect.options[supplierSelect.selectedIndex].textContent.replace(/^\[.*?\]\s*/, '').trim()
    : '';

  const formData = {
    purchase_code: document.getElementById('purchaseCode').value,
    supplier_id: supplierIdVal,
    supplier_name: supplierNameVal,
    purchase_date: document.getElementById('purchaseDate').value,
    total_amount: total,
    payment_status: document.getElementById('paymentStatus').value,
    paid_amount: paidAmount,
    notes: document.getElementById('purchaseNotes').value.trim(),
    items: purchaseItems
  };

  showConfirm(
    'Konfirmasi Simpan',
    `Yakin ingin menyimpan pembelian dengan ${purchaseItems.length} item (Total: ${formatCurrency(total)})?`,
    async () => { await savePurchase(formData); }
  );
}

async function savePurchase(formData) {
  const btn = document.getElementById('btnSubmitPurchase');
  const btnSubmit = document.getElementById('btnSubmitPurchaseText');
  const originalText = btnSubmit.textContent;
  btn.disabled = true;
  btnSubmit.textContent = 'Menyimpan...';

  try {
    const result = await apiClient.post('/purchases', formData);
    if (result.success) {
      closePurchaseModal();
      await loadPurchases();
      showToast('Pembelian berhasil disimpan', 'success');
    } else {
      showPurchaseFormError(result.message || 'Gagal menyimpan pembelian');
      btn.disabled = false;
      btnSubmit.textContent = originalText;
    }
  } catch (error) {
    console.error('Save purchase error:', error);
    showPurchaseFormError('Terjadi kesalahan saat menyimpan');
    btn.disabled = false;
    btnSubmit.textContent = originalText;
  }
}

function showPurchaseFormError(message) {
  const errorDiv = document.getElementById('purchaseFormError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

async function openPayPurchaseModal(purchaseId) {
  try {
    const result = await apiClient.get(`/purchases/${purchaseId}`);
    if (result.success) {
      const purchase = result.data;
      if (purchase.payment_status === 'paid') { showToast('Pembelian sudah lunas', 'info'); return; }
      document.getElementById('payPurchaseId').value = purchase.id;
      document.getElementById('payPurchaseCode').textContent = purchase.purchase_code;
      document.getElementById('paySupplier').textContent = purchase.supplier_name || '-';
      document.getElementById('payTotal').textContent = formatCurrency(purchase.total_amount);
      document.getElementById('payAlreadyPaid').textContent = formatCurrency(purchase.paid_amount);
      document.getElementById('payRemaining').textContent = formatCurrency(purchase.remaining_amount);
      document.getElementById('payAmount').value = '';
      document.getElementById('payAmount').dataset.remaining = purchase.remaining_amount;
      document.getElementById('payPurchaseError').style.display = 'none';
      document.getElementById('payAfterInfo').style.display = 'none';
      document.getElementById('payPurchaseModal').style.display = 'flex';
      setTimeout(() => { document.getElementById('payAmount').focus(); }, 100);
    } else {
      showToast('Gagal memuat data pembelian', 'error');
    }
  } catch (error) {
    console.error('Open pay purchase modal error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function closePayPurchaseModal() {
  document.getElementById('payPurchaseModal').style.display = 'none';
}

function calculatePayAfter() {
  const remaining = parseFloat(document.getElementById('payAmount').dataset.remaining) || 0;
  const amount = parseRupiahInput('payAmount');
  const afterRemaining = Math.max(remaining - amount, 0);
  const infoEl = document.getElementById('payAfterInfo');

  if (amount <= 0) {
    infoEl.style.display = 'none';
    return;
  }

  infoEl.style.display = 'block';
  document.getElementById('payAfterRemaining').textContent = formatCurrency(afterRemaining);

  let statusText, statusClass;
  if (amount >= remaining) {
    statusText = 'Lunas';
    statusClass = 'text-success';
  } else {
    statusText = 'Belum Lunas';
    statusClass = 'text-danger';
  }
  const statusEl = document.getElementById('payAfterStatus');
  statusEl.textContent = statusText;
  statusEl.className = statusClass;
}

async function handlePayPurchase(e) {
  e.preventDefault();
  const purchaseId = parseInt(document.getElementById('payPurchaseId').value);
  const amount = parseRupiahInput('payAmount');
  const remaining = parseFloat(document.getElementById('payAmount').dataset.remaining) || 0;

  if (amount <= 0) { showPayPurchaseError('Jumlah bayar harus lebih dari 0'); return; }
  if (amount > remaining) { showPayPurchaseError('Jumlah bayar melebihi sisa hutang'); return; }

  showConfirm(
    'Konfirmasi Pembayaran',
    `Yakin ingin membayar ${formatCurrency(amount)} untuk pembelian ini?`,
    async () => { await processPurchasePayment(purchaseId, amount); }
  );
}

async function processPurchasePayment(purchaseId, amount) {
  try {
    const result = await apiClient.post(`/purchases/${purchaseId}/pay`, { amount });
    if (result.success) {
      closePayPurchaseModal();
      await loadPurchases();
      showToast('Pembayaran berhasil diproses', 'success');
    } else {
      showPayPurchaseError(result.message || 'Gagal memproses pembayaran');
    }
  } catch (error) {
    console.error('Process purchase payment error:', error);
    showPayPurchaseError('Terjadi kesalahan saat memproses pembayaran');
  }
}

function showPayPurchaseError(message) {
  const errorDiv = document.getElementById('payPurchaseError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

async function openDetailPurchase(purchaseId) {
  try {
    const result = await apiClient.get(`/purchases/${purchaseId}`);
    if (result.success) {
      displayPurchaseDetail(result.data);
      document.getElementById('detailPurchaseModal').style.display = 'flex';
    } else {
      showToast('Gagal memuat detail pembelian', 'error');
    }
  } catch (error) {
    console.error('Open detail purchase error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function displayPurchaseDetail(purchase) {
  const container = document.getElementById('purchaseDetailContent');
  container.innerHTML = `
    <div class="detail-section">
      <h3>Informasi Pembelian</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Kode PO:</span>
          <strong><code>${escapeHtml(purchase.purchase_code)}</code></strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">Tanggal:</span>
          <strong>${formatDateOnly(purchase.purchase_date)}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">Supplier:</span>
          <span>${purchase.supplier_name ? `<strong>${escapeHtml(purchase.supplier_name)}</strong>` : '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">User:</span>
          <strong>${escapeHtml(purchase.user_name)}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status Bayar:</span>
          <span class="badge ${getPaymentStatusClass(purchase.payment_status)}">
            ${getPaymentStatusLabel(purchase.payment_status)}
          </span>
        </div>
        ${purchase.notes ? `
        <div class="detail-item">
          <span class="detail-label">Catatan:</span>
          <span>${escapeHtml(purchase.notes)}</span>
        </div>` : ''}
      </div>
    </div>
    <div class="detail-section">
      <h3>Item Pembelian</h3>
      <table class="detail-table">
        <thead>
          <tr><th>No</th><th>Nama Produk</th><th>Qty</th><th>Satuan</th><th>Harga Beli</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          ${purchase.items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(item.product_name)}</td>
              <td>${item.quantity}</td>
              <td>${item.unit}</td>
              <td>${formatCurrency(item.purchase_price)}</td>
              <td><strong>${formatCurrency(item.subtotal)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="detail-section">
      <div class="payment-detail">
        <div class="payment-row total-row">
          <span>Total Pembelian:</span>
          <strong>${formatCurrency(purchase.total_amount)}</strong>
        </div>
        <div class="payment-row">
          <span>Sudah Dibayar:</span>
          <strong class="text-success">${formatCurrency(purchase.paid_amount)}</strong>
        </div>
        <div class="payment-row">
          <span>Sisa Hutang:</span>
          <strong class="${purchase.remaining_amount > 0 ? 'text-danger' : 'text-success'}">
            ${formatCurrency(purchase.remaining_amount)}
          </strong>
        </div>
      </div>
    </div>
  `;
}

function closeDetailPurchaseModal() {
  document.getElementById('detailPurchaseModal').style.display = 'none';
}

function confirmDeletePurchase(purchaseId, purchaseCode) {
  showConfirm(
    'Konfirmasi Hapus',
    `Yakin ingin menghapus pembelian "${purchaseCode}"? Stok produk akan dikembalikan.`,
    async () => { await deletePurchase(purchaseId); }
  );
}

async function deletePurchase(purchaseId) {
  try {
    const result = await apiClient.delete(`/purchases/${purchaseId}`);
    if (result.success) {
      await loadPurchases();
      showToast('Pembelian berhasil dihapus', 'success');
    } else {
      showToast(result.message || 'Gagal menghapus pembelian', 'error');
    }
  } catch (error) {
    console.error('Delete purchase error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

// ============================================
// SUPPLIER RETURNS
// ============================================

let allReturns = [];
let purchasesForReturn = [];
let returnPurchaseItems = [];
let currentReturnId = null;
let returnSelectedPurchase = null;

async function loadReturns() {
  try {
    const params = {};
    const supplierId = document.getElementById('returnFilterSupplier').value;
    const status = document.getElementById('returnFilterStatus').value;
    const startDate = document.getElementById('returnFilterStartDate').value;
    const endDate = document.getElementById('returnFilterEndDate').value;
    if (supplierId) params.supplier_id = supplierId;
    if (status) params.status = status;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const result = await apiClient.get('/supplier-returns', params);
    if (result.success) {
      allReturns = result.data?.items ?? [];
      renderReturnsTable(allReturns);
      updateReturnsSummary(allReturns);
    } else {
      showToast(result.message || 'Gagal memuat data retur', 'error');
    }
  } catch (error) {
    console.error('loadReturns error:', error);
    showToast('Terjadi kesalahan saat memuat data retur', 'error');
  }
}

function renderReturnsTable(returns) {
  const tbody = document.getElementById('returnsTableBody');
  if (!returns || returns.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data retur</td></tr>';
    return;
  }
  tbody.innerHTML = returns.map(r => `
    <tr>
      <td><strong>${escapeHtml(r.return_code)}</strong></td>
      <td>${formatDate(r.return_date)}</td>
      <td>${escapeHtml(r.purchase_code || '-')}</td>
      <td>${escapeHtml(r.supplier_name || '-')}</td>
      <td>${formatCurrency(r.total_return_amount)}</td>
      <td>${escapeHtml(r.reason)}</td>
      <td>${renderReturnStatusBadge(r.status)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-sm btn-info" onclick="openDetailReturnModal(${r.id})">Detail</button>
          ${r.status === 'pending' ? `<button class="btn btn-sm btn-danger" onclick="confirmDeleteReturn(${r.id}, '${escapeHtml(r.return_code)}')">Hapus</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function renderReturnStatusBadge(status) {
  const map = {
    pending:  ['badge-warning', 'Menunggu'],
    approved: ['badge-success', 'Disetujui'],
    rejected: ['badge-danger',  'Ditolak'],
  };
  const [cls, label] = map[status] ?? ['badge-secondary', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function updateReturnsSummary(returns) {
  const total = returns.reduce((sum, r) => sum + (r.total_return_amount || 0), 0);
  document.getElementById('returnsTotal').textContent = formatCurrency(total);
  document.getElementById('returnsCount').textContent = returns.length;
}

async function loadPurchasesForReturn() {
  try {
    const result = await apiClient.get('/purchases', { limit: 1000 });
    if (result.success) {
      purchasesForReturn = result.data.items ?? [];
      const select = document.getElementById('returnPurchaseId');
      select.innerHTML = '<option value="">-- Pilih PO --</option>';
      purchasesForReturn.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.purchase_code} - ${p.supplier_name || 'Tanpa Supplier'} (${formatDate(p.purchase_date)})`;
        select.appendChild(opt);
      });
    }
  } catch (error) {
    console.error('loadPurchasesForReturn error:', error);
  }
}

async function loadReturnSupplierFilter() {
  try {
    const result = await apiClient.get('/suppliers/active');
    if (result.success) {
      const select = document.getElementById('returnFilterSupplier');
      select.innerHTML = '<option value="">Semua Supplier</option>';
      (result.data || []).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        select.appendChild(opt);
      });
    }
  } catch (error) {
    console.error('loadReturnSupplierFilter error:', error);
  }
}

function openAddReturnModal() {
  currentReturnId = null;
  document.getElementById('returnForm').reset();
  document.getElementById('returnSupplierInfo').classList.add('hidden');
  document.getElementById('returnItemsSection').classList.add('hidden');
  document.getElementById('returnItemsSelectBody').innerHTML = '';
  document.getElementById('returnTotalAmount').textContent = 'Rp 0';
  document.getElementById('returnFormError').classList.add('hidden');
  document.getElementById('returnDate').value = new Date().toISOString().split('T')[0];
  returnPurchaseItems = [];
  returnSelectedPurchase = null;
  loadPurchasesForReturn();
  document.getElementById('returnModal').style.display = 'flex';
}

function closeReturnModal() {
  document.getElementById('returnModal').style.display = 'none';
}

async function handleReturnPurchaseChange() {
  const purchaseId = document.getElementById('returnPurchaseId').value;
  if (!purchaseId) {
    document.getElementById('returnSupplierInfo').classList.add('hidden');
    document.getElementById('returnItemsSection').classList.add('hidden');
    returnPurchaseItems = [];
    return;
  }

  try {
    const [purchaseResult, itemsResult] = await Promise.all([
      apiClient.get(`/purchases/${parseInt(purchaseId)}`),
      apiClient.get(`/purchases/${parseInt(purchaseId)}/items`)
    ]);

    if (purchaseResult.success && itemsResult.success) {
      const purchase = purchaseResult.data;
      returnPurchaseItems = itemsResult.data;
      returnSelectedPurchase = purchase;

      document.getElementById('returnSupplierName').textContent =
        purchase.supplier_name || 'Tanpa Supplier';
      document.getElementById('returnPurchaseStatus').textContent =
        formatPaymentStatus(purchase.payment_status);
      document.getElementById('returnRemainingDebt').textContent =
        formatCurrency(purchase.remaining_amount || 0);
      document.getElementById('returnSupplierInfo').classList.remove('hidden');
      renderReturnItemsSelect(returnPurchaseItems);
      document.getElementById('returnItemsSection').classList.remove('hidden');
    } else {
      showToast('Gagal memuat data pembelian', 'error');
    }
  } catch (error) {
    console.error('handleReturnPurchaseChange error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function renderReturnItemsSelect(items) {
  const tbody = document.getElementById('returnItemsSelectBody');
  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada item</td></tr>';
    return;
  }
  tbody.innerHTML = items.map((item, index) => `
    <tr>
      <td>
        <input type="checkbox" class="return-item-check" data-index="${index}"
               onchange="handleReturnItemCheck(this)">
      </td>
      <td>${escapeHtml(item.product_name)}</td>
      <td>${item.quantity}</td>
      <td>${escapeHtml(item.unit || 'pcs')}</td>
      <td>${formatCurrency(item.purchase_price)}</td>
      <td>
        <input type="number" class="return-qty-input" data-index="${index}"
               min="0.01" max="${item.quantity}" step="0.01"
               value="${item.quantity}" style="width:80px"
               oninput="calculateReturnSubtotal(${index})" disabled>
      </td>
      <td class="return-subtotal" data-index="${index}">${formatCurrency(0)}</td>
    </tr>
  `).join('');
}

function handleReturnItemCheck(checkbox) {
  const index = checkbox.dataset.index;
  const qtyInput = document.querySelector(`.return-qty-input[data-index="${index}"]`);
  qtyInput.disabled = !checkbox.checked;
  if (!checkbox.checked) {
    document.querySelector(`.return-subtotal[data-index="${index}"]`).textContent = formatCurrency(0);
  } else {
    calculateReturnSubtotal(index);
  }
  updateReturnTotal();
}

function calculateReturnSubtotal(index) {
  const item = returnPurchaseItems[index];
  const qty = parseFloat(document.querySelector(`.return-qty-input[data-index="${index}"]`).value) || 0;
  const subtotal = qty * item.purchase_price;
  document.querySelector(`.return-subtotal[data-index="${index}"]`).textContent = formatCurrency(subtotal);
  updateReturnTotal();
}

function updateReturnTotal() {
  let total = 0;
  document.querySelectorAll('.return-item-check:checked').forEach(chk => {
    const index = chk.dataset.index;
    const item = returnPurchaseItems[index];
    const qty = parseFloat(document.querySelector(`.return-qty-input[data-index="${index}"]`).value) || 0;
    total += qty * item.purchase_price;
  });
  document.getElementById('returnTotalAmount').textContent = formatCurrency(total);
}

async function handleReturnFormSubmit(e) {
  e.preventDefault();
  const errorEl = document.getElementById('returnFormError');
  errorEl.classList.add('hidden');

  const purchaseId = parseInt(document.getElementById('returnPurchaseId').value);
  const returnDate = document.getElementById('returnDate').value;
  const reason = document.getElementById('returnReason').value;
  const notes = document.getElementById('returnNotes').value;

  if (!purchaseId || !returnDate || !reason) {
    errorEl.textContent = 'PO, tanggal, dan alasan retur wajib diisi';
    errorEl.classList.remove('hidden');
    return;
  }

  const checkedItems = [];
  const checkedEls = document.querySelectorAll('.return-item-check:checked');
  for (const chk of checkedEls) {
    const index = parseInt(chk.dataset.index);
    const item = returnPurchaseItems[index];
    const qty = parseFloat(document.querySelector(`.return-qty-input[data-index="${index}"]`).value) || 0;
    if (qty <= 0) continue;
    if (qty > item.quantity) {
      errorEl.textContent = `Qty retur untuk "${item.product_name}" melebihi qty beli`;
      errorEl.classList.remove('hidden');
      return;
    }
    checkedItems.push({
      purchase_item_id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: qty,
      unit: item.unit || 'pcs',
      purchase_price: item.purchase_price,
      subtotal: qty * item.purchase_price
    });
  }

  if (checkedItems.length === 0) {
    errorEl.textContent = 'Pilih minimal satu item yang akan diretur';
    errorEl.classList.remove('hidden');
    return;
  }

  try {
    const result = await apiClient.post('/supplier-returns', {
      purchase_id: purchaseId,
      supplier_id: returnSelectedPurchase?.supplier_id ?? null,
      supplier_name: returnSelectedPurchase?.supplier_name ?? '',
      return_date: returnDate,
      reason,
      notes,
      items: checkedItems
    });
    if (result.success) {
      closeReturnModal();
      await loadReturns();
      showToast(`Retur ${result.data?.return_code ?? ''} berhasil disimpan`, 'success');
    } else {
      errorEl.textContent = result.message || 'Gagal menyimpan retur';
      errorEl.classList.remove('hidden');
    }
  } catch (error) {
    console.error('handleReturnFormSubmit error:', error);
    errorEl.textContent = 'Terjadi kesalahan saat menyimpan retur';
    errorEl.classList.remove('hidden');
  }
}

async function openDetailReturnModal(id) {
  currentReturnId = id;
  try {
    const result = await apiClient.get(`/supplier-returns/${id}`);
    if (!result.success) { showToast(result.message || 'Gagal memuat detail retur', 'error'); return; }

    const r = result.data;
    document.getElementById('detailReturnCode').textContent = r.return_code;
    document.getElementById('detailReturnPurchaseCode').textContent = r.purchase_code || '-';
    document.getElementById('detailReturnDate').textContent = formatDate(r.return_date);
    document.getElementById('detailReturnSupplier').textContent = r.supplier_name || '-';
    document.getElementById('detailReturnReason').textContent = r.reason;
    document.getElementById('detailReturnStatus').innerHTML = renderReturnStatusBadge(r.status);
    document.getElementById('detailReturnTotal').textContent = formatCurrency(r.total_return_amount);
    document.getElementById('detailReturnNotes').textContent = r.notes || '-';
    document.getElementById('detailReturnUser').textContent = r.user_name || '-';

    const tbody = document.getElementById('detailReturnItemsBody');
    tbody.innerHTML = (!r.items || r.items.length === 0)
      ? '<tr><td colspan="5" class="text-center">Tidak ada item</td></tr>'
      : r.items.map(item => `
          <tr>
            <td>${escapeHtml(item.product_name)}</td>
            <td>${item.quantity}</td>
            <td>${escapeHtml(item.unit || 'pcs')}</td>
            <td>${formatCurrency(item.purchase_price)}</td>
            <td>${formatCurrency(item.subtotal)}</td>
          </tr>
        `).join('');

    const isPending = r.status === 'pending';
    document.getElementById('btnApproveReturn').style.display = isPending ? 'inline-block' : 'none';
    document.getElementById('btnRejectReturn').style.display = isPending ? 'inline-block' : 'none';
    document.getElementById('detailReturnModal').style.display = 'flex';
  } catch (error) {
    console.error('openDetailReturnModal error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function closeDetailReturnModal() {
  document.getElementById('detailReturnModal').style.display = 'none';
  currentReturnId = null;
}

async function updateReturnStatus(status) {
  if (!currentReturnId) return;
  const label = status === 'approved' ? 'Setujui' : 'Tolak';
  const desc = status === 'approved'
    ? 'Yakin ingin menyetujui retur ini? Stok produk akan dikurangi secara otomatis.'
    : 'Yakin ingin menolak retur ini?';

  showConfirm(`Konfirmasi ${label} Retur`, desc, async () => {
    try {
      const result = await apiClient.patch(`/supplier-returns/${currentReturnId}/status`, { status });
      if (result.success) {
        closeDetailReturnModal();
        await loadReturns();
        showToast(`Retur berhasil di${status === 'approved' ? 'setujui' : 'tolak'}`, 'success');
      } else {
        showToast(result.message || 'Gagal mengubah status', 'error');
      }
    } catch (error) {
      console.error('updateReturnStatus error:', error);
      showToast('Terjadi kesalahan', 'error');
    }
  });
}

function confirmDeleteReturn(id, code) {
  showConfirm(
    'Konfirmasi Hapus',
    `Yakin ingin menghapus retur "${code}"? Stok dan hutang akan dikembalikan.`,
    async () => { await deleteReturn(id); }
  );
}

async function deleteReturn(id) {
  try {
    const result = await apiClient.delete(`/supplier-returns/${id}`);
    if (result.success) {
      await loadReturns();
      showToast('Retur berhasil dihapus', 'success');
    } else {
      showToast(result.message || 'Gagal menghapus retur', 'error');
    }
  } catch (error) {
    console.error('deleteReturn error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function formatPaymentStatus(status) {
  const map = { paid: 'Lunas', unpaid: 'Belum Bayar', partial: 'Bayar Sebagian' };
  return map[status] || status;
}