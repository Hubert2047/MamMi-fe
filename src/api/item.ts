import api from './axios'

export type PriceType = {
    base?: number
    uber?: number
    foodpanda?: number
    [key: string]: number | undefined
}
export interface Item {
    _id: string
    name: string
    names: { vi: string; en: string; 'zh-TW': string }
    categoryName: string
    categoryId?: string | { _id: string; name?: string }
    price: PriceType
    addons: Addon[]
    variants: string[]
    noteOptions: string[]
    active: boolean
}

export interface ItemInput {
    names: { vi: string; en: string; 'zh-TW': string }
    variants: string[]
    price: PriceType
    categoryId: string
    addons: string[]
    noteOptions: string[]
    active: boolean
}

interface Addon {
    _id: string
    name: string
    priceExtra: number
}

export const getItems = async (active?: boolean, lang?: string): Promise<Item[]> => {
    const params = new URLSearchParams()
    if (active !== undefined) params.set('active', String(active))
    if (lang) params.set('lang', lang)
    const query = params.toString()
    const res = await api.get(query ? `items?${query}` : 'items')
    return res.data.data
}

export const createItem = async (data: ItemInput): Promise<Item> => {
    const res = await api.post('items', data)
    return res.data.data
}

export const updateItem = async ({ id, data }: { id: string; data: Partial<ItemInput> }): Promise<Item> => {
    const res = await api.put(`items/${id}`, data)
    return res.data.data
}

export const deleteItem = async (id: string) => {
    const res = await api.delete(`items/${id}`)
    return res.data
}
