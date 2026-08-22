import api from './axios'
import type { Addon } from './addon'

export const getStoreAddons = async (lang?: string): Promise<Addon[]> => (await api.get('store-addons', { params: lang ? { lang } : {} })).data
export const addStoreAddon = async (data: { addonId: string; priceExtra: number; active: boolean }) => (await api.post('store-addons', data)).data
export const updateStoreAddon = async ({ addonId, data }: { addonId: string; data: Partial<{ priceExtra: number; active: boolean }> }) => (await api.put(`store-addons/${addonId}`, data)).data
