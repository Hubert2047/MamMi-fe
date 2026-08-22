import api from './axios'
import type { Addon } from './addon'

export const getStoreAddons = async (lang?: string): Promise<Addon[]> => (await api.get('store-addons', { params: lang ? { lang } : {} })).data
export const addStoreAddon = async (data: { addonId: string; priceExtra: number; permanentlyActive?: boolean }) => (await api.post('store-addons', data)).data
export const updateStoreAddon = async ({ addonId, data }: { addonId: string; data: Partial<{ priceExtra: number; permanentlyActive: boolean; temporarilyUnavailable: boolean }> }) => (await api.put(`store-addons/${addonId}`, data)).data
export const updateTemporaryStoreAddonAvailability = async ({ addonId, temporarilyUnavailable }: { addonId: string; temporarilyUnavailable: boolean }) => (await api.patch(`store-addons/${addonId}/temporary-availability`, { temporarilyUnavailable })).data
