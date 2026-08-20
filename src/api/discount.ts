import api from './axios'

export interface Discount {
    _id: string
    name: string
    amount: number
    type: 'percent' | 'value'
    note: string
    active: boolean
}

export const getDiscounts = async (): Promise<Discount[]> => {
    const res = await api.get('discounts')
    return res.data.data
}

export type DiscountInput = Omit<Discount, '_id'>

export const createDiscount = async (data: DiscountInput): Promise<Discount> => {
    const res = await api.post('discounts', data)
    return res.data.data
}

export const updateDiscount = async ({ id, data }: { id: string; data: Partial<DiscountInput> }): Promise<Discount> => {
    const res = await api.put(`discounts/${id}`, data)
    return res.data.data
}

export const deleteDiscount = async (id: string) => {
    const res = await api.delete(`discounts/${id}`)
    return res.data
}

