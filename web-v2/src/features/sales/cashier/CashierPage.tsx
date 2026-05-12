import { useEffect } from 'react'
import { toast } from 'sonner'

import { useActiveShiftQuery } from './cashier.api'
import { useCashierStore } from './cashier.store'
import { CartPanel } from './components/CartPanel'
import { PaymentModal } from './components/PaymentModal'
import { ProductSearch } from './components/ProductSearch'
import { UnitSelectModal } from './components/UnitSelectModal'

export function CashierPage() {
  const { data: activeShift, isLoading: isLoadingShift } = useActiveShiftQuery()
  const { paymentModalOpen, closePaymentModal } = useCashierStore()

  useEffect(() => {
    if (!isLoadingShift && !activeShift) {
      toast.warning('Belum ada shift aktif. Buka shift terlebih dahulu.', {
        duration: 5000,
        id: 'no-active-shift',
      })
    }
  }, [activeShift, isLoadingShift])

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - var(--navbar-height))',
        overflow: 'hidden',
      }}
    >
      {/* Panel Kiri */}
      <div
        style={{ flex: 1, padding: '16px', overflowY: 'auto' }}
        className="bg-gray-50"
      >
        <ProductSearch />
      </div>

      {/* Panel Kanan */}
      <div
        style={{
          width: '380px',
          borderLeft: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          background: 'white',
        }}
      >
        <CartPanel />
      </div>

      {/* Modals */}
      <UnitSelectModal />
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={(open) => { if (!open) closePaymentModal() }}
      />
    </div>
  )
}
