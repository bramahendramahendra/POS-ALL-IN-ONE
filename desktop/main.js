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
const initSqlJs = require('sql.js');

// ============================================
// SQLITE LOKAL — untuk operasi offline (pakai sql.js, konsisten dengan DB utama)
// ============================================
let localDb = null;
let localDbPath = null;

async function initLocalDb() {
    const SQL = await initSqlJs();
    const userDataPath = app.getPath('userData');
    localDbPath = path.join(userDataPath, 'offline-local.db');

    if (fs.existsSync(localDbPath)) {
        const buffer = fs.readFileSync(localDbPath);
        localDb = new SQL.Database(buffer);
    } else {
        localDb = new SQL.Database();
    }

    // Buat tabel jika belum ada
    localDb.run(`
        CREATE TABLE IF NOT EXISTS local_transactions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            local_id    TEXT UNIQUE NOT NULL,
            data        TEXT NOT NULL,
            created_at  TEXT NOT NULL,
            sync_status TEXT DEFAULT 'PENDING'
        )
    `);
    localDb.run(`
        CREATE TABLE IF NOT EXISTS local_cash_drawer (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            date            TEXT UNIQUE NOT NULL,
            opened_at       TEXT,
            closed_at       TEXT,
            opening_balance REAL DEFAULT 0,
            data            TEXT NOT NULL
        )
    `);
    localDb.run(`
        CREATE TABLE IF NOT EXISTS cache_products (
            id         INTEGER PRIMARY KEY,
            data       TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

    saveLocalDb();
    console.log('Local SQLite DB initialized:', localDbPath);
}

function saveLocalDb() {
    if (localDb && localDbPath) {
        const data   = localDb.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(localDbPath, buffer);
    }
}

function localDbQuery(sql, params = []) {
    const stmt   = localDb.prepare(sql);
    stmt.bind(params);
    const result = [];
    while (stmt.step()) result.push(stmt.getAsObject());
    stmt.free();
    return result;
}

function localDbRun(sql, params = []) {
    localDb.run(sql, params);
    saveLocalDb();
}

function localDbGet(sql, params = []) {
    const stmt = localDb.prepare(sql);
    stmt.bind(params);
    const row  = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
}

// IPC: Simpan transaksi offline
ipcMain.handle('local:saveTransaction', async (event, transactionData) => {
    const { randomUUID } = require('crypto');
    const localId = randomUUID();
    localDbRun(
        `INSERT INTO local_transactions (local_id, data, created_at) VALUES (?, ?, ?)`,
        [localId, JSON.stringify(transactionData), new Date().toISOString()]
    );
    return { local_id: localId };
});

// IPC: Ambil transaksi offline pending
ipcMain.handle('local:getPendingTransactions', async () => {
    return localDbQuery(
        `SELECT * FROM local_transactions WHERE sync_status = 'PENDING' ORDER BY created_at`
    );
});

// IPC: Update cache produk
ipcMain.handle('local:cacheProducts', async (event, products) => {
    const now = new Date().toISOString();
    for (const p of products) {
        localDbRun(
            `INSERT OR REPLACE INTO cache_products (id, data, updated_at) VALUES (?, ?, ?)`,
            [p.id, JSON.stringify(p), now]
        );
    }
    return true;
});

// IPC: Baca cache produk
ipcMain.handle('local:getCachedProducts', async () => {
    return localDbQuery(`SELECT data FROM cache_products`)
        .map(r => JSON.parse(r.data));
});

// IPC: Tandai transaksi lokal sudah ter-sync
ipcMain.handle('local:markTransactionSynced', async (event, localId) => {
    localDbRun(
        `UPDATE local_transactions SET sync_status = 'SYNCED' WHERE local_id = ?`,
        [localId]
    );
    return true;
});

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

  try {
    await initLocalDb();
  } catch (error) {
    console.error('Local SQLite initialization error:', error);
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

// Shell: open external URL
ipcMain.handle('shell:openExternal', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
});


