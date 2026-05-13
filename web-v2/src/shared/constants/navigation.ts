import {
  BarChart2,
  Clock,
  CreditCard,
  LayoutDashboard,
  Package,
  Receipt,
  RefreshCw,
  Settings,
  ShoppingCart,
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

  // Inventori
  {
    label: 'Produk',
    path: ROUTES.PRODUCTS,
    icon: Package,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Inventori',
  },
  {
    label: 'Supplier',
    path: ROUTES.SUPPLIERS,
    icon: Truck,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Inventori',
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
    label: 'Keuangan',
    path: ROUTES.FINANCE,
    icon: Wallet,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Keuangan',
  },
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Keuangan',
  },
  {
    label: 'Laporan',
    path: ROUTES.REPORTS,
    icon: BarChart2,
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    group: 'Keuangan',
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
    label: 'Pengaturan',
    path: ROUTES.SETTINGS,
    icon: Settings,
    allowedRoles: [ROLES.OWNER],
    group: 'Sistem',
  },
]
