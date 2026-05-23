import {
  BarChart2,
  BookOpen,
  Clock,
  CreditCard,
  Landmark,
  LayoutDashboard,
  LineChart,
  Package,
  PackageSearch,
  Receipt,
  RefreshCw,
  RotateCcw,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import type { Role } from '@/shared/types'
import { ROLES } from './roles'
import { ROUTES } from './routes'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  allowedRoles: Role[]
  group: string
}

export const NAV_ITEMS: NavItem[] = [
  // Beranda
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Beranda',
  },

  // Penjualan
  {
    label: 'Kasir',
    path: ROUTES.KASIR,
    icon: ShoppingCart,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.KASIR],
    group: 'Penjualan',
  },
  {
    label: 'Transaksi',
    path: ROUTES.TRANSACTIONS,
    icon: Receipt,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Penjualan',
  },

  // Produk
  {
    label: 'Produk',
    path: ROUTES.PRODUCTS,
    icon: Package,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Produk',
  },
  {
    label: 'Kategori',
    path: ROUTES.PRODUCTS_CATEGORIES,
    icon: Tag,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Produk',
  },
  {
    label: 'Unit',
    path: ROUTES.PRODUCTS_UNITS,
    icon: PackageSearch,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Produk',
  },

  // Pengadaan
  {
    label: 'Supplier',
    path: ROUTES.SUPPLIERS,
    icon: Truck,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Pengadaan',
  },
  {
    label: 'Pembelian',
    path: ROUTES.SUPPLIER_PURCHASES,
    icon: ShoppingBag,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Pengadaan',
  },
  {
    label: 'Retur',
    path: ROUTES.SUPPLIER_RETURNS,
    icon: RotateCcw,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Pengadaan',
  },

  // Pelanggan
  {
    label: 'Pelanggan',
    path: ROUTES.CUSTOMERS,
    icon: Users,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Pelanggan',
  },
  {
    label: 'Piutang',
    path: ROUTES.RECEIVABLES,
    icon: CreditCard,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Pelanggan',
  },

  // Keuangan
  {
    label: 'Dashboard Keuangan',
    path: ROUTES.FINANCE,
    icon: Wallet,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Keuangan',
  },
  {
    label: 'Kas Harian',
    path: ROUTES.FINANCE_CASH_DRAWER,
    icon: Landmark,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Keuangan',
  },
  {
    label: 'Rekap Kas',
    path: ROUTES.FINANCE_CASH_DRAWER_REKAP,
    icon: BookOpen,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Keuangan',
  },
  {
    label: 'Pengeluaran',
    path: ROUTES.FINANCE_EXPENSES,
    icon: TrendingDown,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Keuangan',
  },
  {
    label: 'Kas Saya',
    path: ROUTES.FINANCE_MY_CASH,
    icon: Wallet,
    allowedRoles: [ROLES.KASIR],
    group: 'Keuangan',
  },

  // Pelaporan
  {
    label: 'Penjualan',
    path: ROUTES.REPORTS_SALES,
    icon: TrendingUp,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Pelaporan',
  },
  {
    label: 'Laba Rugi',
    path: ROUTES.REPORTS_PROFIT_LOSS,
    icon: LineChart,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Pelaporan',
  },
  {
    label: 'Stok',
    path: ROUTES.REPORTS_STOCK,
    icon: PackageSearch,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Pelaporan',
  },
  {
    label: 'Kinerja Kasir',
    path: ROUTES.REPORTS_CASHIER,
    icon: BarChart2,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Pelaporan',
  },

  // Operasional
  {
    label: 'Shift',
    path: ROUTES.SHIFTS,
    icon: Clock,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Operasional',
  },
  {
    label: 'Sync Center',
    path: ROUTES.SYNC,
    icon: RefreshCw,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Operasional',
  },

  // Sistem
  {
    label: 'Profil Toko',
    path: ROUTES.SETTINGS_STORE,
    icon: Settings,
    allowedRoles: [ROLES.OWNER],
    group: 'Sistem',
  },
  {
    label: 'Manajemen User',
    path: ROUTES.SETTINGS_USERS,
    icon: Users,
    allowedRoles: [ROLES.OWNER],
    group: 'Sistem',
  },
  {
    label: 'Printer',
    path: ROUTES.SETTINGS_PRINTER,
    icon: Receipt,
    allowedRoles: [ROLES.OWNER],
    group: 'Sistem',
  },
  {
    label: 'Versi Aplikasi',
    path: ROUTES.SETTINGS_VERSIONS,
    icon: RefreshCw,
    allowedRoles: [ROLES.OWNER],
    group: 'Sistem',
  },
]
