import api from './axios'

export interface Addon {
  _id: string
  names: { vi: string; en: string; 'zh-TW': string }
  name: string
  priceExtra: number
  active: boolean
}

export type AddonInput = {
  names: Addon['names']
  priceExtra: number
  active: boolean
}

export const getAddons = async (lang?: string): Promise<Addon[]> => {
  const res = await api.get(lang ? `addons?lang=${lang}` : 'addons')
  return res.data
}

export const createAddon = async (data: AddonInput): Promise<Addon> => {
  const res = await api.post('addons', data)
  return res.data
}

export const updateAddon = async ({ id, data }: { id: string; data: Partial<AddonInput> }): Promise<Addon> => {
  const res = await api.put(`addons/${id}`, data)
  return res.data
}

export const deleteAddon = async (id: string) => {
  const res = await api.delete(`addons/${id}`)
  return res.data
}
