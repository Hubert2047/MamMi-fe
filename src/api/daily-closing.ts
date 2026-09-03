import api from "./axios";
import type { PaymentMethod } from "@/constants";
import type { SalesByPayment } from "@/api/order";

export type CashData = {
  [denomination: number]: string;
};

export interface IDailyClosing {
  _id: string;
  periodStart: string;
  periodEnd: string;
  status: "confirmed" | "voided";
  actualTotal: number;
  systemAmount: number;
  cash: CashData;
  reason: string;
  previousClosingAmount: number;
  cashSales: number;
  otherRevenueTotal: number;
  expensesTotal: number;
  difference: number;
  confirmedAt: string;
  confirmedBy?: string;
  confirmedByEmployee?: {
    employeeId: string;
    numberId: string;
    name: string;
  };
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateDailyClosing {
  actualTotal: number;
  systemAmount: number;
  cash: CashData;
  reason: string;
  employeeNumberId: string;
}

export interface DailyClosingSummary {
  periodStart: string;
  periodEnd: string;
  salesByPayment: Record<PaymentMethod, SalesByPayment>;
  cashSales: number;
  otherRevenueTotal: number;
  otherRevenueByPayment: {
    cash: number;
    bank_transfer: number;
    other: number;
  };
  expensesTotal: number;
  previousClosingAmount: number;
  previousClosingCash: CashData;
  systemAmount: number;
}

export type DailyClosingHistoryParams = {
  from?: string;
  to?: string;
  status?: "confirmed" | "voided";
  page?: number;
  limit?: number;
};

export type DailyClosingHistoryResponse = {
  data: IDailyClosing[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: {
    total: number;
    confirmed: number;
    voided: number;
    latestConfirmedId: string | null;
    latestConfirmedPeriodEnd: string | null;
  };
};

export const getDailyClosingSummary =
  async (): Promise<DailyClosingSummary> => {
    const res = await api.get("daily-closing/summary");
    return res.data.data;
  };

export const getDailyClosings = async (
  params: DailyClosingHistoryParams = {},
): Promise<DailyClosingHistoryResponse> => {
  const res = await api.get("daily-closing", {
    params,
  });
  return res.data;
};
export const createDailyClosing = async (
  data: ICreateDailyClosing,
): Promise<IDailyClosing> => {
  return api.post("daily-closing", data);
};

export const voidDailyClosing = async ({
  id,
  reason,
}: {
  id: string;
  reason: string;
}): Promise<IDailyClosing> => {
  const res = await api.post(`daily-closing/${id}/void`, { reason });
  return res.data.data;
};
