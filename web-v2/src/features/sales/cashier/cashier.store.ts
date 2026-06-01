import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Product, ProductPackage } from '@/features/inventory/products'

import type { CartItem, Discount, DiscountType, Tax } from './cashier.types'
import { calcDiscountAmount, calcItemSubtotal, calcTaxAmount, calculateItemDiscount } from './cashier.utils'

const DEFAULT_DISCOUNT: Discount = { type: 'none', value: 0, amount: 0 }
const DEFAULT_TAX: Tax = { percent: 0, amount: 0 }

interface CashierState {
  // Data
  cart: CartItem[]
  discount: Discount
  tax: Tax
  selectedCustomer: { id: number; name: string } | null

  // UI State (not persisted)
  paymentModalOpen: boolean
  unitSelectModalOpen: boolean
  pendingProduct: { product: Product; availableUnits: ProductPackage[] } | null

  // Actions — Cart
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: number, unitId: number) => void
  updateQty: (productId: number, unitId: number, qty: number) => void
  updateNotes: (productId: number, unitId: number, notes: string) => void
  updatePrice: (productId: number, unitId: number, price: number) => void
  setItemDiscount: (productId: number, unitId: number, type: 'percent' | 'nominal', value: number) => void
  clearCart: () => void

  // Actions — Discount & Tax
  setDiscount: (discount: Omit<Discount, 'amount'>) => void
  setTax: (percent: number) => void

  // Actions — Customer
  setCustomer: (customer: { id: number; name: string } | null) => void

  // Actions — Modal
  openPaymentModal: () => void
  closePaymentModal: () => void
  openUnitSelectModal: (product: Product, units: ProductPackage[]) => void
  closeUnitSelectModal: () => void
}

function recalcDiscountAndTax(
  cart: CartItem[],
  discount: Discount,
  tax: Tax
): { discount: Discount; tax: Tax } {
  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0)
  const discountAmount = calcDiscountAmount(subtotal, discount)
  const taxAmount = calcTaxAmount(subtotal, discountAmount, tax.percent)
  return {
    discount: { ...discount, amount: discountAmount },
    tax: { ...tax, amount: taxAmount },
  }
}

export const useCashierStore = create<CashierState>()(
  persist(
    (set, get) => ({
      cart: [],
      discount: DEFAULT_DISCOUNT,
      tax: DEFAULT_TAX,
      selectedCustomer: null,

      // UI state defaults
      paymentModalOpen: false,
      unitSelectModalOpen: false,
      pendingProduct: null,

      // ── Cart Actions ──

      addToCart: (item) => {
        const { cart, discount, tax } = get()
        const existing = cart.find(
          (i) => i.product_id === item.product_id && i.unit_id === item.unit_id
        )

        let newCart: CartItem[]
        if (existing) {
          const newQty = existing.qty + item.qty
          newCart = cart.map((i) => {
            if (i.product_id !== item.product_id || i.unit_id !== item.unit_id) return i
            if (i.discount_type && i.discount_value) {
              const { discount_amount, effective_price, subtotal } = calculateItemDiscount(
                i.price, newQty, i.discount_type, i.discount_value
              )
              return { ...i, qty: newQty, discount_amount, effective_price, subtotal }
            }
            return { ...i, qty: newQty, subtotal: calcItemSubtotal(newQty, i.price) }
          })
        } else {
          newCart = [...cart, { ...item, subtotal: calcItemSubtotal(item.qty, item.price) }]
        }

        const { discount: newDiscount, tax: newTax } = recalcDiscountAndTax(newCart, discount, tax)
        set({ cart: newCart, discount: newDiscount, tax: newTax })
      },

      removeFromCart: (productId, unitId) => {
        const { cart, discount, tax } = get()
        const newCart = cart.filter((i) => !(i.product_id === productId && i.unit_id === unitId))
        const { discount: newDiscount, tax: newTax } = recalcDiscountAndTax(newCart, discount, tax)
        set({ cart: newCart, discount: newDiscount, tax: newTax })
      },

      updateQty: (productId, unitId, qty) => {
        if (qty <= 0) {
          get().removeFromCart(productId, unitId)
          return
        }
        const { cart, discount, tax } = get()
        const newCart = cart.map((i) => {
          if (i.product_id !== productId || i.unit_id !== unitId) return i
          if (i.discount_type && i.discount_value) {
            const { discount_amount, effective_price, subtotal } = calculateItemDiscount(
              i.price, qty, i.discount_type, i.discount_value
            )
            return { ...i, qty, discount_amount, effective_price, subtotal }
          }
          return { ...i, qty, subtotal: calcItemSubtotal(qty, i.price) }
        })
        const { discount: newDiscount, tax: newTax } = recalcDiscountAndTax(newCart, discount, tax)
        set({ cart: newCart, discount: newDiscount, tax: newTax })
      },

      updateNotes: (productId, unitId, notes) => {
        set((state) => ({
          cart: state.cart.map((i) =>
            i.product_id === productId && i.unit_id === unitId ? { ...i, notes } : i
          ),
        }))
      },

      updatePrice: (productId, unitId, price) => {
        const { cart, discount, tax } = get()
        const newCart = cart.map((i) => {
          if (i.product_id !== productId || i.unit_id !== unitId) return i
          if (i.discount_type && i.discount_value) {
            const { discount_amount, effective_price, subtotal } = calculateItemDiscount(
              price, i.qty, i.discount_type, i.discount_value
            )
            return { ...i, price, discount_amount, effective_price, subtotal }
          }
          return { ...i, price, subtotal: calcItemSubtotal(i.qty, price) }
        })
        const { discount: newDiscount, tax: newTax } = recalcDiscountAndTax(newCart, discount, tax)
        set({ cart: newCart, discount: newDiscount, tax: newTax })
      },

      setItemDiscount: (productId, unitId, type, value) => {
        const { cart, discount, tax } = get()
        const newCart = cart.map((i) => {
          if (i.product_id !== productId || i.unit_id !== unitId) return i
          if (value <= 0) {
            return {
              ...i,
              discount_type: undefined,
              discount_value: undefined,
              discount_amount: undefined,
              effective_price: undefined,
              subtotal: calcItemSubtotal(i.qty, i.price),
            }
          }
          const { discount_amount, effective_price, subtotal } = calculateItemDiscount(
            i.price, i.qty, type, value
          )
          return { ...i, discount_type: type, discount_value: value, discount_amount, effective_price, subtotal }
        })
        const { discount: newDiscount, tax: newTax } = recalcDiscountAndTax(newCart, discount, tax)
        set({ cart: newCart, discount: newDiscount, tax: newTax })
      },

      clearCart: () =>
        set({
          cart: [],
          discount: DEFAULT_DISCOUNT,
          tax: DEFAULT_TAX,
          selectedCustomer: null,
        }),

      // ── Discount & Tax ──

      setDiscount: ({ type, value }: { type: DiscountType; value: number }) => {
        const { cart, tax } = get()
        const subtotal = cart.reduce((s, i) => s + i.subtotal, 0)
        const amount = calcDiscountAmount(subtotal, { type, value })
        const taxAmount = calcTaxAmount(subtotal, amount, tax.percent)
        set({
          discount: { type, value, amount },
          tax: { ...tax, amount: taxAmount },
        })
      },

      setTax: (percent) => {
        const { cart, discount } = get()
        const subtotal = cart.reduce((s, i) => s + i.subtotal, 0)
        const taxAmount = calcTaxAmount(subtotal, discount.amount, percent)
        set({ tax: { percent, amount: taxAmount } })
      },

      // ── Customer ──

      setCustomer: (customer) => set({ selectedCustomer: customer }),

      // ── Modals ──

      openPaymentModal: () => set({ paymentModalOpen: true }),
      closePaymentModal: () => set({ paymentModalOpen: false }),

      openUnitSelectModal: (product, availableUnits) =>
        set({ unitSelectModalOpen: true, pendingProduct: { product, availableUnits } }),
      closeUnitSelectModal: () => set({ unitSelectModalOpen: false, pendingProduct: null }),
    }),
    {
      name: 'cashier-draft',
      partialize: (state) => ({
        cart: state.cart,
        discount: state.discount,
        tax: state.tax,
        selectedCustomer: state.selectedCustomer,
      }),
    }
  )
)
