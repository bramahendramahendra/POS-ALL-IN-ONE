// Kasir Page - POS System
let currentUser = null;
let cart = [];
let currentDiscount = { type: 'none', value: 0, amount: 0 };
let currentTax = { percent: 0, amount: 0 };
let searchTimeout = null;
// pending product for unit selection
let pendingProduct = null;
// cache harga tier: { [product_id]: [{tier_name, min_qty, price}, ...] }
let productPricesCache = {};

// Bersihkan cache tier saat halaman kembali aktif (user baru balik dari halaman produk)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    productPricesCache = {};
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Kasir page loaded');

  // Initialize page layout
  if (!initializePageLayout('kasir')) {
    return;
  }

  currentUser = getCurrentUser();

  // Cek kas harian sebelum lanjut
  const kasOk = await checkCashDrawerOnLoad();
  if (!kasOk) return;

  // Load draft if exists
  loadDraft();

  // Setup event listeners
  setupEventListeners();

  // Focus on search input
  setTimeout(() => {
    document.getElementById('productSearch').focus();
  }, 100);
});

// ============================================
// CEK KAS HARIAN SAAT BUKA KASIR
// ============================================

async function checkCashDrawerOnLoad() {
  try {
    const result = await apiClient.get('/cash-drawer/current');
    const isOpen = result.success && result.data && result.data.status === 'open';

    if (isOpen) return true;

    const role = currentUser?.role;

    if (role === 'kasir') {
      // Kasir wajib buka kas dulu — redirect ke my-cash
      window.location.href = 'my-cash.html?redirect=kasir';
      return false;
    }

    // Owner/admin: tampilkan warning banner saja, tetap bisa akses
    const warning = document.getElementById('cashDrawerWarning');
    if (warning) warning.style.display = 'flex';

    return true;
  } catch (error) {
    console.error('checkCashDrawerOnLoad error:', error);
    // Jika gagal cek (misal offline), biarkan kasir tetap bisa masuk
    return true;
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Product search with debounce
  document.getElementById('productSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const keyword = e.target.value.trim();
    
    if (keyword.length < 2) {
      hideSuggestions();
      return;
    }

    searchTimeout = setTimeout(() => {
      searchProduct(keyword);
    }, 300);
  });

  // Product search - Enter key
  document.getElementById('productSearch').addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const keyword = e.target.value.trim();

      if (!keyword) return;

      // Jika ada suggestion yang tampil, pilih yang pertama
      const suggestionsContainer = document.getElementById('productSuggestions');
      const firstSuggestion = suggestionsContainer.querySelector('.suggestion-item');
      if (suggestionsContainer.style.display !== 'none' && firstSuggestion) {
        firstSuggestion.click();
        return;
      }

      // Fallback: cari via barcode
      try {
        const result = await apiClient.get(`/products/barcode/${encodeURIComponent(keyword)}`);
        if (result.success && result.data) {
          document.getElementById('productSearch').value = '';
          hideSuggestions();
          await addToCartWithUnitSelect(result.data);
        }
      } catch (error) {
        console.error('Barcode search error:', error);
      }
    }
  });

  // Discount type toggle
  document.getElementById('discountTypePercent').addEventListener('click', () => {
    setDiscountType('percent');
  });
  
  document.getElementById('discountTypeAmount').addEventListener('click', () => {
    setDiscountType('amount');
  });

  // Discount value input — rupiah format hanya aktif saat mode 'amount'
  setupRupiahInput('discountValue');
  document.getElementById('discountValue').addEventListener('input', () => {
    const value = currentDiscount.type === 'amount'
      ? parseRupiahInput('discountValue')
      : parseFloat(document.getElementById('discountValue').value) || 0;
    applyDiscount(currentDiscount.type, value);
  });

  // Tax input
  document.getElementById('taxPercent').addEventListener('input', (e) => {
    const percent = parseFloat(e.target.value) || 0;
    calculateTax(percent);
  });

  // Action buttons
  document.getElementById('btnPayment').addEventListener('click', openPaymentModal);
  document.getElementById('btnHold').addEventListener('click', saveDraft);
  document.getElementById('btnCancel').addEventListener('click', confirmClearCart);

  // Metode bayar: tampilkan/sembunyikan section pelanggan kredit
  document.getElementById('paymentMethod').addEventListener('change', onPaymentMethodChange);

  // Load daftar pelanggan aktif
  loadCustomerList();

  // Payment modal
  document.getElementById('closePaymentModal').addEventListener('click', closePaymentModal);
  document.getElementById('btnCancelPayment').addEventListener('click', closePaymentModal);
  document.getElementById('btnProcessPayment').addEventListener('click', processTransaction);

  // Payment amount input - auto calculate change
  setupRupiahInput('paymentAmount');
  document.getElementById('paymentAmount').addEventListener('input', calculateChange);

  // Unit select modal
  document.getElementById('closeUnitSelectModal').addEventListener('click', closeUnitSelectModal);

  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.product-search-box')) {
      hideSuggestions();
    }
    if (e.target === document.getElementById('unitSelectModal')) {
      closeUnitSelectModal();
    }
    if (!e.target.closest('#itemDiscountPopup') && !e.target.closest('.btn-item-discount')) {
      closeItemDiscountPopup();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ============================================
// PRODUCT SEARCH
// ============================================

async function searchProduct(keyword) {
  try {
    const result = await apiClient.get('/products/search', { q: keyword, limit: 10 });

    if (result.success && result.data.length > 0) {
      showProductSuggestions(result.data);
    } else {
      hideSuggestions();
    }
  } catch (error) {
    console.error('Search product error:', error);
  }
}

function showProductSuggestions(products) {
  const container = document.getElementById('productSuggestions');
  
  container.innerHTML = products.map(product => `
    <div class="suggestion-item" onclick="selectProduct(${product.id})">
      <div class="suggestion-main">
        <strong>${escapeHtml(product.name)}</strong>
        <span class="suggestion-barcode">${escapeHtml(product.barcode)}</span>
      </div>
      <div class="suggestion-details">
        <span class="suggestion-price">${formatCurrency(product.selling_price)}</span>
        <span class="suggestion-stock">Stok: ${product.stock}</span>
      </div>
    </div>
  `).join('');
  
  container.style.display = 'block';
}

function hideSuggestions() {
  document.getElementById('productSuggestions').style.display = 'none';
}

async function selectProduct(productId) {
  try {
    const result = await apiClient.get(`/products/${productId}`);

    if (result.success && result.data) {
      document.getElementById('productSearch').value = '';
      hideSuggestions();
      await addToCartWithUnitSelect(result.data);
    }
  } catch (error) {
    console.error('Select product error:', error);
  }
}

// Cek satuan jual tersedia; jika > 1 tampilkan modal pilih satuan, jika hanya 1 langsung pakai
async function addToCartWithUnitSelect(product) {
  try {
    const result = await apiClient.get(`/products/${product.id}/units`);
    const units = result.success && Array.isArray(result.data) ? result.data : [];

    if (units.length > 1) {
      // Tampilkan modal agar kasir bisa memilih satuan (pcs, dus, lusin, dll)
      openUnitSelectModal(product, units);
    } else if (units.length === 1) {
      const u = units[0];
      addToCart(product, 1, {
        unit_id: u.unit_id,
        unit_name: u.unit_name,
        conversion_qty: u.conversion_qty,
        selling_price: u.selling_price,
        is_default: u.is_default
      });
    } else {
      // Tidak ada product_units — gunakan satuan dasar produk
      addToCart(product, 1, null);
    }
  } catch (error) {
    console.error('addToCartWithUnitSelect error:', error);
    addToCart(product, 1, null);
  }
}

// ============================================
// CART MANAGEMENT
// ============================================

// unitInfo = { unit_id, unit_name, conversion_qty, selling_price, is_default } | null (satuan dasar produk)
async function addToCart(product, quantity, unitInfo) {
  const unitName = unitInfo ? unitInfo.unit_name : (product.unit || 'pcs');
  const unitId = unitInfo ? unitInfo.unit_id : null;
  const conversionQty = unitInfo ? unitInfo.conversion_qty : 1;
  const basePrice = unitInfo ? unitInfo.selling_price : product.selling_price;

  // Tier harga hanya berlaku saat menjual satuan DASAR.
  // Satuan tambahan (Dus, Lusin, dll) punya harga tetap sendiri — tier tidak menimpa.
  const isBaseUnit = !unitInfo || !!unitInfo.is_default;

  // Stock cek dalam satuan dasar
  const stockNeeded = quantity * conversionQty;
  if (product.stock < stockNeeded) {
    showToast(`Stok ${product.name} tidak mencukupi (tersedia: ${product.stock} ${product.unit || 'pcs'})`, 'error');
    return;
  }

  // Tentukan harga aktif
  let price, activeTier;
  if (isBaseUnit) {
    const tiers = await loadProductPriceTiers(product.id);
    activeTier = getActivePriceTier(tiers, quantity, basePrice);
    price = activeTier.price;
  } else {
    activeTier = { tier_name: null, price: basePrice, is_default: true };
    price = basePrice;
  }

  // Cari item di cart berdasarkan product_id DAN unit_id
  const existingIndex = cart.findIndex(
    item => item.product_id === product.id && item.unit_id === unitId
  );

  if (existingIndex !== -1) {
    const newQty = cart[existingIndex].quantity + quantity;
    const newStockNeeded = newQty * conversionQty;

    if (newStockNeeded > product.stock) {
      showToast(`Stok ${product.name} tidak mencukupi`, 'error');
      return;
    }

    if (isBaseUnit) {
      const tiers = await loadProductPriceTiers(product.id);
      const newTier = getActivePriceTier(tiers, newQty, basePrice);
      cart[existingIndex].price = newTier.price;
      cart[existingIndex].active_tier = newTier.tier_name;
      cart[existingIndex].is_default_price = newTier.is_default;
    }
    cart[existingIndex].quantity = newQty;
    const existingDiscAmt = cart[existingIndex].discount_item_amount || 0;
    cart[existingIndex].subtotal = newQty * cart[existingIndex].price - existingDiscAmt;
  } else {
    cart.push({
      product_id: product.id,
      product_name: product.name,
      barcode: product.barcode || '',
      price: price,
      base_price: basePrice,
      active_tier: activeTier.tier_name,
      is_default_price: activeTier.is_default,
      is_base_unit: isBaseUnit,
      quantity: quantity,
      unit: unitName,
      unit_id: unitId,
      conversion_qty: conversionQty,
      subtotal: price * quantity,
      stock: product.stock
    });
  }

  renderCart();
  calculateTotal();
  saveDraft();
  setTimeout(() => document.getElementById('productSearch').focus(), 100);
}

// Muat tier harga dari API dan simpan ke cache
async function loadProductPriceTiers(productId) {
  if (productPricesCache[productId] !== undefined) return productPricesCache[productId];
  try {
    const result = await apiClient.get(`/products/${productId}/prices`);
    productPricesCache[productId] = result.success && Array.isArray(result.data) ? result.data : [];
  } catch (e) {
    productPricesCache[productId] = [];
  }
  return productPricesCache[productId];
}

// Kembalikan { tier_name, price } tier yang aktif untuk qty tertentu, atau null jika pakai harga default
function getActivePriceTier(tiers, qty, defaultPrice) {
  if (!tiers || tiers.length === 0) return { tier_name: 'Harga Retail', price: defaultPrice, is_default: true };

  // Urutkan descending min_qty agar tier terbesar lebih dulu
  const sorted = [...tiers].sort((a, b) => b.min_qty - a.min_qty);
  for (const t of sorted) {
    if (qty >= t.min_qty) {
      return { tier_name: t.tier_name, price: t.price, is_default: false };
    }
  }
  return { tier_name: 'Harga Retail', price: defaultPrice, is_default: true };
}

async function updateCartItemQty(index, newQty) {
  if (newQty <= 0) {
    removeCartItem(index);
    return;
  }

  const item = cart[index];
  const convQty = item.conversion_qty || 1;
  const stockNeeded = newQty * convQty;

  if (stockNeeded > item.stock) {
    showToast(`Stok tidak mencukupi (tersedia: ${Math.floor(item.stock / convQty)} ${item.unit})`, 'error');
    return;
  }

  // Tier harga hanya direcalculate untuk satuan dasar
  let activePrice = item.base_price || item.price;
  let activeTierName = item.active_tier;
  let isDefaultPrice = item.is_default_price;

  if (item.is_base_unit !== false) {
    const tiers = await loadProductPriceTiers(item.product_id);
    const activeTier = getActivePriceTier(tiers, newQty, item.base_price || item.price);
    activePrice = activeTier.price;
    activeTierName = activeTier.tier_name;
    isDefaultPrice = activeTier.is_default;
  }

  cart[index].quantity = newQty;
  cart[index].price = activePrice;
  cart[index].active_tier = activeTierName;
  cart[index].is_default_price = isDefaultPrice;

  // Recalculate item discount amount if exists
  const discType = cart[index].discount_item_type;
  const discVal = cart[index].discount_item || 0;
  if (discType === 'percent' && discVal > 0) {
    cart[index].discount_item_amount = (activePrice * newQty * discVal) / 100;
  } else if (discType === 'amount' && discVal > 0) {
    cart[index].discount_item_amount = Math.min(discVal, activePrice * newQty);
  }

  const discAmt = cart[index].discount_item_amount || 0;
  cart[index].subtotal = newQty * activePrice - discAmt;

  renderCart();
  calculateTotal();
  saveDraft();
}

function removeCartItem(index) {
  cart.splice(index, 1);
  renderCart();
  calculateTotal();
  saveDraft();
}

function clearCart() {
  cart = [];
  productPricesCache = {};
  currentDiscount = { type: 'none', value: 0, amount: 0 };
  currentTax = { percent: 0, amount: 0 };
  closeItemDiscountPopup();

  document.getElementById('discountValue').value = '';
  document.getElementById('taxPercent').value = '';
  document.getElementById('customerName').value = '';
  document.getElementById('notes').value = '';
  document.getElementById('paymentMethod').value = 'cash';
  document.getElementById('customerSelect').value = '';
  document.getElementById('customerSection').style.display = 'none';
  document.getElementById('customerCreditInfo').textContent = '';

  renderCart();
  calculateTotal();
  localStorage.removeItem('cart_draft');
}

// ============================================
// KREDIT / PELANGGAN
// ============================================

async function loadCustomerList() {
  try {
    const result = await apiClient.get('/customers/active');
    if (!result.success) return;
    const select = document.getElementById('customerSelect');
    // Hapus semua option kecuali pertama
    while (select.options.length > 1) select.remove(1);
    (result.data ?? []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.customer_code} - ${c.name}`;
      opt.dataset.limit = c.credit_limit;
      opt.dataset.outstanding = c.outstanding;
      select.appendChild(opt);
    });

    select.addEventListener('change', updateCreditInfo);
  } catch (error) {
    console.error('loadCustomerList error:', error);
  }
}

function onPaymentMethodChange() {
  const method = document.getElementById('paymentMethod').value;
  const section = document.getElementById('customerSection');
  if (method === 'kredit') {
    section.style.display = 'block';
  } else {
    section.style.display = 'none';
    document.getElementById('customerCreditInfo').textContent = '';
  }
}

function updateCreditInfo() {
  const select = document.getElementById('customerSelect');
  const opt = select.options[select.selectedIndex];
  const infoEl = document.getElementById('customerCreditInfo');
  if (!opt || !opt.value) { infoEl.textContent = ''; return; }

  const limit = parseFloat(opt.dataset.limit) || 0;
  const outstanding = parseFloat(opt.dataset.outstanding) || 0;
  const sisa = limit > 0 ? limit - outstanding : null;

  if (limit === 0) {
    infoEl.innerHTML = `<span style="color:#27ae60;">Limit: Tak terbatas &bull; Outstanding: ${formatCurrency(outstanding)}</span>`;
  } else {
    const color = sisa !== null && sisa < 0 ? '#e74c3c' : '#f39c12';
    infoEl.innerHTML = `<span style="color:${color};">Limit: ${formatCurrency(limit)} &bull; Outstanding: ${formatCurrency(outstanding)} &bull; Sisa: ${formatCurrency(sisa)}</span>`;
  }
}

function renderCart() {
  const tbody = document.getElementById('cartTableBody');

  if (cart.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center empty-cart">
          Keranjang masih kosong<br>
          <small>Scan barcode atau cari produk untuk mulai transaksi</small>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = cart.map((item, index) => {
    const tierBadge = item.active_tier && !item.is_default_price
      ? `<br><span class="badge badge-warning" style="font-size:10px; margin-top:2px;">${escapeHtml(item.active_tier)}</span>`
      : '';

    const hasItemDiscount = item.discount_item_amount && item.discount_item_amount > 0;
    const discountBadge = hasItemDiscount
      ? `<br><span class="badge badge-danger" style="font-size:10px; margin-top:2px;">Diskon: -${formatCurrency(item.discount_item_amount)}</span>`
      : '';
    const priceDisplay = hasItemDiscount
      ? `<span style="text-decoration:line-through; color:#aaa; font-size:11px;">${formatCurrency(item.price)}</span><br><strong style="color:#e74c3c;">${formatCurrency(item.price - (item.discount_item_amount / item.quantity))}</strong>`
      : formatCurrency(item.price);

    return `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.product_name)}${tierBadge}${discountBadge}</td>
      <td>
        <button class="btn-unit-select" onclick="changeCartItemUnit(${index})" title="Ganti satuan">
          ${escapeHtml(item.unit)}
          <span style="font-size:10px; opacity:0.6;">▼</span>
        </button>
      </td>
      <td>${priceDisplay}</td>
      <td>
        <div class="qty-controls">
          <button class="btn-qty" onclick="updateCartItemQty(${index}, ${item.quantity - 1})">-</button>
          <input
            type="number"
            class="qty-input"
            value="${item.quantity}"
            min="1"
            onchange="updateCartItemQty(${index}, parseInt(this.value))"
          >
          <button class="btn-qty" onclick="updateCartItemQty(${index}, ${item.quantity + 1})">+</button>
        </div>
      </td>
      <td><strong>${formatCurrency(item.subtotal)}</strong></td>
      <td>
        <button class="btn-item-discount ${hasItemDiscount ? 'active' : ''}" onclick="openItemDiscountPopup(${index})" title="Diskon item">
          🏷️
        </button>
      </td>
      <td>
        <button class="btn-remove" onclick="removeCartItem(${index})" title="Hapus">
          ❌
        </button>
      </td>
    </tr>
  `;
  }).join('');
}

// ============================================
// ITEM DISCOUNT
// ============================================

let _activeDiscountIndex = -1;

function openItemDiscountPopup(index) {
  closeItemDiscountPopup();
  _activeDiscountIndex = index;
  const item = cart[index];

  const popup = document.createElement('div');
  popup.id = 'itemDiscountPopup';
  popup.className = 'item-discount-popup';

  const discType = item.discount_item_type || 'percent';
  const discVal = item.discount_item || 0;

  popup.innerHTML = `
    <div class="item-discount-popup-inner">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <strong style="font-size:13px;">Diskon: ${escapeHtml(item.product_name)}</strong>
        <button onclick="closeItemDiscountPopup()" style="background:none;border:none;cursor:pointer;font-size:16px;line-height:1;">×</button>
      </div>
      <div style="display:flex; gap:4px; margin-bottom:8px;">
        <button id="idpTypePct" class="btn-toggle ${discType === 'percent' ? 'active' : ''}" onclick="setItemDiscountType('percent')">%</button>
        <button id="idpTypeAmt" class="btn-toggle ${discType === 'amount' ? 'active' : ''}" onclick="setItemDiscountType('amount')">Rp</button>
      </div>
      <input id="idpValue" type="number" class="form-control" style="width:100%; margin-bottom:8px;" min="0" step="1" value="${discVal}" placeholder="0">
      <div style="display:flex; gap:6px;">
        <button class="btn btn-primary" style="flex:1; padding:6px;" onclick="applyItemDiscount()">Terapkan</button>
        <button class="btn btn-danger" style="padding:6px 10px;" onclick="removeItemDiscount(${index})" title="Hapus diskon">🗑</button>
      </div>
    </div>
  `;

  // Position popup relative to clicked row
  const rows = document.querySelectorAll('#cartTableBody tr');
  const targetRow = rows[index];
  if (targetRow) {
    const rect = targetRow.getBoundingClientRect();
    const cartContainer = document.querySelector('.cart-container');
    const containerRect = cartContainer.getBoundingClientRect();
    popup.style.top = (rect.bottom - containerRect.top + cartContainer.scrollTop + 4) + 'px';
    popup.style.right = '8px';
    cartContainer.style.position = 'relative';
    cartContainer.appendChild(popup);
  } else {
    document.body.appendChild(popup);
  }

  document.getElementById('idpValue').focus();
  document.getElementById('idpValue').select();
}

function closeItemDiscountPopup() {
  const existing = document.getElementById('itemDiscountPopup');
  if (existing) existing.remove();
  _activeDiscountIndex = -1;
}

function setItemDiscountType(type) {
  document.getElementById('idpTypePct') && document.getElementById('idpTypePct').classList.toggle('active', type === 'percent');
  document.getElementById('idpTypeAmt') && document.getElementById('idpTypeAmt').classList.toggle('active', type === 'amount');
  if (_activeDiscountIndex >= 0) {
    cart[_activeDiscountIndex].discount_item_type = type;
  }
}

function applyItemDiscount() {
  if (_activeDiscountIndex < 0) return;
  const index = _activeDiscountIndex;
  const item = cart[index];
  const value = parseFloat(document.getElementById('idpValue').value) || 0;
  const type = cart[index].discount_item_type || 'percent';

  let amount = 0;
  if (type === 'percent') {
    amount = (item.price * item.quantity * value) / 100;
  } else {
    amount = value;
  }

  // Diskon tidak boleh melebihi subtotal item
  amount = Math.min(amount, item.price * item.quantity);

  cart[index].discount_item = value;
  cart[index].discount_item_type = type;
  cart[index].discount_item_amount = amount;
  cart[index].subtotal = (item.price * item.quantity) - amount;

  closeItemDiscountPopup();
  renderCart();
  calculateTotal();
  saveDraft();
}

function removeItemDiscount(index) {
  cart[index].discount_item = 0;
  cart[index].discount_item_type = 'none';
  cart[index].discount_item_amount = 0;
  cart[index].subtotal = cart[index].price * cart[index].quantity;
  closeItemDiscountPopup();
  renderCart();
  calculateTotal();
  saveDraft();
}

// ============================================
// CALCULATIONS
// ============================================

function calculateSubtotal() {
  return cart.reduce((sum, item) => sum + item.subtotal, 0);
}

function setDiscountType(type) {
  currentDiscount.type = type;
  
  // Update toggle buttons
  document.getElementById('discountTypePercent').classList.toggle('active', type === 'percent');
  document.getElementById('discountTypeAmount').classList.toggle('active', type === 'amount');
  
  // Reset nilai saat mode berubah
  document.getElementById('discountValue').value = '';
  applyDiscount(type, 0);
}

function applyDiscount(type, value) {
  const subtotal = calculateSubtotal();
  
  if (type === 'percent') {
    currentDiscount.amount = (subtotal * value) / 100;
  } else if (type === 'amount') {
    currentDiscount.amount = value;
  } else {
    currentDiscount.amount = 0;
  }

  currentDiscount.value = value;
  
  calculateTotal();
}

function calculateTax(percent) {
  const subtotal = calculateSubtotal();
  const afterDiscount = subtotal - currentDiscount.amount;
  
  currentTax.percent = percent;
  currentTax.amount = (afterDiscount * percent) / 100;
  
  calculateTotal();
}

function calculateTotal() {
  const subtotal = calculateSubtotal();
  const afterDiscount = subtotal - currentDiscount.amount;
  const total = afterDiscount + currentTax.amount;

  // Update display
  document.getElementById('cartSubtotal').textContent = formatCurrency(subtotal);
  document.getElementById('discountAmount').textContent = formatCurrency(currentDiscount.amount);
  document.getElementById('taxAmount').textContent = formatCurrency(currentTax.amount);
  document.getElementById('cartTotal').textContent = formatCurrency(total);

  return total;
}

// ============================================
// PAYMENT
// ============================================

function openPaymentModal() {
  if (cart.length === 0) {
    showToast('Keranjang masih kosong', 'error');
    return;
  }

  const total = calculateTotal();
  const paymentMethod = document.getElementById('paymentMethod').value;
  const isCredit = paymentMethod === 'kredit';

  // Validasi pelanggan sebelum buka modal
  if (isCredit && !document.getElementById('customerSelect').value) {
    showToast('Pilih pelanggan untuk transaksi kredit', 'error');
    return;
  }

  document.getElementById('paymentTotal').textContent = formatCurrency(total);
  document.getElementById('paymentMethodDisplay').textContent = getPaymentMethodLabel(paymentMethod);
  document.getElementById('paymentAmount').value = isCredit ? '0' : '';
  document.getElementById('changeAmount').textContent = 'Rp 0';
  document.getElementById('insufficientWarning').style.display = 'none';

  // Sembunyikan input bayar jika kredit
  const payAmountGroup = document.getElementById('paymentAmount').closest('.form-group');
  const changeDisplay = document.getElementById('changeDisplay');
  if (isCredit) {
    payAmountGroup.style.display = 'none';
    changeDisplay.style.display = 'none';
    document.getElementById('btnProcessPayment').disabled = false;
  } else {
    payAmountGroup.style.display = '';
    changeDisplay.style.display = '';
  }

  document.getElementById('paymentModal').style.display = 'flex';

  setTimeout(() => {
    if (!isCredit) document.getElementById('paymentAmount').focus();
  }, 100);
}

function closePaymentModal() {
  document.getElementById('paymentModal').style.display = 'none';
}

function calculateChange() {
  const total = calculateTotal();
  const paymentAmount = parseRupiahInput('paymentAmount');
  const change = paymentAmount - total;

  document.getElementById('changeAmount').textContent = formatCurrency(change);

  const btnProcess = document.getElementById('btnProcessPayment');
  const warningEl = document.getElementById('insufficientWarning');

  if (change < 0) {
    btnProcess.disabled = true;
    warningEl.style.display = 'block';
    document.getElementById('changeAmount').style.color = '#e74c3c';
  } else {
    btnProcess.disabled = false;
    warningEl.style.display = 'none';
    document.getElementById('changeAmount').style.color = '#27ae60';
  }
}

async function processTransaction() {
  const total = calculateTotal();
  const paymentMethod = document.getElementById('paymentMethod').value;
  const isCredit = paymentMethod === 'kredit';

  // Validasi pelanggan jika kredit
  if (isCredit) {
    const customerId = document.getElementById('customerSelect').value;
    if (!customerId) {
      showToast('Pilih pelanggan untuk transaksi kredit', 'error');
      return;
    }
  }

  const paymentAmount = parseRupiahInput('paymentAmount');

  if (!isCredit && paymentAmount < total) {
    showToast('Jumlah uang yang dibayarkan kurang', 'error');
    return;
  }

  const transactionCode = generateTransactionCode();
  
  // Ensure all cart items have complete data
  const items = cart.map(item => ({
    product_id: item.product_id,
    product_name: item.product_name,
    barcode: item.barcode || '',
    quantity: item.quantity,
    unit: item.unit || 'pcs',
    unit_id: item.unit_id || null,
    conversion_qty: item.conversion_qty || 1,
    price: item.price,
    subtotal: item.subtotal,
    discount_item: item.discount_item || 0,
    discount_item_type: item.discount_item_type || 'none',
    discount_item_amount: item.discount_item_amount || 0
  }));

  const customerId = isCredit ? (parseInt(document.getElementById('customerSelect').value) || null) : null;
  // Jika kredit, ambil nama pelanggan dari dropdown
  let customerName = document.getElementById('customerName').value.trim() || '';
  if (isCredit && customerId) {
    const sel = document.getElementById('customerSelect');
    const opt = sel.options[sel.selectedIndex];
    if (opt && opt.textContent) customerName = opt.textContent.split(' - ').slice(1).join(' - ');
  }

  const transactionData = {
    transaction_code: transactionCode,
    user_id: currentUser.id,
    transaction_date: new Date().toISOString(),
    subtotal: calculateSubtotal(),
    discount_type: currentDiscount.type || 'none',
    discount_value: currentDiscount.value || 0,
    discount_amount: currentDiscount.amount || 0,
    tax_percent: currentTax.percent || 0,
    tax_amount: currentTax.amount || 0,
    total_amount: total,
    payment_method: paymentMethod,
    payment_amount: isCredit ? 0 : paymentAmount,
    change_amount: isCredit ? 0 : (paymentAmount - total),
    customer_name: customerName,
    notes: document.getElementById('notes').value.trim() || '',
    customer_id: customerId,
    is_credit: isCredit ? 1 : 0,
    items: items
  };

  console.log('Transaction data to send:', transactionData);

  // Disable button
  const btnProcess = document.getElementById('btnProcessPayment');
  btnProcess.disabled = true;
  btnProcess.textContent = 'Memproses...';

  try {
    // Offline: simpan ke SQLite lokal + antrian sync
    if (typeof connectionMonitor !== 'undefined' && !connectionMonitor.isOnline) {
      if (!dbLocal.isAvailable()) {
        showToast('Mode offline tidak tersedia di platform ini', 'error');
        btnProcess.disabled = false;
        btnProcess.textContent = '✓ Proses Pembayaran';
        return;
      }
      const localId = crypto.randomUUID();
      const offlineData = { ...transactionData, device_source: 'desktop', local_id: localId };

      await dbLocal.saveTransaction(offlineData);
      await window.syncQueue.add({
        entity:  'transaction',
        action:  'create',
        localId: localId,
        payload: offlineData,
      });

      showToast('Transaksi disimpan offline. Akan disinkronkan saat online.', 'warning');
      closePaymentModal();
      clearCart();
      return;
    }

    // Online: kirim ke backend
    const result = await apiClient.post('/transactions', {
      ...transactionData,
      device_source: 'desktop'
    });

    if (result.success) {
      // Update cash drawer if payment is cash
      if (paymentMethod === 'cash') {
        try {
          await window.api.cashDrawer.updateSales(total);
          console.log('Cash drawer updated');
        } catch (error) {
          console.error('Failed to update cash drawer:', error);
          // Don't block transaction if cash drawer update fails
        }
      }

      showToast('Transaksi berhasil disimpan!', 'success');

      // Close modal
      closePaymentModal();

      // Clear cart
      clearCart();

      // Cek stok menipis pasca-transaksi
      if (window.StockAlert) {
        setTimeout(() => window.StockAlert.check({ afterTransaction: true }), 1200);
      }

      // Open receipt
      window.api.window.openReceipt(result.data?.id);

    } else {
      showToast(result.message || 'Gagal menyimpan transaksi', 'error');
      btnProcess.disabled = false;
      btnProcess.textContent = '✓ Proses Pembayaran';
    }
  } catch (error) {
    // Jika error adalah offline flag dari api-client, simpan ke lokal + antrian
    if (error.offline && dbLocal.isAvailable()) {
      try {
        const localId = crypto.randomUUID();
        const offlineData = { ...transactionData, device_source: 'desktop', local_id: localId };
        await dbLocal.saveTransaction(offlineData);
        await window.syncQueue.add({
          entity:  'transaction',
          action:  'create',
          localId: localId,
          payload: offlineData,
        });
        showToast('Transaksi disimpan offline. Akan disinkronkan saat online.', 'warning');
        closePaymentModal();
        clearCart();
        return;
      } catch (localErr) {
        console.error('Offline save error:', localErr);
      }
    }
    console.error('Process transaction error:', error);
    showToast('Terjadi kesalahan saat memproses transaksi', 'error');
    btnProcess.disabled = false;
    btnProcess.textContent = '✓ Proses Pembayaran';
  }
}

// ============================================
// UNIT SELECT MODAL
// ============================================

function openUnitSelectModal(product, units) {
  pendingProduct = { product, units };

  document.getElementById('unitSelectProductName').textContent = product.name;

  const list = document.getElementById('unitSelectList');
  list.innerHTML = units.map(u => {
    const maxQty = Math.floor(product.stock / u.conversion_qty);
    const disabled = maxQty <= 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : '';
    return `
      <button class="btn btn-secondary" style="text-align:left; padding:10px 14px;" ${disabled}
        onclick="selectUnitForCart(${u.unit_id})">
        <strong>${escapeHtml(u.unit_name)}</strong>
        <span style="float:right; color:#888; font-size:12px;">
          ${u.conversion_qty > 1 ? `isi ${u.conversion_qty} &bull; ` : ''}${formatCurrency(u.selling_price)}
          ${maxQty > 0 ? `<br><small>Maks: ${maxQty} ${escapeHtml(u.unit_name)}</small>` : '<br><small style="color:#e74c3c;">Stok habis</small>'}
        </span>
      </button>
    `;
  }).join('');

  document.getElementById('unitSelectModal').style.display = 'flex';
}

function closeUnitSelectModal() {
  document.getElementById('unitSelectModal').style.display = 'none';
  pendingProduct = null;
}

function selectUnitForCart(unitId) {
  if (!pendingProduct) return;

  const { product, units } = pendingProduct;
  const u = units.find(x => x.unit_id === unitId);
  if (!u) return;

  closeUnitSelectModal();
  addToCart(product, 1, {
    unit_id: u.unit_id,
    unit_name: u.unit_name,
    conversion_qty: u.conversion_qty,
    selling_price: u.selling_price,
    is_default: u.is_default
  });
}

async function changeCartItemUnit(index) {
  const item = cart[index];

  try {
    const productResult = await apiClient.get(`/products/${item.product_id}`);
    if (!productResult.success) return;

    const unitsResult = await apiClient.get(`/products/${item.product_id}/units`);
    const units = unitsResult.success && Array.isArray(unitsResult.data) ? unitsResult.data : [];
    if (units.length <= 1) return;

    const product = { ...productResult.data };
    // Restore stock karena item sudah di cart, tambahkan kembali untuk validasi
    const currentStockUsed = item.quantity * (item.conversion_qty || 1);
    product.stock = product.stock + currentStockUsed;

    // Simpan index untuk diupdate setelah pilih
    pendingProduct = {
      product,
      units,
      replaceCartIndex: index
    };

    document.getElementById('unitSelectProductName').textContent = product.name;

    const list = document.getElementById('unitSelectList');
    list.innerHTML = units.map(u => {
      const maxQty = Math.floor(product.stock / u.conversion_qty);
      const isCurrent = item.unit_id === u.unit_id;
      const disabled = maxQty <= 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : '';
      return `
        <button class="btn ${isCurrent ? 'btn-primary' : 'btn-secondary'}"
          style="text-align:left; padding:10px 14px;" ${disabled}
          onclick="applyUnitChange(${u.unit_id})">
          <strong>${escapeHtml(u.unit_name)}</strong>
          ${isCurrent ? ' <small>(sekarang)</small>' : ''}
          <span style="float:right; color:#888; font-size:12px;">
            ${u.conversion_qty > 1 ? `isi ${u.conversion_qty} &bull; ` : ''}${formatCurrency(u.selling_price)}
            ${maxQty > 0 ? `<br><small>Maks: ${maxQty} ${escapeHtml(u.unit_name)}</small>` : '<br><small style="color:#e74c3c;">Stok habis</small>'}
          </span>
        </button>
      `;
    }).join('');

    document.getElementById('unitSelectModal').style.display = 'flex';
  } catch (error) {
    console.error('changeCartItemUnit error:', error);
  }
}

function applyUnitChange(unitId) {
  if (!pendingProduct) return;

  const { product, units, replaceCartIndex } = pendingProduct;

  if (replaceCartIndex === undefined) {
    selectUnitForCart(unitId);
    return;
  }

  const u = units.find(x => x.unit_id === unitId);
  if (!u) return;

  const item = cart[replaceCartIndex];
  const convQty = u.conversion_qty || 1;
  const stockNeeded = item.quantity * convQty;

  if (stockNeeded > product.stock) {
    // Kurangi qty agar muat
    const maxQty = Math.floor(product.stock / convQty);
    if (maxQty <= 0) {
      showToast('Stok tidak mencukupi untuk satuan ini', 'error');
      closeUnitSelectModal();
      return;
    }
    cart[replaceCartIndex].quantity = maxQty;
  }

  cart[replaceCartIndex].unit = u.unit_name;
  cart[replaceCartIndex].unit_id = u.unit_id;
  cart[replaceCartIndex].conversion_qty = convQty;
  cart[replaceCartIndex].is_base_unit = !!u.is_default;
  cart[replaceCartIndex].base_price = u.selling_price;
  cart[replaceCartIndex].price = u.selling_price;
  cart[replaceCartIndex].active_tier = null;
  cart[replaceCartIndex].is_default_price = true;
  cart[replaceCartIndex].subtotal = cart[replaceCartIndex].quantity * u.selling_price;

  closeUnitSelectModal();

  // Jika ganti ke satuan dasar, langsung cek tier pricing untuk qty saat ini
  if (!!u.is_default) {
    const currentQty = cart[replaceCartIndex].quantity;
    loadProductPriceTiers(product.id).then(tiers => {
      const activeTier = getActivePriceTier(tiers, currentQty, u.selling_price);
      cart[replaceCartIndex].price = activeTier.price;
      cart[replaceCartIndex].active_tier = activeTier.tier_name;
      cart[replaceCartIndex].is_default_price = activeTier.is_default;
      cart[replaceCartIndex].subtotal = currentQty * activeTier.price;
      renderCart();
      calculateTotal();
      saveDraft();
    });
    return;
  }

  renderCart();
  calculateTotal();
  saveDraft();
}

function getPaymentMethodLabel(method) {
  const labels = {
    cash: 'Cash',
    debit: 'Debit Card',
    credit: 'Credit Card',
    qris: 'QRIS',
    transfer: 'Transfer',
    kredit: 'Kredit / Piutang'
  };
  return labels[method] || method;
}

// ============================================
// DRAFT MANAGEMENT
// ============================================

function saveDraft() {
  const draft = {
    cart,
    discount: currentDiscount,
    tax: currentTax,
    customerName: document.getElementById('customerName').value,
    notes: document.getElementById('notes').value,
    paymentMethod: document.getElementById('paymentMethod').value,
    customerId: document.getElementById('customerSelect').value
  };

  localStorage.setItem('cart_draft', JSON.stringify(draft));
}

function loadDraft() {
  const draftStr = localStorage.getItem('cart_draft');
  if (!draftStr) return;

  try {
    const draft = JSON.parse(draftStr);
    
    cart = draft.cart || [];
    currentDiscount = draft.discount || { type: 'none', value: 0, amount: 0 };
    currentTax = draft.tax || { percent: 0, amount: 0 };
    
    document.getElementById('customerName').value = draft.customerName || '';
    document.getElementById('notes').value = draft.notes || '';
    document.getElementById('paymentMethod').value = draft.paymentMethod || 'cash';
    if (draft.customerId) {
      document.getElementById('customerSelect').value = draft.customerId;
    }
    if (draft.paymentMethod === 'kredit') {
      document.getElementById('customerSection').style.display = 'block';
      updateCreditInfo();
    }
    
    if (currentDiscount.value > 0) {
      if (currentDiscount.type === 'amount') {
        setRupiahInput('discountValue', currentDiscount.value);
      } else {
        document.getElementById('discountValue').value = currentDiscount.value;
      }
      setDiscountType(currentDiscount.type);
    }
    
    if (currentTax.percent > 0) {
      document.getElementById('taxPercent').value = currentTax.percent;
    }

    renderCart();
    calculateTotal();
    
    if (cart.length > 0) {
      showToast('Draft dimuat', 'info');
    }
  } catch (error) {
    console.error('Load draft error:', error);
  }
}

function confirmClearCart() {
  if (cart.length === 0) {
    return;
  }

  showConfirm(
    'Konfirmasi Batal',
    'Yakin ingin membatalkan transaksi ini? Semua item akan dihapus.',
    () => {
      clearCart();
      showToast('Transaksi dibatalkan', 'info');
    }
  );
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

function handleKeyboardShortcuts(e) {
  // F2: Focus search
  if (e.key === 'F2') {
    e.preventDefault();
    document.getElementById('productSearch').focus();
  }

  // F8: Open payment modal
  if (e.key === 'F8') {
    e.preventDefault();
    openPaymentModal();
  }

  // F9: Save draft
  if (e.key === 'F9') {
    e.preventDefault();
    saveDraft();
  }

  // ESC: Clear cart (with confirmation)
  if (e.key === 'Escape') {
    // Close modal if open
    if (document.getElementById('paymentModal').style.display === 'flex') {
      closePaymentModal();
    } else {
      confirmClearCart();
    }
  }
}