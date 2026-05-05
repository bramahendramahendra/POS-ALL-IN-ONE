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
    updateSales: (amount) => ipcRenderer.invoke('cashDrawer:updateSales', amount),
    updateExpenses: (amount) => ipcRenderer.invoke('cashDrawer:updateExpenses', amount)
  },
  finance: {
    getDashboard: (filters) => ipcRenderer.invoke('finance:getDashboard', filters),
    getTopProducts: (filters) => ipcRenderer.invoke('finance:getTopProducts', filters)
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