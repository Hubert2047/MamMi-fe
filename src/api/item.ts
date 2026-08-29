import api from './axios'

export type PriceType = {
    base?: number
    uber?: number
    foodpanda?: number
    [key: string]: number | undefined
}

export type LocalizedText = { vi: string; en: string; 'zh-TW': string }
export type LocalizedOption = { id: string; names: LocalizedText }
export type OptionGroup = { id: string; names: LocalizedText; selection: 'single' | 'multiple'; required: boolean; defaultOptionId?: string; options: LocalizedOption[] }

export interface Item {
    _id: string
    type?: 'product' | 'combo'
    name: string
    names: LocalizedText
    description: LocalizedText
    imageUrl?: string
    imagePublicId?: string
    recommended?: boolean
    popular?: boolean
    new?: boolean
    categoryName: string
    categorySortOrder?: number
    categoryId?: string | { _id: string; names?: LocalizedText; name?: string }
    price: PriceType
    addons: Addon[]
    variants: LocalizedOption[]
    optionGroups: OptionGroup[]
    noteOptions: LocalizedOption[]
    permanentlyActive: boolean
    temporarilyUnavailable: boolean
    temporarilyUnavailableUntil?: string | null
    components?: Array<{ itemId: string; quantity: number }>
}

export interface ItemInput {
    type?: 'product' | 'combo'
    names: LocalizedText
    description: LocalizedText
    imageUrl?: string
    imagePublicId?: string
    recommended?: boolean
    popular?: boolean
    new?: boolean
    variants: LocalizedOption[]
    optionGroups: OptionGroup[]
    price: PriceType
    categoryId: string
    addons: string[]
    noteOptions: LocalizedOption[]
    components?: Array<{ itemId: string; quantity: number }>
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
