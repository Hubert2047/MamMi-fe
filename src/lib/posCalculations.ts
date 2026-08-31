import type { BaseOrder, OrderItem } from "@/api/order";
import type { Item } from "@/api/item";

type PosOrderItem = Pick<OrderItem, "basePrice" | "quantity" | "addons">;

export type OrderPriceBreakdown = {
  productSubtotal: number;
  addonSubtotal: number;
  subtotal: number;
  discountAmount: number;
  total: number;
};

export function calculateOrderItemTotal(item: PosOrderItem): number {
  const baseTotal = item.basePrice * item.quantity;
  const addonTotal = item.addons.reduce(
    (total, addon) => total + addon.amount * addon.priceExtra * item.quantity,
    0,
  );
  return baseTotal + addonTotal;
}

export function calculateOrderSubtotal(items: PosOrderItem[]): number {
  return items.reduce(
    (total, item) => total + calculateOrderItemTotal(item),
    0,
  );
}

export function calculateOrderTotal(
  order: Pick<BaseOrder, "items" | "appliedPromotions">,
): number {
  return calculateOrderPriceBreakdown(order).total;
}

export function calculateOrderPriceBreakdown(
  order: Pick<BaseOrder, "items" | "appliedPromotions">,
): OrderPriceBreakdown {
  const productSubtotal = order.items.reduce(
    (total, item) => total + item.basePrice * item.quantity,
    0,
  );
  const addonSubtotal = order.items.reduce(
    (total, item) =>
      total +
      item.addons.reduce(
        (addonTotal, addon) =>
          addonTotal + addon.amount * addon.priceExtra * item.quantity,
        0,
      ),
    0,
  );
  const subtotal = productSubtotal + addonSubtotal;
  const discountAmount = (order.appliedPromotions ?? []).reduce(
    (total, promotion) => total + promotion.discountAmount,
    0,
  );
  const total = Math.max(0, subtotal - discountAmount);
  return {
    productSubtotal,
    addonSubtotal,
    subtotal,
    discountAmount: subtotal - total,
    total,
  };
}

export function findFreshSelectedItem(
  selectedItemId: string | null,
  items: Item[],
): Item | null {
  if (!selectedItemId) return null;
  return items.find((item) => item._id === selectedItemId) ?? null;
}

export function getUnavailableAddonIds(
  item: Pick<Item, "addons">,
  selectedAddonIds: string[],
): string[] {
  return item.addons
    .filter(
      (addon) =>
        addon.temporarilyUnavailable === true &&
        selectedAddonIds.includes(addon._id),
    )
    .map((addon) => addon._id);
}

export function syncOrderItemsWithCatalog(
  orderItems: OrderItem[],
  catalogItems: Item[],
): OrderItem[] {
  return orderItems.map((orderItem) => {
    const catalogItem = catalogItems.find((item) => item._id === orderItem.id);
    if (!catalogItem) return orderItem;
    const addons = orderItem.addons.map((orderAddon) => {
      const catalogAddon = catalogItem.addons.find(
        (addon) => addon._id === orderAddon.id,
      );
      return catalogAddon
        ? { ...orderAddon, priceExtra: catalogAddon.priceExtra }
        : orderAddon;
    });
    return { ...orderItem, name: catalogItem.name, addons };
  });
}
