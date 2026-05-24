export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  KASIR: '/kasir',

  // Inventori
  PRODUCTS: '/products',
  PRODUCTS_CATEGORIES: '/products/categories',
  PRODUCTS_UNITS: '/products/units',
  SUPPLIERS: '/suppliers',
  SUPPLIER_PURCHASES: '/suppliers/purchases',
  SUPPLIER_RETURNS: '/suppliers/returns',

  // Penjualan
  TRANSACTIONS: '/transactions',

  // Pelanggan
  CUSTOMERS: '/customers',
  RECEIVABLES: '/receivables',

  // Keuangan
  FINANCE: '/finance',
  FINANCE_CASH_DRAWER: '/finance/cash-drawer',
  FINANCE_CASH_DRAWER_REKAP: '/finance/cash-drawer/rekap',
  FINANCE_EXPENSES: '/finance/expenses',
  FINANCE_MY_CASH: '/finance/my-cash',

  // Laporan
  REPORTS: '/reports',
  REPORTS_SALES: '/reports/sales',
  REPORTS_PROFIT_LOSS: '/reports/profit-loss',
  REPORTS_STOCK: '/reports/stock',
  REPORTS_CASHIER: '/reports/cashier',

  // Operasional
  SHIFTS: '/shifts',
  SYNC: '/sync',

  // Sistem
  SETTINGS: '/settings',
  SETTINGS_STORE: '/settings/store',
  SETTINGS_USERS: '/settings/users',
  SETTINGS_PRINTER: '/settings/printer',
  SETTINGS_VERSIONS: '/settings/versions',
  SETTINGS_ROLES: '/settings/roles',
  SETTINGS_ROLES_ACCESS: '/settings/roles/:id/access',
  SETTINGS_MENUS: '/settings/menus',
} as const
