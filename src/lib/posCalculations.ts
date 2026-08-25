import type { BaseOrder, OrderDiscount, OrderItem } from '@/api/order'
import type { Item } from '@/api/item'

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

export function findFreshSelectedItem(selectedItemId: string | null, items: Item[]): Item | null {
  if (!selectedItemId) return null
  return items.find((item) => item._id === selectedItemId) ?? null
}

export function getUnavailableAddonIds(item: Pick<Item, 'addons'>, selectedAddonIds: string[]): string[] {
  return item.addons.filter((addon) => addon.temporarilyUnavailable === true && selectedAddonIds.includes(addon._id)).map((addon) => addon._id)
}

export function syncOrderItemsWithCatalog(orderItems: OrderItem[], catalogItems: Item[]): OrderItem[] {
  return orderItems.map((orderItem) => {
    const catalogItem = catalogItems.find((item) => item._id === orderItem.id)
    if (!catalogItem) return orderItem
    const addons = orderItem.addons.map((orderAddon) => {
      const catalogAddon = catalogItem.addons.find((addon) => addon._id === orderAddon.id)
      return catalogAddon ? { ...orderAddon, priceExtra: catalogAddon.priceExtra } : orderAddon
    })
    return { ...orderItem, name: catalogItem.name, addons }
  })
}
