import { useQuery } from '@tanstack/react-query'
import { getDiscounts, type Discount } from '@/api/discount'
import { getExpenses, type Expense } from '@/api/expense'
import { getItems, type Item } from '@/api/item'
import { getNextOrderNumber, getOrders, getSalesByPayment, type IOrder, type SalesByPayment } from '@/api/order'
import { getRevenues, type Revenue } from '@/api/other-revenue'
import { getDailyClosingSummary } from '@/api/daily-closing'
import type { PaymentMethod } from '@/constants'
import { useI18n } from '@/lib/i18n'

export const queryKeys = {
  items: ['items'] as const,
  discounts: ['discounts'] as const,
  nextOrderNumber: ['next-order-number'] as const,
  orders: (days: number) => ['orders', days] as const,
  expenses: (date?: string) => ['expenses', date] as const,
  revenues: (date?: string) => ['revenues', date] as const,
  salesByPayment: ['sales-by-payment'] as const,
  dailyClosingSummary: ['daily-closing-summary'] as const,
}

export function useItems(available?: boolean) {
  const { locale } = useI18n()
  return useQuery<Item[], Error>({
    queryKey: [...queryKeys.items, available, locale],
    queryFn: () => getItems(available, locale),
    staleTime: 5 * 60 * 1000,
    refetchInterval: available === undefined ? 60 * 1000 : false,
  })
}

export function useDiscounts() {
  return useQuery<Discount[], Error>({
    queryKey: queryKeys.discounts,
    queryFn: () => getDiscounts(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useNextOrderNumber() {
  return useQuery<number, Error>({
    queryKey: queryKeys.nextOrderNumber,
    queryFn: getNextOrderNumber,
    staleTime: Infinity,
  })
}

export function useOrders(days: number) {
  return useQuery<IOrder[], Error>({
    queryKey: queryKeys.orders(days),
    queryFn: () => getOrders(days),
    staleTime: 5 * 60 * 1000,
  })
}

export function useExpenses(date?: string) {
  return useQuery<Expense[], Error>({
    queryKey: queryKeys.expenses(date),
    queryFn: () => getExpenses(date),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRevenues(date?: string) {
  return useQuery<Revenue[], Error>({
    queryKey: queryKeys.revenues(date),
    queryFn: () => getRevenues(date),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSalesByPayment() {
  return useQuery<Record<PaymentMethod, SalesByPayment>, Error>({
    queryKey: queryKeys.salesByPayment,
    queryFn: getSalesByPayment,
    staleTime: 5 * 60 * 1000,
  })
}

export function useDailyClosingSummary() {
  return useQuery({
    queryKey: queryKeys.dailyClosingSummary,
    queryFn: getDailyClosingSummary,
    staleTime: 5 * 60 * 1000,
  })
}
