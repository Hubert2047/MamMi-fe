import api from './axios'
import type { PaymentMethod } from '@/constants'
import type { SalesByPayment } from '@/api/order'

export type CashData = {
    [denomination: number]: string
}

export interface IDailyClosing {
    _id: string
    actualTotal: number
    systemAmount: number
    cash: CashData
    reason: string
    createdAt: string
    updatedAt: string
}

export interface ICreateDailyClosing {
    actualTotal: number
    systemAmount: number
    cash: CashData
    reason: string
}

export interface IUpdateDailyClosing extends ICreateDailyClosing {
    _id: string
}

export interface DailyClosingSummary {
    salesByPayment: Record<PaymentMethod, SalesByPayment>
    cashSales: number
    otherRevenueTotal: number
    expensesTotal: number
    previousClosingAmount: number
    systemAmount: number
}

export const getDailyClosingSummary = async (): Promise<DailyClosingSummary> => {
    const res = await api.get('daily-closing/summary')
    return res.data.data
}

export const getDailyClosings = async (date?: string): Promise<IDailyClosing[]> => {
    const res = await api.get('daily-closing', {
        params: date ? { date } : {},
    })
    return res.data.data
}
export const getClosingOfYesterday = async (): Promise<{ amount: number }> => {
    const res = await api.get('daily-closing/yesterday')
    return res.data.data
}

export const createDailyClosing = async (data: ICreateDailyClosing): Promise<IDailyClosing> => {
    return api.post('daily-closing', data)
}

export const updateDailyClosing = async ({
    id,
    data,
}: {
    id: string
    data: Partial<IUpdateDailyClosing>
}): Promise<IUpdateDailyClosing> => {
    const res = await api.put(`daily-closing/${id}`, data)
    return res.data.data
}

export const deleteDailyClosing = async (id: string) => {
    const res = await api.delete(`daily-closing/${id}`)
    return res.data
}
