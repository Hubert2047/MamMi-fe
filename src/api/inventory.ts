import api from './axios'

export interface InventoryPurchaseUnit { unitCode: string; conversionFactor: number }
export interface InventoryItem {
    _id: string
    name: string
    stockUnitCode: string
    purchaseUnits: InventoryPurchaseUnit[]
    minimumStock: number
    currentQuantity?: number
    active: boolean
    note?: string
}
export interface InventoryReceiptLine {
    inventoryItemId: string
    quantity: number
    unitCode: string
    unitPrice: number
}
export interface InventoryReceiptInput {
    supplierName?: string
    receivedAt?: string
    note?: string
    lines: InventoryReceiptLine[]
}
export interface InventoryStockRow extends InventoryItem { currentQuantity: number }

export const getInventoryItems = async (): Promise<InventoryItem[]> => (await api.get('inventory/items')).data.data
export const createInventoryItem = async (data: Omit<InventoryItem, '_id' | 'active' | 'currentQuantity'>): Promise<InventoryItem> => (await api.post('inventory/items', data)).data.data
export const updateInventoryItem = async ({ id, data }: { id: string; data: Partial<InventoryItem> }): Promise<InventoryItem> => (await api.put(`inventory/items/${id}`, data)).data.data
export const getInventoryReceipts = async (): Promise<unknown[]> => (await api.get('inventory/receipts')).data.data
export const createInventoryReceipt = async (data: InventoryReceiptInput): Promise<unknown> => (await api.post('inventory/receipts', data)).data.data
export const getInventoryStock = async (): Promise<InventoryStockRow[]> => (await api.get('inventory/stock')).data.data
export const getInventoryStocktakes = async (): Promise<unknown[]> => (await api.get('inventory/stocktakes')).data.data
export const createInventoryStocktake = async (data: { checkedAt?: string; lines: Array<{ inventoryItemId: string; actualQuantity: number; reason?: string }> }): Promise<unknown> => (await api.post('inventory/stocktakes', data)).data.data
