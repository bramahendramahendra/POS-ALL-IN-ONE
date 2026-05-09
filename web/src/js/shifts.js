// Shifts Management Page
requireAuth();
requireRole('kasir', 'owner', 'admin');

let allShifts = [];
let editingShiftId = null;

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (user) {
    const el = document.getElementById('navUsername');
    const roleEl = document.getElementById('navUserRole');
    if (el) el.textContent = user.name || user.username || '—';
    if (roleEl) roleEl.textContent = user.role || '';
  }

  document.getElementById('btn-logout-nav').addEventListener('click', logout);
  setupEventListeners();
  loadShifts();
});

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  document.getElementById('btnAddShift').addEventListener('click', openAddShiftModal);
  document.getElementById('closeShiftModal').addEventListener('click', closeShiftModal);
  document.getElementById('btnCancelShift').addEventListener('click', closeShiftModal);
  document.getElementById('shiftForm').addEventListener('submit', handleShiftFormSubmit);

  window.addEventListener('click', (e) => {
    const modal = document.getElementById('shiftModal');
    if (e.target === modal) closeShiftModal();
  });
}

// ============================================
// LOAD & RENDER
// ============================================

async function loadShifts() {
  try {
    const result = await apiClient.get('/shifts');
    if (result && result.success) {
      allShifts = result.shifts || [];
    } else if (Array.isArray(result)) {
      allShifts = result;
    } else {
      allShifts = [];
    }
    renderShiftsTable(allShifts);
  } catch (error) {
    console.error('loadShifts error:', error);
    document.getElementById('shiftsTableBody').innerHTML =
      '<tr><td colspan="5" class="text-center">Gagal memuat data shift</td></tr>';
  }
}

function renderShiftsTable(shifts) {
  const tbody = document.getElementById('shiftsTableBody');

  if (!shifts.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada data shift</td></tr>';
    return;
  }

  tbody.innerHTML = shifts.map(shift => `
    <tr>
      <td><strong>${escapeHtml(shift.name)}</strong></td>
      <td>${shift.start_time}</td>
      <td>${shift.end_time}</td>
      <td>
        <span class="badge ${shift.is_active ? 'badge-success' : 'badge-secondary'}">
          ${shift.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      </td>
      <td class="action-buttons">
        <button class="btn-icon" onclick="openEditShiftModal(${shift.id})" title="Edit">✏️</button>
        <button class="btn-icon" onclick="toggleShiftStatus(${shift.id}, ${shift.is_active})" title="${shift.is_active ? 'Nonaktifkan' : 'Aktifkan'}">
          ${shift.is_active ? '🔴' : '🟢'}
        </button>
        <button class="btn-icon" onclick="deleteShift(${shift.id})" title="Hapus" style="color:#dc2626">🗑️</button>
      </td>
    </tr>
  `).join('');
}

// ============================================
// MODAL ADD/EDIT
// ============================================

function openAddShiftModal() {
  editingShiftId = null;
  document.getElementById('shiftModalTitle').textContent = 'Tambah Shift';
  document.getElementById('shiftForm').reset();
  document.getElementById('shiftId').value = '';
  hideShiftFormError();
  document.getElementById('shiftModal').style.display = 'flex';
  setTimeout(() => document.getElementById('shiftName').focus(), 100);
}

async function openEditShiftModal(id) {
  try {
    const result = await apiClient.get(`/shifts/${id}`);
    const shift = (result && result.success) ? result.shift : result;
    if (!shift || !shift.id) {
      alert('Gagal memuat data shift');
      return;
    }
    editingShiftId = id;

    document.getElementById('shiftModalTitle').textContent = 'Edit Shift';
    document.getElementById('shiftId').value = shift.id;
    document.getElementById('shiftName').value = shift.name;
    document.getElementById('shiftStartTime').value = shift.start_time;
    document.getElementById('shiftEndTime').value = shift.end_time;
    hideShiftFormError();
    document.getElementById('shiftModal').style.display = 'flex';
  } catch (error) {
    console.error('openEditShiftModal error:', error);
    alert('Terjadi kesalahan saat memuat data shift');
  }
}

function closeShiftModal() {
  document.getElementById('shiftModal').style.display = 'none';
  editingShiftId = null;
}

async function handleShiftFormSubmit(e) {
  e.preventDefault();

  const data = {
    name: document.getElementById('shiftName').value.trim(),
    start_time: document.getElementById('shiftStartTime').value,
    end_time: document.getElementById('shiftEndTime').value
  };

  if (!data.name || !data.start_time || !data.end_time) {
    showShiftFormError('Semua field wajib diisi');
    return;
  }

  try {
    let result;
    if (editingShiftId) {
      result = await apiClient.put(`/shifts/${editingShiftId}`, data);
    } else {
      result = await apiClient.post('/shifts', data);
    }

    const success = result && (result.success === true || result.id);
    if (success) {
      closeShiftModal();
      await loadShifts();
    } else {
      showShiftFormError((result && result.message) || 'Gagal menyimpan shift');
    }
  } catch (error) {
    console.error('handleShiftFormSubmit error:', error);
    showShiftFormError('Terjadi kesalahan saat menyimpan');
  }
}

function showShiftFormError(msg) {
  const el = document.getElementById('shiftFormError');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideShiftFormError() {
  document.getElementById('shiftFormError').classList.add('hidden');
}

// ============================================
// TOGGLE STATUS & DELETE
// ============================================

async function toggleShiftStatus(id, currentStatus) {
  const label = currentStatus ? 'nonaktifkan' : 'aktifkan';
  if (!confirm(`Yakin ingin ${label} shift ini?`)) return;
  try {
    const result = await apiClient.patch(`/shifts/${id}/toggle-status`);
    const success = result && (result.success === true || result.id);
    if (success) {
      await loadShifts();
    } else {
      alert((result && result.message) || 'Gagal mengubah status shift');
    }
  } catch (error) {
    console.error('toggleShiftStatus error:', error);
    alert('Terjadi kesalahan saat mengubah status');
  }
}

async function deleteShift(id) {
  if (!confirm('Yakin ingin menghapus shift ini? Aksi ini tidak dapat dibatalkan.')) return;
  try {
    const result = await apiClient.delete(`/shifts/${id}`);
    const success = result && (result.success === true || result.id || result.deleted);
    if (success) {
      await loadShifts();
    } else {
      alert((result && result.message) || 'Gagal menghapus shift');
    }
  } catch (error) {
    console.error('deleteShift error:', error);
    alert('Terjadi kesalahan saat menghapus shift');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
