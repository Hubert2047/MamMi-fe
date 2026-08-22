import api from './axios'

export type PriceType = {
    base?: number
    uber?: number
    foodpanda?: number
    [key: string]: number | undefined
}

export type LocalizedText = { vi: string; en: string; 'zh-TW': string }
export type LocalizedOption = { id: string; names: LocalizedText }

export interface Item {
    _id: string
    name: string
    names: LocalizedText
    description: LocalizedText
    categoryName: string
    categoryId?: string | { _id: string; names?: LocalizedText; name?: string }
    price: PriceType
    addons: Addon[]
    variants: LocalizedOption[]
    noteOptions: LocalizedOption[]
    permanentlyActive: boolean
    temporarilyUnavailable: boolean
    temporarilyUnavailableUntil?: string | null
}

export interface ItemInput {
    names: LocalizedText
    description: LocalizedText
    variants: LocalizedOption[]
    price: PriceType
    categoryId: string
    addons: string[]
    noteOptions: LocalizedOption[]
}

interface Addon {
    _id: string
    names?: LocalizedText
    name: string
  priceExtra: number
  permanentlyActive?: boolean
  temporarilyUnavailable?: boolean
}

export const getItems = async (available?: boolean, lang?: string): Promise<Item[]> => {
    const params = new URLSearchParams()
    if (available !== undefined) params.set('available', String(available))
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
