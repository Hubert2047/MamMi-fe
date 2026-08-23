import api from './axios'

export interface ExpenseUnit {
    _id: string
    code: string
    names: { vi: string; en: string; 'zh-TW': string }
    category: 'weight' | 'volume' | 'count'
    baseUnit: string
    conversionFactor: number
    active: boolean
}

export const getExpenseUnits = async (includeInactive = false): Promise<ExpenseUnit[]> => {
    const res = await api.get('units', { params: includeInactive ? { all: 'true' } : undefined })
    return res.data.data
}
export const createExpenseUnit = async (data: Omit<ExpenseUnit, '_id' | 'active'> & { active?: boolean }): Promise<ExpenseUnit> => (await api.post('units', data)).data.data
export const updateExpenseUnit = async ({ id, data }: { id: string; data: Partial<ExpenseUnit> }): Promise<ExpenseUnit> => (await api.put(`units/${id}`, data)).data.data

export interface Expense {
    _id: string
    name: string
    quantity: number
    unit?: string
    unitPrice: number
    price: number
    note?: string
    type?: 'other' | 'inventory_purchase'
    receiptId?: string
    category?: string
    createdAt: string
    updatedAt: string
}

export interface ICreateExpense {
    name: string
    quantity: number
    unit?: string
    unitPrice: number
    price: number
    note?: string
    category?: string
}
export interface IUpdateExpense extends ICreateExpense {
    _id: string
}

export type ExpenseRange = { from?: string; to?: string }

export const getExpenses = async (range: ExpenseRange = {}): Promise<Expense[]> => {
    const res = await api.get('expenses', {
        params: range,
    })
    return res.data.data
}

export const fetchExpenseById = async (id: string): Promise<Expense> => {
    const res = await api.get(`expenses/${id}`)
    return res.data.data
}

export const createExpense = async (data: ICreateExpense): Promise<Expense> => {
    return api.post('expenses', data)
}

export const updateExpense = async ({id, data}: {
    id: string
    data: Partial<ICreateExpense>
}): Promise<IUpdateExpense> => {
    const res = await api.put(`expenses/${id}`, data)
    return res.data.data
}

export const deleteExpense = async (id: string) => {
    const res = await api.delete(`expenses/${id}`)
    return res.data
}
