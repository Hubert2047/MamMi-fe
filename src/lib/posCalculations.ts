import type { BaseOrder, OrderDiscount, OrderItem } from '@/api/order'

type PosOrderItem = Pick<OrderItem, 'basePrice' | 'quantity' | 'addons'>

export function calculateOrderItemTotal(item: PosOrderItem): number {
  const baseTotal = item.basePrice * item.quantity
  const addonTotal = item.addons.reduce((total, addon) => total + addon.amount * addon.priceExtra, 0)
  return baseTotal + addonTotal
}

export function calculateOrderSubtotal(items: PosOrderItem[]): number {
  return items.reduce((total, item) => total + calculateOrderItemTotal(item), 0)
}

export function applyOrderDiscount(subtotal: number, discount: OrderDiscount | null): number {
  if (!discount) return subtotal

  const discountedTotal = discount.type === 'percent'
    ? subtotal * (1 - discount.amount / 100)
    : subtotal - discount.amount

  return Math.max(0, discountedTotal)
}

export function calculateOrderTotal(order: Pick<BaseOrder, 'items' | 'discount'>): number {
  return applyOrderDiscount(calculateOrderSubtotal(order.items), order.discount)
}
