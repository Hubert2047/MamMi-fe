import api from './axios'

export interface Discount {
    _id: string
    names: { vi: string; en: string; 'zh-TW': string }
    name: string
    amount: number
    type: 'percent' | 'value'
    note: string
    active: boolean
}

export const getDiscounts = async (storeId?: string): Promise<Discount[]> => {
    const res = await api.get('discounts', { params: storeId ? { storeId } : undefined })
    return res.data.data
}

export type DiscountInput = {
    names: Discount['names']
    amount: number
    type: Discount['type']
    note: string
    active: boolean
    startsAt?: string | null
    endsAt?: string | null
    storeIds?: string[]
    storeId?: string
}

export const createDiscount = async (data: DiscountInput): Promise<Discount> => {
    const res = await api.post('discounts', data)
    return res.data.data
}

export const updateDiscount = async ({ id, data }: { id: string; data: Partial<DiscountInput> }): Promise<Discount> => {
    const res = await api.put(`discounts/${id}`, data)
    return res.data.data
}

export const updateStoreDiscount = async ({ id, data }: { id: string; data: Pick<DiscountInput, 'amount'> & Partial<Pick<DiscountInput, 'active'>> & { storeId?: string } }): Promise<Discount> => {
    const res = await api.put(`discounts/${id}/store-config`, data)
    return res.data.data
}

export const deleteDiscount = async (id: string) => {
    const res = await api.delete(`discounts/${id}`)
    return res.data
}

