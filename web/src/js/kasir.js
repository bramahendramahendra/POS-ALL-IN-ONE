'use strict';

// ============================================
// STATE
// ============================================

let currentUser   = null;
let cart          = [];
let currentDiscount = { type: 'none', value: 0, amount: 0 };
let currentTax    = { percent: 0, amount: 0 };
let searchTimeout = null;
let pendingProduct = null;
// cache tier harga: { [product_id]: [{tier_name, min_qty, price}, ...] }
let productPricesCache = {};

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    requireRole('kasir', 'owner', 'admin');

    currentUser = getCurrentUser();

    // Tampilkan nama di navbar
    const navNameEl = document.getElementById('navUsername');
    const navRoleEl = document.getElementById('navUserRole');
    if (navNameEl && currentUser) navNameEl.textContent = currentUser.full_name || currentUser.username;
    if (navRoleEl && currentUser) navRoleEl.textContent = currentUser.role;

    loadDraft();
    setupEventListeners();
    loadCustomerList();

    setTimeout(() => document.getElementById('productSearch')?.focus(), 100);
});

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Product search dengan debounce
    document.getElementById('productSearch').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const keyword = e.target.value.trim();
        if (keyword.length < 2) { hideSuggestions(); return; }
        searchTimeout = setTimeout(() => searchProduct(keyword), 300);
    });

    // Enter pada search → coba barcode
    document.getElementById('productSearch').addEventListener('keydown', async (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const keyword = e.target.value.trim();
        if (!keyword) return;
        try {
            const result = await apiClient.get(`/products/barcode/${encodeURIComponent(keyword)}`);
            if (result && result.product) {
                document.getElementById('productSearch').value = '';
                hideSuggestions();
                await addToCartWithUnitSelect(result.product);
            }
        } catch (err) {
            console.error('Barcode lookup error:', err);
        }
    });

    // Diskon toggle
    document.getElementById('discountTypePercent').addEventListener('click', () => setDiscountType('percent'));
    document.getElementById('discountTypeAmount').addEventListener('click',  () => setDiscountType('amount'));
    document.getElementById('discountValue').addEventListener('input', (e) => {
        applyDiscount(currentDiscount.type, parseFloat(e.target.value) || 0);
    });

    // Pajak
    document.getElementById('taxPercent').addEventListener('input', (e) => {
        calculateTax(parseFloat(e.target.value) || 0);
    });

    // Tombol aksi
    document.getElementById('btnPayment').addEventListener('click', openPaymentModal);
    document.getElementById('btnHold').addEventListener('click', () => { saveDraft(true); });
    document.getElementById('btnCancel').addEventListener('click', confirmClearCart);

    // Metode bayar → tampilkan/sembunyikan section kredit
    document.getElementById('paymentMethod').addEventListener('change', onPaymentMethodChange);

    // Payment modal
    document.getElementById('closePaymentModal').addEventListener('click', closePaymentModal);
    document.getElementById('btnCancelPayment').addEventListener('click', closePaymentModal);
    document.getElementById('btnProcessPayment').addEventListener('click', processTransaction);
    document.getElementById('paymentAmount').addEventListener('input', calculateChange);

    // Unit select modal
    document.getElementById('closeUnitSelectModal').addEventListener('click', closeUnitSelectModal);

    // Tutup suggestion/popup saat klik luar
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.product-search-box')) hideSuggestions();
        if (e.target === document.getElementById('unitSelectModal')) closeUnitSelectModal();
        if (!e.target.closest('#itemDiscountPopup') && !e.target.closest('.btn-item-discount')) closeItemDiscountPopup();
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
        if (result && result.products && result.products.length > 0) {
            showProductSuggestions(result.products);
        } else {
            hideSuggestions();
        }
    } catch (err) {
        console.error('searchProduct error:', err);
    }
}

function showProductSuggestions(products) {
    const container = document.getElementById('productSuggestions');
    container.innerHTML = products.map(p => `
        <div class="suggestion-item" onclick="selectProduct(${p.id})">
            <div class="suggestion-main">
                <strong>${escapeHtml(p.name)}</strong>
                <span class="suggestion-barcode">${escapeHtml(p.barcode || '')}</span>
            </div>
            <div class="suggestion-details">
                <span class="suggestion-price">${formatCurrency(p.selling_price)}</span>
                <span class="suggestion-stock">Stok: ${p.stock}</span>
            </div>
        </div>`).join('');
    container.style.display = 'block';
}

function hideSuggestions() {
    document.getElementById('productSuggestions').style.display = 'none';
}

async function selectProduct(productId) {
    try {
        const result = await apiClient.get(`/products/${productId}`);
        if (result) {
            const product = result.product || result;
            document.getElementById('productSearch').value = '';
            hideSuggestions();
            await addToCartWithUnitSelect(product);
        }
    } catch (err) {
        console.error('selectProduct error:', err);
    }
}

async function addToCartWithUnitSelect(product) {
    try {
        const result = await apiClient.get(`/products/${product.id}/units`);
        const units  = (result && (result.units || result)) || [];

        if (Array.isArray(units) && units.length > 1) {
            // Cek apakah ada default unit — jika ya, langsung pakai
            const defaultUnit = units.find(u => u.is_default);
            if (defaultUnit) {
                addToCart(product, 1, {
                    unit_id: defaultUnit.unit_id,
                    unit_name: defaultUnit.unit_name,
                    conversion_qty: defaultUnit.conversion_qty,
                    selling_price: defaultUnit.selling_price
                });
            } else {
                openUnitSelectModal(product, units);
            }
        } else if (Array.isArray(units) && units.length === 1) {
            const u = units[0];
            addToCart(product, 1, {
                unit_id: u.unit_id,
                unit_name: u.unit_name,
                conversion_qty: u.conversion_qty,
                selling_price: u.selling_price
            });
        } else {
            addToCart(product, 1, null);
        }
    } catch (err) {
        console.error('addToCartWithUnitSelect error:', err);
        addToCart(product, 1, null);
    }
}

// ============================================
// CART MANAGEMENT
// ============================================

async function addToCart(product, quantity, unitInfo) {
    const unitName      = unitInfo ? unitInfo.unit_name    : (product.unit || 'pcs');
    const unitId        = unitInfo ? unitInfo.unit_id      : null;
    const conversionQty = unitInfo ? unitInfo.conversion_qty : 1;
    const basePrice     = unitInfo ? unitInfo.selling_price  : product.selling_price;

    const stockNeeded = quantity * conversionQty;
    if (product.stock < stockNeeded) {
        showToast(`Stok ${product.name} tidak mencukupi (tersedia: ${product.stock} ${product.unit || 'pcs'})`, 'error');
        return;
    }

    const tiers       = await loadProductPriceTiers(product.id);
    const activeTier  = getActivePriceTier(tiers, quantity, basePrice);
    const price       = activeTier.price;

    const existingIdx = cart.findIndex(item => item.product_id === product.id && item.unit_id === unitId);

    if (existingIdx !== -1) {
        const newQty = cart[existingIdx].quantity + quantity;
        if (newQty * conversionQty > product.stock) {
            showToast(`Stok ${product.name} tidak mencukupi`, 'error');
            return;
        }
        const newTier = getActivePriceTier(tiers, newQty, basePrice);
        cart[existingIdx].quantity   = newQty;
        cart[existingIdx].price      = newTier.price;
        cart[existingIdx].active_tier   = newTier.tier_name;
        cart[existingIdx].is_default_price = newTier.is_default;
        cart[existingIdx].subtotal   = newQty * newTier.price;
    } else {
        cart.push({
            product_id: product.id,
            product_name: product.name,
            barcode: product.barcode || '',
            price,
            base_price: basePrice,
            active_tier: activeTier.tier_name,
            is_default_price: activeTier.is_default,
            quantity,
            unit: unitName,
            unit_id: unitId,
            conversion_qty: conversionQty,
            subtotal: price * quantity,
            stock: product.stock,
        });
    }

    renderCart();
    calculateTotal();
    saveDraft(false);
    setTimeout(() => document.getElementById('productSearch')?.focus(), 100);
}

async function loadProductPriceTiers(productId) {
    if (productPricesCache[productId] !== undefined) return productPricesCache[productId];
    try {
        const result = await apiClient.get(`/products/${productId}/prices`);
        productPricesCache[productId] = (result && (result.prices || result)) || [];
    } catch {
        productPricesCache[productId] = [];
    }
    return productPricesCache[productId];
}

function getActivePriceTier(tiers, qty, defaultPrice) {
    if (!tiers || tiers.length === 0) return { tier_name: 'Harga Retail', price: defaultPrice, is_default: true };
    const sorted = [...tiers].sort((a, b) => b.min_qty - a.min_qty);
    for (const t of sorted) {
        if (qty >= t.min_qty) return { tier_name: t.tier_name, price: t.price, is_default: false };
    }
    return { tier_name: 'Harga Retail', price: defaultPrice, is_default: true };
}

async function updateCartItemQty(index, newQty) {
    if (newQty <= 0) { removeCartItem(index); return; }

    const item     = cart[index];
    const convQty  = item.conversion_qty || 1;
    if (newQty * convQty > item.stock) {
        showToast(`Stok tidak mencukupi (tersedia: ${Math.floor(item.stock / convQty)} ${item.unit})`, 'error');
        return;
    }

    const tiers      = await loadProductPriceTiers(item.product_id);
    const activeTier = getActivePriceTier(tiers, newQty, item.base_price || item.price);

    cart[index].quantity          = newQty;
    cart[index].price             = activeTier.price;
    cart[index].active_tier       = activeTier.tier_name;
    cart[index].is_default_price  = activeTier.is_default;

    const discType = cart[index].discount_item_type;
    const discVal  = cart[index].discount_item || 0;
    if (discType === 'percent' && discVal > 0) {
        cart[index].discount_item_amount = (activeTier.price * newQty * discVal) / 100;
    } else if (discType === 'amount' && discVal > 0) {
        cart[index].discount_item_amount = Math.min(discVal, activeTier.price * newQty);
    }

    const discAmt       = cart[index].discount_item_amount || 0;
    cart[index].subtotal = newQty * activeTier.price - discAmt;

    renderCart();
    calculateTotal();
    saveDraft(false);
}

function removeCartItem(index) {
    cart.splice(index, 1);
    renderCart();
    calculateTotal();
    saveDraft(false);
}

function clearCart() {
    cart = [];
    productPricesCache = {};
    currentDiscount = { type: 'none', value: 0, amount: 0 };
    currentTax      = { percent: 0, amount: 0 };
    closeItemDiscountPopup();

    document.getElementById('discountValue').value       = '';
    document.getElementById('taxPercent').value          = '';
    document.getElementById('customerName').value        = '';
    document.getElementById('notes').value               = '';
    document.getElementById('paymentMethod').value       = 'cash';
    document.getElementById('customerSelect').value      = '';
    document.getElementById('customerSection').style.display   = 'none';
    document.getElementById('customerCreditInfo').textContent  = '';

    renderCart();
    calculateTotal();
    localStorage.removeItem('cart_draft');
}

// ============================================
// RENDER CART
// ============================================

function renderCart() {
    const tbody = document.getElementById('cartTableBody');

    if (cart.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="8" class="text-center empty-cart">
                Keranjang masih kosong<br>
                <small>Scan barcode atau cari produk untuk mulai transaksi</small>
            </td>
        </tr>`;
        return;
    }

    tbody.innerHTML = cart.map((item, i) => {
        const tierBadge = item.active_tier && !item.is_default_price
            ? `<br><span class="badge badge-warning" style="font-size:10px">${escapeHtml(item.active_tier)}</span>`
            : '';

        const hasDisc    = item.discount_item_amount && item.discount_item_amount > 0;
        const discBadge  = hasDisc
            ? `<br><span class="badge badge-danger" style="font-size:10px">Diskon: -${formatCurrency(item.discount_item_amount)}</span>`
            : '';
        const priceDisp  = hasDisc
            ? `<span style="text-decoration:line-through;color:#aaa;font-size:11px">${formatCurrency(item.price)}</span><br>
               <strong style="color:#e74c3c">${formatCurrency(item.price - (item.discount_item_amount / item.quantity))}</strong>`
            : formatCurrency(item.price);

        return `<tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(item.product_name)}${tierBadge}${discBadge}</td>
            <td>
                <button class="btn-unit-select" onclick="changeCartItemUnit(${i})" title="Ganti satuan">
                    ${escapeHtml(item.unit)} <span style="font-size:10px;opacity:.6">▼</span>
                </button>
            </td>
            <td>${priceDisp}</td>
            <td>
                <div class="qty-controls">
                    <button class="btn-qty" onclick="updateCartItemQty(${i}, ${item.quantity - 1})">−</button>
                    <input type="number" class="qty-input" value="${item.quantity}" min="1"
                        onchange="updateCartItemQty(${i}, parseInt(this.value) || 1)">
                    <button class="btn-qty" onclick="updateCartItemQty(${i}, ${item.quantity + 1})">+</button>
                </div>
            </td>
            <td><strong>${formatCurrency(item.subtotal)}</strong></td>
            <td>
                <button class="btn-item-discount ${hasDisc ? 'active' : ''}" onclick="openItemDiscountPopup(${i})" title="Diskon item">🏷️</button>
            </td>
            <td>
                <button class="btn-remove" onclick="removeCartItem(${i})" title="Hapus">❌</button>
            </td>
        </tr>`;
    }).join('');
}

// ============================================
// ITEM DISCOUNT
// ============================================

let _activeDiscountIndex = -1;

function openItemDiscountPopup(index) {
    closeItemDiscountPopup();
    _activeDiscountIndex = index;
    const item    = cart[index];
    const discType = item.discount_item_type || 'percent';
    const discVal  = item.discount_item || 0;

    const popup = document.createElement('div');
    popup.id        = 'itemDiscountPopup';
    popup.className = 'item-discount-popup';
    popup.innerHTML = `
        <div class="item-discount-popup-inner">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <strong style="font-size:13px">Diskon: ${escapeHtml(item.product_name)}</strong>
                <button onclick="closeItemDiscountPopup()" style="background:none;border:none;cursor:pointer;font-size:16px">×</button>
            </div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
                <button id="idpTypePct" class="btn-toggle ${discType === 'percent' ? 'active' : ''}" onclick="setItemDiscountType('percent')">%</button>
                <button id="idpTypeAmt" class="btn-toggle ${discType === 'amount'  ? 'active' : ''}" onclick="setItemDiscountType('amount')">Rp</button>
            </div>
            <input id="idpValue" type="number" style="width:100%;margin-bottom:8px;padding:6px;border:1px solid #ddd;border-radius:4px" min="0" step="1" value="${discVal}" placeholder="0">
            <div style="display:flex;gap:6px">
                <button class="btn btn-primary" style="flex:1;padding:6px" onclick="applyItemDiscount()">Terapkan</button>
                <button class="btn btn-danger" style="padding:6px 10px" onclick="removeItemDiscount(${index})" title="Hapus diskon">🗑</button>
            </div>
        </div>`;

    const rows = document.querySelectorAll('#cartTableBody tr');
    const targetRow = rows[index];
    if (targetRow) {
        const cartContainer = document.querySelector('.cart-container');
        const rect = targetRow.getBoundingClientRect();
        const cRect = cartContainer.getBoundingClientRect();
        popup.style.top   = (rect.bottom - cRect.top + cartContainer.scrollTop + 4) + 'px';
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
    document.getElementById('itemDiscountPopup')?.remove();
    _activeDiscountIndex = -1;
}

function setItemDiscountType(type) {
    document.getElementById('idpTypePct')?.classList.toggle('active', type === 'percent');
    document.getElementById('idpTypeAmt')?.classList.toggle('active', type === 'amount');
    if (_activeDiscountIndex >= 0) cart[_activeDiscountIndex].discount_item_type = type;
}

function applyItemDiscount() {
    if (_activeDiscountIndex < 0) return;
    const index = _activeDiscountIndex;
    const item  = cart[index];
    const value = parseFloat(document.getElementById('idpValue').value) || 0;
    const type  = cart[index].discount_item_type || 'percent';

    let amount = type === 'percent'
        ? (item.price * item.quantity * value) / 100
        : value;
    amount = Math.min(amount, item.price * item.quantity);

    cart[index].discount_item        = value;
    cart[index].discount_item_type   = type;
    cart[index].discount_item_amount = amount;
    cart[index].subtotal             = (item.price * item.quantity) - amount;

    closeItemDiscountPopup();
    renderCart();
    calculateTotal();
    saveDraft(false);
}

function removeItemDiscount(index) {
    cart[index].discount_item        = 0;
    cart[index].discount_item_type   = 'none';
    cart[index].discount_item_amount = 0;
    cart[index].subtotal             = cart[index].price * cart[index].quantity;
    closeItemDiscountPopup();
    renderCart();
    calculateTotal();
    saveDraft(false);
}

// ============================================
// CALCULATIONS
// ============================================

function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
}

function setDiscountType(type) {
    currentDiscount.type = type;
    document.getElementById('discountTypePercent').classList.toggle('active', type === 'percent');
    document.getElementById('discountTypeAmount').classList.toggle('active', type === 'amount');
    applyDiscount(type, parseFloat(document.getElementById('discountValue').value) || 0);
}

function applyDiscount(type, value) {
    const subtotal = calculateSubtotal();
    currentDiscount.amount = type === 'percent' ? (subtotal * value) / 100
        : type === 'amount' ? value : 0;
    currentDiscount.value = value;
    calculateTotal();
}

function calculateTax(percent) {
    const subtotal     = calculateSubtotal();
    const afterDisc    = subtotal - currentDiscount.amount;
    currentTax.percent = percent;
    currentTax.amount  = (afterDisc * percent) / 100;
    calculateTotal();
}

function calculateTotal() {
    const subtotal   = calculateSubtotal();
    const afterDisc  = subtotal - currentDiscount.amount;
    const total      = afterDisc + currentTax.amount;

    document.getElementById('cartSubtotal').textContent    = formatCurrency(subtotal);
    document.getElementById('discountAmount').textContent  = formatCurrency(currentDiscount.amount);
    document.getElementById('taxAmount').textContent       = formatCurrency(currentTax.amount);
    document.getElementById('cartTotal').textContent       = formatCurrency(total);

    return total;
}

// ============================================
// KREDIT / PELANGGAN
// ============================================

async function loadCustomerList() {
    try {
        const result = await apiClient.get('/customers', { is_active: true, limit: 500 });
        const customers = (result && (result.customers || result)) || [];
        if (!Array.isArray(customers)) return;

        const select = document.getElementById('customerSelect');
        while (select.options.length > 1) select.remove(1);

        customers.forEach(c => {
            const opt = document.createElement('option');
            opt.value            = c.id;
            opt.textContent      = `${c.customer_code || ''} - ${c.name}`.replace(/^- /, '');
            opt.dataset.limit    = c.credit_limit    || 0;
            opt.dataset.outstanding = c.outstanding || 0;
            select.appendChild(opt);
        });

        select.addEventListener('change', updateCreditInfo);
    } catch (err) {
        console.error('loadCustomerList error:', err);
    }
}

function onPaymentMethodChange() {
    const method  = document.getElementById('paymentMethod').value;
    const section = document.getElementById('customerSection');
    section.style.display = method === 'kredit' ? 'block' : 'none';
    if (method !== 'kredit') document.getElementById('customerCreditInfo').textContent = '';
}

function updateCreditInfo() {
    const select = document.getElementById('customerSelect');
    const opt    = select.options[select.selectedIndex];
    const infoEl = document.getElementById('customerCreditInfo');
    if (!opt || !opt.value) { infoEl.textContent = ''; return; }

    const limit       = parseFloat(opt.dataset.limit) || 0;
    const outstanding = parseFloat(opt.dataset.outstanding) || 0;
    const sisa        = limit > 0 ? limit - outstanding : null;

    if (limit === 0) {
        infoEl.innerHTML = `<span style="color:#27ae60">Limit: Tak terbatas &bull; Outstanding: ${formatCurrency(outstanding)}</span>`;
    } else {
        const color = sisa !== null && sisa < 0 ? '#e74c3c' : '#f39c12';
        infoEl.innerHTML = `<span style="color:${color}">Limit: ${formatCurrency(limit)} &bull; Outstanding: ${formatCurrency(outstanding)} &bull; Sisa: ${formatCurrency(sisa)}</span>`;
    }
}

// ============================================
// PAYMENT MODAL
// ============================================

function openPaymentModal() {
    if (cart.length === 0) { showToast('Keranjang masih kosong', 'error'); return; }

    const total         = calculateTotal();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const isCredit      = paymentMethod === 'kredit';

    if (isCredit && !document.getElementById('customerSelect').value) {
        showToast('Pilih pelanggan untuk transaksi kredit', 'error');
        return;
    }

    document.getElementById('paymentTotal').textContent          = formatCurrency(total);
    document.getElementById('paymentMethodDisplay').textContent  = getPaymentMethodLabel(paymentMethod);
    document.getElementById('paymentAmount').value               = isCredit ? '0' : '';
    document.getElementById('changeAmount').textContent          = 'Rp 0';
    document.getElementById('insufficientWarning').style.display = 'none';

    const payAmountGroup = document.getElementById('paymentAmount').closest('.form-group');
    const changeDisplay  = document.getElementById('changeDisplay');
    payAmountGroup.style.display = isCredit ? 'none' : '';
    changeDisplay.style.display  = isCredit ? 'none' : '';
    document.getElementById('btnProcessPayment').disabled = isCredit ? false : true;

    document.getElementById('paymentModal').style.display = 'flex';
    if (!isCredit) setTimeout(() => document.getElementById('paymentAmount').focus(), 100);
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

function calculateChange() {
    const total         = calculateTotal();
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value) || 0;
    const change        = paymentAmount - total;

    document.getElementById('changeAmount').textContent       = formatCurrency(change);
    document.getElementById('changeAmount').style.color       = change < 0 ? '#e74c3c' : '#27ae60';
    document.getElementById('btnProcessPayment').disabled     = change < 0;
    document.getElementById('insufficientWarning').style.display = change < 0 ? 'block' : 'none';
}

// ============================================
// PROCESS TRANSACTION (web — tanpa offline)
// ============================================

async function processTransaction() {
    const total         = calculateTotal();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const isCredit      = paymentMethod === 'kredit';

    if (isCredit && !document.getElementById('customerSelect').value) {
        showToast('Pilih pelanggan untuk transaksi kredit', 'error');
        return;
    }

    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value) || 0;
    if (!isCredit && paymentAmount < total) {
        showToast('Jumlah uang yang dibayarkan kurang', 'error');
        return;
    }

    const customerId = isCredit ? (parseInt(document.getElementById('customerSelect').value) || null) : null;
    let   customerName = document.getElementById('customerName').value.trim();
    if (isCredit && customerId) {
        const sel = document.getElementById('customerSelect');
        const opt = sel.options[sel.selectedIndex];
        if (opt) customerName = opt.textContent.split(' - ').slice(1).join(' - ');
    }

    const transactionCode = generateTransactionCode();

    const items = cart.map(item => ({
        product_id:           item.product_id,
        product_name:         item.product_name,
        barcode:              item.barcode || '',
        quantity:             item.quantity,
        unit:                 item.unit || 'pcs',
        unit_id:              item.unit_id || null,
        conversion_qty:       item.conversion_qty || 1,
        price:                item.price,
        subtotal:             item.subtotal,
        discount_item:        item.discount_item || 0,
        discount_item_type:   item.discount_item_type || 'none',
        discount_item_amount: item.discount_item_amount || 0,
    }));

    const transactionData = {
        transaction_code:  transactionCode,
        user_id:           currentUser.id,
        transaction_date:  new Date().toISOString(),
        subtotal:          calculateSubtotal(),
        discount_type:     currentDiscount.type  || 'none',
        discount_value:    currentDiscount.value  || 0,
        discount_amount:   currentDiscount.amount || 0,
        tax_percent:       currentTax.percent || 0,
        tax_amount:        currentTax.amount  || 0,
        total_amount:      total,
        payment_method:    paymentMethod,
        payment_amount:    isCredit ? 0 : paymentAmount,
        change_amount:     isCredit ? 0 : (paymentAmount - total),
        customer_name:     customerName,
        notes:             document.getElementById('notes').value.trim(),
        customer_id:       customerId,
        is_credit:         isCredit ? 1 : 0,
        device_source:     'web',
        items,
    };

    const btnProcess = document.getElementById('btnProcessPayment');
    btnProcess.disabled    = true;
    btnProcess.textContent = 'Memproses...';

    try {
        const result = await apiClient.post('/transactions', transactionData);

        showToast('Transaksi berhasil disimpan!', 'success');
        closePaymentModal();

        // Cetak struk via browser print
        const txData = (result && (result.transaction || result)) || transactionData;
        printReceipt({ ...txData, transaction_code: transactionCode });

        clearCart();
    } catch (err) {
        console.error('processTransaction error:', err);
        showToast('Terjadi kesalahan saat memproses transaksi: ' + err.message, 'error');
        btnProcess.disabled    = false;
        btnProcess.textContent = '✓ Proses Pembayaran';
    }
}

// ============================================
// PRINT RECEIPT (browser window.print)
// ============================================

function printReceipt(transaction) {
    const printArea = document.getElementById('receipt-print');
    printArea.innerHTML = generateReceiptHTML(transaction);
    window.print();
}

function generateReceiptHTML(tx) {
    const items   = tx.items || cart;
    const now     = new Date().toLocaleString('id-ID');
    const user    = currentUser ? (currentUser.full_name || currentUser.username) : '—';
    const method  = getPaymentMethodLabel(tx.payment_method || document.getElementById('paymentMethod').value);

    const itemRows = items.map(item => `
        <tr>
            <td>${escapeHtml(item.product_name)}</td>
            <td style="text-align:right">${item.quantity} ${item.unit || 'pcs'}</td>
            <td style="text-align:right">${formatCurrency(item.price)}</td>
            <td style="text-align:right">${formatCurrency(item.subtotal)}</td>
        </tr>`).join('');

    return `
        <div style="font-family:monospace;max-width:300px;margin:0 auto;font-size:12px">
            <div style="text-align:center;margin-bottom:12px">
                <strong style="font-size:16px">POS System</strong><br>
                <small>${now}</small><br>
                <small>No: ${escapeHtml(tx.transaction_code || '—')}</small>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
                <thead>
                    <tr style="border-bottom:1px dashed #000">
                        <th style="text-align:left">Produk</th>
                        <th style="text-align:right">Qty</th>
                        <th style="text-align:right">Harga</th>
                        <th style="text-align:right">Total</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>
            <div style="border-top:1px dashed #000;padding-top:6px">
                <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>${formatCurrency(tx.subtotal || calculateSubtotal())}</span></div>
                ${(tx.discount_amount > 0) ? `<div style="display:flex;justify-content:space-between"><span>Diskon</span><span>-${formatCurrency(tx.discount_amount)}</span></div>` : ''}
                ${(tx.tax_amount > 0) ? `<div style="display:flex;justify-content:space-between"><span>Pajak (${tx.tax_percent}%)</span><span>${formatCurrency(tx.tax_amount)}</span></div>` : ''}
                <div style="display:flex;justify-content:space-between;font-weight:bold;border-top:1px dashed #000;margin-top:4px;padding-top:4px">
                    <span>TOTAL</span><span>${formatCurrency(tx.total_amount || calculateTotal())}</span>
                </div>
                ${tx.payment_amount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Bayar (${method})</span><span>${formatCurrency(tx.payment_amount)}</span></div>` : ''}
                ${tx.change_amount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Kembalian</span><span>${formatCurrency(tx.change_amount)}</span></div>` : ''}
            </div>
            <div style="text-align:center;margin-top:12px;border-top:1px dashed #000;padding-top:8px">
                <small>Kasir: ${escapeHtml(user)}</small><br>
                <small>Terima kasih!</small>
            </div>
        </div>`;
}

// ============================================
// UNIT SELECT MODAL
// ============================================

function openUnitSelectModal(product, units) {
    pendingProduct = { product, units };
    document.getElementById('unitSelectProductName').textContent = product.name;

    const list = document.getElementById('unitSelectList');
    list.innerHTML = units.map(u => {
        const maxQty   = Math.floor(product.stock / u.conversion_qty);
        const disabled = maxQty <= 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : '';
        return `<button class="btn btn-secondary" style="text-align:left;padding:10px 14px" ${disabled}
            onclick="selectUnitForCart(${u.unit_id})">
            <strong>${escapeHtml(u.unit_name)}</strong>
            <span style="float:right;color:#888;font-size:12px">
                ${u.conversion_qty > 1 ? `isi ${u.conversion_qty} &bull; ` : ''}${formatCurrency(u.selling_price)}
                ${maxQty > 0 ? `<br><small>Maks: ${maxQty} ${escapeHtml(u.unit_name)}</small>` : '<br><small style="color:#e74c3c">Stok habis</small>'}
            </span>
        </button>`;
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
    addToCart(product, 1, { unit_id: u.unit_id, unit_name: u.unit_name, conversion_qty: u.conversion_qty, selling_price: u.selling_price });
}

async function changeCartItemUnit(index) {
    const item = cart[index];
    try {
        const productResult = await apiClient.get(`/products/${item.product_id}`);
        const product = productResult && (productResult.product || productResult);
        if (!product) return;

        const unitsResult = await apiClient.get(`/products/${item.product_id}/units`);
        const units = (unitsResult && (unitsResult.units || unitsResult)) || [];
        if (!Array.isArray(units) || units.length <= 1) return;

        const currentStockUsed = item.quantity * (item.conversion_qty || 1);
        const productCopy = { ...product, stock: product.stock + currentStockUsed };

        pendingProduct = { product: productCopy, units, replaceCartIndex: index };
        document.getElementById('unitSelectProductName').textContent = product.name;

        const list = document.getElementById('unitSelectList');
        list.innerHTML = units.map(u => {
            const maxQty   = Math.floor(productCopy.stock / u.conversion_qty);
            const isCurrent = item.unit_id === u.unit_id;
            const disabled  = maxQty <= 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : '';
            return `<button class="btn ${isCurrent ? 'btn-primary' : 'btn-secondary'}"
                style="text-align:left;padding:10px 14px" ${disabled}
                onclick="applyUnitChange(${u.unit_id})">
                <strong>${escapeHtml(u.unit_name)}</strong>${isCurrent ? ' <small>(sekarang)</small>' : ''}
                <span style="float:right;color:#888;font-size:12px">
                    ${u.conversion_qty > 1 ? `isi ${u.conversion_qty} &bull; ` : ''}${formatCurrency(u.selling_price)}
                    ${maxQty > 0 ? `<br><small>Maks: ${maxQty} ${escapeHtml(u.unit_name)}</small>` : '<br><small style="color:#e74c3c">Stok habis</small>'}
                </span>
            </button>`;
        }).join('');

        document.getElementById('unitSelectModal').style.display = 'flex';
    } catch (err) {
        console.error('changeCartItemUnit error:', err);
    }
}

function applyUnitChange(unitId) {
    if (!pendingProduct) return;
    const { product, units, replaceCartIndex } = pendingProduct;

    if (replaceCartIndex === undefined) { selectUnitForCart(unitId); return; }

    const u = units.find(x => x.unit_id === unitId);
    if (!u) return;

    const item    = cart[replaceCartIndex];
    const convQty = u.conversion_qty || 1;

    if (item.quantity * convQty > product.stock) {
        const maxQty = Math.floor(product.stock / convQty);
        if (maxQty <= 0) { showToast('Stok tidak mencukupi untuk satuan ini', 'error'); closeUnitSelectModal(); return; }
        cart[replaceCartIndex].quantity = maxQty;
    }

    cart[replaceCartIndex].unit         = u.unit_name;
    cart[replaceCartIndex].unit_id      = u.unit_id;
    cart[replaceCartIndex].conversion_qty = convQty;
    cart[replaceCartIndex].price        = u.selling_price;
    cart[replaceCartIndex].subtotal     = cart[replaceCartIndex].quantity * u.selling_price;

    closeUnitSelectModal();
    renderCart();
    calculateTotal();
    saveDraft(false);
}

// ============================================
// DRAFT MANAGEMENT
// ============================================

function saveDraft(showNotif = false) {
    const draft = {
        cart,
        discount:      currentDiscount,
        tax:           currentTax,
        customerName:  document.getElementById('customerName').value,
        notes:         document.getElementById('notes').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        customerId:    document.getElementById('customerSelect').value,
    };
    localStorage.setItem('cart_draft', JSON.stringify(draft));
    if (showNotif) showToast('Draft disimpan', 'info');
}

function loadDraft() {
    const raw = localStorage.getItem('cart_draft');
    if (!raw) return;
    try {
        const draft = JSON.parse(raw);
        cart            = draft.cart     || [];
        currentDiscount = draft.discount || { type: 'none', value: 0, amount: 0 };
        currentTax      = draft.tax      || { percent: 0, amount: 0 };

        document.getElementById('customerName').value   = draft.customerName  || '';
        document.getElementById('notes').value          = draft.notes         || '';
        document.getElementById('paymentMethod').value  = draft.paymentMethod || 'cash';
        if (draft.customerId) document.getElementById('customerSelect').value = draft.customerId;
        if (draft.paymentMethod === 'kredit') {
            document.getElementById('customerSection').style.display = 'block';
            updateCreditInfo();
        }
        if (currentDiscount.value > 0) {
            document.getElementById('discountValue').value = currentDiscount.value;
            setDiscountType(currentDiscount.type);
        }
        if (currentTax.percent > 0) {
            document.getElementById('taxPercent').value = currentTax.percent;
        }

        renderCart();
        calculateTotal();
        if (cart.length > 0) showToast('Draft dimuat', 'info');
    } catch (err) {
        console.error('loadDraft error:', err);
    }
}

function confirmClearCart() {
    if (cart.length === 0) return;
    if (confirm('Yakin ingin membatalkan transaksi ini? Semua item akan dihapus.')) {
        clearCart();
        showToast('Transaksi dibatalkan', 'info');
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

function handleKeyboardShortcuts(e) {
    if (e.key === 'F2') { e.preventDefault(); document.getElementById('productSearch')?.focus(); }
    if (e.key === 'F8') { e.preventDefault(); openPaymentModal(); }
    if (e.key === 'F9') { e.preventDefault(); saveDraft(true); }
    if (e.key === 'Escape') {
        if (document.getElementById('paymentModal').style.display === 'flex') {
            closePaymentModal();
        } else {
            confirmClearCart();
        }
    }
}

// ============================================
// HELPERS
// ============================================

function generateTransactionCode() {
    const now    = new Date();
    const y      = now.getFullYear();
    const m      = String(now.getMonth() + 1).padStart(2, '0');
    const d      = String(now.getDate()).padStart(2, '0');
    const rand   = Math.floor(Math.random() * 900) + 100;
    return `WEB-${y}${m}${d}-${rand}`;
}

function getPaymentMethodLabel(method) {
    const labels = { cash: 'Cash', debit: 'Debit Card', credit: 'Credit Card', qris: 'QRIS', transfer: 'Transfer', kredit: 'Kredit / Piutang' };
    return labels[method] || method;
}

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
    toast.id     = 'web-toast';
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;background:${colors[type] || colors.info};color:#fff;padding:12px 18px;border-radius:8px;font-size:14px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);max-width:320px`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}
