import { describe, expect, it } from 'vitest'
import { calculateCashChange, calculateCashFromDenominations, isCashSufficient } from './cashDenominations'
import { calculateOrderTotal } from './posCalculations'

const orderItem = {
  id: 'item-1',
  itemId: 'item-1',
  name: 'Item',
  quantity: 2,
  basePrice: 100,
  variant: '',
  noteOptions: [],
  note: '',
  addons: [{ id: 'addon-1', name: 'Addon', amount: 1, priceExtra: 20 }],
}

describe('checkout total and cash change', () => {
  it('uses the discounted total when calculating change', () => {
    const total = calculateOrderTotal({
      items: [orderItem],
      discount: { name: '10%', amount: 10, type: 'percent' },
    })

    expect(total).toBe(198)
    expect(isCashSufficient(500, total)).toBe(true)
    expect(calculateCashChange(500, total)).toBe(302)
  })

  it('applies a fixed discount before calculating change', () => {
    const total = calculateOrderTotal({
      items: [orderItem],
      discount: { name: '50 off', amount: 50, type: 'value' },
    })

    expect(total).toBe(170)
    expect(calculateCashChange(200, total)).toBe(30)
  })

  it('supports cash entered by denomination counts', () => {
    const total = calculateOrderTotal({
      items: [orderItem],
      discount: { name: '10%', amount: 10, type: 'percent' },
    })
    const cashGiven = calculateCashFromDenominations({ 100: 3 })

    expect(cashGiven).toBe(300)
    expect(calculateCashChange(cashGiven, total)).toBe(102)
  })

  it('does not allow an excessive discount to produce a negative total', () => {
    const total = calculateOrderTotal({
      items: [orderItem],
      discount: { name: 'Free', amount: 999, type: 'value' },
    })

    expect(total).toBe(0)
    expect(calculateCashChange(50, total)).toBe(50)
  })

  it('does not return change when the customer has not paid enough', () => {
    const total = calculateOrderTotal({ items: [orderItem], discount: null })

    expect(total).toBe(220)
    expect(isCashSufficient(219, total)).toBe(false)
    expect(calculateCashChange(219, total)).toBe(0)
  })
})
