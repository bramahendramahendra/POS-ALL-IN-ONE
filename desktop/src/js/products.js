// Products & Categories Management
let currentUser = null;
let allProducts = [];
let allCategories = [];
let allUnits = [];
let editingProductId = null;
let editingCategoryId = null;
let editingUnitId = null;
// productUnits buffer: array of {unit_id, unit_name, abbreviation, conversion_qty, selling_price, is_default}
let productUnitRows = [];
let puEditIndex = null;

// Label print state
let selectedProductIds = new Set();
let labelPrintProducts = [];
let _labelPrintSavedIds = null; // simpan saat cetak label tunggal

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Products page loaded');

  // Initialize page layout (navbar + menu)
  if (!initializePageLayout('products')) {
    return;
  }

  // Get current user
  currentUser = getCurrentUser();

  // Apply kasir restrictions (read-only mode)
  if (currentUser && currentUser.role === 'kasir') {
    applyKasirReadOnlyMode();
  }

  // Load data
  await loadCategories();
  await loadProducts();
  await loadUnits();

  // Setup event listeners
  setupEventListeners();
});

// ============================================
// KASIR READ-ONLY MODE
// ============================================

function applyKasirReadOnlyMode() {
  // Sembunyikan tab Kategori dan Satuan
  document.querySelectorAll('.tab-button[data-tab="categories"], .tab-button[data-tab="units"]').forEach(btn => {
    btn.style.display = 'none';
  });

  // Sembunyikan tombol aksi di tab Produk
  const btnAdd = document.getElementById('btnAddProduct');
  if (btnAdd) btnAdd.style.display = 'none';

  const btnBulkPrint = document.getElementById('btnBulkPrintLabel');
  if (btnBulkPrint) btnBulkPrint.style.display = 'none';

  // Sembunyikan kolom checkbox (select all) dari header tabel
  const checkAllHeader = document.querySelector('#productsTable thead th:first-child');
  if (checkAllHeader) checkAllHeader.style.display = 'none';
}

// ============================================
// RUPIAH INPUT SETUP
// ============================================

function setupRupiahInputs() {
  ['purchasePrice', 'sellingPrice', 'puPurchasePrice', 'puSellingPrice'].forEach(id => setupRupiahInput(id));
}

// ============================================
// TAB MANAGEMENT
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

  // Product buttons
  document.getElementById('btnAddProduct').addEventListener('click', openAddProductModal);
  document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
  document.getElementById('btnCancelProduct').addEventListener('click', closeProductModal);
  document.getElementById('productForm').addEventListener('submit', handleProductFormSubmit);
  document.getElementById('btnGenerateBarcode').addEventListener('click', handleGenerateBarcode);

  // Category buttons
  document.getElementById('btnAddCategory').addEventListener('click', openAddCategoryModal);
  document.getElementById('closeCategoryModal').addEventListener('click', closeCategoryModal);
  document.getElementById('btnCancelCategory').addEventListener('click', closeCategoryModal);
  document.getElementById('categoryForm').addEventListener('submit', handleCategoryFormSubmit);

  // Product filters & search
  document.getElementById('searchProduct').addEventListener('input', filterProducts);
  document.getElementById('filterCategory').addEventListener('change', filterProducts);
  document.getElementById('filterProductStatus').addEventListener('change', filterProducts);

  // Price change listeners for margin calculation and grosiran ref update
  document.getElementById('purchasePrice').addEventListener('input', onBasePriceChange);
  document.getElementById('sellingPrice').addEventListener('input', onBasePriceChange);

  // Setup rupiah format on price inputs
  setupRupiahInputs();

  // Unit master buttons
  document.getElementById('btnAddUnit').addEventListener('click', openAddUnitModal);
  document.getElementById('closeUnitModal').addEventListener('click', closeUnitModal);
  document.getElementById('btnCancelUnit').addEventListener('click', closeUnitModal);
  document.getElementById('unitForm').addEventListener('submit', handleUnitFormSubmit);

  // Product unit buttons
  document.getElementById('btnAddProductUnit').addEventListener('click', openAddProductUnitModal);
  document.getElementById('closeProductUnitModal').addEventListener('click', closeProductUnitModal);
  document.getElementById('btnCancelProductUnit').addEventListener('click', closeProductUnitModal);
  document.getElementById('productUnitForm').addEventListener('submit', handleProductUnitFormSubmit);

  // Sync satuan dasar di tabel Grosiran saat unit produk berubah
  document.getElementById('unit').addEventListener('change', onBaseUnitChange);

  // Auto-calculate ref harga saat konversi/harga berubah di modal grosiran
  document.getElementById('puConversionQty').addEventListener('input', updatePuRefAndHints);
  document.getElementById('puSellingPrice').addEventListener('input', updatePuRefAndHints);
  document.getElementById('puPurchasePrice').addEventListener('input', updatePuRefAndHints);

  // Import product button (owner/admin only)
  if (currentUser && (currentUser.role === 'owner' || currentUser.role === 'admin')) {
    const btnImport = document.getElementById('btnImportProduct');
    if (btnImport) {
      btnImport.style.display = '';
      btnImport.addEventListener('click', openImportProductModal);
    }
  }
  document.getElementById('closeImportProductModal').addEventListener('click', closeImportProductModal);
  document.getElementById('btnCancelImport').addEventListener('click', closeImportProductModal);
  document.getElementById('btnCancelImport2').addEventListener('click', closeImportProductModal);
  document.getElementById('btnCloseImportResult').addEventListener('click', closeImportProductModal);
  document.getElementById('btnDownloadTemplate').addEventListener('click', downloadImportTemplate);
  document.getElementById('btnParseImport').addEventListener('click', parseImportFile);
  document.getElementById('btnBackImport').addEventListener('click', () => showImportStep(1));
  document.getElementById('btnProcessImport').addEventListener('click', processImport);
  document.querySelectorAll('input[name="importFilter"]').forEach(r => {
    r.addEventListener('change', renderImportPreview);
  });

  // Label print buttons
  document.getElementById('btnBulkPrintLabel').addEventListener('click', openLabelPrintModal);
  document.getElementById('closeLabelPrintModal').addEventListener('click', closeLabelPrintModal);
  document.getElementById('btnCancelLabelPrint').addEventListener('click', closeLabelPrintModal);
  document.getElementById('btnRefreshLabelPreview').addEventListener('click', renderLabelPreview);
  document.getElementById('btnDoLabelPrint').addEventListener('click', doLabelPrint);
  document.getElementById('labelSize').addEventListener('change', renderLabelPreview);

  // Check-all checkbox
  document.getElementById('checkAllProducts').addEventListener('change', function () {
    const visible = document.querySelectorAll('.product-row-check');
    visible.forEach(cb => {
      cb.checked = this.checked;
      const id = parseInt(cb.dataset.id);
      if (this.checked) selectedProductIds.add(id);
      else selectedProductIds.delete(id);
    });
    updateBulkLabelBtn();
  });

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    const productModal = document.getElementById('productModal');
    const categoryModal = document.getElementById('categoryModal');
    const unitModal = document.getElementById('unitModal');
    const productUnitModal = document.getElementById('productUnitModal');
    const labelPrintModal = document.getElementById('labelPrintModal');

    if (e.target === productModal) closeProductModal();
    if (e.target === categoryModal) closeCategoryModal();
    if (e.target === unitModal) closeUnitModal();
    if (e.target === productUnitModal) closeProductUnitModal();
    if (e.target === labelPrintModal) closeLabelPrintModal();
    const importModal = document.getElementById('importProductModal');
    if (e.target === importModal) closeImportProductModal();
  });
}

async function switchTab(tabName) {
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

  // Reload data saat kembali ke tab produk agar filter dan tabel mencerminkan perubahan terbaru
  if (tabName === 'products') {
    await loadCategories();
    await loadProducts();
  }
}

// ============================================
// CATEGORIES MANAGEMENT
// ============================================

async function loadCategories() {
  try {
    const result = await apiClient.get('/categories');

    if (result.success) {
      allCategories = result.data;
      renderCategoriesTable(allCategories);
      populateCategoryDropdowns();
    } else {
      showToast('Gagal memuat data kategori', 'error');
    }
  } catch (error) {
    console.error('Load categories error:', error);
    showToast('Terjadi kesalahan saat memuat kategori', 'error');
  }
}

function renderCategoriesTable(categories) {
  const tbody = document.getElementById('categoriesTableBody');
  
  if (categories.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">Tidak ada data kategori</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = categories.map(category => `
    <tr>
      <td>${escapeHtml(category.name)}</td>
      <td>${escapeHtml(category.description || '-')}</td>
      <td>${category.product_count || 0} produk</td>
      <td class="action-buttons">
        <button class="btn-icon" onclick="editCategory(${category.id})" title="Edit">
          ✏️
        </button>
        <button
          class="btn-icon"
          onclick="confirmDeleteCategory(${category.id}, '${escapeHtml(category.name)}', ${category.product_count || 0})"
          title="Hapus"
        >
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

function populateCategoryDropdowns() {
  const productCategorySelect = document.getElementById('productCategory');
  const filterCategorySelect = document.getElementById('filterCategory');

  // Clear existing options (except first)
  productCategorySelect.innerHTML = '<option value="">Pilih Kategori</option>';
  filterCategorySelect.innerHTML = '<option value="">Semua Kategori</option>';

  allCategories.forEach(category => {
    const option1 = document.createElement('option');
    option1.value = category.id;
    option1.textContent = category.name;
    productCategorySelect.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = category.id;
    option2.textContent = category.name;
    filterCategorySelect.appendChild(option2);
  });
}

function openAddCategoryModal() {
  editingCategoryId = null;
  document.getElementById('categoryModalTitle').textContent = 'Tambah Kategori';
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryFormError').style.display = 'none';
  document.getElementById('btnSubmitCategoryText').textContent = 'Simpan';
  document.getElementById('categoryModal').style.display = 'flex';
  
  setTimeout(() => {
    document.getElementById('categoryName').focus();
  }, 100);
}

async function editCategory(categoryId) {
  try {
    const result = await apiClient.get(`/categories/${categoryId}`);
    
    if (result.success) {
      const category = result.data;
      editingCategoryId = categoryId;
      
      document.getElementById('categoryModalTitle').textContent = 'Edit Kategori';
      document.getElementById('categoryId').value = category.id;
      document.getElementById('categoryName').value = category.name;
      document.getElementById('categoryDescription').value = category.description || '';
      document.getElementById('categoryFormError').style.display = 'none';
      document.getElementById('btnSubmitCategoryText').textContent = 'Update';
      document.getElementById('categoryModal').style.display = 'flex';
      
      setTimeout(() => {
        document.getElementById('categoryName').focus();
      }, 100);
    } else {
      showToast('Gagal memuat data kategori', 'error');
    }
  } catch (error) {
    console.error('Edit category error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function closeCategoryModal() {
  document.getElementById('categoryModal').style.display = 'none';
  document.getElementById('categoryForm').reset();
  editingCategoryId = null;
}

async function handleCategoryFormSubmit(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('categoryName').value.trim(),
    description: document.getElementById('categoryDescription').value.trim()
  };

  if (!formData.name) {
    showCategoryFormError('Nama kategori harus diisi');
    return;
  }

  const actionText = editingCategoryId ? 'mengupdate' : 'menambahkan';
  
  showConfirm(
    'Konfirmasi Simpan',
    `Yakin ingin ${actionText} kategori "${formData.name}"?`,
    async () => {
      await saveCategory(formData);
    }
  );
}

async function saveCategory(formData) {
  const btnSubmit = document.getElementById('btnSubmitCategory');
  const btnSubmitText = document.getElementById('btnSubmitCategoryText');
  const originalText = btnSubmitText.textContent;
  
  btnSubmit.disabled = true;
  btnSubmitText.textContent = 'Menyimpan...';

  try {
    let result;
    
    if (editingCategoryId) {
      result = await apiClient.put(`/categories/${editingCategoryId}`, formData);
    } else {
      result = await apiClient.post('/categories', formData);
    }

    if (result.success) {
      closeCategoryModal();
      await loadCategories();
      showToast(
        editingCategoryId ? 'Kategori berhasil diupdate' : 'Kategori berhasil ditambahkan',
        'success'
      );
    } else {
      showCategoryFormError(result.message || 'Gagal menyimpan kategori');
      btnSubmit.disabled = false;
      btnSubmitText.textContent = originalText;
    }
  } catch (error) {
    console.error('Save category error:', error);
    showCategoryFormError('Terjadi kesalahan saat menyimpan');
    btnSubmit.disabled = false;
    btnSubmitText.textContent = originalText;
  }
}

function confirmDeleteCategory(categoryId, categoryName, productCount) {
  if (productCount > 0) {
    showToast(`Tidak dapat menghapus kategori "${categoryName}". Masih ada ${productCount} produk dalam kategori ini.`, 'error');
    return;
  }

  showConfirm(
    'Konfirmasi Hapus',
    `Yakin ingin menghapus kategori "${categoryName}"?`,
    async () => {
      await deleteCategory(categoryId);
    }
  );
}

async function deleteCategory(categoryId) {
  try {
    const result = await apiClient.delete(`/categories/${categoryId}`);
    
    if (result.success) {
      await loadCategories();
      showToast('Kategori berhasil dihapus', 'success');
    } else {
      showToast(result.message || 'Gagal menghapus kategori', 'error');
    }
  } catch (error) {
    console.error('Delete category error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function showCategoryFormError(message) {
  const errorDiv = document.getElementById('categoryFormError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// ============================================
// PRODUCTS MANAGEMENT
// ============================================

async function loadProducts() {
  try {
    const result = await apiClient.get('/products', { limit: 10000 });

    if (result.success) {
      allProducts = result.data.items ?? result.data;
      renderProductsTable(allProducts);
    } else {
      showToast('Gagal memuat data produk', 'error');
    }
  } catch (error) {
    console.error('Load products error:', error);
    showToast('Terjadi kesalahan saat memuat produk', 'error');
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('productsTableBody');

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="text-center">Tidak ada data produk</td>
      </tr>
    `;
    return;
  }

  const isKasir = currentUser && currentUser.role === 'kasir';

  tbody.innerHTML = products.map(product => {
    const margin = calculateMargin(product.purchase_price, product.selling_price);
    const stockStatus = getStockStatus(product.stock, product.min_stock);
    const checked = selectedProductIds.has(product.id) ? 'checked' : '';

    const checkboxCell = isKasir
      ? `<td style="display:none;"></td>`
      : `<td style="text-align:center;">
           <input type="checkbox" class="product-row-check" data-id="${product.id}" ${checked}
             onchange="onProductCheckChange(this)">
         </td>`;

    const actionButtons = isKasir
      ? `<td class="action-buttons">
           <button class="btn-icon" onclick="openSingleLabelPrint(${product.id})" title="Cetak Label">
             🏷️
           </button>
         </td>`
      : `<td class="action-buttons">
           <button class="btn-icon" onclick="editProduct(${product.id})" title="Edit">
             ✏️
           </button>
           <button class="btn-icon" onclick="openSingleLabelPrint(${product.id})" title="Cetak Label">
             🏷️
           </button>
           <button
             class="btn-icon"
             onclick="toggleProductStatus(${product.id}, ${product.is_active})"
             title="${product.is_active ? 'Nonaktifkan' : 'Aktifkan'}"
           >
             ${product.is_active ? '🔓' : '🔒'}
           </button>
           <button
             class="btn-icon"
             onclick="confirmDeleteProduct(${product.id}, '${escapeHtml(product.name)}')"
             title="Hapus"
           >
             🗑️
           </button>
         </td>`;

    return `
      <tr>
        ${checkboxCell}
        <td><code>${escapeHtml(product.barcode)}</code></td>
        <td>${escapeHtml(product.name)}</td>
        <td>${escapeHtml(product.category_name || '-')}</td>
        <td>${formatCurrency(product.purchase_price)}</td>
        <td>${formatCurrency(product.selling_price)}</td>
        <td>
          <span class="badge ${margin >= 30 ? 'badge-success' : margin >= 15 ? 'badge-warning' : 'badge-danger'}">
            ${margin}%
          </span>
        </td>
        <td>
          <span class="badge ${stockStatus.class}">
            ${product.stock}
          </span>
        </td>
        <td>
          <div>${escapeHtml(product.unit)}</div>
          ${product.extra_units_count > 0
            ? `<span class="badge badge-warning" style="font-size:10px; margin-top:2px;" title="${product.extra_units_count} paket grosiran">📦 +${product.extra_units_count} paket</span>`
            : ''}
        </td>
        <td>
          <span class="badge ${product.is_active ? 'badge-success' : 'badge-danger'}">
            ${product.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
        </td>
        ${actionButtons}
      </tr>
    `;
  }).join('');
}

function getStockStatus(stock, minStock) {
  if (stock === 0) {
    return { class: 'badge-danger', text: 'Habis' };
  } else if (stock < minStock) {
    return { class: 'badge-warning', text: 'Menipis' };
  } else {
    return { class: 'badge-success', text: 'Aman' };
  }
}

function filterProducts() {
  const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
  const categoryFilter = document.getElementById('filterCategory').value;
  const statusFilter = document.getElementById('filterProductStatus').value;

  let filtered = allProducts;

  // Search
  if (searchTerm) {
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.barcode.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by category
  if (categoryFilter) {
    filtered = filtered.filter(product => product.category_id == categoryFilter);
  }

  // Filter by status
  if (statusFilter === '1') {
    filtered = filtered.filter(product => product.is_active == true);
  } else if (statusFilter === '0') {
    filtered = filtered.filter(product => product.is_active == false);
  } else if (statusFilter === 'low_stock') {
    filtered = filtered.filter(product => product.stock < product.min_stock);
  }

  renderProductsTable(filtered);
}

function openAddProductModal() {
  editingProductId = null;
  productUnitRows = [];
  document.getElementById('productModalTitle').textContent = 'Tambah Produk';
  document.getElementById('productForm').reset();
  document.getElementById('stock').value = '0';
  document.getElementById('minStock').value = '5';
  document.getElementById('marginDisplay').value = '0%';
  document.getElementById('productFormError').style.display = 'none';
  document.getElementById('btnSubmitProductText').textContent = 'Simpan';

  document.getElementById('updateSyncNote').style.display = 'none';
  populateBaseUnitSelect();
  document.getElementById('productUnitsSection').classList.remove('hidden');
  renderProductUnitsRows('');
  document.getElementById('productModal').style.display = 'flex';

  setTimeout(() => {
    document.getElementById('barcode').focus();
  }, 100);
}

async function editProduct(productId) {
  try {
    const result = await apiClient.get(`/products/${productId}`);

    if (result.success) {
      const product = result.data;
      editingProductId = productId;

      document.getElementById('productModalTitle').textContent = 'Edit Produk';
      document.getElementById('productId').value = product.id;
      document.getElementById('barcode').value = product.barcode;
      document.getElementById('productName').value = product.name;
      document.getElementById('productCategory').value = product.category_id || '';
      setRupiahInput('purchasePrice', product.purchase_price);
      setRupiahInput('sellingPrice', product.selling_price);
      document.getElementById('stock').value = product.stock;
      document.getElementById('minStock').value = product.min_stock;
      populateBaseUnitSelect(product.unit);

      calculateAndDisplayMargin();

      // Load product units (grosiran)
      await loadProductUnitsForEdit(productId, product.unit, product.selling_price);

      document.getElementById('productFormError').style.display = 'none';
      document.getElementById('btnSubmitProductText').textContent = 'Update';
    
      document.getElementById('updateSyncNote').style.display = 'block';
      document.getElementById('productModal').style.display = 'flex';

      setTimeout(() => {
        document.getElementById('productName').focus();
      }, 100);
    } else {
      showToast('Gagal memuat data produk', 'error');
    }
  } catch (error) {
    console.error('Edit product error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
  document.getElementById('productForm').reset();
  document.getElementById('productUnitsSection').classList.add('hidden');
  document.getElementById('updateSyncNote').style.display = 'none';
  editingProductId = null;
  productUnitRows = [];
}

function handleGenerateBarcode() {
  const barcode = generateBarcode();
  document.getElementById('barcode').value = barcode;
}

function onBasePriceChange() {
  calculateAndDisplayMargin();
  // Sinkronkan default row dengan harga terbaru
  const defIdx = productUnitRows.findIndex(r => r.is_default);
  if (defIdx !== -1) {
    productUnitRows[defIdx] = {
      ...productUnitRows[defIdx],
      purchase_price: parseRupiahInput('purchasePrice') || productUnitRows[defIdx].purchase_price,
      selling_price: parseRupiahInput('sellingPrice') || productUnitRows[defIdx].selling_price,
    };
  }
}

function calculateAndDisplayMargin() {
  const purchasePrice = parseRupiahInput('purchasePrice');
  const sellingPrice = parseRupiahInput('sellingPrice');

  const margin = calculateMargin(purchasePrice, sellingPrice);
  document.getElementById('marginDisplay').value = `${margin}%`;

  // Re-render grosiran agar margin per paket terupdate
  const unitsSection = document.getElementById('productUnitsSection');
  if (unitsSection && !unitsSection.classList.contains('hidden') && productUnitRows.length > 0) {
    renderProductUnitsRows(document.getElementById('unit').value);
  }
}

function onBaseUnitChange() {
  const newUnitName = document.getElementById('unit').value;
  if (!newUnitName) return;

  const unitObj = allUnits.find(u => u.name === newUnitName);
  const defaultIdx = productUnitRows.findIndex(r => r.is_default);

  if (defaultIdx !== -1) {
    productUnitRows[defaultIdx] = {
      ...productUnitRows[defaultIdx],
      unit_id: unitObj ? unitObj.id : productUnitRows[defaultIdx].unit_id,
      unit_name: newUnitName,
      abbreviation: unitObj ? unitObj.abbreviation : '',
      purchase_price: parseRupiahInput('purchasePrice') || productUnitRows[defaultIdx].purchase_price,
      selling_price: parseRupiahInput('sellingPrice') || productUnitRows[defaultIdx].selling_price,
    };
  } else if (unitObj) {
    productUnitRows.unshift({
      id: null,
      unit_id: unitObj.id,
      unit_name: unitObj.name,
      abbreviation: unitObj.abbreviation || '',
      conversion_qty: 1,
      purchase_price: parseRupiahInput('purchasePrice') || 0,
      selling_price: parseRupiahInput('sellingPrice') || 0,
      is_default: true,
    });
  }

  renderProductUnitsRows(newUnitName);
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  
  const formData = {
    barcode: document.getElementById('barcode').value.trim(),
    name: document.getElementById('productName').value.trim(),
    category_id: parseInt(document.getElementById('productCategory').value) || null,
    purchase_price: parseRupiahInput('purchasePrice'),
    selling_price: parseRupiahInput('sellingPrice'),
    stock: parseInt(document.getElementById('stock').value) || 0,
    min_stock: parseInt(document.getElementById('minStock').value) || 5,
    unit: document.getElementById('unit').value
  };

  // Validate
  if (!formData.barcode || !formData.name) {
    showProductFormError('Barcode dan nama produk harus diisi');
    return;
  }

  if (!formData.unit) {
    showProductFormError('Satuan produk harus dipilih');
    return;
  }

  if (formData.purchase_price < 0 || formData.selling_price < 0) {
    showProductFormError('Harga tidak boleh negatif');
    return;
  }

  if (formData.selling_price <= 0) {
    showProductFormError('Harga jual harus lebih dari 0');
    return;
  }

  if (formData.selling_price < formData.purchase_price) {
    showProductFormError('Harga jual tidak boleh lebih rendah dari harga beli');
    return;
  }

  const actionText = editingProductId ? 'mengupdate' : 'menambahkan';
  
  showConfirm(
    'Konfirmasi Simpan',
    `Yakin ingin ${actionText} produk "${formData.name}"?`,
    async () => {
      await saveProduct(formData);
    }
  );
}

async function saveProduct(formData) {
  const btnSubmit = document.getElementById('btnSubmitProduct');
  const btnSubmitText = document.getElementById('btnSubmitProductText');
  const originalText = btnSubmitText.textContent;
  
  btnSubmit.disabled = true;
  btnSubmitText.textContent = 'Menyimpan...';

  try {
    let result;
    
    if (editingProductId) {
      result = await apiClient.put(`/products/${editingProductId}`, formData);
    } else {
      result = await apiClient.post('/products', formData);
    }

    if (result.success) {
      const isNew = !editingProductId;
      const savedProductId = editingProductId || result.data?.id;

      // Simpan grosiran jika ada di buffer
      let unitSaveFailed = false;
      if (savedProductId && productUnitRows.length > 0) {
        // Pastikan default row selalu sinkron dengan harga produk terbaru
        const defIdx = productUnitRows.findIndex(r => r.is_default);
        if (defIdx !== -1) {
          productUnitRows[defIdx] = {
            ...productUnitRows[defIdx],
            purchase_price: formData.purchase_price,
            selling_price: formData.selling_price,
          };
        }
        const unitResult = await apiClient.post(`/products/${savedProductId}/units`, { units: productUnitRows });
        if (!unitResult.success) {
          unitSaveFailed = true;
        }
      }

      await loadProducts();
      if (unitSaveFailed) {
        showToast(
          (isNew ? 'Produk berhasil ditambahkan' : 'Produk berhasil diupdate') + ', tapi gagal menyimpan satuan jual. Buka kembali produk dan coba lagi.',
          'warning'
        );
      } else {
        showToast(isNew ? 'Produk berhasil ditambahkan' : 'Produk berhasil diupdate', 'success');
      }

      closeProductModal();
      btnSubmit.disabled = false;
      btnSubmitText.textContent = originalText;
    } else {
      showProductFormError(result.message || 'Gagal menyimpan produk');
      btnSubmit.disabled = false;
      btnSubmitText.textContent = originalText;
    }
  } catch (error) {
    console.error('Save product error:', error);
    showProductFormError('Terjadi kesalahan saat menyimpan');
    btnSubmit.disabled = false;
    btnSubmitText.textContent = originalText;
  }
}

async function toggleProductStatus(productId, currentStatus) {
  try {
    const result = await apiClient.patch(`/products/${productId}/toggle-status`);
    
    if (result.success) {
      await loadProducts();
      showToast(
        `Produk berhasil ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}`,
        'success'
      );
    } else {
      showToast('Gagal mengubah status produk', 'error');
    }
  } catch (error) {
    console.error('Toggle product status error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function confirmDeleteProduct(productId, productName) {
  showConfirm(
    'Konfirmasi Hapus',
    `Yakin ingin menghapus produk "${productName}"?`,
    async () => {
      await deleteProduct(productId);
    }
  );
}

async function deleteProduct(productId) {
  try {
    const result = await apiClient.delete(`/products/${productId}`);
    
    if (result.success) {
      await loadProducts();
      showToast('Produk berhasil dihapus', 'success');
    } else {
      showToast(result.message || 'Gagal menghapus produk', 'error');
    }
  } catch (error) {
    console.error('Delete product error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function showProductFormError(message) {
  const errorDiv = document.getElementById('productFormError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// ============================================
// UNITS MASTER MANAGEMENT
// ============================================

async function loadUnits() {
  try {
    const result = await apiClient.get('/units');
    if (result.success) {
      allUnits = result.data;
      renderUnitsTable(allUnits);
      populateBaseUnitSelect();
    } else {
      showToast('Gagal memuat data satuan', 'error');
    }
  } catch (error) {
    console.error('Load units error:', error);
    showToast('Terjadi kesalahan saat memuat satuan', 'error');
  }
}

function populateBaseUnitSelect(currentValue) {
  const select = document.getElementById('unit');
  if (!select) return;
  const activeUnits = allUnits.filter(u => u.is_active);

  // Jika currentValue adalah unit yang sudah nonaktif, tetap tampilkan agar tidak hilang
  const inactiveCurrentUnit = currentValue && !activeUnits.find(u => u.name === currentValue)
    ? allUnits.find(u => u.name === currentValue)
    : null;

  select.innerHTML = '<option value="">-- Pilih Satuan --</option>' +
    activeUnits.map(u =>
      `<option value="${escapeHtml(u.name)}">${escapeHtml(u.name)} (${escapeHtml(u.abbreviation)})</option>`
    ).join('') +
    (inactiveCurrentUnit
      ? `<option value="${escapeHtml(inactiveCurrentUnit.name)}" style="color:#e74c3c;">${escapeHtml(inactiveCurrentUnit.name)} (nonaktif)</option>`
      : '');

  if (currentValue) select.value = currentValue;
}

function renderUnitsTable(units) {
  const tbody = document.getElementById('unitsTableBody');

  if (units.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center">Tidak ada data satuan</td></tr>`;
    return;
  }

  tbody.innerHTML = units.map(unit => `
    <tr>
      <td>${escapeHtml(unit.name)}</td>
      <td><code>${escapeHtml(unit.abbreviation)}</code></td>
      <td>
        <span class="badge ${unit.is_active ? 'badge-success' : 'badge-danger'}">
          ${unit.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      </td>
      <td class="action-buttons">
        <button class="btn-icon" onclick="editUnit(${unit.id})" title="Edit">✏️</button>
        <button class="btn-icon" onclick="toggleUnitStatus(${unit.id}, ${unit.is_active})"
          title="${unit.is_active ? 'Nonaktifkan' : 'Aktifkan'}">
          ${unit.is_active ? '🔓' : '🔒'}
        </button>
        <button class="btn-icon" onclick="confirmDeleteUnit(${unit.id}, '${escapeHtml(unit.name)}')" title="Hapus">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openAddUnitModal() {
  editingUnitId = null;
  document.getElementById('unitModalTitle').textContent = 'Tambah Satuan';
  document.getElementById('unitForm').reset();
  document.getElementById('unitFormError').style.display = 'none';
  document.getElementById('btnSubmitUnitText').textContent = 'Simpan';
  document.getElementById('unitModal').style.display = 'flex';
  setTimeout(() => document.getElementById('unitName').focus(), 100);
}

async function editUnit(unitId) {
  try {
    const result = await apiClient.get(`/units/${unitId}`);
    if (result.success) {
      const unit = result.data;
      editingUnitId = unitId;
      document.getElementById('unitModalTitle').textContent = 'Edit Satuan';
      document.getElementById('unitId').value = unit.id;
      document.getElementById('unitName').value = unit.name;
      document.getElementById('unitAbbreviation').value = unit.abbreviation;
      document.getElementById('unitFormError').style.display = 'none';
      document.getElementById('btnSubmitUnitText').textContent = 'Update';
      document.getElementById('unitModal').style.display = 'flex';
      setTimeout(() => document.getElementById('unitName').focus(), 100);
    } else {
      showToast('Gagal memuat data satuan', 'error');
    }
  } catch (error) {
    console.error('Edit unit error:', error);
    showToast('Terjadi kesalahan', 'error');
  }
}

function closeUnitModal() {
  document.getElementById('unitModal').style.display = 'none';
  document.getElementById('unitForm').reset();
  editingUnitId = null;
}

async function handleUnitFormSubmit(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('unitName').value.trim(),
    abbreviation: document.getElementById('unitAbbreviation').value.trim()
  };

  if (!formData.name || !formData.abbreviation) {
    showUnitFormError('Nama dan singkatan satuan harus diisi');
    return;
  }

  showConfirm(
    'Konfirmasi Simpan',
    `Yakin ingin ${editingUnitId ? 'mengupdate' : 'menambahkan'} satuan "${formData.name}"?`,
    async () => {
      const btnSubmit = document.querySelector('#unitForm button[type="submit"]');
      const btnText = document.getElementById('btnSubmitUnitText');
      btnSubmit.disabled = true;
      btnText.textContent = 'Menyimpan...';

      try {
        const result = editingUnitId
          ? await apiClient.put(`/units/${editingUnitId}`, formData)
          : await apiClient.post('/units', formData);

        if (result.success) {
          closeUnitModal();
          await loadUnits();
          showToast(editingUnitId ? 'Satuan berhasil diupdate' : 'Satuan berhasil ditambahkan', 'success');
        } else {
          showUnitFormError(result.message || 'Gagal menyimpan satuan');
        }
      } catch (error) {
        showUnitFormError('Terjadi kesalahan saat menyimpan');
      } finally {
        btnSubmit.disabled = false;
        btnText.textContent = editingUnitId ? 'Update' : 'Simpan';
      }
    }
  );
}

async function toggleUnitStatus(unitId, currentStatus) {
  try {
    const result = await apiClient.patch(`/units/${unitId}/toggle-status`);
    if (result.success) {
      await loadUnits();
      showToast(`Satuan berhasil ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}`, 'success');
    } else {
      showToast('Gagal mengubah status satuan', 'error');
    }
  } catch (error) {
    showToast('Terjadi kesalahan', 'error');
  }
}

function confirmDeleteUnit(unitId, unitName) {
  showConfirm('Konfirmasi Hapus', `Yakin ingin menghapus satuan "${unitName}"?`, async () => {
    try {
      const result = await apiClient.delete(`/units/${unitId}`);
      if (result.success) {
        await loadUnits();
        showToast('Satuan berhasil dihapus', 'success');
      } else {
        showToast(result.message || 'Gagal menghapus satuan', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'error');
    }
  });
}

function showUnitFormError(message) {
  const el = document.getElementById('unitFormError');
  el.textContent = message;
  el.style.display = 'block';
}

// ============================================
// PRODUCT UNITS (SATUAN JUAL) MANAGEMENT
// ============================================

async function loadProductUnitsForEdit(productId, baseUnit, basePrice) {
  try {
    const result = await apiClient.get(`/products/${productId}/units`);
    if (result.success) {
      productUnitRows = result.data.map(u => ({
        id: u.id,
        unit_id: u.unit_id,
        unit_name: u.unit_name,
        abbreviation: u.abbreviation || '',
        conversion_qty: u.conversion_qty,
        purchase_price: u.purchase_price || 0,
        selling_price: u.selling_price,
        is_default: u.is_default
      }));
    } else {
      productUnitRows = [];
    }

    // Pastikan row dasar selalu ada
    const baseUnitObj = allUnits.find(u => u.name.toLowerCase() === baseUnit.toLowerCase());
    const alreadyHasDefault = productUnitRows.some(r => r.is_default);
    if (!alreadyHasDefault && baseUnitObj) {
      productUnitRows.unshift({
        id: null,
        unit_id: baseUnitObj.id,
        unit_name: baseUnitObj.name,
        abbreviation: baseUnitObj.abbreviation,
        conversion_qty: 1,
        purchase_price: 0,
        selling_price: basePrice,
        is_default: true
      });
    }

    renderProductUnitsRows(baseUnit);
    document.getElementById('productUnitsSection').classList.remove('hidden');
  } catch (error) {
    console.error('loadProductUnitsForEdit error:', error);
  }
}

function renderProductUnitsRows(baseUnit) {
  const container = document.getElementById('productUnitsContainer');

  if (productUnitRows.length === 0) {
    container.innerHTML = `<p class="text-center" style="color:#888; font-size:13px;">Belum ada paket grosiran. Klik "+ Tambah Paket" untuk menambahkan.</p>`;
    return;
  }

  const basePurchase = parseRupiahInput('purchasePrice') || 0;
  const baseSelling = parseRupiahInput('sellingPrice') || 0;

  container.innerHTML = `
    <table class="data-table" style="font-size:13px;">
      <thead>
        <tr>
          <th>Nama Paket</th>
          <th>Isi</th>
          <th>Harga Beli</th>
          <th>Harga Jual</th>
          <th>Tipe</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${productUnitRows.map((row, idx) => {
          const refPurchase = basePurchase * row.conversion_qty;
          const refSelling = baseSelling * row.conversion_qty;
          const purchaseCell = row.is_default
            ? `<td><span style="color:#888; font-size:11px;">Dari produk</span></td>`
            : `<td>
                ${formatCurrency(row.purchase_price)}
                ${refPurchase > 0 ? `<br><small style="color:#888;">Ref: ${formatCurrency(refPurchase)}</small>` : ''}
               </td>`;
          const sellingCell = row.is_default
            ? `<td><span style="color:#888; font-size:11px;">Ubah via Harga Jual ↑</span></td>`
            : `<td>
                ${formatCurrency(row.selling_price)}
                ${refSelling > 0 ? `<br><small style="color:#888;">Ref: ${formatCurrency(refSelling)}</small>` : ''}
               </td>`;
          return `
            <tr>
              <td>${escapeHtml(row.unit_name)}</td>
              <td>${row.is_default ? '1 (Dasar)' : `${row.conversion_qty} ${escapeHtml(baseUnit || '')}`}</td>
              ${purchaseCell}
              ${sellingCell}
              <td>
                <span class="badge ${row.is_default ? 'badge-success' : 'badge-warning'}">
                  ${row.is_default ? 'Dasar' : 'Paket'}
                </span>
              </td>
              <td class="action-buttons">
                ${row.is_default
                  ? `<small style="color:#888; font-size:11px;">—</small>`
                  : `
                    <button type="button" class="btn-icon" onclick="editProductUnitRow(${idx})" title="Edit">✏️</button>
                    <button type="button" class="btn-icon" onclick="deleteProductUnitRow(${idx})" title="Hapus">🗑️</button>
                  `}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function openAddProductUnitModal() {
  puEditIndex = null;
  document.getElementById('productUnitModalTitle').textContent = 'Tambah Paket Grosiran';
  document.getElementById('productUnitForm').reset();
  document.getElementById('puEditIndex').value = '';
  document.getElementById('productUnitFormError').style.display = 'none';
  document.getElementById('btnSubmitProductUnitText').textContent = 'Simpan';
  document.getElementById('puPriceHint').textContent = '';
  document.getElementById('puRefInfo').style.display = 'none';

  document.getElementById('productUnitModal').style.display = 'flex';
  setTimeout(() => document.getElementById('puUnitName').focus(), 100);
}

function editProductUnitRow(idx) {
  const row = productUnitRows[idx];
  puEditIndex = idx;

  document.getElementById('productUnitModalTitle').textContent = 'Edit Paket Grosiran';
  document.getElementById('puEditIndex').value = idx;
  document.getElementById('productUnitFormError').style.display = 'none';
  document.getElementById('btnSubmitProductUnitText').textContent = 'Update';

  document.getElementById('puUnitName').value = row.unit_name;
  document.getElementById('puConversionQty').value = row.conversion_qty;
  setRupiahInput('puPurchasePrice', row.purchase_price || 0);
  setRupiahInput('puSellingPrice', row.selling_price);
  updatePuRefAndHints();

  document.getElementById('productUnitModal').style.display = 'flex';
  setTimeout(() => document.getElementById('puUnitName').focus(), 100);
}

function deleteProductUnitRow(idx) {
  showConfirm('Konfirmasi Hapus', 'Yakin ingin menghapus satuan jual ini?', async () => {
    const removed = productUnitRows.splice(idx, 1);
    if (editingProductId) {
      const saveResult = await apiClient.post(`/products/${editingProductId}/units`, { units: productUnitRows });
      if (!saveResult.success) {
        productUnitRows.splice(idx, 0, removed[0]); // rollback
        showToast('Gagal menghapus satuan jual', 'error');
        return;
      }
    }
    const baseUnit = document.getElementById('unit').value;
    renderProductUnitsRows(baseUnit);
    showToast('Satuan jual dihapus', 'success');
  });
}

function closeProductUnitModal() {
  document.getElementById('productUnitModal').style.display = 'none';
  document.getElementById('productUnitForm').reset();
  puEditIndex = null;
}

function updatePuRefAndHints() {
  const convQty = parseFloat(document.getElementById('puConversionQty').value) || 0;
  const sellingPrice = parseRupiahInput('puSellingPrice');
  const baseUnit = document.getElementById('unit') ? document.getElementById('unit').value : '';
  const basePurchase = parseRupiahInput('purchasePrice') || 0;
  const baseSelling = parseRupiahInput('sellingPrice') || 0;

  // Hint konversi
  const hint = document.getElementById('puConversionHint');
  hint.textContent = convQty > 0
    ? `1 paket ini = ${convQty} ${baseUnit}`
    : 'Berapa satuan dasar dalam 1 paket ini';

  // Hint harga jual per satuan dasar
  const priceHint = document.getElementById('puPriceHint');
  if (convQty > 0 && sellingPrice > 0) {
    priceHint.textContent = `≈ ${formatCurrency(sellingPrice / convQty)} per ${baseUnit}`;
  } else {
    priceHint.textContent = '';
  }

  // Ref harga otomatis
  const refInfo = document.getElementById('puRefInfo');
  if (convQty > 0 && (basePurchase > 0 || baseSelling > 0)) {
    document.getElementById('puRefPurchase').textContent = basePurchase > 0 ? formatCurrency(basePurchase * convQty) : '—';
    document.getElementById('puRefSelling').textContent = baseSelling > 0 ? formatCurrency(baseSelling * convQty) : '—';
    refInfo.style.display = 'block';
  } else {
    refInfo.style.display = 'none';
  }
}

async function handleProductUnitFormSubmit(e) {
  e.preventDefault();

  const unitName = document.getElementById('puUnitName').value.trim();
  const conversionQty = parseFloat(document.getElementById('puConversionQty').value) || 0;
  const purchasePrice = parseRupiahInput('puPurchasePrice');
  const sellingPrice = parseRupiahInput('puSellingPrice');

  if (!unitName) {
    showPuFormError('Nama paket harus diisi');
    return;
  }
  if (conversionQty <= 0) {
    showPuFormError('Nilai konversi harus lebih dari 0');
    return;
  }
  if (purchasePrice <= 0) {
    showPuFormError('Harga beli harus lebih dari 0');
    return;
  }
  if (sellingPrice <= 0) {
    showPuFormError('Harga jual harus lebih dari 0');
    return;
  }

  // Cegah duplikat nama paket (kecuali row yang sedang diedit)
  const isDuplicate = productUnitRows.some((r, i) => !r.is_default && r.unit_name.toLowerCase() === unitName.toLowerCase() && i !== puEditIndex);
  if (isDuplicate) {
    showPuFormError('Nama paket ini sudah ditambahkan');
    return;
  }

  const rowData = {
    id: puEditIndex !== null ? productUnitRows[puEditIndex].id : null,
    unit_id: null,
    unit_name: unitName,
    abbreviation: '',
    conversion_qty: conversionQty,
    purchase_price: purchasePrice,
    selling_price: sellingPrice,
    is_default: false
  };

  // Simpan state lama untuk rollback jika API gagal
  const prevRows = [...productUnitRows];

  if (puEditIndex !== null) {
    productUnitRows[puEditIndex] = rowData;
  } else {
    productUnitRows.push(rowData);
  }

  // Persist immediately jika sedang edit produk yang sudah ada
  if (editingProductId) {
    const saveResult = await apiClient.post(`/products/${editingProductId}/units`, { units: productUnitRows });
    if (!saveResult.success) {
      productUnitRows = prevRows; // rollback
      showToast('Gagal menyimpan paket grosiran', 'error');
      return;
    }
    // Reload dari DB untuk dapat IDs terbaru
    const fresh = await apiClient.get(`/products/${editingProductId}/units`);
    if (fresh.success && Array.isArray(fresh.data)) {
      productUnitRows = fresh.data.map(u => ({
        id: u.id,
        unit_id: u.unit_id,
        unit_name: u.unit_name,
        abbreviation: u.abbreviation || '',
        conversion_qty: u.conversion_qty,
        purchase_price: u.purchase_price || 0,
        selling_price: u.selling_price,
        is_default: u.is_default
      }));
    }
  }

  const baseUnit = document.getElementById('unit').value;
  renderProductUnitsRows(baseUnit);
  closeProductUnitModal();
  showToast(puEditIndex !== null ? 'Paket grosiran diupdate' : 'Paket grosiran ditambahkan', 'success');
}

function showPuFormError(message) {
  const el = document.getElementById('productUnitFormError');
  el.textContent = message;
  el.style.display = 'block';
}


// ============================================
// CETAK LABEL BARCODE
// ============================================

function onProductCheckChange(checkbox) {
  const id = parseInt(checkbox.dataset.id);
  if (checkbox.checked) selectedProductIds.add(id);
  else selectedProductIds.delete(id);
  updateBulkLabelBtn();
}

function updateBulkLabelBtn() {
  const btn = document.getElementById('btnBulkPrintLabel');
  const span = document.getElementById('selectedCount');
  const count = selectedProductIds.size;
  span.textContent = count;
  btn.style.display = count > 0 ? 'inline-flex' : 'none';
}

function openSingleLabelPrint(productId) {
  _labelPrintSavedIds = new Set(selectedProductIds);
  selectedProductIds.clear();
  selectedProductIds.add(productId);
  updateBulkLabelBtn();
  openLabelPrintModal();
}

async function openLabelPrintModal() {
  if (selectedProductIds.size === 0) {
    showToast('Pilih minimal 1 produk terlebih dahulu', 'error');
    return;
  }

  // Collect product data dari allProducts
  labelPrintProducts = allProducts.filter(p => selectedProductIds.has(p.id));
  if (labelPrintProducts.length === 0) {
    showToast('Produk tidak ditemukan', 'error');
    return;
  }

  // Load default settings
  try {
    const res = await apiClient.get('/settings');
    if (res.success && res.data) {
      const s = res.data;
      if (s.label_size_default) {
        document.getElementById('labelSize').value = s.label_size_default;
      }
    }
  } catch (e) { /* ignore */ }

  // Load printers
  await loadPrinterList();

  // Render product rows
  renderLabelProductRows();

  // Clear error
  const errEl = document.getElementById('labelPrintError');
  errEl.classList.add('hidden');

  // Reset preview
  document.getElementById('labelPreviewArea').innerHTML =
    '<p style="color:#888;font-size:13px;margin:auto;">Klik "Refresh Preview" untuk melihat preview label</p>';

  document.getElementById('labelPrintModal').style.display = 'flex';
}

function closeLabelPrintModal() {
  document.getElementById('labelPrintModal').style.display = 'none';
  labelPrintProducts = [];
  if (_labelPrintSavedIds !== null) {
    selectedProductIds = _labelPrintSavedIds;
    _labelPrintSavedIds = null;
    updateBulkLabelBtn();
  }
}

async function loadPrinterList() {
  // Printer selection not needed — printing via browser print dialog (window.print())
  const select = document.getElementById('labelPrinter');
  if (select) select.innerHTML = '<option value="">— Gunakan dialog print browser —</option>';
}

function renderLabelProductRows() {
  const tbody = document.getElementById('labelPrintProductsBody');
  tbody.innerHTML = labelPrintProducts.map(p => `
    <tr>
      <td><code>${escapeHtml(p.barcode)}</code></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${formatCurrency(p.selling_price)}</td>
      <td>
        <input
          type="number"
          class="label-qty-input"
          data-id="${p.id}"
          value="1"
          min="1"
          max="999"
          style="width:80px;padding:4px 6px;border:1px solid #ddd;border-radius:4px;text-align:center;"
        >
      </td>
    </tr>
  `).join('');
}

function getLabelQtyMap() {
  const map = {};
  document.querySelectorAll('.label-qty-input').forEach(input => {
    const id = parseInt(input.dataset.id);
    const qty = Math.max(1, parseInt(input.value) || 1);
    map[id] = qty;
  });
  return map;
}

function renderLabelPreview() {
  const size = document.getElementById('labelSize').value;
  const qtyMap = getLabelQtyMap();
  const previewArea = document.getElementById('labelPreviewArea');

  const SIZE_CFG = {
    '3x2':   { w: '84px',  h: '57px',  bw: 0.9, bh: 20, fs: 7 },
    '4x2.5': { w: '113px', h: '71px',  bw: 1.1, bh: 27, fs: 8 },
    '5x3':   { w: '142px', h: '85px',  bw: 1.4, bh: 35, fs: 9 },
    '6x4':   { w: '170px', h: '113px', bw: 1.7, bh: 45, fs: 10 },
    '8x5':   { w: '227px', h: '142px', bw: 2.2, bh: 58, fs: 11 }
  };

  const cfg = SIZE_CFG[size] || SIZE_CFG['4x2.5'];
  previewArea.innerHTML = '';

  let totalLabels = 0;
  labelPrintProducts.forEach(p => {
    const qty = qtyMap[p.id] || 1;
    totalLabels += qty;
    const showQty = Math.min(qty, 3); // preview maks 3 per produk

    for (let i = 0; i < showQty; i++) {
      const wrap = document.createElement('div');
      wrap.style.cssText = `
        width:${cfg.w};height:${cfg.h};
        border:1px dashed #aaa;border-radius:3px;
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        padding:3px;background:#fff;overflow:hidden;
        flex-shrink:0;
      `;

      const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      wrap.appendChild(svgEl);

      const nameEl = document.createElement('div');
      nameEl.style.cssText = `font-size:${cfg.fs}px;font-weight:700;text-align:center;line-height:1.2;word-break:break-word;max-width:100%;margin-top:2px;`;
      nameEl.textContent = p.name.length > 20 ? p.name.slice(0, 19) + '…' : p.name;
      wrap.appendChild(nameEl);

      const priceEl = document.createElement('div');
      priceEl.style.cssText = `font-size:${cfg.fs}px;font-weight:700;text-align:center;margin-top:1px;`;
      priceEl.textContent = 'Rp ' + Number(p.selling_price).toLocaleString('id-ID');
      wrap.appendChild(priceEl);

      previewArea.appendChild(wrap);

      try {
        JsBarcode(svgEl, p.barcode, {
          format: 'CODE128',
          width: cfg.bw,
          height: cfg.bh,
          displayValue: true,
          fontSize: cfg.fs,
          margin: 1,
          textMargin: 1
        });
      } catch (e) {
        svgEl.remove();
        const errEl = document.createElement('div');
        errEl.style.cssText = `font-size:${cfg.fs}px;color:#dc2626;text-align:center;`;
        errEl.textContent = p.barcode;
        wrap.insertBefore(errEl, nameEl);
      }
    }

    if (qty > 3) {
      const moreEl = document.createElement('div');
      moreEl.style.cssText = 'display:flex;align-items:center;justify-content:center;font-size:12px;color:#6b7280;padding:8px;';
      moreEl.textContent = `+${qty - 3} lagi`;
      previewArea.appendChild(moreEl);
    }
  });

  if (totalLabels === 0) {
    previewArea.innerHTML = '<p style="color:#888;font-size:13px;margin:auto;">Belum ada produk</p>';
  }
}

function doLabelPrint() {
  const size = document.getElementById('labelSize').value;
  const qtyMap = getLabelQtyMap();

  const errEl = document.getElementById('labelPrintError');
  errEl.classList.add('hidden');

  if (labelPrintProducts.length === 0) {
    errEl.textContent = 'Tidak ada produk yang dipilih.';
    errEl.classList.remove('hidden');
    return;
  }

  const SIZE_MM = {
    '3x2':   { w: '30mm', h: '20mm' },
    '4x2.5': { w: '40mm', h: '25mm' },
    '5x3':   { w: '50mm', h: '30mm' },
    '6x4':   { w: '60mm', h: '40mm' },
    '8x5':   { w: '80mm', h: '50mm' }
  };
  const sz = SIZE_MM[size] || SIZE_MM['4x2.5'];

  // Build flat list of labels (one per copy)
  const items = [];
  labelPrintProducts.forEach(p => {
    const qty = qtyMap[p.id] || 1;
    for (let i = 0; i < qty; i++) items.push(p);
  });

  const labels = items.map((p, idx) => `
    <div class="label">
      <div class="product-name">${escapeHtml(p.name.length > 24 ? p.name.slice(0, 23) + '…' : p.name)}</div>
      <svg data-barcode="${escapeHtml(p.barcode)}" id="bc-${idx}"></svg>
      <div class="price">Rp ${Number(p.selling_price).toLocaleString('id-ID')}</div>
    </div>
  `).join('');

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Print Label Barcode</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
  <style>
    body { margin: 0; display: flex; flex-wrap: wrap; gap: 2px; }
    .label {
      display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
      width: ${sz.w}; height: ${sz.h};
      border: 1px dashed #ccc; padding: 2px; box-sizing: border-box; text-align: center;
    }
    .product-name { font-size: 8px; font-weight: bold; line-height: 1.2; word-break: break-word; max-width: 100%; }
    .label svg { width: 90%; max-height: 55%; }
    .price { font-size: 9px; font-weight: bold; }
    @media print { body { gap: 0; } .label { border: none; page-break-inside: avoid; } }
  </style>
</head>
<body>
  ${labels}
  <script>
    document.querySelectorAll('svg[data-barcode]').forEach(function(el) {
      try {
        JsBarcode(el, el.dataset.barcode, { format: 'CODE128', displayValue: true, fontSize: 9, margin: 1, textMargin: 1 });
      } catch(e) {}
    });
    window.onload = function() { window.print(); window.close(); };
  <\/script>
</body>
</html>`);
  printWindow.document.close();

  closeLabelPrintModal();
  showToast('Window cetak label dibuka', 'success');
}

// ============================================
// IMPORT PRODUK VIA EXCEL/CSV
// ============================================

let importParsedRows = [];   // raw parsed rows
let importValidated = [];    // [{rowNum, data, errors:[]}]

function openImportProductModal() {
  importParsedRows = [];
  importValidated = [];
  document.getElementById('importFileInput').value = '';
  document.getElementById('importFileError').classList.add('hidden');
  document.getElementById('importFileError').textContent = '';
  showImportStep(1);
  document.getElementById('importProductModal').classList.add('active');
}

function closeImportProductModal() {
  document.getElementById('importProductModal').classList.remove('active');
}

function showImportStep(step) {
  document.getElementById('importStep1').classList.add('hidden');
  document.getElementById('importStep2').classList.add('hidden');
  document.getElementById('importStep3').classList.add('hidden');
  document.getElementById(`importStep${step}`).classList.remove('hidden');
}

function downloadImportTemplate() {
  const headers = ['nama', 'barcode', 'kategori', 'harga_beli', 'harga_jual', 'stok', 'stok_minimum', 'satuan'];
  const example = ['Contoh Produk A', 'PROD-00001', 'Minuman', 5000, 7000, 100, 10, 'pcs'];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'template_import_produk.xlsx');
}

function parseImportFile() {
  const fileInput = document.getElementById('importFileInput');
  const errEl = document.getElementById('importFileError');
  errEl.classList.add('hidden');

  if (!fileInput.files || !fileInput.files[0]) {
    errEl.textContent = 'Pilih file terlebih dahulu.';
    errEl.classList.remove('hidden');
    return;
  }

  const file = fileInput.files[0];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xlsx', 'csv'].includes(ext)) {
    errEl.textContent = 'Format file tidak didukung. Gunakan .xlsx atau .csv';
    errEl.classList.remove('hidden');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!rows || rows.length === 0) {
        errEl.textContent = 'File kosong atau tidak ada data.';
        errEl.classList.remove('hidden');
        return;
      }

      // Normalize header keys (trim + lowercase)
      importParsedRows = rows.map(r => {
        const norm = {};
        for (const k in r) norm[k.trim().toLowerCase().replace(/\s+/g, '_')] = r[k];
        return norm;
      });

      validateImportRows();
      renderImportPreview();
      showImportStep(2);
    } catch (err) {
      errEl.textContent = 'Gagal membaca file: ' + err.message;
      errEl.classList.remove('hidden');
    }
  };
  reader.readAsArrayBuffer(file);
}

function validateImportRows() {
  const existingBarcodes = new Set(allProducts.map(p => String(p.barcode).toLowerCase()));
  const seenBarcodes = new Set();
  const categoryNames = new Set(allCategories.map(c => c.name.toLowerCase()));

  importValidated = importParsedRows.map((row, idx) => {
    const errors = [];
    const warnings = [];
    const nama = String(row.nama || '').trim();
    const barcode = String(row.barcode || '').trim();
    const kategori = String(row.kategori || '').trim();
    const harga_beli = parseFloat(row.harga_beli) || 0;
    const harga_jual = parseFloat(row.harga_jual) || 0;

    if (!nama) errors.push('Nama kosong');
    if (!barcode) {
      errors.push('Barcode kosong');
    } else {
      if (existingBarcodes.has(barcode.toLowerCase())) errors.push(`Barcode "${barcode}" sudah ada di database`);
      if (seenBarcodes.has(barcode.toLowerCase())) errors.push(`Barcode "${barcode}" duplikat dalam file`);
      seenBarcodes.add(barcode.toLowerCase());
    }
    if (kategori && !categoryNames.has(kategori.toLowerCase())) {
      warnings.push(`Kategori "${kategori}" belum ada — akan dibuat otomatis`);
    }
    if (harga_jual < harga_beli) errors.push('Harga jual < harga beli');
    if (!row.satuan) errors.push('Satuan kosong');

    return { rowNum: idx + 2, data: row, errors, warnings };
  });
}

function renderImportPreview() {
  const filter = document.querySelector('input[name="importFilter"]:checked').value;
  const tbody = document.getElementById('importPreviewBody');

  const totalRows = importValidated.length;
  const errorRows = importValidated.filter(r => r.errors.length > 0).length;
  const warnRows  = importValidated.filter(r => r.errors.length === 0 && r.warnings && r.warnings.length > 0).length;
  const validRows = totalRows - errorRows;

  document.getElementById('importSummaryBar').innerHTML =
    `Total: <strong>${totalRows}</strong> baris &nbsp;|&nbsp; ` +
    `<span style="color:#16a34a;">✅ Valid: <strong>${validRows}</strong></span> &nbsp;|&nbsp; ` +
    (warnRows > 0 ? `<span style="color:#d97706;">⚠️ Warning: <strong>${warnRows}</strong></span> &nbsp;|&nbsp; ` : '') +
    `<span style="color:#dc2626;">❌ Error: <strong>${errorRows}</strong></span>`;

  let rows = importValidated;
  if (filter === 'valid') rows = importValidated.filter(r => r.errors.length === 0);
  if (filter === 'error') rows = importValidated.filter(r => r.errors.length > 0);

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center" style="color:#888;">Tidak ada data</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => {
    const isError   = r.errors.length > 0;
    const hasWarn   = !isError && r.warnings && r.warnings.length > 0;
    const statusCell = isError
      ? `<td><span class="badge badge-danger" title="${r.errors.join('; ')}">❌ Error</span></td>`
      : hasWarn
        ? `<td><span class="badge badge-warning" title="${r.warnings.join('; ')}">⚠️ Warning</span></td>`
        : `<td><span class="badge badge-success">✅ Valid</span></td>`;
    const rowStyle = isError ? 'background:#fff5f5;' : hasWarn ? 'background:#fffbeb;' : '';
    const d = r.data;
    const noteRow = isError
      ? `<tr style="background:#fff5f5;"><td colspan="10" style="font-size:12px;color:#dc2626;padding:2px 12px 8px;">↳ ${r.errors.join(' · ')}</td></tr>`
      : hasWarn
        ? `<tr style="background:#fffbeb;"><td colspan="10" style="font-size:12px;color:#d97706;padding:2px 12px 8px;">↳ ${r.warnings.join(' · ')}</td></tr>`
        : '';
    return `<tr style="${rowStyle}">
      <td>${r.rowNum}</td>
      <td>${escHtml(String(d.nama || ''))}</td>
      <td>${escHtml(String(d.barcode || ''))}</td>
      <td>${escHtml(String(d.kategori || ''))}</td>
      <td>${formatRupiah(parseFloat(d.harga_beli) || 0)}</td>
      <td>${formatRupiah(parseFloat(d.harga_jual) || 0)}</td>
      <td>${d.stok || 0}</td>
      <td>${d.stok_minimum || 5}</td>
      <td>${escHtml(String(d.satuan || ''))}</td>
      ${statusCell}
    </tr>${noteRow}`;
  }).join('');
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function processImport() {
  const errorRows = importValidated.filter(r => r.errors.length > 0);
  const skipErrors = document.getElementById('importSkipErrors').checked;
  const processEl = document.getElementById('importProcessError');
  processEl.classList.add('hidden');

  if (errorRows.length > 0 && !skipErrors) {
    processEl.textContent = `Ada ${errorRows.length} baris error. Centang "Skip baris error" atau perbaiki data terlebih dahulu.`;
    processEl.classList.remove('hidden');
    return;
  }

  const validRows = importValidated.filter(r => r.errors.length === 0).map(r => r.data);
  if (validRows.length === 0) {
    processEl.textContent = 'Tidak ada baris valid untuk diproses.';
    processEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('btnProcessImport');
  btn.disabled = true;
  btn.textContent = 'Memproses...';

  try {
    const result = await apiClient.post('/products/import-bulk', { rows: validRows });
    btn.disabled = false;
    btn.textContent = '✅ Proses Import';

    if (!result.success) {
      processEl.textContent = result.message || 'Terjadi kesalahan saat import.';
      processEl.classList.remove('hidden');
      return;
    }

    const results = result.data;
    let html = `<div style="margin-bottom:14px;padding:12px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;">
      <div style="font-size:16px;font-weight:700;color:#15803d;margin-bottom:4px;">Import Selesai</div>
      <div>✅ Berhasil: <strong>${results.success}</strong> produk</div>
      <div>❌ Gagal: <strong>${results.failed.length}</strong> baris</div>
    </div>`;

    if (results.failed.length > 0) {
      html += `<div style="font-size:13px;font-weight:600;margin-bottom:6px;">Detail baris gagal:</div>
      <div class="table-container" style="max-height:220px;overflow-y:auto;">
        <table class="data-table">
          <thead><tr><th>Baris</th><th>Nama</th><th>Barcode</th><th>Alasan</th></tr></thead>
          <tbody>
            ${results.failed.map(f => `<tr>
              <td>${f.baris}</td>
              <td>${escHtml(String(f.data.nama || ''))}</td>
              <td>${escHtml(String(f.data.barcode || ''))}</td>
              <td style="color:#dc2626;">${escHtml(f.alasan)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    }

    document.getElementById('importResultContent').innerHTML = html;
    showImportStep(3);

    if (results.success > 0) {
      await loadProducts();
      showToast(`${results.success} produk berhasil diimport`, 'success');
    }
  } catch (err) {
    btn.disabled = false;
    btn.textContent = '✅ Proses Import';
    processEl.textContent = 'Terjadi kesalahan: ' + err.message;
    processEl.classList.remove('hidden');
  }
}