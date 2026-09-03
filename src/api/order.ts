import api from "./axios";
import type { PaymentMethod } from "@/constants";

export interface OrderItem {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  basePrice: number;
  variant: string;
  addons: OrderItemAddon[];
  addonDisplayMode?: "named" | "merged";
  noteOptions: string[];
  optionSelections?: { groupId: string; optionId: string; name?: string }[];
  note: string;
  componentSelections?: {
    componentId: string;
    itemId: string;
    noteOptions: string[];
    note: string;
    name?: string;
  }[];
  printName?: string;
  printVariant?: string;
  printAddons?: OrderItemAddon[];
  printNoteOptions?: string[];
}

interface Customer {
  name: string;
  phone: string;
}

interface OrderItemAddon {
  id: string;
  name: string;
  priceExtra: number;
  amount: number;
  printName?: string;
}

export interface AppliedPromotion {
  promotionId: string;
  promotionVersion: number;
  name: string;
  /** Absent only on historical orders created before this snapshot was added. */
  names?: { vi: string; en: string; "zh-TW": string };
  mode: "automatic" | "manual";
  targets?: ("order" | "product" | "addon" | "line")[];
  discountAmount: number;
  allocations: {
    itemId: string;
    productDiscountAmount: number;
    addonDiscounts: { addonId: string; discountAmount: number }[];
  }[];
}
export type ExpectedPricing = {
  total: number;
  appliedPromotions: AppliedPromotion[];
};
export type PricingConflictData = {
  items: OrderItem[];
  pricing: ExpectedPricing;
  reason?: string;
};

export interface BaseOrder {
  _id: string;
  number: number;
  items: OrderItem[];
  status: "pending" | "paid" | "cancelled";
  paymentMethod: PaymentMethod;
  pickupAt?: string;
  selectedPromotionIds?: string[];
  appliedPromotions?: AppliedPromotion[];
  expectedPricing?: ExpectedPricing;
  type: "dine_in" | "takeaway" | "uber" | "foodpanda";
  customer: Customer | null;
  checkoutPending: boolean;
  version?: number;
  table?: string;
  source?: "pos" | "qr" | "online" | "uber" | "foodpanda";
  externalOrderId?: string;
  printOnConfirm?: boolean;
}

export interface IOrder extends BaseOrder {
  _id: string;
  totalPrice: number;
  cashReceived?: number;
  createdAt: Date;
  paidAt?: Date;
}
export type SalesByPayment = {
  _id: string;
  totalSales: number;
  count: number;
};
export type OrderRange = { from?: string; to?: string };

export const getOrders = async (range: OrderRange = {}): Promise<IOrder[]> => {
  const res = await api.get("orders", { params: range });
  return res.data.data;
};
export const getNextOrderNumber = async (): Promise<number> => {
  const res = await api.get("orders/next-order-number");
  return res.data.nextNumber;
};
export const fetchOrderById = async (id: string): Promise<IOrder> => {
  const res = await api.get(`orders/${id}`);
  return res.data.data;
};

export const createOrder = async (order: BaseOrder): Promise<number> => {
  const res = await api.post("orders", order);
  return res.data.data;
};
export const cancelOrder = async ({
  id,
  version,
}: {
  id: string;
  version: number;
}): Promise<BaseOrder> => {
  const res = await api.patch(`orders/${id}/cancel`, { version });
  if (!res.data?.success || !res.data?.data)
    throw new Error("Invalid cancel order response");
  return res.data.data;
};
export const queueKitchenPrint = async (id: string): Promise<void> => {
  await api.post(`orders/${id}/print-kitchen`);
};

export const updateOrderPayment = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<{ paymentMethod: string; version: number }>;
}): Promise<BaseOrder> => {
  const res = await api.put(`orders/payment/${id}`, data);
  return res.data.data;
};
export const updatePendingOrder = async ({
  id,
  data,
}: {
  id: string;
  data: Pick<
    BaseOrder,
    | "items"
    | "type"
    | "selectedPromotionIds"
    | "expectedPricing"
    | "paymentMethod"
    | "version"
    | "table"
    | "pickupAt"
  >;
}): Promise<BaseOrder> => {
  const res = await api.put(`orders/${id}`, data);
  return res.data.data;
};
export const updateOrderCustomer = async ({
  id,
  customer,
  pickupAt,
}: {
  id: string;
  customer: Customer;
  pickupAt?: string;
}): Promise<BaseOrder> => {
  const res = await api.put(`orders/${id}/customer`, { customer, pickupAt });
  return res.data.data;
};

export const deleteOrder = async (id: string) => {
  const res = await api.delete(`orders/${id}`);
  return res.data;
};
export const getSalesByPayment = async (): Promise<
  Record<PaymentMethod, SalesByPayment>
> => {
  const res = await api.get("/orders/sales-by-payment");
  return res.data.data;
};
