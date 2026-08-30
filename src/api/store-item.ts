import api from './axios'
import type { Item, PriceType } from './item'

export const getStoreItems = async (lang?: string): Promise<Item[]> => (await api.get('store-items', { params: lang ? { lang } : {} })).data.data
export const addStoreItem = async (data: { itemId: string; price: PriceType }) => (await api.post('store-items', data)).data.data
export type StoreItemVisibility = { pos: boolean; qr: boolean; online: boolean }
export const updateStoreItem = async ({ itemId, data }: { itemId: string; data: Partial<{ price: PriceType; permanentlyActive: boolean; temporarilyUnavailable: boolean; visibility: StoreItemVisibility; addonDisplayMode: 'named' | 'merged' }> }) => (await api.put(`store-items/${itemId}`, data)).data.data
export const updateTemporaryStoreItemAvailability = async ({ itemId, temporarilyUnavailable }: { itemId: string; temporarilyUnavailable: boolean }) => (await api.patch(`store-items/${itemId}/temporary-availability`, { temporarilyUnavailable })).data.data
