import { describe, expect, it } from 'vitest'
import type { OrderItem } from '@/api/order'
import { calculateOrderItemTotal, calculateOrderSubtotal, calculateOrderTotal } from './posCalculations'
import { getPriceByType } from './utils'

const item = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: 'order-item-1',
  itemId: 'item-1',
  name: 'Mì bò',
  quantity: 1,
  basePrice: 30000,
  variant: '',
  addons: [],
  noteOptions: [],
  note: '',
  ...overrides,
})

describe('POS price calculations', () => {
  it('calculates an item total from quantity and addon amounts', () => {
    expect(calculateOrderItemTotal(item({
      quantity: 2,
      addons: [
        { id: 'egg', name: 'Trứng', priceExtra: 5000, amount: 2 },
        { id: 'beef', name: 'Bò thêm', priceExtra: 15000, amount: 1 },
      ],
    }))).toBe(85000)
  })

  it('returns the base total when no addons are selected', () => {
    expect(calculateOrderItemTotal(item({ quantity: 3 }))).toBe(90000)
  })

  it('calculates the subtotal across all order items', () => {
    expect(calculateOrderSubtotal([
      item({ quantity: 2 }),
      item({ basePrice: 45000, quantity: 1, addons: [{ id: 'tea', name: 'Trà', priceExtra: 10000, amount: 1 }] }),
    ])).toBe(115000)
  })

  it('applies a percentage discount', () => {
    expect(calculateOrderTotal({
      items: [item({ basePrice: 100000 })],
      discount: { name: '10%', type: 'percent', amount: 10 },
    })).toBe(90000)
  })

  it('applies a fixed-value discount', () => {
    expect(calculateOrderTotal({
      items: [item({ basePrice: 100000 })],
      discount: { name: 'Voucher', type: 'value', amount: 25000 },
    })).toBe(75000)
  })

  it('never returns a negative total when discount exceeds the subtotal', () => {
    expect(calculateOrderTotal({
      items: [item({ basePrice: 30000 })],
      discount: { name: 'Voucher', type: 'value', amount: 50000 },
    })).toBe(0)
  })

  it('uses the correct channel price for each POS order type', () => {
    const prices = { base: 30000, uber: 35000, foodpanda: 40000 }
    expect(getPriceByType('dine_in', prices)).toBe(30000)
    expect(getPriceByType('takeaway', prices)).toBe(30000)
    expect(getPriceByType('uber', prices)).toBe(35000)
    expect(getPriceByType('foodpanda', prices)).toBe(40000)
  })
})
