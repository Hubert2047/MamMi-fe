import api from './axios'
import type { Item, PriceType } from './item'

export const getStoreItems = async (lang?: string): Promise<Item[]> => (await api.get('store-items', { params: lang ? { lang } : {} })).data.data
export const addStoreItem = async (data: { itemId: string; price: PriceType; active: boolean }) => (await api.post('store-items', data)).data.data
export const updateStoreItem = async ({ itemId, data }: { itemId: string; data: Partial<{ price: PriceType; active: boolean }> }) => (await api.put(`store-items/${itemId}`, data)).data.data
