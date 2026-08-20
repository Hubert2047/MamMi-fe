import api from './axios'

export interface Addon {
  _id: string
  name: string
  priceExtra: number
  active: boolean
}

export type AddonInput = Omit<Addon, '_id'>

export const getAddons = async (): Promise<Addon[]> => {
  const res = await api.get('addons')
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
