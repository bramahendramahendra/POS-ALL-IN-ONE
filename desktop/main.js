const { app, BrowserWindow, ipcMain, globalShortcut, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let mainWindow;
let currentUser = null;
let pendingLabelPrintData = null;

// Import database functions
const dbModule = require('./database/db');
const { initDatabase } = require('./database/init');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'src/views/login.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Build application menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Backup Database',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu:backup');
          }
        },
        {
          label: 'Restore Database',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu:restore');
          }
        },
        { type: 'separator' },
        {
          label: 'Keluar',
          accelerator: 'CmdOrCtrl+Q',
          click: () => { app.quit(); }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) mainWindow.reload();
          }
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'F12',
          click: () => {
            if (mainWindow) mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Tentang Aplikasi',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Tentang POS Retail',
              message: 'POS Retail v1.0.0',
              detail: 'Aplikasi Point of Sale Desktop\nDibangun dengan Electron + SQLite\n\nLogin Default:\nUsername: admin\nPassword: admin123'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize database when app is ready
app.whenReady().then(async () => {
  console.log('Initializing database...');

  try {
    await dbModule.initDb();
    await initDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }

  createWindow();

  // Register global keyboard shortcuts
  app.on('browser-window-focus', () => {
    // Navigation shortcuts — kirim ke renderer
    const shortcuts = [
      { key: 'CmdOrCtrl+N', channel: 'shortcut:kasir' },
      { key: 'CmdOrCtrl+P', channel: 'shortcut:products' },
      { key: 'CmdOrCtrl+T', channel: 'shortcut:transactions' },
      { key: 'CmdOrCtrl+F', channel: 'shortcut:finance' },
      { key: 'CmdOrCtrl+Shift+R', channel: 'shortcut:reports' },
      { key: 'CmdOrCtrl+U', channel: 'shortcut:users' },
      { key: 'CmdOrCtrl+Shift+S', channel: 'shortcut:settings' },
      { key: 'CmdOrCtrl+L', channel: 'shortcut:logout' },
      { key: 'CmdOrCtrl+Shift+L', channel: 'pinlock:lock' }
    ];

    shortcuts.forEach(({ key, channel }) => {
      globalShortcut.register(key, () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(channel);
        }
      });
    });
  });

  app.on('browser-window-blur', () => {
    globalShortcut.unregisterAll();
  });

  // Auto backup on startup
  try {
    await runAutoBackupIfNeeded();
  } catch (err) {
    console.error('Auto backup error:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================
// AUTO BACKUP HELPER
// ============================================

async function runAutoBackupIfNeeded() {
  try {
    const autoBackupSetting = dbModule.get("SELECT value FROM settings WHERE key = 'auto_backup'");
    if (!autoBackupSetting || autoBackupSetting.value !== '1') return;

    const backupDaysSetting = dbModule.get("SELECT value FROM settings WHERE key = 'backup_days'");
    const daysToKeep = parseInt(backupDaysSetting?.value || '7', 10);

    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Check if backup already done today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayBackupExists = fs.readdirSync(backupDir)
      .some(f => f.startsWith(`backup_${today}`));

    if (todayBackupExists) {
      console.log('Auto backup already done today, skipping');
      return;
    }

    // Create backup
    const dbPath = path.join(__dirname, 'pos-retail.db');
    if (!fs.existsSync(dbPath)) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFilename = `backup_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFilename);

    fs.copyFileSync(dbPath, backupPath);
    console.log(`Auto backup created: ${backupFilename}`);

    // Clean old backups
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.db'))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => a.time - b.time);

    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    files.forEach(file => {
      if (file.time < cutoff) {
        fs.unlinkSync(path.join(backupDir, file.name));
        console.log(`Deleted old backup: ${file.name}`);
      }
    });

  } catch (err) {
    console.error('runAutoBackupIfNeeded error:', err);
  }
}

// IPC Handler: Load login page
ipcMain.on('load-login-page', (event) => {
  console.log('Reloading login page...');
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, 'src/views/login.html'));
  }
});

// Update cash sales (called when transaction is completed)
ipcMain.handle('cashDrawer:updateSales', async (event, amount) => {
  try {
    if (!currentUser) {
      return { success: false, message: 'User tidak ditemukan' };
    }

    const today = new Date().toISOString().split('T')[0];

    // Get today's open cash drawer
    const cashDrawer = dbModule.get(`
      SELECT id FROM cash_drawer 
      WHERE user_id = ? 
      AND DATE(open_time) = DATE(?) 
      AND status = 'open'
    `, [currentUser.id, today]);

    if (cashDrawer) {
      dbModule.run(
        `UPDATE cash_drawer 
         SET total_sales = total_sales + ?,
             total_cash_sales = total_cash_sales + ?
         WHERE id = ?`,
        [amount, amount, cashDrawer.id]
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Update cash sales error:', error);
    return { success: false };
  }
});

// Update expenses (called when expense is created)
ipcMain.handle('cashDrawer:updateExpenses', async (event, amount) => {
  try {
    if (!currentUser) {
      return { success: false, message: 'User tidak ditemukan' };
    }

    const today = new Date().toISOString().split('T')[0];

    // Get today's open cash drawer
    const cashDrawer = dbModule.get(`
      SELECT id FROM cash_drawer 
      WHERE user_id = ? 
      AND DATE(open_time) = DATE(?) 
      AND status = 'open'
    `, [currentUser.id, today]);

    if (cashDrawer) {
      dbModule.run(
        'UPDATE cash_drawer SET total_expenses = total_expenses + ? WHERE id = ?',
        [amount, cashDrawer.id]
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Update expenses error:', error);
    return { success: false };
  }
});

// ============================================
// EXPENSES IPC HANDLERS
// ============================================


// ============================================
// SUPPLIER RETURNS IPC HANDLERS
// ============================================

function generateReturnCode() {
  const now = new Date();
  const datePart = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const last = dbModule.get(
    "SELECT return_code FROM supplier_returns ORDER BY id DESC LIMIT 1"
  );
  let seq = 1;
  if (last) {
    const parts = last.return_code.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }
  return `RTR-${datePart}-${String(seq).padStart(4, '0')}`;
}



// ============================================
// FINANCE DASHBOARD IPC HANDLERS
// ============================================

// Get finance dashboard data
ipcMain.handle('finance:getDashboard', async (event, filters = {}) => {
  try {
    const startDate = filters.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = filters.endDate || new Date().toISOString().split('T')[0];

    // Get sales summary
    const salesData = dbModule.get(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_sales,
        SUM(subtotal) as total_revenue,
        AVG(total_amount) as avg_transaction
      FROM transactions
      WHERE DATE(transaction_date) BETWEEN DATE(?) AND DATE(?)
      AND status = 'completed'
    `, [startDate, endDate]);

    // Get expenses summary
    const expensesData = dbModule.get(`
      SELECT 
        COUNT(*) as total_expenses_count,
        SUM(amount) as total_expenses
      FROM expenses
      WHERE DATE(expense_date) BETWEEN DATE(?) AND DATE(?)
    `, [startDate, endDate]);

    // Get purchases summary (for calculating COGS)
    const purchasesData = dbModule.get(`
      SELECT 
        SUM(total_amount) as total_purchases
      FROM purchases
      WHERE DATE(purchase_date) BETWEEN DATE(?) AND DATE(?)
    `, [startDate, endDate]);

    // Calculate COGS (Cost of Goods Sold) from transaction items
    const cogsData = dbModule.get(`
      SELECT 
        SUM(ti.quantity * p.purchase_price) as cogs
      FROM transaction_items ti
      INNER JOIN transactions t ON ti.transaction_id = t.id
      INNER JOIN products p ON ti.product_id = p.id
      WHERE DATE(t.transaction_date) BETWEEN DATE(?) AND DATE(?)
      AND t.status = 'completed'
    `, [startDate, endDate]);

    const totalSales = salesData.total_sales || 0;
    const totalExpenses = expensesData.total_expenses || 0;
    const cogs = cogsData.cogs || 0;
    const grossProfit = totalSales - cogs;
    const netProfit = grossProfit - totalExpenses;

    const dashboard = {
      total_sales: totalSales,
      total_expenses: totalExpenses,
      gross_profit: grossProfit,
      net_profit: netProfit,
      total_transactions: salesData.total_transactions || 0,
      avg_transaction: salesData.avg_transaction || 0,
      total_purchases: purchasesData.total_purchases || 0,
      cogs: cogs
    };

    // Get daily sales and expenses for chart
    const dailyData = dbModule.all(`
      SELECT 
        DATE(transaction_date) as date,
        SUM(total_amount) as sales,
        0 as expenses
      FROM transactions
      WHERE DATE(transaction_date) BETWEEN DATE(?) AND DATE(?)
      AND status = 'completed'
      GROUP BY DATE(transaction_date)
      
      UNION ALL
      
      SELECT 
        DATE(expense_date) as date,
        0 as sales,
        SUM(amount) as expenses
      FROM expenses
      WHERE DATE(expense_date) BETWEEN DATE(?) AND DATE(?)
      GROUP BY DATE(expense_date)
      
      ORDER BY date
    `, [startDate, endDate, startDate, endDate]);

    // Aggregate daily data
    const chartData = {};
    dailyData.forEach(row => {
      if (!chartData[row.date]) {
        chartData[row.date] = { date: row.date, sales: 0, expenses: 0 };
      }
      chartData[row.date].sales += row.sales;
      chartData[row.date].expenses += row.expenses;
    });

    dashboard.chart_data = Object.values(chartData);

    return { success: true, dashboard };
  } catch (error) {
    console.error('Get finance dashboard error:', error);
    return { success: false, message: 'Gagal memuat dashboard keuangan' };
  }
});

// Get top selling products
ipcMain.handle('finance:getTopProducts', async (event, filters = {}) => {
  try {
    const startDate = filters.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = filters.endDate || new Date().toISOString().split('T')[0];
    const limit = filters.limit || 10;

    const topProducts = dbModule.all(`
      SELECT 
        ti.product_name,
        SUM(ti.quantity) as total_quantity,
        SUM(ti.subtotal) as total_sales,
        COUNT(DISTINCT ti.transaction_id) as transaction_count
      FROM transaction_items ti
      INNER JOIN transactions t ON ti.transaction_id = t.id
      WHERE DATE(t.transaction_date) BETWEEN DATE(?) AND DATE(?)
      AND t.status = 'completed'
      GROUP BY ti.product_id, ti.product_name
      ORDER BY total_quantity DESC
      LIMIT ?
    `, [startDate, endDate, limit]);

    return { success: true, topProducts };
  } catch (error) {
    console.error('Get top products error:', error);
    return { success: false, message: 'Gagal memuat produk terlaris' };
  }
});

// ============================================
// PRINTER IPC HANDLERS
// ============================================

ipcMain.handle('printer:getAll', async () => {
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return { success: true, printers };
  } catch (error) {
    console.error('printer:getAll error:', error);
    return { success: true, printers: [] };
  }
});

ipcMain.handle('labelPrint:getData', () => {
  return pendingLabelPrintData;
});

// Open barcode label print window
ipcMain.on('window:openBarcodeLabel', (event, data) => {
  pendingLabelPrintData = data;
  const labelWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Cetak Label Barcode'
  });
  labelWindow.loadFile(path.join(__dirname, 'src/views/barcode-label.html'));
});

// Open receipt window
ipcMain.on('window:openReceipt', (event, transactionId) => {
  const receiptWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load receipt page with transaction ID as query parameter
  receiptWindow.loadFile(path.join(__dirname, 'src/views/receipt.html'), {
    query: { id: transactionId.toString() }
  });
});

// ============================================
// SETTINGS IPC HANDLERS
// ============================================

ipcMain.handle('settings:getAll', async () => {
  try {
    const rows = dbModule.all('SELECT key, value FROM settings');
    const settings = {};
    rows.forEach(row => { settings[row.key] = row.value; });
    return { success: true, settings };
  } catch (error) {
    console.error('settings:getAll error:', error);
    return { success: false, message: 'Gagal memuat pengaturan' };
  }
});

ipcMain.handle('settings:get', async (event, key) => {
  try {
    const row = dbModule.get('SELECT value FROM settings WHERE key = ?', [key]);
    return { success: true, value: row?.value ?? null };
  } catch (error) {
    console.error('settings:get error:', error);
    return { success: false, message: 'Gagal memuat pengaturan' };
  }
});

ipcMain.handle('settings:save', async (event, data) => {
  try {
    Object.entries(data).forEach(([key, value]) => {
      dbModule.run(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        [key, value ?? '']
      );
    });
    return { success: true };
  } catch (error) {
    console.error('settings:save error:', error);
    return { success: false, message: 'Gagal menyimpan pengaturan' };
  }
});

ipcMain.handle('settings:reset', async () => {
  try {
    const defaults = [
      ['store_name', 'TOKO RETAIL'],
      ['store_address', 'Jl. Contoh No. 123, Kota'],
      ['store_phone', '021-12345678'],
      ['store_email', 'info@tokoretail.com'],
      ['tax_enabled', '0'],
      ['tax_percent', '0'],
      ['receipt_footer', 'Terima Kasih - Barang yang sudah dibeli tidak dapat ditukar'],
      ['auto_backup', '1'],
      ['backup_days', '7'],
      ['store_logo', ''],
      ['label_size_default', '4x2.5'],
      ['label_printer_default', '']
    ];
    defaults.forEach(([key, value]) => {
      dbModule.run(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      );
    });
    return { success: true };
  } catch (error) {
    console.error('settings:reset error:', error);
    return { success: false, message: 'Gagal reset pengaturan' };
  }
});

// ============================================
// BACKUP IPC HANDLERS
// ============================================

ipcMain.handle('backup:selectFolder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Pilih Folder Backup'
    });
    if (result.canceled || !result.filePaths.length) {
      return { success: false, canceled: true };
    }
    return { success: true, folderPath: result.filePaths[0] };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('backup:selectFile', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Database', extensions: ['db'] }],
      title: 'Pilih File Backup'
    });
    if (result.canceled || !result.filePaths.length) {
      return { success: false, canceled: true };
    }
    return { success: true, filePath: result.filePaths[0] };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('backup:create', async () => {
  try {
    const dbPath = path.join(__dirname, 'pos-retail.db');
    if (!fs.existsSync(dbPath)) {
      return { success: false, message: 'File database tidak ditemukan' };
    }

    // Ask user where to save
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const defaultFilename = `backup_${timestamp}.db`;

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Simpan Backup',
      defaultPath: defaultFilename,
      filters: [{ name: 'Database Backup', extensions: ['db'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    fs.copyFileSync(dbPath, result.filePath);

    return { success: true, filePath: result.filePath, filename: path.basename(result.filePath) };
  } catch (error) {
    console.error('backup:create error:', error);
    return { success: false, message: 'Gagal membuat backup: ' + error.message };
  }
});

ipcMain.handle('backup:restore', async (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, message: 'File backup tidak ditemukan' };
    }

    const dbPath = path.join(__dirname, 'pos-retail.db');

    // Create auto-backup before restore
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const autoBackupPath = path.join(__dirname, `pos-retail.backup-before-restore.${timestamp}.db`);
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, autoBackupPath);
    }

    // Copy backup file to db path
    fs.copyFileSync(filePath, dbPath);

    // Restart app
    app.relaunch();
    app.exit(0);

    return { success: true };
  } catch (error) {
    console.error('backup:restore error:', error);
    return { success: false, message: 'Gagal restore database: ' + error.message };
  }
});

// Shell: open external URL
ipcMain.handle('shell:openExternal', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
});

// ============================================
// DASHBOARD STATS IPC HANDLER
// ============================================

ipcMain.handle('dashboard:getStats', async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Total penjualan hari ini
    const salesRow = dbModule.get(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_sales,
        COUNT(*) AS total_transactions
      FROM transactions
      WHERE DATE(transaction_date) = DATE(?)
      AND status = 'completed'
    `, [today]);

    // Total produk aktif
    const productsRow = dbModule.get(
      'SELECT COUNT(*) AS total FROM products WHERE is_active = 1'
    );

    // Stok menipis (stock <= min_stock tapi > 0)
    const lowStockRow = dbModule.get(
      'SELECT COUNT(*) AS total FROM products WHERE stock <= min_stock AND stock > 0 AND is_active = 1'
    );

    // Stok habis
    const emptyStockRow = dbModule.get(
      'SELECT COUNT(*) AS total FROM products WHERE stock = 0 AND is_active = 1'
    );

    // Total transaksi bulan ini
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    const monthStart = firstOfMonth.toISOString().split('T')[0];

    const monthSalesRow = dbModule.get(`
      SELECT COALESCE(SUM(total_amount), 0) AS total_sales
      FROM transactions
      WHERE DATE(transaction_date) >= DATE(?)
      AND status = 'completed'
    `, [monthStart]);

    // Total user aktif
    const usersRow = dbModule.get(
      'SELECT COUNT(*) AS total FROM users WHERE is_active = 1'
    );

    return {
      success: true,
      stats: {
        today_sales:       salesRow?.total_sales       || 0,
        today_transactions: salesRow?.total_transactions || 0,
        total_products:    productsRow?.total          || 0,
        low_stock:         lowStockRow?.total          || 0,
        empty_stock:       emptyStockRow?.total        || 0,
        month_sales:       monthSalesRow?.total_sales  || 0,
        total_users:       usersRow?.total             || 0
      }
    };
  } catch (error) {
    console.error('dashboard:getStats error:', error);
    return { success: false, message: 'Gagal memuat statistik dashboard' };
  }
});

// ============================================
// DASHBOARD CHARTS IPC HANDLERS
// ============================================

function getDashboardDateRange(period) {
  const today = new Date();
  const fmt = d => d.toISOString().split('T')[0];
  switch (period) {
    case '7days': {
      const s = new Date(today); s.setDate(s.getDate() - 6);
      return { start: fmt(s), end: fmt(today) };
    }
    case '30days': {
      const s = new Date(today); s.setDate(s.getDate() - 29);
      return { start: fmt(s), end: fmt(today) };
    }
    case 'month': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: fmt(s), end: fmt(today) };
    }
    default: // today
      return { start: fmt(today), end: fmt(today) };
  }
}

// Grafik 1 — Trend Penjualan (periode ini vs periode sebelumnya)
ipcMain.handle('dashboard:getSalesTrend', async (event, period = '7days') => {
  try {
    const { start, end } = getDashboardDateRange(period);
    const startDate = new Date(start);
    const endDate   = new Date(end);
    const diffDays  = Math.round((endDate - startDate) / 86400000) + 1;

    const prevEnd   = new Date(startDate); prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);   prevStart.setDate(prevStart.getDate() - diffDays + 1);
    const fmt = d => d.toISOString().split('T')[0];

    const rows = dbModule.all(`
      SELECT DATE(transaction_date) as date,
             COALESCE(SUM(total_amount),0) as total,
             COUNT(*) as count
      FROM transactions
      WHERE DATE(transaction_date) BETWEEN DATE(?) AND DATE(?)
        AND status = 'completed'
      GROUP BY DATE(transaction_date)
      ORDER BY date
    `, [start, end]);

    const prevRows = dbModule.all(`
      SELECT DATE(transaction_date) as date,
             COALESCE(SUM(total_amount),0) as total,
             COUNT(*) as count
      FROM transactions
      WHERE DATE(transaction_date) BETWEEN DATE(?) AND DATE(?)
        AND status = 'completed'
      GROUP BY DATE(transaction_date)
      ORDER BY date
    `, [fmt(prevStart), fmt(prevEnd)]);

    // Buat array label (tanggal periode ini)
    const labels = [];
    const cur = new Date(startDate);
    while (cur <= endDate) {
      labels.push(fmt(cur));
      cur.setDate(cur.getDate() + 1);
    }

    const mapByDate = (arr) => {
      const m = {};
      arr.forEach(r => { m[r.date] = r; });
      return m;
    };
    const curMap  = mapByDate(rows);
    const prevMap = mapByDate(prevRows);

    const currentTotals  = labels.map((d, i) => curMap[d]?.total  || 0);
    const previousTotals = labels.map((d, i) => {
      const pd = fmt(new Date(new Date(prevStart).setDate(prevStart.getDate() + i)));
      return prevMap[pd]?.total || 0;
    });
    const currentCounts  = labels.map(d => curMap[d]?.count || 0);

    return { success: true, labels, currentTotals, previousTotals, currentCounts };
  } catch (error) {
    console.error('dashboard:getSalesTrend error:', error);
    return { success: false, message: 'Gagal memuat trend penjualan' };
  }
});

// Grafik 2 — Top 5 Kategori Terlaris
ipcMain.handle('dashboard:getTopCategories', async (event, period = 'today') => {
  try {
    const { start, end } = getDashboardDateRange(period);
    const rows = dbModule.all(`
      SELECT c.name as category,
             COALESCE(SUM(ti.quantity * ti.price), 0) as total,
             COALESCE(SUM(ti.quantity), 0) as qty
      FROM transaction_items ti
      JOIN transactions t ON t.id = ti.transaction_id
      JOIN products p ON p.id = ti.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE DATE(t.transaction_date) BETWEEN DATE(?) AND DATE(?)
        AND t.status = 'completed'
      GROUP BY p.category_id
      ORDER BY total DESC
      LIMIT 5
    `, [start, end]);
    return { success: true, rows };
  } catch (error) {
    console.error('dashboard:getTopCategories error:', error);
    return { success: false, message: 'Gagal memuat kategori terlaris' };
  }
});

// Grafik 3 — Top 5 Produk Terlaris
ipcMain.handle('dashboard:getTopProducts', async (event, period = 'today', mode = 'qty') => {
  try {
    const { start, end } = getDashboardDateRange(period);
    const orderBy = mode === 'value' ? 'total DESC' : 'qty DESC';
    const rows = dbModule.all(`
      SELECT p.name as product,
             COALESCE(SUM(ti.quantity), 0) as qty,
             COALESCE(SUM(ti.quantity * ti.price), 0) as total
      FROM transaction_items ti
      JOIN transactions t ON t.id = ti.transaction_id
      JOIN products p ON p.id = ti.product_id
      WHERE DATE(t.transaction_date) BETWEEN DATE(?) AND DATE(?)
        AND t.status = 'completed'
      GROUP BY ti.product_id
      ORDER BY ${orderBy}
      LIMIT 5
    `, [start, end]);
    return { success: true, rows };
  } catch (error) {
    console.error('dashboard:getTopProducts error:', error);
    return { success: false, message: 'Gagal memuat produk terlaris' };
  }
});

// Grafik 4 — Metode Pembayaran
ipcMain.handle('dashboard:getPaymentMethods', async (event, period = 'today') => {
  try {
    const { start, end } = getDashboardDateRange(period);
    const rows = dbModule.all(`
      SELECT payment_method,
             COUNT(*) as count,
             COALESCE(SUM(total_amount), 0) as total
      FROM transactions
      WHERE DATE(transaction_date) BETWEEN DATE(?) AND DATE(?)
        AND status = 'completed'
      GROUP BY payment_method
      ORDER BY total DESC
    `, [start, end]);
    return { success: true, rows };
  } catch (error) {
    console.error('dashboard:getPaymentMethods error:', error);
    return { success: false, message: 'Gagal memuat metode pembayaran' };
  }
});

// Summary Extra — transaksi tertinggi, peak hour, rata-rata
ipcMain.handle('dashboard:getSummaryExtra', async (event, period = 'today') => {
  try {
    const { start, end } = getDashboardDateRange(period);

    const highest = dbModule.get(`
      SELECT transaction_code, total_amount, transaction_date
      FROM transactions
      WHERE DATE(transaction_date) BETWEEN DATE(?) AND DATE(?)
        AND status = 'completed'
      ORDER BY total_amount DESC
      LIMIT 1
    `, [start, end]);

    const peakHour = dbModule.get(`
      SELECT strftime('%H', transaction_date) as hour, COUNT(*) as count
      FROM transactions
      WHERE DATE(transaction_date) BETWEEN DATE(?) AND DATE(?)
        AND status = 'completed'
      GROUP BY hour
      ORDER BY count DESC
      LIMIT 1
    `, [start, end]);

    const avg = dbModule.get(`
      SELECT COALESCE(AVG(total_amount), 0) as avg_amount,
             COUNT(*) as total_count
      FROM transactions
      WHERE DATE(transaction_date) BETWEEN DATE(?) AND DATE(?)
        AND status = 'completed'
    `, [start, end]);

    return { success: true, highest, peakHour, avg };
  } catch (error) {
    console.error('dashboard:getSummaryExtra error:', error);
    return { success: false, message: 'Gagal memuat summary' };
  }
});

