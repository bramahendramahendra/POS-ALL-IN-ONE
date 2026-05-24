type Filter = Record<string, unknown> | undefined

export const queryKeys = {
  auth: {
    profile: () => ['auth', 'profile'] as const,
  },

  products: {
    all: () => ['products'] as const,
    list: (filter?: Filter) => ['products', 'list', filter] as const,
    detail: (id: number) => ['products', 'detail', id] as const,
    productUnits: (id: number) => ['products', 'productUnits', id] as const,
    priceTiers: (id: number) => ['products', 'priceTiers', id] as const,
    barcode: (code: string) => ['products', 'barcode', code] as const,
  },

  categories: {
    all: () => ['categories'] as const,
    list: () => ['categories', 'list'] as const,
  },

  units: {
    all: () => ['units'] as const,
    list: () => ['units', 'list'] as const,
  },

  suppliers: {
    all: () => ['suppliers'] as const,
    list: (filter?: Filter) => ['suppliers', 'list', filter] as const,
    detail: (id: number) => ['suppliers', 'detail', id] as const,
  },

  transactions: {
    all: () => ['transactions'] as const,
    list: (filter?: Filter) => ['transactions', 'list', filter] as const,
    detail: (id: number) => ['transactions', 'detail', id] as const,
  },

  customers: {
    all: () => ['customers'] as const,
    list: (filter?: Filter) => ['customers', 'list', filter] as const,
    detail: (id: number) => ['customers', 'detail', id] as const,
  },

  receivables: {
    all: () => ['receivables'] as const,
    list: (filter?: Filter) => ['receivables', 'list', filter] as const,
    detail: (id: number) => ['receivables', 'detail', id] as const,
  },

  finance: {
    summary: (filter?: Filter) => ['finance', 'summary', filter] as const,
    cashflow: (filter?: Filter) => ['finance', 'cashflow', filter] as const,
  },

  dashboard: {
    summary: (period: string) => ['dashboard', 'summary', period] as const,
    salesChart: (period: string) => ['dashboard', 'salesChart', period] as const,
    topProducts: (period: string) => ['dashboard', 'topProducts', period] as const,
  },

  reports: {
    data: (filter?: Filter) => ['reports', 'data', filter] as const,
  },

  shifts: {
    all: () => ['shifts'] as const,
    list: (filter?: Filter) => ['shifts', 'list', filter] as const,
    active: () => ['shifts', 'active'] as const,
    detail: (id: number) => ['shifts', 'detail', id] as const,
  },

  settings: {
    store: () => ['settings', 'store'] as const,
    users: () => ['settings', 'users'] as const,
    appVersions: () => ['settings', 'appVersions'] as const,
  },

  sync: {
    status: () => ['sync', 'status'] as const,
    history: () => ['sync', 'history'] as const,
    conflicts: () => ['sync', 'conflicts'] as const,
  },

  roles: {
    all: () => ['roles'] as const,
    list: (filter?: Filter) => ['roles', 'list', filter] as const,
    detail: (id: number) => ['roles', 'detail', id] as const,
    menus: (id: number) => ['roles', 'menus', id] as const,
  },

  menus: {
    all: () => ['menus'] as const,
    list: (filter?: Filter) => ['menus', 'list', filter] as const,
    detail: (id: number) => ['menus', 'detail', id] as const,
    my: () => ['menus', 'my'] as const,
  },

  cashDrawer: {
    all: () => ['cashDrawer'] as const,
    current: () => ['cashDrawer', 'current'] as const,
    list: (filter?: Filter) => ['cashDrawer', 'list', filter] as const,
    detail: (id: number) => ['cashDrawer', 'detail', id] as const,
    summary: (filter?: Filter) => ['cashDrawer', 'summary', filter] as const,
  },
}
