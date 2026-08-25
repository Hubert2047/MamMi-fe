import api from './axios'

export type TableSession = { _id: string; status: 'active' | 'closed' | 'expired'; openedAt: string; expiresAt: string; lastExtendedAt?: string; closedAt?: string }
export type StoreTable = { _id: string; code: string; name: string; active: boolean; qrToken: string; session?: TableSession | null }

export const getStoreTables = async (): Promise<StoreTable[]> => (await api.get('tables')).data.data
export const createStoreTable = async (data: { code: string; name?: string }): Promise<StoreTable> => (await api.post('tables', data)).data.data
export const regenerateStoreTableQr = async (id: string): Promise<StoreTable> => (await api.post(`tables/${id}/regenerate-qr`)).data.data
export const regenerateAllStoreTableQr = async (): Promise<{ count: number }> => (await api.post('tables/regenerate-qr-all')).data.data
export const openStoreTableSession = async (id: string): Promise<TableSession> => (await api.post(`tables/${id}/session/open`)).data.data
export const extendStoreTableSession = async (id: string): Promise<TableSession> => (await api.post(`tables/${id}/session/extend`)).data.data
export const closeStoreTableSession = async (id: string): Promise<TableSession> => (await api.post(`tables/${id}/session/close`)).data.data
