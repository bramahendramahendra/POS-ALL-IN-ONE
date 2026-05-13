/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { LoginPage, ProtectedRoute, RootRedirect } from '@/features/auth'
import { ROLES } from '@/shared/constants/roles'
import { ROUTES } from '@/shared/constants/routes'

import { LazyRoute } from './LazyRoute'

const CashierPage      = lazy(() => import('@/features/sales/cashier/CashierPage').then(m => ({ default: m.CashierPage })))
const TransactionsPage = lazy(() => import('@/features/sales/transactions/TransactionsPage').then(m => ({ default: m.TransactionsPage })))
const CustomersPage    = lazy(() => import('@/features/customers/CustomersPage').then(m => ({ default: m.CustomersPage })))
const ProductsPage     = lazy(() => import('@/features/inventory/products/ProductsPage').then(m => ({ default: m.ProductsPage })))
const SuppliersPage    = lazy(() => import('@/features/inventory/suppliers/SuppliersPage').then(m => ({ default: m.SuppliersPage })))
const DashboardPage    = lazy(() => import('@/features/reporting/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ReportsPage      = lazy(() => import('@/features/reporting/reports/ReportsPage').then(m => ({ default: m.ReportsPage })))
const FinancePage      = lazy(() => import('@/features/finance/overview/FinancePage').then(m => ({ default: m.FinancePage })))
const ReceivablesPage  = lazy(() => import('@/features/finance/receivables/ReceivablesPage').then(m => ({ default: m.ReceivablesPage })))
const ShiftsPage       = lazy(() => import('@/features/shifts/ShiftsPage').then(m => ({ default: m.ShiftsPage })))
const SyncCenterPage   = lazy(() => import('@/features/sync/SyncCenterPage').then(m => ({ default: m.SyncCenterPage })))
const SettingsPage     = lazy(() => import('@/features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))

const ALL_ROLES        = [ROLES.OWNER, ROLES.ADMIN, ROLES.KASIR] as const
const MANAGEMENT_ROLES = [ROLES.OWNER, ROLES.ADMIN] as const
const OWNER_ONLY       = [ROLES.OWNER] as const

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  // Protected — semua role
  {
    element: <ProtectedRoute allowedRoles={[...ALL_ROLES]} />,
    children: [
      { path: ROUTES.KASIR, element: <LazyRoute><CashierPage /></LazyRoute> },
    ],
  },
  // Protected — owner & admin
  {
    element: <ProtectedRoute allowedRoles={[...MANAGEMENT_ROLES]} />,
    children: [
      { path: ROUTES.DASHBOARD,    element: <LazyRoute><DashboardPage /></LazyRoute> },
      { path: ROUTES.PRODUCTS,     element: <LazyRoute><ProductsPage /></LazyRoute> },
      { path: ROUTES.SUPPLIERS,    element: <LazyRoute><SuppliersPage /></LazyRoute> },
      { path: ROUTES.TRANSACTIONS, element: <LazyRoute><TransactionsPage /></LazyRoute> },
      { path: ROUTES.CUSTOMERS,    element: <LazyRoute><CustomersPage /></LazyRoute> },
      { path: ROUTES.RECEIVABLES,  element: <LazyRoute><ReceivablesPage /></LazyRoute> },
      { path: ROUTES.FINANCE,      element: <LazyRoute><FinancePage /></LazyRoute> },
      { path: ROUTES.REPORTS,      element: <LazyRoute><ReportsPage /></LazyRoute> },
      { path: ROUTES.SHIFTS,       element: <LazyRoute><ShiftsPage /></LazyRoute> },
      { path: ROUTES.SYNC,         element: <LazyRoute><SyncCenterPage /></LazyRoute> },
    ],
  },
  // Protected — owner only
  {
    element: <ProtectedRoute allowedRoles={[...OWNER_ONLY]} />,
    children: [
      { path: ROUTES.SETTINGS, element: <LazyRoute><SettingsPage /></LazyRoute> },
    ],
  },
  // 404
  { path: '*', element: <Navigate to="/" replace /> },
])
