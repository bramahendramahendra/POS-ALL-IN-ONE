const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: (username, password) => ipcRenderer.invoke('auth:login', username, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser')
  },

  cashDrawer: {
    updateSales: (amount) => ipcRenderer.invoke('cashDrawer:updateSales', amount),
    updateExpenses: (amount) => ipcRenderer.invoke('cashDrawer:updateExpenses', amount)
  },
  finance: {
    getDashboard: (filters) => ipcRenderer.invoke('finance:getDashboard', filters),
    getTopProducts: (filters) => ipcRenderer.invoke('finance:getTopProducts', filters)
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
  },
  printer: {
    getAll: () => ipcRenderer.invoke('printer:getAll')
  },
  window: {
    loadLoginPage: () => ipcRenderer.send('load-login-page'),
    openReceipt: (transactionId) => ipcRenderer.send('window:openReceipt', transactionId)
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

// ============================================
// LOCAL DB — SQLite offline via IPC
// ============================================
contextBridge.exposeInMainWorld('localDB', {
    saveTransaction:         (data)     => ipcRenderer.invoke('local:saveTransaction', data),
    getPendingTransactions:  ()         => ipcRenderer.invoke('local:getPendingTransactions'),
    cacheProducts:           (products) => ipcRenderer.invoke('local:cacheProducts', products),
    getCachedProducts:       ()         => ipcRenderer.invoke('local:getCachedProducts'),
    markTransactionSynced:   (localId)  => ipcRenderer.invoke('local:markTransactionSynced', localId),
});

// ============================================
// SYNC QUEUE — Antrian sinkronisasi offline via IPC
// ============================================
contextBridge.exposeInMainWorld('syncQueue', {
    add:          (item)   => ipcRenderer.invoke('syncQueue:add', item),
    getPending:   ()       => ipcRenderer.invoke('syncQueue:getPending'),
    updateStatus: (params) => ipcRenderer.invoke('syncQueue:updateStatus', params),
    getAll:       (params) => ipcRenderer.invoke('syncQueue:getAll', params || {}),
    retryFailed:  ()       => ipcRenderer.invoke('syncQueue:retryFailed'),
});