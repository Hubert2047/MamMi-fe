import api from "./axios";

export type SuperAdminOverviewStore = {
  _id: string;
  code: string;
  name: string;
  revenue: number;
  orderRevenue: number;
  orderRevenueByPayment: Record<string, number>;
  otherRevenue: number;
  expenses: number;
  inventoryExpenses: number;
  otherExpenses: number;
  profit: number;
  orders: number;
  closingDifference: number;
  closingCount: number;
  lastClosingAt: string | null;
};

export type SuperAdminOverview = {
  from: string;
  to: string;
  totals: Pick<SuperAdminOverviewStore, "revenue" | "expenses" | "profit" | "orders" | "closingDifference">;
  stores: SuperAdminOverviewStore[];
};

export const getSuperAdminOverview = async (params: {
  from?: string;
  to?: string;
} = {}): Promise<SuperAdminOverview> =>
  (await api.get("overview", { params })).data.data;
