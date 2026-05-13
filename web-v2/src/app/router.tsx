import { createBrowserRouter, Navigate } from 'react-router-dom'

import { LoginPage, ProtectedRoute, RootRedirect } from '@/features/auth'
import { CashierPage } from '@/features/sales/cashier'
import { TransactionsPage } from '@/features/sales/transactions'
import { CustomersPage } from '@/features/customers'
import { ShiftsPage } from '@/features/shifts'
import { SettingsPage } from '@/features/settings'
import { DashboardPage } from '@/features/reporting/dashboard'
import { ReportsPage } from '@/features/reporting/reports'
import { FinancePage } from '@/features/finance/overview'
import { ReceivablesPage } from '@/features/finance/receivables'
import { ProductsPage } from '@/features/inventory/products'
import { SuppliersPage } from '@/features/inventory/suppliers'
import { ROLES } from '@/shared/constants/roles'
import { ROUTES } from '@/shared/constants/routes'

const ALL_ROLES = [ROLES.OWNER, ROLES.ADMIN, ROLES.KASIR] as const
const MANAGEMENT_ROLES = [ROLES.OWNER, ROLES.ADMIN] as const
const OWNER_ONLY = [ROLES.OWNER] as const

const Placeholder = ({ name }: { name: string }) => (
  <div className="p-8 text-xl font-semibold text-gray-600">{name} (coming soon)</div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  // Protected — semua role
  {
    element: <ProtectedRoute allowedRoles={[...ALL_ROLES]} />,
    children: [
      { path: ROUTES.KASIR, element: <CashierPage /> },
    ],
  },
  // Protected — owner & admin
  {
    element: <ProtectedRoute allowedRoles={[...MANAGEMENT_ROLES]} />,
    children: [
      { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
      { path: ROUTES.PRODUCTS, element: <ProductsPage /> },
      { path: ROUTES.SUPPLIERS, element: <SuppliersPage /> },
      { path: ROUTES.TRANSACTIONS, element: <TransactionsPage /> },
      { path: ROUTES.CUSTOMERS, element: <CustomersPage /> },
      { path: ROUTES.RECEIVABLES, element: <ReceivablesPage /> },
      { path: ROUTES.FINANCE, element: <FinancePage /> },
      { path: ROUTES.REPORTS, element: <ReportsPage /> },
      { path: ROUTES.SHIFTS, element: <ShiftsPage /> },
      { path: ROUTES.SYNC, element: <Placeholder name="Sync" /> },
    ],
  },
  // Protected — owner only
  {
    element: <ProtectedRoute allowedRoles={[...OWNER_ONLY]} />,
    children: [
      { path: ROUTES.SETTINGS, element: <SettingsPage /> },
    ],
  },
  // 404
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
