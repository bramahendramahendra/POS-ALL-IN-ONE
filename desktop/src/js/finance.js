// Finance Page - Kas, Pengeluaran
let currentUser = null;
let allExpenses = [];
let allCashDrawers = [];
let editingExpenseId = null;
let currentCashDrawer = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Finance page loaded');

  // Initialize page layout
  if (!initializePageLayout('keuangan')) {
    return;
  }

  currentUser = getCurrentUser();

  // Check role - only owner and admin
  if (currentUser.role === 'kasir') {
    showToast('Anda tidak memiliki akses ke halaman ini', 'error');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
    return;
  }

  // Setup event listeners
  setupEventListeners();

  // Load initial data
  await loadShiftsFilterDropdown();
  await loadDashboard();

  // Populate dropdowns
  populateExpenseCategories();
});

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Dashboard filters
  document.getElementById('btnApplyDashboardFilter').addEventListener('click', loadDashboard);

  // Shift summary
  document.getElementById('btnApplyShiftSummaryFilter').addEventListener('click', loadShiftSummary);

  // Rupiah inputs
  setupRupiahInput('openingBalance');
  setupRupiahInput('closingBalance');
  setupRupiahInput('expenseAmount');
  document.getElementById('closingBalance').addEventListener('input', calculateDifference);

  // Expenses
  document.getElementById('btnAddExpense').addEventListener('click', openAddExpenseModal);
  document.getElementById('btnApplyExpenseFilter').addEventListener('click', loadExpenses);
  document.getElementById('closeExpenseModal').addEventListener('click', closeExpenseModal);
  document.getElementById('btnCancelExpense').addEventListener('click', closeExpenseModal);
  document.getElementById('expenseForm').addEventListener('submit', handleExpenseFormSubmit);

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    const modals = ['expenseModal'];
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

function switchTab(tabName) {
  // Update tab buttons
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update tab content
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.classList.remove('active');
  });

  document.getElementById(`${tabName}-tab`).classList.add('active');

  // Load data for active tab
  if (tabName === 'dashboard') {
    loadDashboard();
  } else if (tabName === 'expenses') {
    loadExpenses();
  } else if (tabName === 'shift-summary') {
    loadShiftSummary();
  }
}

// ============================================
// DASHBOARD
// ============================================

async function loadDashboard() {
  try {
    // Get date range
    const startDate = document.getElementById('dashboardStartDate').value;
    const endDate = document.getElementById('dashboardEndDate').value;

    // Set default to current month if empty
    if (!startDate || !endDate) {
      const monthRange = getCurrentMonthRange();
      document.getElementById('dashboardStartDate').value = monthRange.startDate;
      document.getElementById('dashboardEndDate').value = monthRange.endDate;
    }

    const filters = {
      startDate: document.getElementById('dashboardStartDate').value,
      endDate: document.getElementById('dashboardEndDate').value
    };

    const result = await window.api.finance.getDashboard(filters);

    if (result.success) {
      const dashboard = result.dashboard;

      // Update summary cards
      document.getElementById('totalSales').textContent = formatCurrency(dashboard.total_sales);
      document.getElementById('totalExpenses').textContent = formatCurrency(dashboard.total_expenses);
      document.getElementById('grossProfit').textContent = formatCurrency(dashboard.gross_profit);
      document.getElementById('netProfit').textContent = formatCurrency(dashboard.net_profit);

      // Update quick stats
      document.getElementById('totalTransactions').textContent = dashboard.total_transactions;
      document.getElementById('avgTransaction').textContent = formatCurrency(dashboard.avg_transaction);
      document.getElementById('totalCOGS').textContent = formatCurrency(dashboard.cogs);

      // Render chart
      renderSalesExpensesChart(dashboard.chart_data);
    } else {
      showToast('Gagal memuat dashboard keuangan', 'error');
    }

    // Load top products
    await loadTopProducts(filters);
  } catch (error) {
    console.error('Load dashboard error:', error);
    showToast('Terjadi kesalahan saat memuat dashboard', 'error');
  }
}

async function loadTopProducts(filters) {
  try {
    const result = await window.api.finance.getTopProducts(filters);

    if (result.success) {
      renderTopProducts(result.topProducts);
    }
  } catch (error) {
    console.error('Load top products error:', error);
  }
}

function renderTopProducts(products) {
  const container = document.getElementById('topProductsList');

  if (products.length === 0) {
    container.innerHTML = '<p class="text-center">Tidak ada data</p>';
    return;
  }

  container.innerHTML = products.map((product, index) => `
    <div class="top-product-item">
      <div class="top-product-rank">${index + 1}</div>
      <div class="top-product-info">
        <strong>${escapeHtml(product.product_name)}</strong>
        <div class="top-product-stats">
          <span>Terjual: ${product.total_quantity}</span>
          <span>•</span>
          <span>Omzet: ${formatCurrency(product.total_sales)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderSalesExpensesChart(data) {
  // Simple canvas-based chart (you can use Chart.js library if needed)
  const canvas = document.getElementById('salesExpensesChart');
  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!data || data.length === 0) {
    ctx.fillStyle = '#7f8c8d';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Tidak ada data untuk ditampilkan', canvas.width / 2, canvas.height / 2);
    return;
  }

  // For now, just display text
  ctx.fillStyle = '#2c3e50';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Data ${data.length} hari`, canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillText('Chart akan ditampilkan di sini', canvas.width / 2, canvas.height / 2 + 10);
}

// ============================================
// CASH DRAWER
// ============================================

async function checkCurrentCashDrawer() {
  try {
    const result = await apiClient.get('/cash-drawer/current');

    if (result.success) {
      currentCashDrawer = result.data;
      renderCashStatus(currentCashDrawer);
    } else {
      showToast('Gagal memuat status kas', 'error');
    }
  } catch (error) {
    console.error('Check current cash drawer error:', error);
    renderCashStatus(null);
  }
}

function renderCashStatus(cashDrawer) {
  const container = document.getElementById('cashStatusContent');

  if (!cashDrawer) {
    // Kas belum dibuka
    container.innerHTML = `
      <div class="cash-status-closed">
        <p class="status-message">Kas belum dibuka hari ini</p>
        <button class="btn btn-success btn-large" onclick="openOpenCashModal()">
          🔓 Buka Kas
        </button>
      </div>
    `;
  } else {
    // Kas sudah dibuka
    const openTime = new Date(cashDrawer.open_time);
    container.innerHTML = `
      <div class="cash-status-open">
        <div class="status-badge badge-success">● KAS TERBUKA</div>
        <div class="cash-info-grid">
          <div class="cash-info-item">
            <span class="label">Kasir:</span>
            <strong>${escapeHtml(currentUser.full_name)}</strong>
          </div>
          <div class="cash-info-item">
            <span class="label">Waktu Buka:</span>
            <strong>${formatTimeOnly(cashDrawer.open_time)}</strong>
          </div>
          <div class="cash-info-item">
            <span class="label">Saldo Awal:</span>
            <strong>${formatCurrency(cashDrawer.opening_balance)}</strong>
          </div>
          <div class="cash-info-item">
            <span class="label">Penjualan Cash:</span>
            <strong>${formatCurrency(cashDrawer.total_cash_sales)}</strong>
          </div>
          <div class="cash-info-item">
            <span class="label">Pengeluaran:</span>
            <strong>${formatCurrency(cashDrawer.total_expenses)}</strong>
          </div>
          <div class="cash-info-item">
            <span class="label">Expected Balance:</span>
            <strong class="text-success">${formatCurrency(cashDrawer.opening_balance + cashDrawer.total_cash_sales - cashDrawer.total_expenses)}</strong>
          </div>
        </div>
        ${cashDrawer.notes ? `<p class="cash-notes">Catatan: ${escapeHtml(cashDrawer.notes)}</p>` : ''}
        <button class="btn btn-danger btn-large" onclick="openCloseCashModal(${cashDrawer.id})">
          🔒 Tutup Kas
        </button>
      </div>
    `;
  }
}

async function loadCashDrawerHistory() {
  try {
    const filters = {
      startDate: document.getElementById('cashFilterStartDate').value,
      endDate: document.getElementById('cashFilterEndDate').value,
      shiftId: document.getElementById('cashFilterShift').value || null
    };

    // Set default to last 30 days if empty
    if (!filters.startDate || !filters.endDate) {
      const range = getLastNDaysRange(30);
      document.getElementById('cashFilterStartDate').value = range.startDate;
      document.getElementById('cashFilterEndDate').value = range.endDate;
      filters.startDate = range.startDate;
      filters.endDate = range.endDate;
    }

    const result = await apiClient.get('/cash-drawer', {
      start_date: filters.startDate,
      end_date: filters.endDate,
      shift_id: filters.shiftId
    });

    if (result.success) {
      allCashDrawers = result.history || [];
      renderCashDrawerTable(allCashDrawers);
    } else {
      showToast('Gagal memuat riwayat kas', 'error');
    }
  } catch (error) {
    console.error('Load cash drawer history error:', error);
    showToast('Terjadi kesalahan saat memuat riwayat kas', 'error');
  }
}

function renderCashDrawerTable(cashDrawers) {
  const tbody = document.getElementById('cashDrawerTableBody');

  if (cashDrawers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="text-center">Tidak ada data kas</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = cashDrawers.map(cash => `
    <tr>
      <td>
        <div>${formatDateOnly(cash.open_time)}</div>
        <small>${formatTimeOnly(cash.open_time)}</small>
      </td>
      <td>${escapeHtml(cash.cashier_name)}</td>
      <td>
        ${cash.shift_name
          ? `<span class="badge badge-info">${escapeHtml(cash.shift_name)}</span>`
          : '<span class="text-muted">-</span>'}
      </td>
      <td>${formatCurrency(cash.opening_balance)}</td>
      <td>${formatCurrency(cash.total_cash_sales)}</td>
      <td>${formatCurrency(cash.total_expenses)}</td>
      <td>${formatCurrency(cash.expected_balance || 0)}</td>
      <td>${cash.closing_balance !== null ? formatCurrency(cash.closing_balance) : '-'}</td>
      <td>
        ${cash.difference !== null ? 
          `<span class="${cash.difference === 0 ? 'text-success' : 'text-danger'}">${formatCurrency(cash.difference)}</span>` 
          : '-'}
      </td>
      <td>
        <span class="badge ${cash.status === 'open' ? 'badge-success' : 'badge-secondary'}">
          ${cash.status === 'open' ? 'Open' : 'Closed'}
        </span>
      </td>
      <td class="action-buttons">
        <button class="btn-icon" onclick="openDetailCashDrawer(${cash.id})" title="Detail">
          👁️
        </button>
      </td>
    </tr>
  `).join('');
}

// Open Cash Drawer Modal
function openOpenCashModal() {
  document.getElementById('openCashForm').reset();
  document.getElementById('openCashError').style.display = 'none';
  document.getElementById('openCashModal').style.display = 'flex';

  setTimeout(() => {
    document.getElementById('openingBalance').focus();
  }, 100);
}

function closeOpenCashModal() {
  document.getElementById('openCashModal').style.display = 'none';
}

async function handleOpenCash(e) {
  e.preventDefault();

  const openingBalance = parseRupiahInput('openingBalance');
  const notes = document.getElementById('openCashNotes').value.trim();

  if (openingBalance < 0) {
    showOpenCashError('Saldo awal tidak boleh negatif');
    return;
  }

  showConfirm(
    'Konfirmasi Buka Kas',
    `Yakin ingin membuka kas dengan saldo awal ${formatCurrency(openingBalance)}?`,
    async () => {
      await openCashDrawer({ opening_balance: openingBalance, notes });
    }
  );
}

async function openCashDrawer(data) {
  // Offline — antri ke sync_queue
  if (typeof connectionMonitor !== 'undefined' && !connectionMonitor.isOnline) {
    try {
      await window.syncQueue.add({
        entity:  'cash_drawer',
        action:  'open',
        payload: { ...data, date: new Date().toISOString().slice(0, 10) },
      });
      showToast('Kas harian dibuka offline. Akan disinkronkan saat online.', 'warning');
      closeOpenCashModal();
    } catch (err) {
      console.error('Offline open cash drawer error:', err);
      showOpenCashError('Gagal menyimpan kas offline');
    }
    return;
  }

  try {
    const result = await apiClient.post('/cash-drawer/open', data);

    if (result.success) {
      showToast('Kas berhasil dibuka', 'success');
      closeOpenCashModal();
      await checkCurrentCashDrawer();
    } else {
      showOpenCashError(result.message || 'Gagal membuka kas');
    }
  } catch (error) {
    console.error('Open cash drawer error:', error);
    showOpenCashError('Terjadi kesalahan saat membuka kas');
  }
}

function showOpenCashError(message) {
  const errorDiv = document.getElementById('openCashError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// Close Cash Drawer Modal
function openCloseCashModal(cashDrawerId) {
  if (!currentCashDrawer) return;

  document.getElementById('closeCashDrawerId').value = cashDrawerId;
  document.getElementById('closeOpeningBalance').textContent = formatCurrency(currentCashDrawer.opening_balance);
  document.getElementById('closeCashSales').textContent = formatCurrency(currentCashDrawer.total_cash_sales);
  document.getElementById('closeExpenses').textContent = formatCurrency(currentCashDrawer.total_expenses);

  const expected = currentCashDrawer.opening_balance + currentCashDrawer.total_cash_sales - currentCashDrawer.total_expenses;
  document.getElementById('closeExpectedBalance').textContent = formatCurrency(expected);

  document.getElementById('closingBalance').value = '';
  document.getElementById('closeCashNotes').value = '';
  document.getElementById('differenceDisplay').style.display = 'none';
  document.getElementById('closeCashError').style.display = 'none';

  document.getElementById('closeCashModal').style.display = 'flex';

  setTimeout(() => {
    document.getElementById('closingBalance').focus();
  }, 100);
}

function closeCloseCashModal() {
  document.getElementById('closeCashModal').style.display = 'none';
}

function calculateDifference() {
  if (!currentCashDrawer) return;

  const closingBalance = parseRupiahInput('closingBalance');
  const expected = currentCashDrawer.opening_balance + currentCashDrawer.total_cash_sales - currentCashDrawer.total_expenses;
  const difference = closingBalance - expected;

  const differenceEl = document.getElementById('differenceAmount');
  differenceEl.textContent = formatCurrency(difference);

  if (difference === 0) {
    differenceEl.className = 'text-success';
  } else {
    differenceEl.className = 'text-danger';
  }

  document.getElementById('differenceDisplay').style.display = 'flex';
}

async function handleCloseCash(e) {
  e.preventDefault();

  const cashDrawerId = parseInt(document.getElementById('closeCashDrawerId').value);
  const closingBalance = parseRupiahInput('closingBalance');
  const notes = document.getElementById('closeCashNotes').value.trim();

  if (closingBalance < 0) {
    showCloseCashError('Saldo akhir tidak boleh negatif');
    return;
  }

  showConfirm(
    'Konfirmasi Tutup Kas',
    `Yakin ingin menutup kas dengan saldo akhir ${formatCurrency(closingBalance)}?`,
    async () => {
      await closeCashDrawer(cashDrawerId, { closing_balance: closingBalance, notes });
    }
  );
}

async function closeCashDrawer(cashDrawerId, data) {
  try {
    const result = await apiClient.post(`/cash-drawer/${cashDrawerId}/close`, data);

    if (result.success) {
      showToast('Kas berhasil ditutup', 'success');
      closeCloseCashModal();
      await checkCurrentCashDrawer();
      await loadCashDrawerHistory();
    } else {
      showCloseCashError(result.message || 'Gagal menutup kas');
    }
  } catch (error) {
    console.error('Close cash drawer error:', error);
    showCloseCashError('Terjadi kesalahan saat menutup kas');
  }
}

function showCloseCashError(message) {
  const errorDiv = document.getElementById('closeCashError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// Detail Cash Drawer
async function openDetailCashDrawer(cashDrawerId) {
  try {
    const result = await apiClient.get(`/cash-drawer/${cashDrawerId}`);

    if (result.success) {
      displayCashDrawerDetail(result.data);
      document.getElementById('detailCashModal').style.display = 'flex';
    } else {
      showToast('Gagal memuat detail kas', 'error');
    }
  } catch (error) {
    console.error('Open detail cash drawer error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function displayCashDrawerDetail(cashDrawer) {
  const container = document.getElementById('cashDetailContent');

  const transactions = cashDrawer.transactions || [];
  const expenses = cashDrawer.expenses || [];

  // Use calculated values if available (more accurate)
  const totalCashSales = cashDrawer.calculated_cash_sales || cashDrawer.total_cash_sales;
  const totalExpenses = cashDrawer.calculated_expenses || cashDrawer.total_expenses;
  const expectedBalance = cashDrawer.opening_balance + totalCashSales - totalExpenses;

  container.innerHTML = `
    <div class="detail-section">
      <h3>Informasi Kas</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Kasir:</span>
          <strong>${escapeHtml(cashDrawer.cashier_name)}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">Tanggal:</span>
          <strong>${formatDateOnly(cashDrawer.open_time)}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">Waktu Buka:</span>
          <strong>${formatTimeOnly(cashDrawer.open_time)}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">Waktu Tutup:</span>
          <strong>${cashDrawer.close_time ? formatTimeOnly(cashDrawer.close_time) : '-'}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">Saldo Awal:</span>
          <strong>${formatCurrency(cashDrawer.opening_balance)}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">Saldo Akhir:</span>
          <strong>${cashDrawer.closing_balance !== null ? formatCurrency(cashDrawer.closing_balance) : '-'}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status:</span>
          <span class="badge ${cashDrawer.status === 'open' ? 'badge-success' : 'badge-secondary'}">
            ${cashDrawer.status === 'open' ? 'Open' : 'Closed'}
          </span>
        </div>
        ${cashDrawer.notes ? `
        <div class="detail-item">
          <span class="detail-label">Catatan:</span>
          <span>${escapeHtml(cashDrawer.notes)}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="detail-section">
      <h3>Transaksi Penjualan Cash (${transactions.length})</h3>
      ${transactions.length > 0 ? `
        <table class="detail-table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Kode</th>
              <th>Customer</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(tx => `
              <tr>
                <td>${formatTimeOnly(tx.transaction_date)}</td>
                <td><code>${escapeHtml(tx.transaction_code)}</code></td>
                <td>${escapeHtml(tx.customer_name || '-')}</td>
                <td><strong>${formatCurrency(tx.total_amount)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p class="text-center">Tidak ada transaksi cash</p>'}
    </div>

    <div class="detail-section">
      <h3>Pengeluaran (${expenses.length})</h3>
      ${expenses.length > 0 ? `
        <table class="detail-table">
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map(exp => `
              <tr>
                <td>${escapeHtml(exp.category)}</td>
                <td>${escapeHtml(exp.description)}</td>
                <td><strong>${formatCurrency(exp.amount)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="expense-summary-note">
          <strong>Total Pengeluaran: ${formatCurrency(totalExpenses)}</strong>
        </div>
      ` : '<p class="text-center">Tidak ada pengeluaran</p>'}
    </div>

    <div class="detail-section">
      <div class="payment-detail">
        <div class="payment-row">
          <span>Saldo Awal:</span>
          <strong>${formatCurrency(cashDrawer.opening_balance)}</strong>
        </div>
        <div class="payment-row">
          <span>Total Penjualan Cash:</span>
          <strong class="text-success">+ ${formatCurrency(totalCashSales)}</strong>
        </div>
        <div class="payment-row">
          <span>Total Pengeluaran:</span>
          <strong class="text-danger">- ${formatCurrency(totalExpenses)}</strong>
        </div>
        <div class="payment-row total-row">
          <span>Expected Balance:</span>
          <strong>${formatCurrency(expectedBalance)}</strong>
        </div>
        ${cashDrawer.closing_balance !== null ? `
        <div class="payment-row">
          <span>Saldo Akhir Aktual:</span>
          <strong>${formatCurrency(cashDrawer.closing_balance)}</strong>
        </div>
        <div class="payment-row">
          <span>Selisih:</span>
          <strong class="${cashDrawer.difference === 0 ? 'text-success' : 'text-danger'}">
            ${formatCurrency(cashDrawer.closing_balance - expectedBalance)}
          </strong>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

function closeDetailCashModal() {
  document.getElementById('detailCashModal').style.display = 'none';
}

// ============================================
// SHIFTS FILTER & SUMMARY
// ============================================

async function loadShiftsFilterDropdown() {
  try {
    const result = await apiClient.get('/shifts');
    if (!result.success) return;

    const select = document.getElementById('cashFilterShift');
    if (!select) return;
    result.data.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.start_time}-${s.end_time})`;
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
    let startDate = document.getElementById('shiftSummaryStartDate').value;
    let endDate = document.getElementById('shiftSummaryEndDate').value;

    if (!startDate || !endDate) {
      const range = getCurrentMonthRange();
      document.getElementById('shiftSummaryStartDate').value = range.startDate;
      document.getElementById('shiftSummaryEndDate').value = range.endDate;
      startDate = range.startDate;
      endDate = range.endDate;
    }

    const result = await apiClient.get('/shifts/summary', { start_date: startDate, end_date: endDate });

    if (!result.success) {
      container.innerHTML = '<p class="text-center text-danger">Gagal memuat ringkasan shift</p>';
      return;
    }

    const summary = result.data;

    if (summary.length === 0) {
      container.innerHTML = '<p class="text-center">Tidak ada data shift untuk periode ini</p>';
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Shift</th>
              <th>Jam Operasional</th>
              <th>Jumlah Sesi</th>
              <th>Total Penjualan</th>
              <th>Total Pengeluaran</th>
              <th>Total Penjualan Cash</th>
              <th>Total Selisih Kas</th>
            </tr>
          </thead>
          <tbody>
            ${summary.map(row => {
              const diff = row.total_difference || 0;
              return `
                <tr>
                  <td><strong>${escapeHtml(row.shift_name)}</strong></td>
                  <td>${row.start_time} - ${row.end_time}</td>
                  <td>${row.session_count || 0}</td>
                  <td class="text-success">${formatCurrency(row.total_sales || 0)}</td>
                  <td class="text-danger">${formatCurrency(row.total_expenses || 0)}</td>
                  <td>${formatCurrency(row.total_cash_sales || 0)}</td>
                  <td class="${diff === 0 ? 'text-success' : diff > 0 ? 'text-warning' : 'text-danger'}">
                    ${formatCurrency(diff)}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3"><strong>Total</strong></td>
              <td class="text-success"><strong>${formatCurrency(summary.reduce((s,r) => s + (r.total_sales||0), 0))}</strong></td>
              <td class="text-danger"><strong>${formatCurrency(summary.reduce((s,r) => s + (r.total_expenses||0), 0))}</strong></td>
              <td><strong>${formatCurrency(summary.reduce((s,r) => s + (r.total_cash_sales||0), 0))}</strong></td>
              <td><strong>${formatCurrency(summary.reduce((s,r) => s + (r.total_difference||0), 0))}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('loadShiftSummary error:', error);
    container.innerHTML = '<p class="text-center text-danger">Terjadi kesalahan</p>';
  }
}

// ============================================
// EXPENSES
// ============================================

async function loadExpenses() {
  try {
    const filters = {
      startDate: document.getElementById('expenseFilterStartDate').value,
      endDate: document.getElementById('expenseFilterEndDate').value,
      category: document.getElementById('expenseFilterCategory').value
    };

    // Set default to current month if empty
    if (!filters.startDate || !filters.endDate) {
      const monthRange = getCurrentMonthRange();
      document.getElementById('expenseFilterStartDate').value = monthRange.startDate;
      document.getElementById('expenseFilterEndDate').value = monthRange.endDate;
      filters.startDate = monthRange.startDate;
      filters.endDate = monthRange.endDate;
    }

    const result = await apiClient.get('/expenses', {
      start_date: filters.startDate,
      end_date: filters.endDate,
      category: filters.category || undefined
    });

    if (result.success) {
      allExpenses = result.data.items;
      renderExpensesTable(allExpenses);
      updateExpensesTotal(allExpenses);
    } else {
      showToast('Gagal memuat data pengeluaran', 'error');
    }
  } catch (error) {
    console.error('Load expenses error:', error);
    showToast('Terjadi kesalahan saat memuat data', 'error');
  }
}

function renderExpensesTable(expenses) {
  const tbody = document.getElementById('expensesTableBody');

  if (expenses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">Tidak ada data pengeluaran</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = expenses.map(expense => `
    <tr>
      <td>${formatDateOnly(expense.expense_date)}</td>
      <td><span class="badge badge-category">${escapeHtml(expense.category)}</span></td>
      <td>${escapeHtml(expense.description)}</td>
      <td><strong>${formatCurrency(expense.amount)}</strong></td>
      <td>${expense.payment_method || '-'}</td>
      <td>${escapeHtml(expense.user_name)}</td>
      <td class="action-buttons">
        <button class="btn-icon" onclick="editExpense(${expense.id})" title="Edit">
          ✏️
        </button>
        <button class="btn-icon" onclick="confirmDeleteExpense(${expense.id}, '${escapeHtml(expense.description)}')" title="Hapus">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

function updateExpensesTotal(expenses) {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  document.getElementById('expensesTotal').textContent = formatCurrency(total);
}

function populateExpenseCategories() {
  const categories = getExpenseCategories();
  
  // For filter dropdown
  const filterSelect = document.getElementById('expenseFilterCategory');
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    filterSelect.appendChild(option);
  });

  // For form dropdown
  const formSelect = document.getElementById('expenseCategory');
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    formSelect.appendChild(option);
  });
}

function openAddExpenseModal() {
  editingExpenseId = null;
  document.getElementById('expenseModalTitle').textContent = 'Tambah Pengeluaran';
  document.getElementById('expenseForm').reset();
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('expenseDate').value = today;
  
  document.getElementById('expenseFormError').style.display = 'none';
  document.getElementById('btnSubmitExpenseText').textContent = 'Simpan';
  document.getElementById('expenseModal').style.display = 'flex';

  setTimeout(() => {
    document.getElementById('expenseDate').focus();
  }, 100);
}

async function editExpense(expenseId) {
  try {
    const result = await apiClient.get(`/expenses/${expenseId}`);

    if (result.success) {
      const expense = result.data;
      editingExpenseId = expenseId;

      document.getElementById('expenseModalTitle').textContent = 'Edit Pengeluaran';
      document.getElementById('expenseId').value = expense.id;
      document.getElementById('expenseDate').value = expense.expense_date.split('T')[0];
      document.getElementById('expenseCategory').value = expense.category;
      document.getElementById('expenseDescription').value = expense.description;
      setRupiahInput('expenseAmount', expense.amount);
      document.getElementById('expensePaymentMethod').value = expense.payment_method || 'cash';
      document.getElementById('expenseNotes').value = expense.notes || '';

      document.getElementById('expenseFormError').style.display = 'none';
      document.getElementById('btnSubmitExpenseText').textContent = 'Update';
      document.getElementById('expenseModal').style.display = 'flex';

      setTimeout(() => {
        document.getElementById('expenseDate').focus();
      }, 100);
    } else {
      showToast('Gagal memuat data pengeluaran', 'error');
    }
  } catch (error) {
    console.error('Edit expense error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function closeExpenseModal() {
  document.getElementById('expenseModal').style.display = 'none';
  editingExpenseId = null;
}

async function handleExpenseFormSubmit(e) {
  e.preventDefault();

  const formData = {
    expense_date: document.getElementById('expenseDate').value,
    category: document.getElementById('expenseCategory').value,
    description: document.getElementById('expenseDescription').value.trim(),
    amount: parseRupiahInput('expenseAmount'),
    payment_method: document.getElementById('expensePaymentMethod').value,
    notes: document.getElementById('expenseNotes').value.trim()
  };

  if (!formData.category || !formData.description) {
    showExpenseFormError('Kategori dan deskripsi harus diisi');
    return;
  }

  if (formData.amount <= 0) {
    showExpenseFormError('Jumlah harus lebih dari 0');
    return;
  }

  const actionText = editingExpenseId ? 'mengupdate' : 'menambahkan';

  showConfirm(
    'Konfirmasi Simpan',
    `Yakin ingin ${actionText} pengeluaran "${formData.description}" sebesar ${formatCurrency(formData.amount)}?`,
    async () => {
      await saveExpense(formData);
    }
  );
}

async function saveExpense(formData) {

  console.log('=== SAVING EXPENSE ===');
  console.log('Expense Data:', formData);
  console.log('Payment Method:', formData.payment_method);
  console.log('Expense Date:', formData.expense_date);
  console.log('Today:', new Date().toISOString().split('T')[0]);

  // Update/delete tidak diizinkan saat offline
  if (typeof connectionMonitor !== 'undefined' && !connectionMonitor.isOnline && editingExpenseId) {
    showExpenseFormError('Tidak dapat mengubah pengeluaran saat offline');
    return;
  }

  // Offline — hanya untuk create baru
  if (typeof connectionMonitor !== 'undefined' && !connectionMonitor.isOnline && !editingExpenseId) {
    try {
      const localId = crypto.randomUUID();
      await window.syncQueue.add({
        entity:  'expense',
        action:  'create',
        localId: localId,
        payload: { ...formData, local_id: localId },
      });
      closeExpenseModal();
      showToast('Pengeluaran disimpan offline. Akan disinkronkan saat online.', 'warning');
    } catch (err) {
      console.error('Offline save expense error:', err);
      showExpenseFormError('Gagal menyimpan pengeluaran offline');
    }
    return;
  }

  try {
    let result;

    if (editingExpenseId) {
      result = await apiClient.put(`/expenses/${editingExpenseId}`, formData);
    } else {
      result = await apiClient.post('/expenses', formData);
    }

    if (result.success) {
      closeExpenseModal();
      await loadExpenses();
      showToast(
        editingExpenseId ? 'Pengeluaran berhasil diupdate' : 'Pengeluaran berhasil ditambahkan',
        'success'
      );
    } else {
      showExpenseFormError(result.message || 'Gagal menyimpan pengeluaran');
    }
  } catch (error) {
    console.error('Save expense error:', error);
    showExpenseFormError('Terjadi kesalahan saat menyimpan');
  }
}

function confirmDeleteExpense(expenseId, description) {
  showConfirm(
    'Konfirmasi Hapus',
    `Yakin ingin menghapus pengeluaran "${description}"?`,
    async () => {
      await deleteExpense(expenseId);
    }
  );
}

async function deleteExpense(expenseId) {
  try {
    const result = await apiClient.delete(`/expenses/${expenseId}`);

    if (result.success) {
      await loadExpenses();
      showToast('Pengeluaran berhasil dihapus', 'success');
    } else {
      showToast(result.message || 'Gagal menghapus pengeluaran', 'error');
    }
  } catch (error) {
    console.error('Delete expense error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function showExpenseFormError(message) {
  const errorDiv = document.getElementById('expenseFormError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

