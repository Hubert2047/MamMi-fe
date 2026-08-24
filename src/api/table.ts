import api from './axios'

export type StoreTable = { _id: string; code: string; name: string; active: boolean; qrToken: string }

export const getStoreTables = async (): Promise<StoreTable[]> => (await api.get('tables')).data.data
export const createStoreTable = async (data: { code: string; name?: string }): Promise<StoreTable> => (await api.post('tables', data)).data.data
export const regenerateStoreTableQr = async (id: string): Promise<StoreTable> => (await api.post(`tables/${id}/regenerate-qr`)).data.data
export const regenerateAllStoreTableQr = async (): Promise<{ count: number }> => (await api.post('tables/regenerate-qr-all')).data.data
