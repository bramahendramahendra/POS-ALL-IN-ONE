const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: (username, password) => ipcRenderer.invoke('auth:login', username, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser')
  },

  dashboard: {
    getStats:        () => ipcRenderer.invoke('dashboard:getStats'),
    getSalesTrend:   (period) => ipcRenderer.invoke('dashboard:getSalesTrend', period),
    getTopCategories:(period) => ipcRenderer.invoke('dashboard:getTopCategories', period),
    getTopProducts:  (period, mode) => ipcRenderer.invoke('dashboard:getTopProducts', period, mode),
    getPaymentMethods:(period) => ipcRenderer.invoke('dashboard:getPaymentMethods', period),
    getSummaryExtra: (period) => ipcRenderer.invoke('dashboard:getSummaryExtra', period)
  },

  cashDrawer: {
    getCurrent: () => ipcRenderer.invoke('cashDrawer:getCurrent'),
    open: (data) => ipcRenderer.invoke('cashDrawer:open', data),
    close: (id, data) => ipcRenderer.invoke('cashDrawer:close', id, data),
    getHistory: (filters) => ipcRenderer.invoke('cashDrawer:getHistory', filters),
    getById: (id) => ipcRenderer.invoke('cashDrawer:getById', id),
    updateSales: (amount) => ipcRenderer.invoke('cashDrawer:updateSales', amount),
    updateExpenses: (amount) => ipcRenderer.invoke('cashDrawer:updateExpenses', amount)
  },
  expenses: {
    getAll: (filters) => ipcRenderer.invoke('expenses:getAll', filters),
    getById: (id) => ipcRenderer.invoke('expenses:getById', id),
    create: (expenseData) => ipcRenderer.invoke('expenses:create', expenseData),
    update: (id, expenseData) => ipcRenderer.invoke('expenses:update', id, expenseData),
    delete: (id) => ipcRenderer.invoke('expenses:delete', id)
  },
  purchases: {
    getAll: (filters) => ipcRenderer.invoke('purchases:getAll', filters),
    getById: (id) => ipcRenderer.invoke('purchases:getById', id),
    create: (purchaseData) => ipcRenderer.invoke('purchases:create', purchaseData),
    update: (id, purchaseData) => ipcRenderer.invoke('purchases:update', id, purchaseData),
    delete: (id) => ipcRenderer.invoke('purchases:delete', id),
    pay: (id, amount) => ipcRenderer.invoke('purchases:pay', id, amount)
  },
  suppliers: {
    getAll: (filters) => ipcRenderer.invoke('suppliers:getAll', filters),
    getById: (id) => ipcRenderer.invoke('suppliers:getById', id),
    create: (data) => ipcRenderer.invoke('suppliers:create', data),
    update: (id, data) => ipcRenderer.invoke('suppliers:update', id, data),
    delete: (id) => ipcRenderer.invoke('suppliers:delete', id),
    toggleStatus: (id) => ipcRenderer.invoke('suppliers:toggleStatus', id),
    getDetail: (id) => ipcRenderer.invoke('suppliers:getDetail', id),
    getActiveList: () => ipcRenderer.invoke('suppliers:getActiveList')
  },
  supplierReturns: {
    getAll: (filters) => ipcRenderer.invoke('supplierReturns:getAll', filters),
    getById: (id) => ipcRenderer.invoke('supplierReturns:getById', id),
    create: (data) => ipcRenderer.invoke('supplierReturns:create', data),
    updateStatus: (id, status) => ipcRenderer.invoke('supplierReturns:updateStatus', id, status),
    delete: (id) => ipcRenderer.invoke('supplierReturns:delete', id),
    getPurchaseItems: (purchaseId) => ipcRenderer.invoke('supplierReturns:getPurchaseItems', purchaseId)
  },
  customers: {
    getAll: (filters) => ipcRenderer.invoke('customers:getAll', filters),
    getById: (id) => ipcRenderer.invoke('customers:getById', id),
    getActiveList: () => ipcRenderer.invoke('customers:getActiveList'),
    create: (data) => ipcRenderer.invoke('customers:create', data),
    update: (id, data) => ipcRenderer.invoke('customers:update', id, data),
    delete: (id) => ipcRenderer.invoke('customers:delete', id),
    toggleStatus: (id) => ipcRenderer.invoke('customers:toggleStatus', id)
  },
  receivables: {
    getAll: (filters) => ipcRenderer.invoke('receivables:getAll', filters),
    getById: (id) => ipcRenderer.invoke('receivables:getById', id),
    getSummaryByCustomer: () => ipcRenderer.invoke('receivables:getSummaryByCustomer'),
    pay: (receivableId, paymentData) => ipcRenderer.invoke('receivables:pay', receivableId, paymentData),
    getPayments: (receivableId) => ipcRenderer.invoke('receivables:getPayments', receivableId)
  },
  shifts: {
    getAll: () => ipcRenderer.invoke('shifts:getAll'),
    getActive: () => ipcRenderer.invoke('shifts:getActive'),
    getById: (id) => ipcRenderer.invoke('shifts:getById', id),
    create: (data) => ipcRenderer.invoke('shifts:create', data),
    update: (id, data) => ipcRenderer.invoke('shifts:update', id, data),
    delete: (id) => ipcRenderer.invoke('shifts:delete', id),
    toggleStatus: (id) => ipcRenderer.invoke('shifts:toggleStatus', id),
    getSummary: (filters) => ipcRenderer.invoke('shifts:getSummary', filters)
  },
  finance: {
    getDashboard: (filters) => ipcRenderer.invoke('finance:getDashboard', filters),
    getTopProducts: (filters) => ipcRenderer.invoke('finance:getTopProducts', filters)
  },
  reports: {
    getSalesReport: (filters) => ipcRenderer.invoke('reports:getSalesReport', filters),
    getProfitLossReport: (filters) => ipcRenderer.invoke('reports:getProfitLossReport', filters),
    getStockReport: (filters) => ipcRenderer.invoke('reports:getStockReport', filters),
    getCashierReport: (filters) => ipcRenderer.invoke('reports:getCashierReport', filters),
    getUsers: () => ipcRenderer.invoke('reports:getUsers')
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    get: (key) => ipcRenderer.invoke('settings:get', key),
    save: (data) => ipcRenderer.invoke('settings:save', data),
    reset: () => ipcRenderer.invoke('settings:reset')
  },
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    restore: (filePath) => ipcRenderer.invoke('backup:restore', filePath),
    selectFile: () => ipcRenderer.invoke('backup:selectFile'),
    selectFolder: () => ipcRenderer.invoke('backup:selectFolder')
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
  },
  printer: {
    getAll: () => ipcRenderer.invoke('printer:getAll')
  },
  labelPrint: {
    getData: () => ipcRenderer.invoke('labelPrint:getData')
  },
  window: {
    loadLoginPage: () => ipcRenderer.send('load-login-page'),
    openReceipt: (transactionId) => ipcRenderer.send('window:openReceipt', transactionId),
    openBarcodeLabel: (data) => ipcRenderer.send('window:openBarcodeLabel', data)
  },
  shortcuts: {
    onNavigate: (callback) => {
      const channels = [
        'shortcut:kasir', 'shortcut:products', 'shortcut:transactions',
        'shortcut:finance', 'shortcut:reports', 'shortcut:users',
        'shortcut:settings', 'shortcut:logout'
      ];
      channels.forEach(ch => {
        ipcRenderer.on(ch, () => callback(ch));
      });
    }
  },
  menuEvents: {
    onBackup:  (cb) => ipcRenderer.on('menu:backup',  () => cb()),
    onRestore: (cb) => ipcRenderer.on('menu:restore', () => cb())
  },
  pinLock: {
    onLockScreen: (cb) => ipcRenderer.on('pinlock:lock', () => cb())
  }
});