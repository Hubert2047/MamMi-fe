import type { BaseOrder, OrderItem } from "@/api/order";
import type { ReactElement } from "react";
import { SiFoodpanda, SiLine, SiUber } from "react-icons/si";

export const DEFAULT_ORDER_ITEM: OrderItem = {
  id: "",
  itemId: "",
  name: "",
  quantity: 1,
  basePrice: 0,
  variant: "",
  addons: [],
  noteOptions: [],
  note: "",
  componentSelections: [],
};

export const DEFAULT_ORDER: BaseOrder = {
  _id: "",
  number: 1,
  items: [],
  status: "pending",
  paymentMethod: "cash",
  selectedPromotionIds: [],
  appliedPromotions: [],
  type: "takeaway",
  customer: null,
  checkoutPending: false,
  source: "pos",
  pickupAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

export const PAYMENT_METHODS = [
  "cash",
  "uber",
  "linepay",
  "bank",
  "foodpanda",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, ReactElement> = {
  cash: <span>💵</span>,
  uber: <SiUber className="w-5 h-5" />,
  linepay: <SiLine className="w-5 h-5" />,
  bank: <span>🏦</span>,
  foodpanda: <SiFoodpanda className="w-5 h-5" />,
};
