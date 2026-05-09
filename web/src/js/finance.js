'use strict';

// ============================================
// STATE
// ============================================

let currentUser       = null;
let allExpenses       = [];
let allPurchases      = [];
let allCashDrawers    = [];
let allProducts       = [];
let purchaseItems     = [];
let suppliersCache    = [];
let editingExpenseId  = null;
let editingPurchaseId = null;
let currentCashDrawer = null;
let allReturns        = [];
let purchasesForReturn   = [];
let returnPurchaseItems  = [];
let currentReturnId      = null;

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

  setupEventListeners();
  setDefaultDates();

  await loadSuppliersDropdown();
  await loadShiftsFilterDropdown();
  await loadDashboard();
  await loadProducts();
  await checkCurrentCashDrawer();
  await loadReturnSupplierFilter();
  populateExpenseCategories();
});

function setDefaultDates() {
  const today     = new Date();
  const firstDay  = new Date(today.getFullYear(), today.getMonth(), 1);
  const todayStr  = toISODate(today);
  const firstStr  = toISODate(firstDay);
  const last30    = toISODate(new Date(today - 30 * 864e5));

  document.getElementById('dashboardStartDate').value   = firstStr;
  document.getElementById('dashboardEndDate').value     = todayStr;
  document.getElementById('cashFilterStartDate').value  = last30;
  document.getElementById('cashFilterEndDate').value    = todayStr;
  document.getElementById('expenseFilterStartDate').value = firstStr;
  document.getElementById('expenseFilterEndDate').value   = todayStr;
  document.getElementById('purchaseFilterStartDate').value = firstStr;
  document.getElementById('purchaseFilterEndDate').value   = todayStr;
  document.getElementById('shiftSummaryStartDate').value   = firstStr;
  document.getElementById('shiftSummaryEndDate').value     = todayStr;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  document.getElementById('btnApplyDashboardFilter').addEventListener('click', loadDashboard);

  document.getElementById('btnApplyCashFilter').addEventListener('click', loadCashDrawerHistory);
  document.getElementById('btnApplyShiftSummaryFilter').addEventListener('click', loadShiftSummary);
  document.getElementById('closeOpenCashModal').addEventListener('click', closeOpenCashModal);
  document.getElementById('btnCancelOpenCash').addEventListener('click', closeOpenCashModal);
  document.getElementById('openCashForm').addEventListener('submit', handleOpenCash);
  document.getElementById('closeCloseCashModal').addEventListener('click', closeCloseCashModal);
  document.getElementById('btnCancelCloseCash').addEventListener('click', closeCloseCashModal);
  document.getElementById('closeCashForm').addEventListener('submit', handleCloseCash);
  document.getElementById('closingBalance').addEventListener('input', calculateDifference);
  document.getElementById('closeDetailCashModal').addEventListener('click', closeDetailCashModal);
  document.getElementById('btnCloseDetailCash').addEventListener('click', closeDetailCashModal);

  document.getElementById('btnAddExpense').addEventListener('click', openAddExpenseModal);
  document.getElementById('btnApplyExpenseFilter').addEventListener('click', loadExpenses);
  document.getElementById('closeExpenseModal').addEventListener('click', closeExpenseModal);
  document.getElementById('btnCancelExpense').addEventListener('click', closeExpenseModal);
  document.getElementById('expenseForm').addEventListener('submit', handleExpenseFormSubmit);

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
  document.getElementById('itemPurchasePrice').addEventListener('input', calculateItemSubtotal);
  document.getElementById('paymentStatus').addEventListener('change', handlePaymentStatusChange);
  document.getElementById('paidAmount').addEventListener('input', calculateRemainingAmount);
  document.getElementById('closePayPurchaseModal').addEventListener('click', closePayPurchaseModal);
  document.getElementById('btnCancelPay').addEventListener('click', closePayPurchaseModal);
  document.getElementById('payPurchaseForm').addEventListener('submit', handlePayPurchase);
  document.getElementById('closeDetailPurchaseModal').addEventListener('click', closeDetailPurchaseModal);
  document.getElementById('btnCloseDetailPurchase').addEventListener('click', closeDetailPurchaseModal);

  document.getElementById('btnAddReturn').addEventListener('click', openAddReturnModal);
  document.getElementById('btnApplyReturnFilter').addEventListener('click', loadReturns);
  document.getElementById('closeReturnModal').addEventListener('click', closeReturnModal);
  document.getElementById('btnCancelReturn').addEventListener('click', closeReturnModal);
  document.getElementById('returnForm').addEventListener('submit', handleReturnFormSubmit);
  document.getElementById('returnPurchaseId').addEventListener('change', handleReturnPurchaseChange);
  document.getElementById('closeDetailReturnModal').addEventListener('click', closeDetailReturnModal);
  document.getElementById('btnCloseDetailReturn').addEventListener('click', closeDetailReturnModal);
  document.getElementById('btnMarkReturnDone').addEventListener('click', markReturnDone);

  window.addEventListener('click', (e) => {
    ['openCashModal','closeCashModal','detailCashModal','expenseModal','purchaseModal',
     'addPurchaseItemModal','payPurchaseModal','detailPurchaseModal','returnModal','detailReturnModal'
    ].forEach(id => {
      const m = document.getElementById(id);
      if (e.target === m) m.style.display = 'none';
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');

  if      (tabName === 'dashboard')        loadDashboard();
  else if (tabName === 'cash-drawer')      { checkCurrentCashDrawer(); loadCashDrawerHistory(); }
  else if (tabName === 'expenses')         loadExpenses();
  else if (tabName === 'purchases')        loadPurchases();
  else if (tabName === 'shift-summary')    loadShiftSummary();
  else if (tabName === 'supplier-returns') { loadReturnSupplierFilter(); loadReturns(); }
}

// ============================================
// DASHBOARD
// ============================================

async function loadDashboard() {
  const startDate = document.getElementById('dashboardStartDate').value;
  const endDate   = document.getElementById('dashboardEndDate').value;

  try {
    const pl = await apiClient.get('/reports/profit-loss', { date_from: startDate, date_to: endDate });

    document.getElementById('totalSales').textContent      = formatCurrency(pl.total_revenue    || 0);
    document.getElementById('totalExpenses').textContent   = formatCurrency(pl.total_expenses   || 0);
    document.getElementById('grossProfit').textContent     = formatCurrency(pl.gross_profit     || 0);
    document.getElementById('netProfit').textContent       = formatCurrency(pl.net_profit       || 0);
    document.getElementById('totalCOGS').textContent       = formatCurrency(pl.total_cogs       || 0);

    const transactions = pl.items || [];
    const txCount = transactions.length;
    document.getElementById('totalTransactions').textContent = txCount;
    document.getElementById('avgTransaction').textContent    = formatCurrency(txCount > 0 ? (pl.total_revenue / txCount) : 0);
  } catch (error) {
    console.error('Load dashboard error:', error);
    showToast('Gagal memuat dashboard keuangan', 'error');
  }

  await loadTopProducts(startDate, endDate);
}

async function loadTopProducts(startDate, endDate) {
  try {
    const result = await apiClient.get('/dashboard/top-products', { start_date: startDate, end_date: endDate, limit: 10 });
    const products = Array.isArray(result) ? result : (result.items || result.products || []);
    renderTopProducts(products);
  } catch (error) {
    console.error('Load top products error:', error);
  }
}

function renderTopProducts(products) {
  const container = document.getElementById('topProductsList');
  if (!products || products.length === 0) {
    container.innerHTML = '<p class="text-center">Tidak ada data</p>';
    return;
  }
  container.innerHTML = products.map((p, i) => `
    <div class="top-product-item">
      <div class="top-product-rank">${i + 1}</div>
      <div class="top-product-info">
        <strong>${escapeHtml(p.product_name)}</strong>
        <div class="top-product-stats">
          <span>Terjual: ${p.total_qty || p.total_quantity || 0}</span>
          <span>•</span>
          <span>Omzet: ${formatCurrency(p.total_value || p.total_sales || 0)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================
// CASH DRAWER
// ============================================

async function checkCurrentCashDrawer() {
  try {
    const result = await apiClient.get('/cash-drawer/current');
    currentCashDrawer = result || null;
    renderCashStatus(currentCashDrawer);
  } catch (error) {
    renderCashStatus(null);
  }
}

function renderCashStatus(cashDrawer) {
  const container = document.getElementById('cashStatusContent');
  if (!cashDrawer) {
    container.innerHTML = `
      <div class="cash-status-closed">
        <p class="status-message">Kas belum dibuka hari ini</p>
        <button class="btn btn-success btn-large" onclick="openOpenCashModal()">🔓 Buka Kas</button>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="cash-status-open">
      <div class="status-badge badge-success">● KAS TERBUKA</div>
      <div class="cash-info-grid">
        <div class="cash-info-item"><span class="label">Kasir:</span><strong>${escapeHtml(cashDrawer.user_name || currentUser.full_name || '-')}</strong></div>
        <div class="cash-info-item"><span class="label">Waktu Buka:</span><strong>${formatTimeOnly(cashDrawer.open_time)}</strong></div>
        <div class="cash-info-item"><span class="label">Saldo Awal:</span><strong>${formatCurrency(cashDrawer.opening_balance)}</strong></div>
        <div class="cash-info-item"><span class="label">Penjualan Cash:</span><strong>${formatCurrency(cashDrawer.total_cash_sales)}</strong></div>
        <div class="cash-info-item"><span class="label">Pengeluaran:</span><strong>${formatCurrency(cashDrawer.total_expenses)}</strong></div>
        <div class="cash-info-item"><span class="label">Expected Balance:</span><strong class="text-success">${formatCurrency((cashDrawer.opening_balance || 0) + (cashDrawer.total_cash_sales || 0) - (cashDrawer.total_expenses || 0))}</strong></div>
      </div>
      ${cashDrawer.notes ? `<p class="cash-notes">Catatan: ${escapeHtml(cashDrawer.notes)}</p>` : ''}
      <button class="btn btn-danger btn-large" onclick="openCloseCashModal(${cashDrawer.id})">🔒 Tutup Kas</button>
    </div>`;
}

async function loadCashDrawerHistory() {
  const startDate = document.getElementById('cashFilterStartDate').value;
  const endDate   = document.getElementById('cashFilterEndDate').value;
  const shiftId   = document.getElementById('cashFilterShift').value || undefined;

  try {
    const result = await apiClient.get('/cash-drawer', {
      start_date: startDate || undefined,
      end_date:   endDate   || undefined,
      shift_id:   shiftId
    });
    allCashDrawers = result.items || result.history || (Array.isArray(result) ? result : []);
    renderCashDrawerTable(allCashDrawers);
  } catch (error) {
    console.error('Load cash drawer history error:', error);
    showToast('Gagal memuat riwayat kas', 'error');
  }
}

function renderCashDrawerTable(cashDrawers) {
  const tbody = document.getElementById('cashDrawerTableBody');
  if (!cashDrawers.length) {
    tbody.innerHTML = '<tr><td colspan="11" class="text-center">Tidak ada data kas</td></tr>';
    return;
  }
  tbody.innerHTML = cashDrawers.map(c => `
    <tr>
      <td><div>${formatDateOnly(c.open_time)}</div><small>${formatTimeOnly(c.open_time)}</small></td>
      <td>${escapeHtml(c.user_name || '-')}</td>
      <td>${c.shift_name ? `<span class="badge badge-info">${escapeHtml(c.shift_name)}</span>` : '-'}</td>
      <td>${formatCurrency(c.opening_balance)}</td>
      <td>${formatCurrency(c.total_cash_sales || c.total_sales || 0)}</td>
      <td>${formatCurrency(c.total_expenses || 0)}</td>
      <td>${formatCurrency(c.expected_balance || 0)}</td>
      <td>${c.closing_balance != null ? formatCurrency(c.closing_balance) : '-'}</td>
      <td>${c.difference != null ? `<span class="${c.difference === 0 ? 'text-success' : 'text-danger'}">${formatCurrency(c.difference)}</span>` : '-'}</td>
      <td><span class="badge ${c.status === 'open' ? 'badge-success' : 'badge-secondary'}">${c.status === 'open' ? 'Open' : 'Closed'}</span></td>
      <td><button class="btn-icon" onclick="openDetailCashDrawer(${c.id})" title="Detail">👁️</button></td>
    </tr>
  `).join('');
}

function openOpenCashModal() {
  document.getElementById('openCashForm').reset();
  document.getElementById('openCashError').style.display = 'none';
  document.getElementById('openCashModal').style.display = 'flex';
  setTimeout(() => document.getElementById('openingBalance').focus(), 100);
}

function closeOpenCashModal() {
  document.getElementById('openCashModal').style.display = 'none';
}

async function handleOpenCash(e) {
  e.preventDefault();
  const openingBalance = parseFloat(document.getElementById('openingBalance').value) || 0;
  const notes = document.getElementById('openCashNotes').value.trim();

  if (openingBalance <= 0) { showOpenCashError('Saldo awal harus lebih dari 0'); return; }

  if (!confirm(`Yakin ingin membuka kas dengan saldo awal ${formatCurrency(openingBalance)}?`)) return;

  try {
    await apiClient.post('/cash-drawer/open', { opening_balance: openingBalance, notes });
    showToast('Kas berhasil dibuka', 'success');
    closeOpenCashModal();
    await checkCurrentCashDrawer();
  } catch (error) {
    console.error('Open cash drawer error:', error);
    showOpenCashError(error.message || 'Gagal membuka kas');
  }
}

function showOpenCashError(msg) {
  const el = document.getElementById('openCashError');
  el.textContent = msg;
  el.style.display = 'block';
}

function openCloseCashModal(cashDrawerId) {
  if (!currentCashDrawer) return;
  document.getElementById('closeCashDrawerId').value = cashDrawerId;
  document.getElementById('closeOpeningBalance').textContent  = formatCurrency(currentCashDrawer.opening_balance);
  document.getElementById('closeCashSales').textContent       = formatCurrency(currentCashDrawer.total_cash_sales || 0);
  document.getElementById('closeExpenses').textContent        = formatCurrency(currentCashDrawer.total_expenses || 0);

  const expected = (currentCashDrawer.opening_balance || 0) + (currentCashDrawer.total_cash_sales || 0) - (currentCashDrawer.total_expenses || 0);
  document.getElementById('closeExpectedBalance').textContent = formatCurrency(expected);
  document.getElementById('closingBalance').value = '';
  document.getElementById('closeCashNotes').value = '';
  document.getElementById('differenceDisplay').style.display = 'none';
  document.getElementById('closeCashError').style.display = 'none';
  document.getElementById('closeCashModal').style.display = 'flex';
  setTimeout(() => document.getElementById('closingBalance').focus(), 100);
}

function closeCloseCashModal() {
  document.getElementById('closeCashModal').style.display = 'none';
}

function calculateDifference() {
  if (!currentCashDrawer) return;
  const closingBalance = parseFloat(document.getElementById('closingBalance').value) || 0;
  const expected = (currentCashDrawer.opening_balance || 0) + (currentCashDrawer.total_cash_sales || 0) - (currentCashDrawer.total_expenses || 0);
  const diff = closingBalance - expected;
  const el = document.getElementById('differenceAmount');
  el.textContent = formatCurrency(diff);
  el.className = diff === 0 ? 'text-success' : 'text-danger';
  document.getElementById('differenceDisplay').style.display = 'flex';
}

async function handleCloseCash(e) {
  e.preventDefault();
  const cashDrawerId   = parseInt(document.getElementById('closeCashDrawerId').value);
  const closingBalance = parseFloat(document.getElementById('closingBalance').value) || 0;
  const notes          = document.getElementById('closeCashNotes').value.trim();

  if (closingBalance < 0) { showCloseCashError('Saldo akhir tidak boleh negatif'); return; }
  if (!confirm(`Yakin ingin menutup kas dengan saldo akhir ${formatCurrency(closingBalance)}?`)) return;

  try {
    await apiClient.post(`/cash-drawer/${cashDrawerId}/close`, { closing_balance: closingBalance, notes });
    showToast('Kas berhasil ditutup', 'success');
    closeCloseCashModal();
    await checkCurrentCashDrawer();
    await loadCashDrawerHistory();
  } catch (error) {
    console.error('Close cash drawer error:', error);
    showCloseCashError(error.message || 'Gagal menutup kas');
  }
}

function showCloseCashError(msg) {
  const el = document.getElementById('closeCashError');
  el.textContent = msg;
  el.style.display = 'block';
}

async function openDetailCashDrawer(cashDrawerId) {
  try {
    const cashDrawer = await apiClient.get(`/cash-drawer/${cashDrawerId}`);
    displayCashDrawerDetail(cashDrawer);
    document.getElementById('detailCashModal').style.display = 'flex';
  } catch (error) {
    console.error('Open detail cash drawer error:', error);
    showToast('Gagal memuat detail kas', 'error');
  }
}

function displayCashDrawerDetail(cashDrawer) {
  const container  = document.getElementById('cashDetailContent');
  const transactions = cashDrawer.transactions || [];
  const expenses     = cashDrawer.expenses || [];
  const totalCash    = cashDrawer.total_cash_sales || cashDrawer.total_sales || 0;
  const totalExp     = cashDrawer.total_expenses || 0;
  const expected     = (cashDrawer.opening_balance || 0) + totalCash - totalExp;

  container.innerHTML = `
    <div class="detail-section">
      <h3>Informasi Kas</h3>
      <div class="detail-grid">
        <div class="detail-item"><span class="detail-label">Kasir:</span><strong>${escapeHtml(cashDrawer.user_name || '-')}</strong></div>
        <div class="detail-item"><span class="detail-label">Tanggal:</span><strong>${formatDateOnly(cashDrawer.open_time)}</strong></div>
        <div class="detail-item"><span class="detail-label">Waktu Buka:</span><strong>${formatTimeOnly(cashDrawer.open_time)}</strong></div>
        <div class="detail-item"><span class="detail-label">Waktu Tutup:</span><strong>${cashDrawer.close_time ? formatTimeOnly(cashDrawer.close_time) : '-'}</strong></div>
        <div class="detail-item"><span class="detail-label">Saldo Awal:</span><strong>${formatCurrency(cashDrawer.opening_balance)}</strong></div>
        <div class="detail-item"><span class="detail-label">Saldo Akhir:</span><strong>${cashDrawer.closing_balance != null ? formatCurrency(cashDrawer.closing_balance) : '-'}</strong></div>
        <div class="detail-item"><span class="detail-label">Status:</span><span class="badge ${cashDrawer.status === 'open' ? 'badge-success' : 'badge-secondary'}">${cashDrawer.status === 'open' ? 'Open' : 'Closed'}</span></div>
        ${cashDrawer.notes ? `<div class="detail-item"><span class="detail-label">Catatan:</span><span>${escapeHtml(cashDrawer.notes)}</span></div>` : ''}
      </div>
    </div>

    <div class="detail-section">
      <h3>Transaksi Penjualan Cash (${transactions.length})</h3>
      ${transactions.length > 0 ? `
        <table class="detail-table">
          <thead><tr><th>Waktu</th><th>Kode</th><th>Customer</th><th>Total</th></tr></thead>
          <tbody>${transactions.map(tx => `
            <tr>
              <td>${formatTimeOnly(tx.transaction_date || tx.created_at)}</td>
              <td><code>${escapeHtml(tx.transaction_code || tx.transaction_number || '-')}</code></td>
              <td>${escapeHtml(tx.customer_name || '-')}</td>
              <td><strong>${formatCurrency(tx.total_amount)}</strong></td>
            </tr>`).join('')}
          </tbody>
        </table>` : '<p class="text-center">Tidak ada transaksi cash</p>'}
    </div>

    <div class="detail-section">
      <h3>Pengeluaran (${expenses.length})</h3>
      ${expenses.length > 0 ? `
        <table class="detail-table">
          <thead><tr><th>Kategori</th><th>Deskripsi</th><th>Jumlah</th></tr></thead>
          <tbody>${expenses.map(exp => `
            <tr>
              <td>${escapeHtml(exp.category)}</td>
              <td>${escapeHtml(exp.description)}</td>
              <td><strong>${formatCurrency(exp.amount)}</strong></td>
            </tr>`).join('')}
          </tbody>
        </table>
        <div class="expense-summary-note"><strong>Total Pengeluaran: ${formatCurrency(totalExp)}</strong></div>` : '<p class="text-center">Tidak ada pengeluaran</p>'}
    </div>

    <div class="detail-section">
      <div class="payment-detail">
        <div class="payment-row"><span>Saldo Awal:</span><strong>${formatCurrency(cashDrawer.opening_balance)}</strong></div>
        <div class="payment-row"><span>Total Penjualan Cash:</span><strong class="text-success">+ ${formatCurrency(totalCash)}</strong></div>
        <div class="payment-row"><span>Total Pengeluaran:</span><strong class="text-danger">- ${formatCurrency(totalExp)}</strong></div>
        <div class="payment-row total-row"><span>Expected Balance:</span><strong>${formatCurrency(expected)}</strong></div>
        ${cashDrawer.closing_balance != null ? `
        <div class="payment-row"><span>Saldo Akhir Aktual:</span><strong>${formatCurrency(cashDrawer.closing_balance)}</strong></div>
        <div class="payment-row"><span>Selisih:</span><strong class="${(cashDrawer.closing_balance - expected) === 0 ? 'text-success' : 'text-danger'}">${formatCurrency(cashDrawer.closing_balance - expected)}</strong></div>` : ''}
      </div>
    </div>
  `;
}

function closeDetailCashModal() {
  document.getElementById('detailCashModal').style.display = 'none';
}

// ============================================
// SHIFTS
// ============================================

async function loadShiftsFilterDropdown() {
  try {
    const result = await apiClient.get('/shifts');
    const shifts  = result.items || result.shifts || (Array.isArray(result) ? result : []);
    const select  = document.getElementById('cashFilterShift');
    if (!select) return;
    shifts.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name}${s.start_time ? ` (${s.start_time}-${s.end_time})` : ''}`;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error('loadShiftsFilterDropdown error:', error);
  }
}

async function loadShiftSummary() {
  const container = document.getElementById('shiftSummaryContainer');
  container.innerHTML = '<p class="text-center">Loading...</p>';

  try {
    const result  = await apiClient.get('/shifts/summary');
    const summary = Array.isArray(result) ? result : (result.items || result.summary || []);

    if (!summary.length) {
      container.innerHTML = '<p class="text-center">Tidak ada data ringkasan shift</p>';
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Shift</th>
              <th>Total Transaksi</th>
              <th>Total Penjualan</th>
              <th>Total Cash</th>
              <th>Total Non-Cash</th>
            </tr>
          </thead>
          <tbody>
            ${summary.map(row => `
              <tr>
                <td><strong>${escapeHtml(row.shift_name)}</strong></td>
                <td>${row.total_transactions || 0}</td>
                <td class="text-success">${formatCurrency(row.total_sales || 0)}</td>
                <td>${formatCurrency(row.total_cash || 0)}</td>
                <td>${formatCurrency(row.total_non_cash || 0)}</td>
              </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td><strong>Total</strong></td>
              <td><strong>${summary.reduce((s, r) => s + (r.total_transactions || 0), 0)}</strong></td>
              <td class="text-success"><strong>${formatCurrency(summary.reduce((s, r) => s + (r.total_sales || 0), 0))}</strong></td>
              <td><strong>${formatCurrency(summary.reduce((s, r) => s + (r.total_cash || 0), 0))}</strong></td>
              <td><strong>${formatCurrency(summary.reduce((s, r) => s + (r.total_non_cash || 0), 0))}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  } catch (error) {
    console.error('loadShiftSummary error:', error);
    container.innerHTML = '<p class="text-center text-danger">Gagal memuat ringkasan shift</p>';
  }
}

// ============================================
// EXPENSES
// ============================================

async function loadExpenses() {
  try {
    const startDate = document.getElementById('expenseFilterStartDate').value;
    const endDate   = document.getElementById('expenseFilterEndDate').value;
    const category  = document.getElementById('expenseFilterCategory').value || undefined;

    const result = await apiClient.get('/expenses', { start_date: startDate || undefined, end_date: endDate || undefined, category });
    allExpenses = result.items || result.expenses || (Array.isArray(result) ? result : []);
    renderExpensesTable(allExpenses);
    updateExpensesTotal(allExpenses);
  } catch (error) {
    console.error('Load expenses error:', error);
    showToast('Gagal memuat data pengeluaran', 'error');
  }
}

function renderExpensesTable(expenses) {
  const tbody = document.getElementById('expensesTableBody');
  if (!expenses.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data pengeluaran</td></tr>';
    return;
  }
  tbody.innerHTML = expenses.map(exp => `
    <tr>
      <td>${formatDateOnly(exp.expense_date)}</td>
      <td><span class="badge badge-category">${escapeHtml(exp.category)}</span></td>
      <td>${escapeHtml(exp.description)}</td>
      <td><strong>${formatCurrency(exp.amount)}</strong></td>
      <td>${escapeHtml(exp.payment_method || '-')}</td>
      <td>${escapeHtml(exp.user_name || '-')}</td>
      <td class="action-buttons">
        <button class="btn-icon" onclick="editExpense(${exp.id})" title="Edit">✏️</button>
        <button class="btn-icon" onclick="confirmDeleteExpense(${exp.id}, '${escapeHtml(exp.description)}')" title="Hapus">🗑️</button>
      </td>
    </tr>`).join('');
}

function updateExpensesTotal(expenses) {
  const total = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  document.getElementById('expensesTotal').textContent = formatCurrency(total);
}

function populateExpenseCategories() {
  const categories = ['Operasional','Gaji','Sewa','Listrik & Air','Internet','Transportasi','Pembelian Peralatan','Marketing','Lain-lain'];
  ['expenseFilterCategory','expenseCategory'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      sel.appendChild(opt);
    });
  });
}

function openAddExpenseModal() {
  editingExpenseId = null;
  document.getElementById('expenseModalTitle').textContent = 'Tambah Pengeluaran';
  document.getElementById('expenseForm').reset();
  document.getElementById('expenseDate').value = toISODate(new Date());
  document.getElementById('expenseFormError').style.display = 'none';
  document.getElementById('btnSubmitExpenseText').textContent = 'Simpan';
  document.getElementById('expenseModal').style.display = 'flex';
  setTimeout(() => document.getElementById('expenseDate').focus(), 100);
}

async function editExpense(expenseId) {
  try {
    const expense = await apiClient.get(`/expenses/${expenseId}`);
    editingExpenseId = expenseId;
    document.getElementById('expenseModalTitle').textContent = 'Edit Pengeluaran';
    document.getElementById('expenseId').value               = expense.id;
    document.getElementById('expenseDate').value             = (expense.expense_date || '').split('T')[0];
    document.getElementById('expenseCategory').value         = expense.category;
    document.getElementById('expenseDescription').value      = expense.description;
    document.getElementById('expenseAmount').value           = expense.amount;
    document.getElementById('expensePaymentMethod').value    = expense.payment_method || 'cash';
    document.getElementById('expenseNotes').value            = expense.notes || '';
    document.getElementById('expenseFormError').style.display = 'none';
    document.getElementById('btnSubmitExpenseText').textContent = 'Update';
    document.getElementById('expenseModal').style.display = 'flex';
  } catch (error) {
    console.error('Edit expense error:', error);
    showToast('Gagal memuat data pengeluaran', 'error');
  }
}

function closeExpenseModal() {
  document.getElementById('expenseModal').style.display = 'none';
  editingExpenseId = null;
}

async function handleExpenseFormSubmit(e) {
  e.preventDefault();
  const formData = {
    expense_date:   document.getElementById('expenseDate').value,
    category:       document.getElementById('expenseCategory').value,
    description:    document.getElementById('expenseDescription').value.trim(),
    amount:         parseFloat(document.getElementById('expenseAmount').value) || 0,
    payment_method: document.getElementById('expensePaymentMethod').value,
    notes:          document.getElementById('expenseNotes').value.trim()
  };

  if (!formData.category || !formData.description) { showExpenseFormError('Kategori dan deskripsi harus diisi'); return; }
  if (formData.amount <= 0) { showExpenseFormError('Jumlah harus lebih dari 0'); return; }

  const label = editingExpenseId ? 'mengupdate' : 'menambahkan';
  if (!confirm(`Yakin ingin ${label} pengeluaran "${formData.description}" sebesar ${formatCurrency(formData.amount)}?`)) return;

  try {
    if (editingExpenseId) {
      await apiClient.put(`/expenses/${editingExpenseId}`, formData);
    } else {
      await apiClient.post('/expenses', formData);
    }
    closeExpenseModal();
    await loadExpenses();
    showToast(editingExpenseId ? 'Pengeluaran berhasil diupdate' : 'Pengeluaran berhasil ditambahkan', 'success');
  } catch (error) {
    console.error('Save expense error:', error);
    showExpenseFormError(error.message || 'Gagal menyimpan pengeluaran');
  }
}

function confirmDeleteExpense(expenseId, description) {
  if (!confirm(`Yakin ingin menghapus pengeluaran "${description}"?`)) return;
  deleteExpense(expenseId);
}

async function deleteExpense(expenseId) {
  try {
    await apiClient.delete(`/expenses/${expenseId}`);
    await loadExpenses();
    showToast('Pengeluaran berhasil dihapus', 'success');
  } catch (error) {
    console.error('Delete expense error:', error);
    showToast('Gagal menghapus pengeluaran', 'error');
  }
}

function showExpenseFormError(msg) {
  const el = document.getElementById('expenseFormError');
  el.textContent = msg;
  el.style.display = 'block';
}

// ============================================
// PURCHASES
// ============================================

async function loadProducts() {
  try {
    const result = await apiClient.get('/products', { limit: 1000 });
    const products = result.items || result.products || (Array.isArray(result) ? result : []);
    allProducts = products.filter(p => p.is_active !== false && p.is_active !== 0);
    populateProductDropdown();
  } catch (error) {
    console.error('Load products error:', error);
  }
}

function populateProductDropdown() {
  const select = document.getElementById('itemProduct');
  select.innerHTML = '<option value="">Pilih Produk</option>';
  allProducts.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name}${p.barcode ? ` (${p.barcode})` : ''}`;
    opt.dataset.unit          = p.unit || 'pcs';
    opt.dataset.purchasePrice = p.purchase_price || 0;
    select.appendChild(opt);
  });
}

async function loadSuppliersDropdown() {
  try {
    const result = await apiClient.get('/suppliers/active');
    suppliersCache = Array.isArray(result) ? result : (result.items || result.suppliers || []);
  } catch (error) {
    console.error('loadSuppliersDropdown error:', error);
  }
}

function populateSupplierDropdown(selectedId = null) {
  const select   = document.getElementById('supplierSelect');
  if (!select) return;
  const current  = selectedId !== null ? selectedId : select.value;
  select.innerHTML = '<option value="">-- Pilih Supplier (opsional) --</option>';
  suppliersCache.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `[${s.supplier_code || s.code || ''}] ${s.name}`;
    if (String(s.id) === String(current)) opt.selected = true;
    select.appendChild(opt);
  });
}

async function loadPurchases() {
  try {
    const startDate     = document.getElementById('purchaseFilterStartDate').value;
    const endDate       = document.getElementById('purchaseFilterEndDate').value;
    const paymentStatus = document.getElementById('purchaseFilterStatus').value || undefined;

    const result = await apiClient.get('/purchases', {
      start_date:     startDate || undefined,
      end_date:       endDate   || undefined,
      payment_status: paymentStatus
    });
    allPurchases = result.items || result.purchases || (Array.isArray(result) ? result : []);
    renderPurchasesTable(allPurchases);
    updatePurchasesSummary(allPurchases);
  } catch (error) {
    console.error('Load purchases error:', error);
    showToast('Gagal memuat data pembelian', 'error');
  }
}

function renderPurchasesTable(purchases) {
  const tbody = document.getElementById('purchasesTableBody');
  if (!purchases.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data pembelian</td></tr>';
    return;
  }
  tbody.innerHTML = purchases.map(p => `
    <tr>
      <td><code>${escapeHtml(p.purchase_code)}</code></td>
      <td>${formatDateOnly(p.purchase_date)}</td>
      <td>${escapeHtml(p.supplier_name || '-')}</td>
      <td><strong>${formatCurrency(p.total_amount)}</strong></td>
      <td><span class="badge ${getPaymentStatusClass(p.payment_status)}">${getPaymentStatusLabel(p.payment_status)}</span></td>
      <td>${(p.remaining_amount || 0) > 0 ? `<strong class="text-danger">${formatCurrency(p.remaining_amount)}</strong>` : '-'}</td>
      <td class="action-buttons">
        <button class="btn-icon" onclick="openDetailPurchase(${p.id})" title="Detail">👁️</button>
        ${p.payment_status !== 'paid' ? `<button class="btn-icon" onclick="openPayPurchaseModal(${p.id})" title="Bayar">💰</button>` : ''}
        ${(p.paid_amount || 0) === 0 ? `<button class="btn-icon" onclick="confirmDeletePurchase(${p.id}, '${escapeHtml(p.purchase_code)}')" title="Hapus">🗑️</button>` : ''}
      </td>
    </tr>`).join('');
}

function updatePurchasesSummary(purchases) {
  document.getElementById('purchasesTotal').textContent = formatCurrency(purchases.reduce((s, p) => s + (p.total_amount || 0), 0));
  document.getElementById('purchasesDebt').textContent  = formatCurrency(purchases.reduce((s, p) => s + (p.remaining_amount || 0), 0));
}

function openAddPurchaseModal() {
  editingPurchaseId = null;
  purchaseItems     = [];
  document.getElementById('purchaseModalTitle').textContent = 'Tambah Pembelian';
  document.getElementById('purchaseForm').reset();
  document.getElementById('purchaseDate').value     = toISODate(new Date());
  document.getElementById('purchaseCode').value     = generatePurchaseCode();
  document.getElementById('paymentStatus').value    = 'unpaid';
  document.getElementById('paidAmount').value       = 0;
  document.getElementById('paidAmount').disabled    = true;
  populateSupplierDropdown(null);
  renderPurchaseItemsTable();
  updatePurchaseTotal();
  document.getElementById('purchaseFormError').style.display = 'none';
  document.getElementById('btnSubmitPurchaseText').textContent = 'Simpan';
  document.getElementById('purchaseModal').style.display = 'flex';
}

function closePurchaseModal() {
  document.getElementById('purchaseModal').style.display = 'none';
  editingPurchaseId = null;
  purchaseItems     = [];
}

function renderPurchaseItemsTable() {
  const tbody = document.getElementById('purchaseItemsTableBody');
  if (!purchaseItems.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada item. Klik "Tambah Item" untuk menambahkan.</td></tr>';
    return;
  }
  tbody.innerHTML = purchaseItems.map((item, i) => `
    <tr>
      <td>${escapeHtml(item.product_name)}</td>
      <td>${item.quantity}</td>
      <td>${escapeHtml(item.unit)}</td>
      <td>${formatCurrency(item.purchase_price)}</td>
      <td><strong>${formatCurrency(item.subtotal)}</strong></td>
      <td><button class="btn-remove" onclick="removePurchaseItem(${i})" title="Hapus">❌</button></td>
    </tr>`).join('');
}

function removePurchaseItem(index) {
  purchaseItems.splice(index, 1);
  renderPurchaseItemsTable();
  updatePurchaseTotal();
}

function updatePurchaseTotal() {
  const total = purchaseItems.reduce((s, i) => s + i.subtotal, 0);
  document.getElementById('purchaseTotalAmount').textContent = formatCurrency(total);
  calculateRemainingAmount();
}

function handlePaymentStatusChange() {
  const status = document.getElementById('paymentStatus').value;
  const paidEl = document.getElementById('paidAmount');
  if (status === 'unpaid') {
    paidEl.value = 0;
    paidEl.disabled = true;
  } else {
    paidEl.disabled = false;
    if (status === 'paid') paidEl.value = purchaseItems.reduce((s, i) => s + i.subtotal, 0);
  }
  calculateRemainingAmount();
}

function calculateRemainingAmount() {
  const total     = purchaseItems.reduce((s, i) => s + i.subtotal, 0);
  const paid      = parseFloat(document.getElementById('paidAmount').value) || 0;
  document.getElementById('remainingAmount').value = formatCurrency(total - paid);
}

function openAddItemModal() {
  document.getElementById('addPurchaseItemForm').reset();
  document.getElementById('itemUnit').value     = '';
  document.getElementById('itemSubtotal').value = 'Rp 0';
  document.getElementById('addPurchaseItemModal').style.display = 'flex';
  setTimeout(() => document.getElementById('itemProduct').focus(), 100);
}

function closeAddItemModal() {
  document.getElementById('addPurchaseItemModal').style.display = 'none';
}

function handleProductSelect() {
  const select = document.getElementById('itemProduct');
  const opt    = select.options[select.selectedIndex];
  if (opt.value) {
    document.getElementById('itemUnit').value          = opt.dataset.unit || 'pcs';
    document.getElementById('itemPurchasePrice').value = opt.dataset.purchasePrice || 0;
    calculateItemSubtotal();
  } else {
    document.getElementById('itemUnit').value          = '';
    document.getElementById('itemPurchasePrice').value = '';
    document.getElementById('itemSubtotal').value      = 'Rp 0';
  }
}

function calculateItemSubtotal() {
  const qty   = parseFloat(document.getElementById('itemQuantity').value) || 0;
  const price = parseFloat(document.getElementById('itemPurchasePrice').value) || 0;
  document.getElementById('itemSubtotal').value = formatCurrency(qty * price);
}

async function handleAddPurchaseItem(e) {
  e.preventDefault();
  const productId    = parseInt(document.getElementById('itemProduct').value);
  const quantity     = parseFloat(document.getElementById('itemQuantity').value);
  const purchasePrice = parseFloat(document.getElementById('itemPurchasePrice').value);

  if (!productId || quantity <= 0 || purchasePrice < 0) { showToast('Isi semua field dengan benar', 'error'); return; }

  const product = allProducts.find(p => p.id === productId);
  if (!product) { showToast('Produk tidak ditemukan', 'error'); return; }
  if (purchaseItems.find(i => i.product_id === productId)) { showToast('Produk sudah ada dalam daftar', 'error'); return; }

  purchaseItems.push({ product_id: productId, product_name: product.name, quantity, unit: product.unit || 'pcs', purchase_price: purchasePrice, subtotal: quantity * purchasePrice });
  closeAddItemModal();
  renderPurchaseItemsTable();
  updatePurchaseTotal();
}

async function handlePurchaseFormSubmit(e) {
  e.preventDefault();
  if (!purchaseItems.length) { showPurchaseFormError('Tambahkan minimal 1 item pembelian'); return; }

  const total      = purchaseItems.reduce((s, i) => s + i.subtotal, 0);
  const paidAmount = parseFloat(document.getElementById('paidAmount').value) || 0;
  if (paidAmount > total) { showPurchaseFormError('Jumlah dibayar tidak boleh melebihi total'); return; }

  const supplierSelect = document.getElementById('supplierSelect');
  const supplierIdVal  = supplierSelect.value ? parseInt(supplierSelect.value) : null;
  const supplierNameVal = supplierIdVal
    ? supplierSelect.options[supplierSelect.selectedIndex].textContent.replace(/^\[.*?\]\s*/, '').trim()
    : '';

  const formData = {
    purchase_code:  document.getElementById('purchaseCode').value,
    supplier_id:    supplierIdVal,
    supplier_name:  supplierNameVal,
    purchase_date:  document.getElementById('purchaseDate').value,
    total_amount:   total,
    payment_status: document.getElementById('paymentStatus').value,
    paid_amount:    paidAmount,
    notes:          document.getElementById('purchaseNotes').value.trim(),
    items:          purchaseItems
  };

  if (!confirm(`Yakin ingin menyimpan pembelian dengan ${purchaseItems.length} item (Total: ${formatCurrency(total)})?`)) return;

  const btnText = document.getElementById('btnSubmitPurchaseText');
  btnText.textContent = 'Menyimpan...';
  try {
    await apiClient.post('/purchases', formData);
    closePurchaseModal();
    await loadPurchases();
    showToast('Pembelian berhasil disimpan', 'success');
  } catch (error) {
    console.error('Save purchase error:', error);
    showPurchaseFormError(error.message || 'Gagal menyimpan pembelian');
    btnText.textContent = 'Simpan';
  }
}

function showPurchaseFormError(msg) {
  const el = document.getElementById('purchaseFormError');
  el.textContent = msg;
  el.style.display = 'block';
}

async function openPayPurchaseModal(purchaseId) {
  try {
    const purchase = await apiClient.get(`/purchases/${purchaseId}`);
    if (purchase.payment_status === 'paid') { showToast('Pembelian sudah lunas', 'info'); return; }

    document.getElementById('payPurchaseId').value        = purchase.id;
    document.getElementById('payPurchaseCode').textContent = purchase.purchase_code;
    document.getElementById('paySupplier').textContent     = purchase.supplier_name || '-';
    document.getElementById('payTotal').textContent        = formatCurrency(purchase.total_amount);
    document.getElementById('payAlreadyPaid').textContent  = formatCurrency(purchase.paid_amount || 0);
    document.getElementById('payRemaining').textContent    = formatCurrency(purchase.remaining_amount || 0);
    document.getElementById('payAmount').value             = '';
    document.getElementById('payAmount').max               = purchase.remaining_amount || 0;
    document.getElementById('payPurchaseError').style.display = 'none';
    document.getElementById('payPurchaseModal').style.display = 'flex';
    setTimeout(() => document.getElementById('payAmount').focus(), 100);
  } catch (error) {
    console.error('Open pay purchase modal error:', error);
    showToast('Gagal memuat data pembelian', 'error');
  }
}

function closePayPurchaseModal() {
  document.getElementById('payPurchaseModal').style.display = 'none';
}

async function handlePayPurchase(e) {
  e.preventDefault();
  const purchaseId = parseInt(document.getElementById('payPurchaseId').value);
  const amount     = parseFloat(document.getElementById('payAmount').value) || 0;
  const remaining  = parseCurrency(document.getElementById('payRemaining').textContent);

  if (amount <= 0)       { showPayPurchaseError('Jumlah bayar harus lebih dari 0'); return; }
  if (amount > remaining) { showPayPurchaseError('Jumlah bayar melebihi sisa hutang'); return; }
  if (!confirm(`Yakin ingin membayar ${formatCurrency(amount)} untuk pembelian ini?`)) return;

  try {
    await apiClient.post(`/purchases/${purchaseId}/pay`, { amount });
    closePayPurchaseModal();
    await loadPurchases();
    showToast('Pembayaran berhasil diproses', 'success');
  } catch (error) {
    console.error('Process purchase payment error:', error);
    showPayPurchaseError(error.message || 'Gagal memproses pembayaran');
  }
}

function showPayPurchaseError(msg) {
  const el = document.getElementById('payPurchaseError');
  el.textContent = msg;
  el.style.display = 'block';
}

async function openDetailPurchase(purchaseId) {
  try {
    const purchase = await apiClient.get(`/purchases/${purchaseId}`);
    displayPurchaseDetail(purchase);
    document.getElementById('detailPurchaseModal').style.display = 'flex';
  } catch (error) {
    console.error('Open detail purchase error:', error);
    showToast('Gagal memuat detail pembelian', 'error');
  }
}

function displayPurchaseDetail(purchase) {
  const container = document.getElementById('purchaseDetailContent');
  const items     = purchase.items || purchase.purchase_items || [];

  container.innerHTML = `
    <div class="detail-section">
      <h3>Informasi Pembelian</h3>
      <div class="detail-grid">
        <div class="detail-item"><span class="detail-label">Kode PO:</span><strong><code>${escapeHtml(purchase.purchase_code)}</code></strong></div>
        <div class="detail-item"><span class="detail-label">Tanggal:</span><strong>${formatDateOnly(purchase.purchase_date)}</strong></div>
        <div class="detail-item"><span class="detail-label">Supplier:</span><strong>${escapeHtml(purchase.supplier_name || '-')}</strong></div>
        <div class="detail-item"><span class="detail-label">User:</span><strong>${escapeHtml(purchase.user_name || '-')}</strong></div>
        <div class="detail-item"><span class="detail-label">Status Bayar:</span><span class="badge ${getPaymentStatusClass(purchase.payment_status)}">${getPaymentStatusLabel(purchase.payment_status)}</span></div>
        ${purchase.notes ? `<div class="detail-item"><span class="detail-label">Catatan:</span><span>${escapeHtml(purchase.notes)}</span></div>` : ''}
      </div>
    </div>

    <div class="detail-section">
      <h3>Item Pembelian</h3>
      <table class="detail-table">
        <thead><tr><th>No</th><th>Nama Produk</th><th>Qty</th><th>Satuan</th><th>Harga Beli</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${items.map((item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escapeHtml(item.product_name || item.name || '-')}</td>
              <td>${item.quantity}</td>
              <td>${escapeHtml(item.unit || 'pcs')}</td>
              <td>${formatCurrency(item.purchase_price || item.unit_price || 0)}</td>
              <td><strong>${formatCurrency(item.subtotal || (item.quantity * (item.purchase_price || 0)))}</strong></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="detail-section">
      <div class="payment-detail">
        <div class="payment-row total-row"><span>Total Pembelian:</span><strong>${formatCurrency(purchase.total_amount)}</strong></div>
        <div class="payment-row"><span>Sudah Dibayar:</span><strong class="text-success">${formatCurrency(purchase.paid_amount || 0)}</strong></div>
        <div class="payment-row"><span>Sisa Hutang:</span><strong class="${(purchase.remaining_amount || 0) > 0 ? 'text-danger' : 'text-success'}">${formatCurrency(purchase.remaining_amount || 0)}</strong></div>
      </div>
    </div>`;
}

function closeDetailPurchaseModal() {
  document.getElementById('detailPurchaseModal').style.display = 'none';
}

function confirmDeletePurchase(purchaseId, purchaseCode) {
  if (!confirm(`Yakin ingin menghapus pembelian "${purchaseCode}"? Stok produk akan dikembalikan.`)) return;
  deletePurchase(purchaseId);
}

async function deletePurchase(purchaseId) {
  try {
    await apiClient.delete(`/purchases/${purchaseId}`);
    await loadPurchases();
    showToast('Pembelian berhasil dihapus', 'success');
  } catch (error) {
    console.error('Delete purchase error:', error);
    showToast('Gagal menghapus pembelian', 'error');
  }
}

// ============================================
// SUPPLIER RETURNS
// ============================================

async function loadReturns() {
  try {
    const params = {};
    const supplierId = document.getElementById('returnFilterSupplier').value;
    const status     = document.getElementById('returnFilterStatus').value;
    const startDate  = document.getElementById('returnFilterStartDate').value;
    const endDate    = document.getElementById('returnFilterEndDate').value;
    if (supplierId) params.supplier_id = supplierId;
    if (status)     params.status      = status;
    if (startDate)  params.start_date  = startDate;
    if (endDate)    params.end_date    = endDate;

    const result = await apiClient.get('/supplier-returns', params);
    allReturns = result.items || result.returns || (Array.isArray(result) ? result : []);
    renderReturnsTable(allReturns);
    updateReturnsSummary(allReturns);
  } catch (error) {
    console.error('loadReturns error:', error);
    showToast('Gagal memuat data retur', 'error');
  }
}

function renderReturnsTable(returns) {
  const tbody = document.getElementById('returnsTableBody');
  if (!returns.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data retur</td></tr>';
    return;
  }
  tbody.innerHTML = returns.map(r => `
    <tr>
      <td><strong>${escapeHtml(r.return_code)}</strong></td>
      <td>${formatDateOnly(r.return_date)}</td>
      <td>${escapeHtml(r.supplier_name || '-')}</td>
      <td>${formatCurrency(r.total_return_amount)}</td>
      <td>${escapeHtml(r.reason || '-')}</td>
      <td>${renderReturnStatusBadge(r.status)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-sm btn-info" onclick="openDetailReturnModal(${r.id})">Detail</button>
          ${r.status === 'pending' ? `<button class="btn btn-sm btn-danger" onclick="confirmDeleteReturn(${r.id}, '${escapeHtml(r.return_code)}')">Hapus</button>` : ''}
        </div>
      </td>
    </tr>`).join('');
}

function renderReturnStatusBadge(status) {
  if (status === 'approved') return '<span class="badge badge-success">Disetujui</span>';
  if (status === 'rejected') return '<span class="badge badge-danger">Ditolak</span>';
  return '<span class="badge badge-warning">Diproses</span>';
}

function updateReturnsSummary(returns) {
  document.getElementById('returnsTotal').textContent = formatCurrency(returns.reduce((s, r) => s + (r.total_return_amount || 0), 0));
  document.getElementById('returnsCount').textContent = returns.length;
}

async function loadPurchasesForReturn() {
  try {
    const result      = await apiClient.get('/purchases');
    purchasesForReturn = result.items || result.purchases || (Array.isArray(result) ? result : []);
    const select      = document.getElementById('returnPurchaseId');
    select.innerHTML  = '<option value="">-- Pilih PO --</option>';
    purchasesForReturn.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.purchase_code} - ${p.supplier_name || 'Tanpa Supplier'} (${formatDateOnly(p.purchase_date)})`;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error('loadPurchasesForReturn error:', error);
  }
}

async function loadReturnSupplierFilter() {
  try {
    const result   = await apiClient.get('/suppliers/active');
    const suppliers = Array.isArray(result) ? result : (result.items || result.suppliers || []);
    const select   = document.getElementById('returnFilterSupplier');
    select.innerHTML = '<option value="">Semua Supplier</option>';
    suppliers.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      select.appendChild(opt);
    });
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
  document.getElementById('returnDate').value = toISODate(new Date());
  returnPurchaseItems = [];
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
    const [purchase, itemsResult] = await Promise.all([
      apiClient.get(`/purchases/${parseInt(purchaseId)}`),
      apiClient.get(`/purchases/${parseInt(purchaseId)}/items`)
    ]);

    returnPurchaseItems = Array.isArray(itemsResult) ? itemsResult : (itemsResult.items || []);

    document.getElementById('returnSupplierName').textContent    = purchase.supplier_name || 'Tanpa Supplier';
    document.getElementById('returnPurchaseStatus').textContent  = getPaymentStatusLabel(purchase.payment_status);
    document.getElementById('returnRemainingDebt').textContent   = formatCurrency(purchase.remaining_amount || 0);
    document.getElementById('returnSupplierInfo').classList.remove('hidden');

    renderReturnItemsSelect(returnPurchaseItems);
    document.getElementById('returnItemsSection').classList.remove('hidden');
  } catch (error) {
    console.error('handleReturnPurchaseChange error:', error);
    showToast('Gagal memuat item pembelian', 'error');
  }
}

function renderReturnItemsSelect(items) {
  const tbody = document.getElementById('returnItemsSelectBody');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada item</td></tr>';
    return;
  }
  tbody.innerHTML = items.map((item, i) => `
    <tr>
      <td><input type="checkbox" class="return-item-check" data-index="${i}" onchange="handleReturnItemCheck(this)"></td>
      <td>${escapeHtml(item.product_name || item.name || '-')}</td>
      <td>${item.quantity}</td>
      <td>${escapeHtml(item.unit || 'pcs')}</td>
      <td>${formatCurrency(item.purchase_price || 0)}</td>
      <td><input type="number" class="return-qty-input" data-index="${i}" min="0.01" max="${item.quantity}" step="0.01" value="${item.quantity}" style="width:80px" oninput="calculateReturnSubtotal(${i})" disabled></td>
      <td class="return-subtotal" data-index="${i}">${formatCurrency(0)}</td>
    </tr>`).join('');
}

function handleReturnItemCheck(checkbox) {
  const index   = checkbox.dataset.index;
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
  const item    = returnPurchaseItems[index];
  const qty     = parseFloat(document.querySelector(`.return-qty-input[data-index="${index}"]`).value) || 0;
  document.querySelector(`.return-subtotal[data-index="${index}"]`).textContent = formatCurrency(qty * (item.purchase_price || 0));
  updateReturnTotal();
}

function updateReturnTotal() {
  let total = 0;
  document.querySelectorAll('.return-item-check:checked').forEach(chk => {
    const index = chk.dataset.index;
    const item  = returnPurchaseItems[index];
    const qty   = parseFloat(document.querySelector(`.return-qty-input[data-index="${index}"]`).value) || 0;
    total += qty * (item.purchase_price || 0);
  });
  document.getElementById('returnTotalAmount').textContent = formatCurrency(total);
}

async function handleReturnFormSubmit(e) {
  e.preventDefault();
  const errorEl   = document.getElementById('returnFormError');
  errorEl.classList.add('hidden');

  const purchaseId = parseInt(document.getElementById('returnPurchaseId').value);
  const returnDate = document.getElementById('returnDate').value;
  const reason     = document.getElementById('returnReason').value;
  const notes      = document.getElementById('returnNotes').value;

  if (!purchaseId || !returnDate || !reason) {
    errorEl.textContent = 'PO, tanggal, dan alasan retur wajib diisi';
    errorEl.classList.remove('hidden');
    return;
  }

  const purchase     = purchasesForReturn.find(p => p.id === purchaseId);
  const supplierName = purchase ? (purchase.supplier_name || '') : '';

  const checkedItems = [];
  let hasError = false;
  document.querySelectorAll('.return-item-check:checked').forEach(chk => {
    if (hasError) return;
    const index = parseInt(chk.dataset.index);
    const item  = returnPurchaseItems[index];
    const qty   = parseFloat(document.querySelector(`.return-qty-input[data-index="${index}"]`).value) || 0;
    if (qty <= 0) return;
    if (qty > item.quantity) {
      errorEl.textContent = `Qty retur untuk "${item.product_name}" melebihi qty beli`;
      errorEl.classList.remove('hidden');
      hasError = true;
      return;
    }
    checkedItems.push({
      purchase_item_id: item.id,
      product_id:       item.product_id,
      product_name:     item.product_name || item.name || '',
      quantity:         qty,
      unit:             item.unit || 'pcs',
      purchase_price:   item.purchase_price || 0,
      subtotal:         qty * (item.purchase_price || 0)
    });
  });

  if (hasError) return;
  if (!checkedItems.length) {
    errorEl.textContent = 'Pilih minimal satu item yang akan diretur';
    errorEl.classList.remove('hidden');
    return;
  }

  try {
    const result = await apiClient.post('/supplier-returns', {
      purchase_id:   purchaseId,
      supplier_name: supplierName,
      return_date:   returnDate,
      reason,
      notes,
      items: checkedItems
    });
    closeReturnModal();
    await loadReturns();
    const code = result.return_code || result.returnCode || '';
    showToast(`Retur ${code} berhasil disimpan`, 'success');
  } catch (error) {
    console.error('handleReturnFormSubmit error:', error);
    errorEl.textContent = error.message || 'Gagal menyimpan retur';
    errorEl.classList.remove('hidden');
  }
}

async function openDetailReturnModal(id) {
  currentReturnId = id;
  try {
    const r = await apiClient.get(`/supplier-returns/${id}`);
    const ret = r.return || r;

    document.getElementById('detailReturnCode').textContent     = ret.return_code;
    document.getElementById('detailReturnDate').textContent     = formatDateOnly(ret.return_date);
    document.getElementById('detailReturnSupplier').textContent = ret.supplier_name || '-';
    document.getElementById('detailReturnReason').textContent   = ret.reason || '-';
    document.getElementById('detailReturnStatus').innerHTML     = renderReturnStatusBadge(ret.status);
    document.getElementById('detailReturnTotal').textContent    = formatCurrency(ret.total_return_amount);
    document.getElementById('detailReturnNotes').textContent    = ret.notes || '-';
    document.getElementById('detailReturnUser').textContent     = ret.user_name || '-';

    const tbody = document.getElementById('detailReturnItemsBody');
    const items = ret.items || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada item</td></tr>';
    } else {
      tbody.innerHTML = items.map(item => `
        <tr>
          <td>${escapeHtml(item.product_name || '-')}</td>
          <td>${item.quantity}</td>
          <td>${escapeHtml(item.unit || 'pcs')}</td>
          <td>${formatCurrency(item.purchase_price || 0)}</td>
          <td>${formatCurrency(item.subtotal || 0)}</td>
        </tr>`).join('');
    }

    const btnDone = document.getElementById('btnMarkReturnDone');
    btnDone.style.display = (ret.status === 'pending' || ret.status === 'diproses') ? 'inline-block' : 'none';

    document.getElementById('detailReturnModal').style.display = 'flex';
  } catch (error) {
    console.error('openDetailReturnModal error:', error);
    showToast('Gagal memuat detail retur', 'error');
  }
}

function closeDetailReturnModal() {
  document.getElementById('detailReturnModal').style.display = 'none';
  currentReturnId = null;
}

async function markReturnDone() {
  if (!currentReturnId) return;
  try {
    await apiClient.patch(`/supplier-returns/${currentReturnId}/status`, { status: 'approved' });
    closeDetailReturnModal();
    await loadReturns();
    showToast('Status retur diubah menjadi Disetujui', 'success');
  } catch (error) {
    console.error('markReturnDone error:', error);
    showToast('Gagal mengubah status retur', 'error');
  }
}

function confirmDeleteReturn(id, code) {
  if (!confirm(`Yakin ingin menghapus retur "${code}"? Stok dan hutang akan dikembalikan.`)) return;
  deleteReturn(id);
}

async function deleteReturn(id) {
  try {
    await apiClient.delete(`/supplier-returns/${id}`);
    await loadReturns();
    showToast('Retur berhasil dihapus', 'success');
  } catch (error) {
    console.error('deleteReturn error:', error);
    showToast('Gagal menghapus retur', 'error');
  }
}

// ============================================
// UTILITY
// ============================================

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
}

function parseCurrency(str) {
  return parseFloat(String(str).replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0;
}

function formatDateOnly(str) {
  if (!str) return '-';
  return new Date(str).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimeOnly(str) {
  if (!str) return '-';
  return new Date(str).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generatePurchaseCode() {
  const now  = new Date();
  const yy   = String(now.getFullYear()).slice(-2);
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `PO${yy}${mm}${dd}${rand}`;
}

function getPaymentStatusClass(status) {
  const map = { paid: 'badge-success', unpaid: 'badge-danger', partial: 'badge-warning' };
  return map[status] || 'badge-secondary';
}

function getPaymentStatusLabel(status) {
  const map = { paid: 'Lunas', unpaid: 'Belum Bayar', partial: 'Bayar Sebagian' };
  return map[status] || (status || '-');
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
