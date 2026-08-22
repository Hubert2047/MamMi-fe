import { describe, expect, it } from 'vitest'
import { calculateCashChange, calculateCashFromDenominations, isCashSufficient, setCashCount, updateCashCount } from './cashDenominations'

describe('cash denomination calculations', () => {
  it('calculates the amount from denomination quantities', () => {
    expect(calculateCashFromDenominations({ 1: 2, 10: 1, 1000: 2 })).toBe(2012)
  })

  it('ignores negative and fractional quantities', () => {
    expect(calculateCashFromDenominations({ 5: -2, 100: 1.8 })).toBe(100)
  })

  it('updates a denomination count without mutating the previous value', () => {
    const previous = { 100: 1 }
    const next = updateCashCount(previous, 100, 2)
    expect(next).toEqual({ 100: 3 })
    expect(previous).toEqual({ 100: 1 })
    expect(updateCashCount(next, 100, -5)).toEqual({ 100: 0 })
  })

  it('sets the selected denomination quantity from keypad input', () => {
    expect(setCashCount({ 1000: 2 }, 1000, 10)).toEqual({ 1000: 10 })
    expect(setCashCount({ 1000: 2 }, 1000, -1)).toEqual({ 1000: 0 })
  })

  it('calculates change and never returns a negative amount', () => {
    expect(calculateCashChange(1500, 986)).toBe(514)
    expect(calculateCashChange(900, 986)).toBe(0)
  })

  it('checks whether the cash given is sufficient', () => {
    expect(isCashSufficient(1000, 1000)).toBe(true)
    expect(isCashSufficient(999, 1000)).toBe(false)
  })
})
