import api from './axios'

export interface StoreOption {
  _id: string
  code: string
  name: string
}

export const getStores = async (): Promise<StoreOption[]> => (await api.get('stores')).data.data
