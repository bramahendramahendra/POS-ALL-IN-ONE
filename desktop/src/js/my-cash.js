// Kas Harian Page - Semua role
let currentUser = null;
let allCashDrawers = [];
let currentCashDrawer = null;
let shiftsCache = [];
// true setelah checkCurrentCashDrawer berhasil minimal sekali — membedakan "belum dimuat" dari "dimuat, hasilnya null"
let cashDrawerStatusLoaded = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  if (!initializePageLayout('my-cash')) {
    return;
  }

  currentUser = getCurrentUser();

  // Tampilkan tab hanya untuk owner/admin
  if (currentUser.role === 'owner' || currentUser.role === 'admin') {
    document.getElementById('kasHarianTabsContainer').style.display = '';
  }

  // Setup event listeners
  setupEventListeners();

  // Load initial data
  await loadShiftsDropdown();
  await checkCurrentCashDrawer();
  await loadMyCashHistory();
});

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Tab switching (owner/admin only)
  document.querySelectorAll('.tab-button[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  // Rekap kas filter
  document.getElementById('btnApplyRekapFilter').addEventListener('click', loadRekapKas);

  // Cash drawer filters
  document.getElementById('btnApplyCashFilter').addEventListener('click', loadMyCashHistory);

  // Open cash modal
  document.getElementById('closeOpenCashModal').addEventListener('click', closeOpenCashModal);
  document.getElementById('btnCancelOpenCash').addEventListener('click', closeOpenCashModal);
  document.getElementById('openCashForm').addEventListener('submit', handleOpenCash);

  // Close cash modal
  document.getElementById('closeCloseCashModal').addEventListener('click', closeCloseCashModal);
  document.getElementById('btnCancelCloseCash').addEventListener('click', closeCloseCashModal);
  document.getElementById('closeCashForm').addEventListener('submit', handleCloseCash);
  setupRupiahInput('openingBalance');
  setupRupiahInput('closingBalance');
  document.getElementById('closingBalance').addEventListener('input', calculateDifference);

  // Detail cash modal
  document.getElementById('closeDetailCashModal').addEventListener('click', closeDetailCashModal);
  document.getElementById('btnCloseDetailCash').addEventListener('click', closeDetailCashModal);

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    const modals = ['openCashModal', 'closeCashModal', 'detailCashModal'];
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

// ============================================
// SHIFTS
// ============================================

async function loadShiftsDropdown() {
  try {
    const result = await apiClient.get('/shifts/active');
    if (result.success) {
      shiftsCache = result.data;
      const select = document.getElementById('openShiftSelect');
      select.innerHTML = '<option value="">-- Pilih Shift --</option>' +
        result.data.map(s =>
          `<option value="${s.id}">${escapeHtml(s.name)} (${s.start_time} - ${s.end_time})</option>`
        ).join('');
    }
  } catch (error) {
    console.error('loadShiftsDropdown error:', error);
  }
}

function getShiftLabel(shiftId, shiftName) {
  if (shiftName) return shiftName;
  if (!shiftId) return '-';
  const s = shiftsCache.find(x => x.id === shiftId);
  return s ? s.name : '-';
}

// ============================================
// CASH DRAWER STATUS
// ============================================

async function checkCurrentCashDrawer() {
  try {
    const result = await apiClient.get('/cash-drawer/current');

    if (result.success) {
      currentCashDrawer = result.data;
      cashDrawerStatusLoaded = true;
      renderCashStatus(currentCashDrawer);
    } else {
      showToast('Gagal memuat status kas', 'error');
      const container = document.getElementById('cashStatusContent');
      container.innerHTML = `
        <div class="empty-state">
          <p class="text-danger">Gagal memuat status kas. Coba refresh halaman.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Check current cash drawer error:', error);
    // Jika offline dan currentCashDrawer sudah pernah dimuat sebelumnya,
    // tampilkan state terakhir yang diketahui — bukan pesan error yang menyembunyikan tombol Tutup Kas.
    const isOffline = typeof connectionMonitor !== 'undefined' && !connectionMonitor.isOnline;
    if (isOffline && cashDrawerStatusLoaded) {
      renderCashStatus(currentCashDrawer);
      return;
    }
    showToast('Gagal memuat status kas, coba refresh halaman', 'error');
    const container = document.getElementById('cashStatusContent');
    container.innerHTML = `
      <div class="empty-state">
        <p class="text-danger">Gagal memuat status kas. Coba refresh halaman.</p>
      </div>
    `;
  }
}

function renderCashStatus(cashDrawer) {
  const container = document.getElementById('cashStatusContent');

  if (!cashDrawer) {
    // Kas belum dibuka
    container.innerHTML = `
      <div class="cash-status-closed">
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <p class="empty-title">Kas Belum Dibuka</p>
          <p class="empty-desc">Buka kas terlebih dahulu untuk memulai transaksi hari ini</p>
        </div>
        <button class="btn btn-success btn-large" onclick="openOpenCashModal()">
          🔓 Buka Kas Sekarang
        </button>
      </div>
    `;
  } else {
    // Kas sudah dibuka
    container.innerHTML = `
      <div class="cash-status-open">
        <div class="status-badge badge-success">● KAS TERBUKA</div>

        <div class="cash-info-grid">
          ${cashDrawer.shift_name ? `
          <div class="cash-info-item">
            <span class="label">Shift:</span>
            <strong>${escapeHtml(cashDrawer.shift_name)}${cashDrawer.shift_start && cashDrawer.shift_end ? ` (${cashDrawer.shift_start} - ${cashDrawer.shift_end})` : ''}</strong>
          </div>` : ''}
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
            <strong class="text-success">${formatCurrency(cashDrawer.total_cash_sales)}</strong>
          </div>
          <div class="cash-info-item">
            <span class="label">Pengeluaran:</span>
            <strong class="text-danger">${formatCurrency(cashDrawer.total_expenses)}</strong>
          </div>
          <div class="cash-info-item">
            <span class="label">Expected Balance:</span>
            <strong class="text-primary">${formatCurrency(cashDrawer.expected_balance)}</strong>
          </div>
          <div class="cash-info-item">
            <span class="label">Durasi:</span>
            <strong>${calculateDuration(cashDrawer.open_time)}</strong>
          </div>
        </div>
        
        ${cashDrawer.open_notes ? `
        <p class="cash-notes">Catatan: ${escapeHtml(cashDrawer.open_notes)}</p>` : ''}
        <button class="btn btn-danger btn-large" onclick="openCloseCashModal(${cashDrawer.id})">
          🔒 Tutup Kas
        </button>
      </div>
    `;
  }
}

function calculateDuration(openTime) {
  const start = new Date(openTime);
  const now = new Date();
  const diffMs = now - start;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours} jam ${diffMins} menit`;
  } else {
    return `${diffMins} menit`;
  }
}

// ============================================
// CASH DRAWER HISTORY (MY CASH ONLY)
// ============================================

async function loadMyCashHistory() {
  try {
    const filters = {
      userId: currentUser.id, // IMPORTANT: Only my cash
      startDate: document.getElementById('cashFilterStartDate').value,
      endDate: document.getElementById('cashFilterEndDate').value
    };

    // Set default masing-masing field jika kosong — tidak override field yang sudah diisi user
    if (!filters.startDate) {
      filters.startDate = getLastNDaysRange(7).startDate;
      document.getElementById('cashFilterStartDate').value = filters.startDate;
    }
    if (!filters.endDate) {
      filters.endDate = new Date().toISOString().split('T')[0];
      document.getElementById('cashFilterEndDate').value = filters.endDate;
    }

    if (filters.startDate > filters.endDate) {
      showToast('Tanggal awal tidak boleh lebih dari tanggal akhir', 'error');
      return;
    }

    const result = await apiClient.get('/cash-drawer', {
      start_date: filters.startDate,
      end_date: filters.endDate,
      user_id: filters.userId
    });

    if (result.success) {
      allCashDrawers = result.data?.items || [];
      renderCashDrawerTable(allCashDrawers);
    } else {
      showToast('Gagal memuat riwayat kas', 'error');
    }
  } catch (error) {
    console.error('Load my cash history error:', error);
    showToast('Terjadi kesalahan saat memuat riwayat kas', 'error');
  }
}

function renderCashDrawerTable(cashDrawers) {
  const tbody = document.getElementById('cashDrawerTableBody');

  if (cashDrawers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center">Tidak ada riwayat kas</td>
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
      <td>
        ${cash.shift_name
          ? `<span class="badge badge-info">${escapeHtml(cash.shift_name)}</span>`
          : '<span class="text-muted">-</span>'}
      </td>
      <td>${formatCurrency(cash.opening_balance)}</td>
      <td class="text-success">${formatCurrency(cash.total_cash_sales)}</td>
      <td class="text-danger">${formatCurrency(cash.total_expenses)}</td>
      <td>${formatCurrency(cash.expected_balance || 0)}</td>
      <td>${cash.closing_balance !== null ? formatCurrency(cash.closing_balance) : '-'}</td>
      <td>
        ${cash.difference != null ?
          `<span class="${cash.difference === 0 ? 'text-success' : cash.difference > 0 ? 'text-warning' : 'text-danger'} font-weight-bold">${formatCurrency(cash.difference)}</span>`
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

// ============================================
// OPEN CASH DRAWER MODAL
// ============================================

function openOpenCashModal() {
  document.getElementById('openCashForm').reset();
  document.getElementById('openCashError').style.display = 'none';
  document.getElementById('openCashModal').style.display = 'flex';

  // Pre-select shift if current time matches (handles overnight shifts)
  if (shiftsCache.length > 0) {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const toMins = hhmm => {
      const [h, m] = hhmm.split(':').map(Number);
      return h * 60 + m;
    };
    const matched = shiftsCache.find(s => {
      const start = toMins(s.start_time);
      const end = toMins(s.end_time);
      if (start <= end) {
        return nowMins >= start && nowMins < end;
      }
      // overnight shift: e.g. 22:00–06:00
      return nowMins >= start || nowMins < end;
    });
    if (matched) {
      document.getElementById('openShiftSelect').value = String(matched.id);
    }
  }

  setTimeout(() => {
    document.getElementById('openShiftSelect').focus();
  }, 100);
}

function closeOpenCashModal() {
  document.getElementById('openCashModal').style.display = 'none';
}

async function handleOpenCash(e) {
  e.preventDefault();

  const shiftId = parseInt(document.getElementById('openShiftSelect').value) || null;
  const openingBalance = parseRupiahInput('openingBalance');
  const notes = document.getElementById('openCashNotes').value.trim();

  if (openingBalance < 0) {
    showOpenCashError('Saldo awal tidak boleh negatif');
    return;
  }

  const selectedShift = shiftsCache.find(s => s.id === shiftId);
  const shiftLabel = selectedShift ? ` (${selectedShift.name})` : '';

  showConfirm(
    'Konfirmasi Buka Kas',
    `Yakin ingin membuka kas${shiftLabel} dengan saldo awal ${formatCurrency(openingBalance)}?`,
    async () => {
      await openCashDrawer({ shift_id: shiftId, opening_balance: openingBalance, notes });
    }
  );
}

async function openCashDrawer(data) {
  // Offline — antri ke sync_queue
  if (typeof connectionMonitor !== 'undefined' && !connectionMonitor.isOnline) {
    try {
      // localId digunakan sebagai penghubung antara cash_drawer:open dan cash_drawer:close
      // agar setelah open tersinkronisasi, server_id bisa diteruskan ke item close-nya.
      const localId = crypto.randomUUID();
      await window.syncQueue.add({
        entity:  'cash_drawer',
        action:  'open',
        localId,
        payload: { ...data, date: new Date().toISOString().slice(0, 10) },
      });
      showToast('Kas harian dibuka offline. Akan disinkronkan saat online.', 'warning');
      closeOpenCashModal();
      // Tampilkan status optimistis agar UI tidak stuck di "Kas Belum Dibuka".
      // _localId disimpan agar item tutup-kas offline bisa di-link ke item buka-kas ini
      // sehingga sync engine dapat meneruskan server_id setelah open tersinkronisasi.
      currentCashDrawer = {
        id:               null,
        _localId:         localId,
        opening_balance:  data.opening_balance,
        total_cash_sales: 0,
        total_expenses:   0,
        expected_balance: data.opening_balance,
        open_time:        new Date().toISOString(),
        status:           'open',
        shift_name:       null,
        open_notes:       data.notes || null,
      };
      cashDrawerStatusLoaded = true;
      renderCashStatus(currentCashDrawer);
      await loadMyCashHistory();
    } catch (err) {
      console.error('Offline open cash drawer error:', err);
      showOpenCashError('Gagal menyimpan kas offline');
    }
    return;
  }

  try {
    const result = await apiClient.post('/cash-drawer/open', data);

    if (result.success) {
      showToast('Kas berhasil dibuka! Anda siap untuk transaksi.', 'success');
      closeOpenCashModal();
      await checkCurrentCashDrawer();
      await loadMyCashHistory();
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

// ============================================
// CLOSE CASH DRAWER MODAL
// ============================================

async function openCloseCashModal(cashDrawerId) {
  if (!currentCashDrawer) return;

  // Reset form
  document.getElementById('closeCashDrawerId').value = cashDrawerId ?? '';
  document.getElementById('closingBalance').value = '';
  document.getElementById('closeCashNotes').value = '';
  document.getElementById('differenceDisplay').style.display = 'none';
  document.getElementById('differenceAmount').textContent = 'Rp 0';
  document.getElementById('closeCashError').style.display = 'none';
  document.getElementById('closeCashModal').style.display = 'flex';

  // Jika offline, gunakan data currentCashDrawer yang sudah ada di memori —
  // tidak perlu API call yang akan selalu gagal saat offline.
  // Hitung ulang expected_balance dari antrian sync agar transaksi tunai offline ikut terhitung.
  // Selalu mulai dari opening_balance (tidak berubah) + antrian sync, bukan dari
  // total_cash_sales yang mungkin sudah dimutasi oleh pembukaan modal sebelumnya.
  if (typeof connectionMonitor !== 'undefined' && !connectionMonitor.isOnline) {
    let offlineCashSales = 0;
    let offlineExpenses = 0;
    if (typeof window.syncQueue !== 'undefined') {
      try {
        const pending = await window.syncQueue.getPending();
        offlineCashSales = pending
          .filter(i => i.entity === 'transaction' && i.action === 'create')
          .reduce((sum, i) => {
            const p = typeof i.payload === 'string' ? JSON.parse(i.payload) : i.payload;
            return sum + (p.payment_method === 'cash' ? (p.total_amount || 0) : 0);
          }, 0);
        // Jumlahkan pengeluaran offline yang belum tersinkron agar expected_balance akurat.
        offlineExpenses = pending
          .filter(i => i.entity === 'expense' && i.action === 'create')
          .reduce((sum, i) => {
            const p = typeof i.payload === 'string' ? JSON.parse(i.payload) : i.payload;
            return sum + (p.amount || 0);
          }, 0);
      } catch (e) {
        console.error('Failed to read offline transactions for expected balance:', e);
        offlineCashSales = currentCashDrawer.total_cash_sales || 0;
      }
    } else {
      offlineCashSales = currentCashDrawer.total_cash_sales || 0;
    }
    const totalExpenses = (currentCashDrawer.total_expenses || 0) + offlineExpenses;
    const offlineExpected = currentCashDrawer.opening_balance + offlineCashSales - totalExpenses;
    // Perbarui hanya expected_balance agar calculateDifference() memakai angka yang sama.
    // total_cash_sales dan total_expenses TIDAK diubah agar pembukaan modal berikutnya tidak double-count.
    currentCashDrawer = { ...currentCashDrawer, expected_balance: offlineExpected };

    document.getElementById('closeOpeningBalance').textContent = formatCurrency(currentCashDrawer.opening_balance);
    document.getElementById('closeCashSales').textContent = formatCurrency(offlineCashSales);
    document.getElementById('closeExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('closeExpectedBalance').textContent = formatCurrency(offlineExpected);
    setTimeout(() => document.getElementById('closingBalance').focus(), 100);
    return;
  }

  // Online: refresh dari API untuk mendapatkan angka terkini dan server ID yang valid.
  document.getElementById('closeOpeningBalance').textContent = 'Memuat...';
  document.getElementById('closeCashSales').textContent = 'Memuat...';
  document.getElementById('closeExpenses').textContent = 'Memuat...';
  document.getElementById('closeExpectedBalance').textContent = 'Memuat...';

  try {
    const result = await apiClient.get('/cash-drawer/current');
    if (result.success && result.data) {
      currentCashDrawer = result.data;
      // Bug 2: Perbarui hidden field dengan server ID yang valid dari API response —
      // menghindari NaN jika kas dibuka saat offline (id awalnya null).
      document.getElementById('closeCashDrawerId').value = result.data.id;
    } else {
      showToast('Gagal memuat data kas terkini, coba lagi', 'error');
      document.getElementById('closeCashModal').style.display = 'none';
      return;
    }
  } catch (e) {
    console.error('Refresh cash drawer error:', e);
    showToast('Gagal memuat data kas terkini, coba lagi', 'error');
    document.getElementById('closeCashModal').style.display = 'none';
    return;
  }

  document.getElementById('closeOpeningBalance').textContent = formatCurrency(currentCashDrawer.opening_balance);
  document.getElementById('closeCashSales').textContent = formatCurrency(currentCashDrawer.total_cash_sales);
  document.getElementById('closeExpenses').textContent = formatCurrency(currentCashDrawer.total_expenses);
  document.getElementById('closeExpectedBalance').textContent = formatCurrency(currentCashDrawer.expected_balance);

  setTimeout(() => document.getElementById('closingBalance').focus(), 100);
}

function closeCloseCashModal() {
  document.getElementById('closeCashModal').style.display = 'none';
}

function calculateDifference() {
  if (!currentCashDrawer) return;

  const closingBalance = parseRupiahInput('closingBalance');
  const difference = closingBalance - currentCashDrawer.expected_balance;

  const differenceEl = document.getElementById('differenceAmount');
  const displayDiv = document.getElementById('differenceDisplay');
  
  differenceEl.textContent = formatCurrency(difference);

  if (difference === 0) {
    differenceEl.className = 'text-success';
    displayDiv.style.backgroundColor = '#d5f4e6';
    displayDiv.style.borderColor = '#27ae60';
  } else if (difference > 0) {
    differenceEl.className = 'text-warning';
    displayDiv.style.backgroundColor = '#fff3cd';
    displayDiv.style.borderColor = '#f39c12';
  } else {
    differenceEl.className = 'text-danger';
    displayDiv.style.backgroundColor = '#fee';
    displayDiv.style.borderColor = '#e74c3c';
  }

  displayDiv.style.display = 'flex';
}

async function handleCloseCash(e) {
  e.preventDefault();

  const cashDrawerId = parseInt(document.getElementById('closeCashDrawerId').value);
  const closingBalance = parseRupiahInput('closingBalance');
  const notes = document.getElementById('closeCashNotes').value.trim();

  // Validasi ID sebelum konfirmasi ditampilkan.
  // Mode offline dengan kas yang dibuka offline (id null) ditangani di closeCashDrawer() via _localId,
  // sehingga hanya blokir jika online dengan ID tidak valid.
  const isOffline = typeof connectionMonitor !== 'undefined' && !connectionMonitor.isOnline;
  if (!isOffline && (isNaN(cashDrawerId) || cashDrawerId <= 0)) {
    showCloseCashError('ID kas tidak valid. Coba refresh halaman.');
    return;
  }

  if (closingBalance < 0) {
    showCloseCashError('Saldo akhir tidak boleh negatif');
    return;
  }

  const difference = closingBalance - currentCashDrawer.expected_balance;

  let confirmMessage = `Yakin ingin menutup kas dengan saldo akhir ${formatCurrency(closingBalance)}?`;
  
  if (difference !== 0) {
    confirmMessage += `\n\nSelisih: ${formatCurrency(difference)}`;
    if (difference > 0) {
      confirmMessage += ' (Uang lebih)';
    } else {
      confirmMessage += ' (Uang kurang)';
    }
  }

  showConfirm(
    'Konfirmasi Tutup Kas',
    confirmMessage,
    async () => {
      await closeCashDrawer(cashDrawerId, { closing_balance: closingBalance, notes });
    }
  );
}

async function closeCashDrawer(cashDrawerId, data) {
  // Offline — antri ke sync_queue
  if (typeof connectionMonitor !== 'undefined' && !connectionMonitor.isOnline) {
    try {
      // Bug 2: Jika kas dibuka saat offline, cashDrawerId adalah null/NaN dan server_id
      // belum diketahui. Gunakan _localId dari sesi buka-kas agar sync engine bisa
      // meneruskan server_id setelah cash_drawer:open tersinkronisasi.
      const openedOffline = !cashDrawerId || isNaN(cashDrawerId);
      await window.syncQueue.add({
        entity:   'cash_drawer',
        action:   'close',
        localId:  openedOffline ? (currentCashDrawer?._localId || null) : null,
        serverId: openedOffline ? null : cashDrawerId,
        payload:  data,
      });
      showToast('Kas akan ditutup saat koneksi pulih.', 'warning');
      closeCloseCashModal();
      // Perbarui UI optimistis agar status tampil "Kas Belum Dibuka"
      currentCashDrawer = null;
      renderCashStatus(null);
      await loadMyCashHistory();
    } catch (err) {
      console.error('Offline close cash drawer error:', err);
      showCloseCashError('Gagal menyimpan tutup kas offline');
    }
    return;
  }

  try {
    const result = await apiClient.post(`/cash-drawer/${cashDrawerId}/close`, data);

    if (result.success) {
      showToast('Kas berhasil ditutup!', 'success');
      closeCloseCashModal();
      await checkCurrentCashDrawer();
      await loadMyCashHistory();
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

// ============================================
// DETAIL CASH DRAWER
// ============================================

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

  const totalCashSales = cashDrawer.total_cash_sales;
  const totalExpenses = cashDrawer.total_expenses;
  const expectedBalance = cashDrawer.expected_balance;

  container.innerHTML = `
    <div class="detail-section">
      <h3>Informasi Kas</h3>
      <div class="detail-grid">
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
          <strong>${cashDrawer.close_time ? formatTimeOnly(cashDrawer.close_time) : 'Belum ditutup'}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status:</span>
          <span class="badge ${cashDrawer.status === 'open' ? 'badge-success' : 'badge-secondary'}">
            ${cashDrawer.status === 'open' ? 'Open' : 'Closed'}
          </span>
        </div>
        ${cashDrawer.open_notes ? `
        <div class="detail-item detail-item-full">
          <span class="detail-label">Catatan Buka:</span>
          <span>${escapeHtml(cashDrawer.open_notes)}</span>
        </div>
        ` : ''}
        ${cashDrawer.notes ? `
        <div class="detail-item detail-item-full">
          <span class="detail-label">Catatan Tutup:</span>
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
        <div class="summary-box">
          <strong>Total Penjualan Cash: ${formatCurrency(totalCashSales)}</strong>
        </div>
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
        <div class="summary-box">
          <strong>Total Pengeluaran: ${formatCurrency(totalExpenses)}</strong>
        </div>
      ` : '<p class="text-center">Tidak ada pengeluaran</p>'}
    </div>

    <div class="detail-section">
      <h3>Ringkasan</h3>
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
          <strong class="${cashDrawer.difference === 0 ? 'text-success' : cashDrawer.difference > 0 ? 'text-warning' : 'text-danger'}">
            ${formatCurrency(cashDrawer.difference)}
          </strong>
        </div>
        ${cashDrawer.difference === 0 ?
          '<div class="success-box">✅ Kas pas, tidak ada selisih!</div>' :
          cashDrawer.difference > 0 ?
            '<div class="warning-box">⚠️ Uang lebih dari expected</div>' :
            '<div class="error-box">❌ Uang kurang dari expected</div>'
        }
        ` : ''}
      </div>
    </div>
  `;
}

function closeDetailCashModal() {
  document.getElementById('detailCashModal').style.display = 'none';
}

// ============================================
// TAB SWITCHING
// ============================================

function switchTab(tabName) {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}-tab`).classList.add('active');

  if (tabName === 'kas-harian') {
    checkCurrentCashDrawer();
    loadMyCashHistory();
  } else if (tabName === 'rekap-kas') {
    loadRekapKas();
  }
}

// ============================================
// REKAP KAS (owner/admin only)
// ============================================

async function loadRekapKas() {
  const tbody = document.getElementById('rekapTableBody');
  const tfoot = document.getElementById('rekapTableFoot');
  const summaryCards = document.getElementById('rekapSummaryCards');

  tbody.innerHTML = '<tr><td colspan="11" class="text-center">Loading...</td></tr>';
  tfoot.style.display = 'none';
  summaryCards.style.display = 'none';

  let startDate = document.getElementById('rekapStartDate').value;
  let endDate = document.getElementById('rekapEndDate').value;

  // Set default masing-masing field jika kosong — tidak override field yang sudah diisi user
  const today = new Date().toISOString().split('T')[0];
  if (!startDate) {
    startDate = today;
    document.getElementById('rekapStartDate').value = today;
  }
  if (!endDate) {
    endDate = today;
    document.getElementById('rekapEndDate').value = today;
  }

  if (startDate > endDate) {
    tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Tanggal awal tidak boleh lebih dari tanggal akhir</td></tr>';
    return;
  }

  try {
    const result = await apiClient.get('/cash-drawer', {
      start_date: startDate,
      end_date: endDate,
      limit: 1000
    });

    if (!result.success) {
      tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Gagal memuat data rekap kas</td></tr>';
      return;
    }

    const data = result.data?.items || [];

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" class="text-center">Tidak ada data kas pada periode ini</td></tr>';
      return;
    }

    // Summary cards: semua sesi (termasuk yang masih open) agar owner tahu total aktivitas periode ini.
    const allTotalSales    = data.reduce((s, r) => s + (r.total_cash_sales || 0), 0);
    const allTotalExpenses = data.reduce((s, r) => s + (r.total_expenses || 0), 0);

    // Footer total: hanya sesi yang sudah ditutup agar saldoAwal/sales/expenses/expected/closing/selisih
    // dihitung dari basis data yang sama dan bisa dibandingkan satu sama lain.
    const closedRows       = data.filter(r => r.closing_balance !== null);
    const totalSaldoAwal   = closedRows.reduce((s, r) => s + (r.opening_balance || 0), 0);
    const totalSales       = closedRows.reduce((s, r) => s + (r.total_cash_sales || 0), 0);
    const totalExpenses    = closedRows.reduce((s, r) => s + (r.total_expenses || 0), 0);
    const totalExpected    = closedRows.reduce((s, r) => s + (r.expected_balance || 0), 0);
    const totalClosing     = closedRows.reduce((s, r) => s + (r.closing_balance || 0), 0);
    const totalSelisih     = closedRows.reduce((s, r) => s + (r.difference || 0), 0);

    // Render baris tabel
    tbody.innerHTML = data.map(cash => {
      const diff = cash.difference;
      return `
        <tr>
          <td>
            <div>${formatDateOnly(cash.open_time)}</div>
            <small>${formatTimeOnly(cash.open_time)}</small>
          </td>
          <td><strong>${escapeHtml(cash.user_name || '-')}</strong></td>
          <td>
            ${cash.shift_name
              ? `<span class="badge badge-info">${escapeHtml(cash.shift_name)}</span>`
              : '<span class="text-muted">-</span>'}
          </td>
          <td>${formatCurrency(cash.opening_balance)}</td>
          <td class="text-success">${formatCurrency(cash.total_cash_sales)}</td>
          <td class="text-danger">${formatCurrency(cash.total_expenses)}</td>
          <td>${formatCurrency(cash.expected_balance || 0)}</td>
          <td>${cash.closing_balance !== null ? formatCurrency(cash.closing_balance) : '-'}</td>
          <td>
            ${diff != null
              ? `<span class="${diff === 0 ? 'text-success' : diff > 0 ? 'text-warning' : 'text-danger'}">${formatCurrency(diff)}</span>`
              : '-'}
          </td>
          <td>
            <span class="badge ${cash.status === 'open' ? 'badge-success' : 'badge-secondary'}">
              ${cash.status === 'open' ? 'Open' : 'Closed'}
            </span>
          </td>
          <td class="action-buttons">
            <button class="btn-icon" onclick="openDetailCashDrawer(${cash.id})" title="Detail">👁️</button>
          </td>
        </tr>
      `;
    }).join('');

    // Render footer total
    document.getElementById('rekapFootSaldoAwal').textContent  = formatCurrency(totalSaldoAwal);
    document.getElementById('rekapFootSales').textContent      = formatCurrency(totalSales);
    document.getElementById('rekapFootExpenses').textContent   = formatCurrency(totalExpenses);
    document.getElementById('rekapFootExpected').textContent   = formatCurrency(totalExpected);
    document.getElementById('rekapFootClosing').textContent    = formatCurrency(totalClosing);
    document.getElementById('rekapFootSelisih').textContent    = formatCurrency(totalSelisih);
    tfoot.style.display = '';

    // Render summary cards (semua sesi, termasuk yang masih open)
    document.getElementById('rekapTotalSales').textContent    = formatCurrency(allTotalSales);
    document.getElementById('rekapTotalExpenses').textContent = formatCurrency(allTotalExpenses);
    document.getElementById('rekapTotalClosing').textContent  = formatCurrency(totalClosing);
    document.getElementById('rekapTotalSesi').textContent     = data.length;
    summaryCards.style.display = '';

  } catch (error) {
    console.error('loadRekapKas error:', error);
    tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Terjadi kesalahan saat memuat data</td></tr>';
  }
}