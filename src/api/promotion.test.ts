import { describe, expect, it } from 'vitest'
import { getCatalogAddonPromotionPrice, getCatalogProductPromotionPrice, type Promotion } from './promotion'

const basePromotion = (overrides: Partial<Promotion>): Promotion => ({
    _id: 'promotion-1',
    names: { vi: 'Khuyến mại', en: 'Promotion', 'zh-TW': '優惠' },
    name: 'Promotion',
    mode: 'automatic',
    priority: 0,
    combinable: true,
    exclusiveGroup: '',
    rules: [],
    status: 'active',
    version: 1,
    enabled: true,
    assigned: true,
    assignedStoreIds: ['store-1'],
    ...overrides,
})

describe('catalog promotion prices', () => {
    it('shows only automatic product rules on a category card', () => {
        const promotions = [basePromotion({ rules: [
            { target: 'product', productIds: ['tea'], reward: { type: 'percent', amount: 10 } },
            { target: 'addon', addonIds: ['boba'], reward: { type: 'value', amount: 15 } },
            { target: 'line', productIds: ['tea'], reward: { type: 'value', amount: 30 } },
        ] })]
        expect(getCatalogProductPromotionPrice({ productId: 'tea', price: 100, promotions })).toBe(90)
    })

    it('shows an add-on reduction only while configuring its product', () => {
        const promotions = [basePromotion({ rules: [{ target: 'addon', productIds: ['tea'], addonIds: ['boba'], reward: { type: 'value', amount: 15 } }] })]
        expect(getCatalogAddonPromotionPrice({ productId: 'tea', addonId: 'boba', price: 25, promotions })).toBe(10)
        expect(getCatalogAddonPromotionPrice({ productId: 'coffee', addonId: 'boba', price: 25, promotions })).toBe(25)
    })

    it('does not advertise manual, expired, or order-threshold promotions in catalog cards', () => {
        const now = new Date('2026-08-26T10:00:00.000Z')
        const promotions = [
            basePromotion({ mode: 'manual', rules: [{ target: 'product', productIds: ['tea'], reward: { type: 'value', amount: 10 } }] }),
            basePromotion({ _id: 'expired', endsAt: '2026-08-26T09:59:59.999Z', rules: [{ target: 'product', productIds: ['tea'], reward: { type: 'value', amount: 10 } }] }),
            basePromotion({ _id: 'threshold', minSubtotal: 200, rules: [{ target: 'product', productIds: ['tea'], reward: { type: 'value', amount: 10 } }] }),
        ]
        expect(getCatalogProductPromotionPrice({ productId: 'tea', price: 100, promotions, now })).toBe(100)
    })
})
