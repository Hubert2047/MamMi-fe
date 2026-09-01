import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getPromotions, type Promotion } from "@/api/promotion";
import { getExpenses, type Expense, type ExpenseRange } from "@/api/expense";
import { getItems, type Item } from "@/api/item";
import { getStoreAddons } from "@/api/store-addon";
import type { Addon } from "@/api/addon";
import {
  getNextOrderNumber,
  getOrders,
  getSalesByPayment,
  type IOrder,
  type OrderRange,
  type SalesByPayment,
} from "@/api/order";
import {
  getRevenues,
  type Revenue,
  type RevenueRange,
} from "@/api/other-revenue";
import { getDailyClosingSummary } from "@/api/daily-closing";
import type { PaymentMethod } from "@/constants";
import { useI18n } from "@/lib/i18n";
import { useStoreContext } from "@/lib/store-context";

export const queryKeys = {
  items: ["items"] as const,
  promotions: ["promotions"] as const,
  nextOrderNumber: ["next-order-number"] as const,
  orders: (range?: OrderRange) => ["orders", range?.from, range?.to] as const,
  expenses: (range?: ExpenseRange) =>
    ["expenses", range?.from, range?.to] as const,
  revenues: (range?: RevenueRange) =>
    ["revenues", range?.from, range?.to] as const,
  salesByPayment: ["sales-by-payment"] as const,
  dailyClosingSummary: ["daily-closing-summary"] as const,
};

export function useItems(available?: boolean) {
  const { locale } = useI18n();
  return useQuery<Item[], Error>({
    queryKey: [...queryKeys.items, available, locale],
    queryFn: () => getItems(available, locale),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: available === undefined ? 60 * 1000 : false,
  });
}

export function usePromotions() {
  return useQuery<Promotion[], Error>({
    queryKey: queryKeys.promotions,
    queryFn: () => getPromotions(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useNextOrderNumber() {
  const { activeStoreId } = useStoreContext();
  return useQuery<number, Error>({
    queryKey: [...queryKeys.nextOrderNumber, activeStoreId],
    queryFn: getNextOrderNumber,
    enabled: Boolean(activeStoreId),
    staleTime: 0,
  });
}

export function useOrders(range: OrderRange = {}) {
  return useQuery<IOrder[], Error>({
    queryKey: queryKeys.orders(range),
    queryFn: () => getOrders(range),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useExpenses(range?: ExpenseRange) {
  return useQuery<Expense[], Error>({
    queryKey: queryKeys.expenses(range),
    queryFn: () => getExpenses(range),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
  });
}

export function useRevenues(range?: RevenueRange) {
  return useQuery<Revenue[], Error>({
    queryKey: queryKeys.revenues(range),
    queryFn: () => getRevenues(range),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSalesByPayment() {
  return useQuery<Record<PaymentMethod, SalesByPayment>, Error>({
    queryKey: queryKeys.salesByPayment,
    queryFn: getSalesByPayment,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDailyClosingSummary() {
  return useQuery({
    queryKey: queryKeys.dailyClosingSummary,
    queryFn: getDailyClosingSummary,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
  });
}

export function useStoreAddons() {
  const { locale } = useI18n();
  return useQuery<Addon[], Error>({
    queryKey: ["store-addons", locale],
    queryFn: () => getStoreAddons(locale),
    staleTime: 5 * 60 * 1000,
  });
}
