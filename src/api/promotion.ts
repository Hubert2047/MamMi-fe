import api from './axios'

export type PromotionRule = { target: 'order' | 'product' | 'addon' | 'line'; productIds?: string[]; addonIds?: string[]; reward: { type: 'percent' | 'value'; amount: number } }
export interface Promotion { _id: string; names: { vi: string; en: string; 'zh-TW': string }; name: string; mode: 'automatic' | 'manual'; minSubtotal?: number; priority: number; combinable: boolean; exclusiveGroup: string; rules: PromotionRule[]; status: 'draft' | 'active' | 'expired' | 'archived'; version: number; startsAt?: string | null; endsAt?: string | null; enabled: boolean; assigned: boolean; assignedStoreIds: string[] }
export type PromotionInput = Omit<Promotion, '_id' | 'name' | 'version' | 'enabled' | 'assigned' | 'assignedStoreIds'> & { storeIds?: string[] }
export const getPromotions = async (): Promise<Promotion[]> => (await api.get('promotions')).data.data
export const createPromotion = async (data: PromotionInput): Promise<Promotion> => (await api.post('promotions', data)).data.data
export const updatePromotion = async ({ id, data }: { id: string; data: Partial<PromotionInput> }): Promise<Promotion> => (await api.put(`promotions/${id}`, data)).data.data
export const deletePromotion = async (id: string) => api.delete(`promotions/${id}`)
export const updateStorePromotion = async ({ id, enabled }: { id: string; enabled: boolean }) => (await api.put(`promotions/${id}/store-config`, { enabled })).data.data
export const previewPromotions = async (data: { items: unknown[]; selectedPromotionIds?: string[] }): Promise<{ total: number; appliedPromotions: import('./order').AppliedPromotion[] }> => (await api.post('promotions/preview', data)).data.data

const isAvailableForCatalog = (promotion: Promotion, now: Date) => {
    if (!promotion.enabled || promotion.status !== 'active' || promotion.mode !== 'automatic' || promotion.minSubtotal) return false
    return (!promotion.startsAt || new Date(promotion.startsAt) <= now) && (!promotion.endsAt || new Date(promotion.endsAt) >= now)
}

const productDiscountFor = (price: number, rule: PromotionRule) => Math.min(price, Math.max(0, rule.reward.type === 'percent' ? price * rule.reward.amount / 100 : rule.reward.amount))

const eligibleCatalogPromotions = (promotions: Promotion[], now: Date, matchesRule: (rule: PromotionRule) => boolean) => {
    const candidates = promotions.filter((promotion) => isAvailableForCatalog(promotion, now) && promotion.rules.some(matchesRule))
        .sort((a, b) => b.priority - a.priority || a._id.localeCompare(b._id))
    const usedGroups = new Set<string>()
    return candidates.filter((promotion) => {
        const group = promotion.exclusiveGroup || (promotion.combinable ? '' : 'default')
        if (group && usedGroups.has(group)) return false
        if (group) usedGroups.add(group)
        return true
    })
}

/**
 * Category cards intentionally project only unconditional automatic product rules.
 * Add-on, line, and order rules remain visible only after a product is configured.
 */
export const getCatalogProductPromotionPrice = ({ productId, price, promotions, now = new Date() }: { productId: string; price: number; promotions: Promotion[]; now?: Date }) => {
    const matchesRule = (rule: PromotionRule) => rule.target === 'product' && (!rule.productIds?.length || rule.productIds.includes(productId))
    const accepted = eligibleCatalogPromotions(promotions, now, matchesRule)
    return accepted.reduce((remaining, promotion) => promotion.rules.filter((rule) => rule.target === 'product' && (!rule.productIds?.length || rule.productIds.includes(productId))).reduce((value, rule) => value - productDiscountFor(value, rule), remaining), price)
}

export const getCatalogAddonPromotionPrice = ({ productId, addonId, price, promotions, now = new Date() }: { productId: string; addonId: string; price: number; promotions: Promotion[]; now?: Date }) => {
    const matchesRule = (rule: PromotionRule) => rule.target === 'addon' && (!rule.productIds?.length || rule.productIds.includes(productId)) && (!rule.addonIds?.length || rule.addonIds.includes(addonId))
    const accepted = eligibleCatalogPromotions(promotions, now, matchesRule)
    return accepted.reduce((remaining, promotion) => promotion.rules.filter(matchesRule).reduce((value, rule) => value - productDiscountFor(value, rule), remaining), price)
}
