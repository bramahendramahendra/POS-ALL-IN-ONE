import type { PriceTier } from '@/features/inventory/products'

import type { CartItem, CartSummary, Discount, Tax } from './cashier.types'

export const calcItemSubtotal = (qty: number, price: number): number => {
  return qty * price
}

export const calcSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.subtotal, 0)
}

export const calcDiscountAmount = (
  subtotal: number,
  discount: Omit<Discount, 'amount'>
): number => {
  if (discount.type === 'none' || discount.value <= 0) return 0
  if (discount.type === 'percent') {
    return Math.round((subtotal * Math.min(discount.value, 100)) / 100)
  }
  return Math.min(discount.value, subtotal)
}

export const calcTaxAmount = (
  subtotal: number,
  discountAmount: number,
  taxPercent: number
): number => {
  if (taxPercent <= 0) return 0
  const taxableAmount = subtotal - discountAmount
  return Math.round((taxableAmount * taxPercent) / 100)
}

export const calcGrandTotal = (
  subtotal: number,
  discountAmount: number,
  taxAmount: number
): number => {
  return Math.max(0, subtotal - discountAmount + taxAmount)
}

export const calcCartSummary = (items: CartItem[], discount: Discount, tax: Tax): CartSummary => {
  const subtotal = calcSubtotal(items)
  const discountAmount = calcDiscountAmount(subtotal, discount)
  const taxAmount = calcTaxAmount(subtotal, discountAmount, tax.percent)
  const grandTotal = calcGrandTotal(subtotal, discountAmount, taxAmount)
  return { subtotal, discountAmount, taxAmount, grandTotal }
}

export const calcChange = (grandTotal: number, amountPaid: number): number => {
  return Math.max(0, amountPaid - grandTotal)
}

export const getApplicablePrice = (
  priceTiers: PriceTier[],
  unitId: number,
  qty: number
): number | null => {
  const tiers = priceTiers
    .filter((p) => p.unit_id === unitId && p.min_qty <= qty)
    .sort((a, b) => b.min_qty - a.min_qty)
  return tiers[0]?.price ?? null
}

export const isPaymentSufficient = (grandTotal: number, amountPaid: number): boolean => {
  return amountPaid >= grandTotal
}

export function calculateItemDiscount(
  price: number,
  qty: number,
  type: 'percent' | 'nominal',
  value: number
): { discount_amount: number; effective_price: number; subtotal: number } {
  if (value <= 0) {
    return { discount_amount: 0, effective_price: price, subtotal: price * qty }
  }

  if (type === 'percent') {
    const pct = Math.min(value, 100)
    const effective_price = Math.round(price * (1 - pct / 100))
    const discount_amount = (price - effective_price) * qty
    return { discount_amount, effective_price, subtotal: effective_price * qty }
  }

  // nominal: value adalah potongan per unit
  const effective_price = Math.max(0, price - value)
  const discount_amount = (price - effective_price) * qty
  return { discount_amount, effective_price, subtotal: effective_price * qty }
}
