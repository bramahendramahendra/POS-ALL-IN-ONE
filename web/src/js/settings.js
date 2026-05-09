// ============================================
// SETTINGS PAGE — WEB
// ============================================

'use strict';

requireAuth();
requireRole('admin');

let currentSettings = {};
let logoBase64 = '';

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (user) {
    const elName = document.getElementById('navUsername');
    const elRole = document.getElementById('navUserRole');
    if (elName) elName.textContent = user.name || user.username || '—';
    if (elRole) elRole.textContent = user.role || '';
  }

  document.getElementById('btn-logout-nav').addEventListener('click', logout);

  // Show backend URL (readonly info)
  const backendUrl = window.APP_CONFIG?.backendUrl || 'http://localhost:8080';
  const urlEl = document.getElementById('backendUrl');
  const infoEl = document.getElementById('infoBackendUrl');
  if (urlEl)  urlEl.value = backendUrl;
  if (infoEl) infoEl.textContent = backendUrl;

  loadSettings();
  setupEventListeners();
});

// ============================================
// TOAST
// ============================================

const Toast = {
  show(msg, type) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error'); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg)    { this.show(msg, 'info'); }
};

// ============================================
// LOAD SETTINGS
// ============================================

async function loadSettings() {
  showLoading('Memuat pengaturan...');
  try {
    const res = await apiClient.get('/settings');
    if (!res || !res.success) {
      Toast.error((res && res.message) || 'Gagal memuat pengaturan');
      return;
    }
    currentSettings = res.settings;
    applySettingsToForm(res.settings);
  } catch (e) {
    console.error('loadSettings error:', e);
    Toast.error('Terjadi kesalahan saat memuat pengaturan');
  } finally {
    hideLoading();
  }
}

function applySettingsToForm(s) {
  setVal('storeName',     s.store_name     || '');
  setVal('storeAddress',  s.store_address  || '');
  setVal('storePhone',    s.store_phone    || '');
  setVal('storeEmail',    s.store_email    || '');
  setVal('receiptFooter', s.receipt_footer || '');

  const taxEnabled = s.tax_enabled === '1';
  document.getElementById('taxEnabled').checked = taxEnabled;
  setVal('taxPercent', s.tax_percent || '0');
  toggleTaxPercent(taxEnabled);

  const stockNotif = s.stock_notification_enabled !== '0';
  document.getElementById('stockNotificationEnabled').checked = stockNotif;

  if (s.label_size_default) {
    const sizeEl = document.getElementById('labelSizeDefault');
    if (sizeEl) sizeEl.value = s.label_size_default;
  }

  if (s.store_logo && s.store_logo.length > 0) {
    logoBase64 = s.store_logo;
    showLogoPreview(s.store_logo);
  }

  updateReceiptPreview();
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  document.getElementById('btnSaveSettings').addEventListener('click', handleSaveSettings);

  document.getElementById('btnResetSettings').addEventListener('click', async () => {
    if (!confirm('Yakin ingin mereset semua pengaturan ke nilai default? Perubahan yang belum disimpan akan hilang.')) return;
    showLoading('Mereset pengaturan...');
    try {
      const res = await apiClient.post('/settings/reset');
      if (res && res.success) {
        await loadSettings();
        Toast.success('Pengaturan berhasil direset ke default');
      } else {
        Toast.error((res && res.message) || 'Gagal mereset pengaturan');
      }
    } catch (e) {
      Toast.error('Terjadi kesalahan saat mereset');
    } finally {
      hideLoading();
    }
  });

  document.getElementById('taxEnabled').addEventListener('change', function () {
    toggleTaxPercent(this.checked);
  });

  document.getElementById('logoFileInput').addEventListener('change', handleLogoUpload);
  document.getElementById('btnRemoveLogo').addEventListener('click', removeLogo);

  ['storeName', 'storeAddress', 'storePhone', 'receiptFooter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateReceiptPreview);
  });

  document.getElementById('btnBackupNow').addEventListener('click', handleBackupNow);
  document.getElementById('btnRestoreBackup').addEventListener('click', handleRestoreBackup);
}

// ============================================
// TAX TOGGLE
// ============================================

function toggleTaxPercent(enabled) {
  document.getElementById('taxPercentGroup').style.display = enabled ? 'block' : 'none';
  document.getElementById('taxInfoBox').style.display      = enabled ? 'block' : 'none';
  document.getElementById('taxPercent').disabled           = !enabled;
}

// ============================================
// LOGO HANDLING
// ============================================

function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    Toast.error('File harus berupa gambar (JPG, PNG, GIF)');
    return;
  }
  if (file.size > 512000) {
    Toast.error('Ukuran file maksimal 500KB');
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    logoBase64 = ev.target.result;
    showLogoPreview(logoBase64);
    Toast.success('Logo berhasil dipilih. Klik "Simpan Pengaturan" untuk menyimpan.');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function showLogoPreview(base64) {
  const preview = document.getElementById('logoPreview');
  preview.innerHTML = `<img src="${base64}" alt="Logo" class="logo-img">`;
}

function removeLogo() {
  logoBase64 = '';
  document.getElementById('logoPreview').innerHTML = '<span class="logo-placeholder">🏪</span>';
  Toast.info('Logo dihapus. Klik "Simpan Pengaturan" untuk menyimpan perubahan.');
}

// ============================================
// RECEIPT PREVIEW
// ============================================

function updateReceiptPreview() {
  const name    = document.getElementById('storeName')?.value    || 'TOKO RETAIL';
  const address = document.getElementById('storeAddress')?.value || '';
  const phone   = document.getElementById('storePhone')?.value   || '';
  const footer  = document.getElementById('receiptFooter')?.value || '';

  const nameEl    = document.getElementById('previewStoreName');
  const addressEl = document.getElementById('previewStoreAddress');
  const phoneEl   = document.getElementById('previewStorePhone');
  const footerEl  = document.getElementById('previewFooter');

  if (nameEl)    nameEl.textContent    = name;
  if (addressEl) addressEl.textContent = address;
  if (phoneEl)   phoneEl.textContent   = phone;
  if (footerEl)  footerEl.textContent  = footer;
}

// ============================================
// SAVE SETTINGS
// ============================================

async function handleSaveSettings() {
  const storeName = document.getElementById('storeName').value.trim();
  if (!storeName) {
    Toast.warning('Nama toko tidak boleh kosong');
    document.getElementById('storeName').focus();
    return;
  }

  const taxEnabled = document.getElementById('taxEnabled').checked;
  const taxPercent = parseFloat(document.getElementById('taxPercent').value || '0');

  if (taxEnabled && (isNaN(taxPercent) || taxPercent < 0 || taxPercent > 100)) {
    Toast.warning('Persentase pajak harus antara 0 dan 100');
    document.getElementById('taxPercent').focus();
    return;
  }

  const data = {
    store_name:                 storeName,
    store_address:              document.getElementById('storeAddress').value.trim(),
    store_phone:                document.getElementById('storePhone').value.trim(),
    store_email:                document.getElementById('storeEmail').value.trim(),
    tax_enabled:                taxEnabled ? '1' : '0',
    tax_percent:                String(taxPercent),
    receipt_footer:             document.getElementById('receiptFooter').value.trim(),
    store_logo:                 logoBase64,
    stock_notification_enabled: document.getElementById('stockNotificationEnabled').checked ? '1' : '0',
    label_size_default:         document.getElementById('labelSizeDefault')?.value || '4x2.5'
  };

  showLoading('Menyimpan pengaturan...');
  try {
    const res = await apiClient.put('/settings', data);
    if (res && res.success) {
      currentSettings = { ...currentSettings, ...data };
      Toast.success('Pengaturan berhasil disimpan');
    } else {
      Toast.error((res && res.message) || 'Gagal menyimpan pengaturan');
    }
  } catch (e) {
    console.error('handleSaveSettings error:', e);
    Toast.error('Terjadi kesalahan saat menyimpan pengaturan');
  } finally {
    hideLoading();
  }
}

// ============================================
// BACKUP & RESTORE
// ============================================

async function handleBackupNow() {
  const btn = document.getElementById('btnBackupNow');
  btn.disabled = true;
  btn.textContent = '⏳ Membuat backup...';

  try {
    const blob = await apiClient.get('/backup/export', {}, { responseType: 'blob' });
    const filename = `backup-${new Date().toISOString().slice(0, 10)}.sql`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    showBackupStatus(`✅ Backup berhasil diunduh: ${filename}`, 'success');
    Toast.success(`Backup berhasil: ${filename}`);
  } catch (e) {
    console.error('handleBackupNow error:', e);
    Toast.error('Terjadi kesalahan saat backup');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Backup Sekarang';
  }
}

async function handleRestoreBackup() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.sql,.zip';

  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;

    if (!confirm(`Anda akan mengganti database aktif dengan:\n"${file.name}"\n\nData saat ini akan digantikan dan TIDAK BISA DIKEMBALIKAN.\nAplikasi akan dimuat ulang setelah restore.\n\nYakin ingin melanjutkan?`)) return;

    showLoading('Memulihkan database...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.uploadFile('/backup/restore', formData);
      Toast.success('Restore berhasil. Aplikasi akan dimuat ulang...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      console.error('handleRestoreBackup error:', e);
      Toast.error('Terjadi kesalahan saat restore database');
    } finally {
      hideLoading();
    }
  };

  fileInput.click();
}

function showBackupStatus(message, type) {
  const box  = document.getElementById('backupStatusBox');
  const text = document.getElementById('backupStatusText');
  if (!box || !text) return;

  text.textContent = message;
  box.style.display = 'flex';
  box.className = `info-box info-box-${type || 'info'} mt-20`;
  setTimeout(() => { box.style.display = 'none'; }, 6000);
}

// ============================================
// LOADING OVERLAY
// ============================================

function showLoading(text) {
  const overlay = document.getElementById('loadingOverlay');
  const label   = document.getElementById('loadingText');
  if (overlay) overlay.classList.remove('hidden');
  if (label)   label.textContent = text || 'Memproses...';
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.add('hidden');
}
