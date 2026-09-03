import api from "./axios";
import type { AppliedPromotion, OrderItem } from "./order";

export type PromotionRule = {
  target: "order" | "product" | "addon" | "line";
  productIds?: string[];
  addonIds?: string[];
  reward: { type: "percent" | "value"; amount: number };
};
export interface Promotion {
  _id: string;
  names: { vi: string; en: string; "zh-TW": string };
  name: string;
  imageUrl?: string;
  imagePublicId?: string;
  mode: "automatic" | "manual";
  minSubtotal?: number;
  priority: number;
  combinable: boolean;
  exclusiveGroup: string;
  rules: PromotionRule[];
  status: "draft" | "active" | "expired" | "archived";
  version: number;
  startsAt?: string | null;
  endsAt?: string | null;
  enabled: boolean;
  assigned: boolean;
  assignedStoreIds: string[];
}
export type PromotionInput = Omit<
  Promotion,
  "_id" | "name" | "version" | "enabled" | "assigned" | "assignedStoreIds"
> & { storeIds?: string[] };
export const getPromotions = async (lang?: string): Promise<Promotion[]> =>
  (await api.get("promotions", { params: lang ? { lang } : undefined })).data
    .data;
export const createPromotion = async (
  data: PromotionInput,
): Promise<Promotion> => (await api.post("promotions", data)).data.data;
export const updatePromotion = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<PromotionInput>;
}): Promise<Promotion> => (await api.put(`promotions/${id}`, data)).data.data;
export const deletePromotion = async (id: string) =>
  api.delete(`promotions/${id}`);
export const updateStorePromotion = async ({
  id,
  enabled,
}: {
  id: string;
  enabled: boolean;
}) => (await api.put(`promotions/${id}/store-config`, { enabled })).data.data;
export const previewPromotions = async (data: {
  items: unknown[];
  selectedPromotionIds?: string[];
}): Promise<{
  total: number;
  appliedPromotions: import("./order").AppliedPromotion[];
}> => (await api.post("promotions/preview", data)).data.data;

const orderItemTotal = (
  item: Pick<OrderItem, "basePrice" | "quantity" | "addons">,
) =>
  item.basePrice * item.quantity +
  item.addons.reduce(
    (total, addon) => total + addon.amount * addon.priceExtra * item.quantity,
    0,
  );
const promotionDiscount = (subtotal: number, reward: PromotionRule["reward"]) =>
  Math.max(
    0,
    Math.min(
      subtotal,
      reward.type === "percent"
        ? (subtotal * reward.amount) / 100
        : reward.amount,
    ),
  );

const roundTwd = (amount: number) => Math.floor(amount + 0.5 + Number.EPSILON);

const finalizePromotionPreview = (
  grossSubtotal: number,
  exactTotal: number,
  appliedPromotions: AppliedPromotion[],
) => {
  const total = roundTwd(exactTotal);
  const targetDiscount = roundTwd(grossSubtotal) - total;
  const entries: { amount: number; index: number; set(amount: number): void }[] = [];

  appliedPromotions.forEach((promotion) =>
    promotion.allocations.forEach((allocation) => {
      if (allocation.productDiscountAmount > 0)
        entries.push({
          amount: allocation.productDiscountAmount,
          index: entries.length,
          set: (amount) => {
            allocation.productDiscountAmount = amount;
          },
        });
      allocation.addonDiscounts.forEach((addonDiscount) => {
        if (addonDiscount.discountAmount > 0)
          entries.push({
            amount: addonDiscount.discountAmount,
            index: entries.length,
            set: (amount) => {
              addonDiscount.discountAmount = amount;
            },
          });
      });
    }),
  );

  const roundedEntries = entries.map((entry) => ({
    ...entry,
    amount: Math.floor(entry.amount + Number.EPSILON),
    fraction: entry.amount - Math.floor(entry.amount + Number.EPSILON),
  }));
  let remainingUnits =
    targetDiscount - roundedEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const byLargestFraction = [...roundedEntries].sort(
    (a, b) => b.fraction - a.fraction || a.index - b.index,
  );
  for (
    let index = 0;
    remainingUnits > 0 && byLargestFraction.length;
    index += 1, remainingUnits -= 1
  )
    byLargestFraction[index % byLargestFraction.length]!.amount += 1;
  roundedEntries.forEach((entry) => entry.set(entry.amount));

  return {
    total,
    appliedPromotions: appliedPromotions
      .map((promotion) => ({
        ...promotion,
        discountAmount: promotion.allocations.reduce(
          (sum, allocation) =>
            sum +
            allocation.productDiscountAmount +
            allocation.addonDiscounts.reduce(
              (addonSum, addon) => addonSum + addon.discountAmount,
              0,
            ),
          0,
        ),
      }))
      .filter((promotion) => promotion.discountAmount > 0),
  };
};

/** Fast POS-only preview. The backend recalculates and validates this pricing data before accepting an order. */
export const calculatePromotionPreview = ({
  items,
  promotions,
  selectedPromotionIds = [],
  now = new Date(),
}: {
  items: OrderItem[];
  promotions: Promotion[];
  selectedPromotionIds?: string[];
  now?: Date;
}): { total: number; appliedPromotions: AppliedPromotion[] } => {
  const grossSubtotal = items.reduce(
    (total, item) => total + orderItemTotal(item),
    0,
  );
  const eligible = promotions.filter((promotion) => {
    if (!promotion.enabled || promotion.status !== "active") return false;
    if (
      promotion.mode !== "automatic" &&
      !selectedPromotionIds.includes(promotion._id)
    )
      return false;
    if (promotion.minSubtotal && grossSubtotal < promotion.minSubtotal)
      return false;
    return (
      (!promotion.startsAt || new Date(promotion.startsAt) <= now) &&
      (!promotion.endsAt || new Date(promotion.endsAt) >= now)
    );
  });
  const estimatedDiscount = (promotion: Promotion) =>
    promotion.rules.reduce((sum, rule) => {
      if (rule.target === "order")
        return sum + promotionDiscount(grossSubtotal, rule.reward);
      return (
        sum +
        items.reduce((itemSum, item) => {
          if (rule.productIds?.length && !rule.productIds.includes(item.id))
            return itemSum;
          if (rule.target === "product")
            return (
              itemSum +
              promotionDiscount(item.basePrice * item.quantity, {
                ...rule.reward,
                amount:
                  rule.reward.type === "value"
                    ? rule.reward.amount * item.quantity
                    : rule.reward.amount,
              })
            );
          if (rule.target === "addon")
            return (
              itemSum +
              item.addons
                .filter(
                  (addon) =>
                    !rule.addonIds?.length || rule.addonIds.includes(addon.id),
                )
                .reduce(
                  (addonSum, addon) =>
                    addonSum +
                    promotionDiscount(
                      addon.amount * addon.priceExtra * item.quantity,
                      {
                        ...rule.reward,
                        amount:
                          rule.reward.type === "value"
                            ? rule.reward.amount * addon.amount * item.quantity
                            : rule.reward.amount,
                      },
                    ),
                  0,
                )
            );
          return (
            itemSum +
            promotionDiscount(orderItemTotal(item), {
              ...rule.reward,
              amount:
                rule.reward.type === "value"
                  ? rule.reward.amount * item.quantity
                  : rule.reward.amount,
            })
          );
        }, 0)
      );
    }, 0);
  const sorted = [...eligible].sort(
    (a, b) =>
      b.priority - a.priority ||
      estimatedDiscount(b) - estimatedDiscount(a) ||
      a._id.localeCompare(b._id),
  );
  const accepted: Promotion[] = [];
  const usedGroups = new Set<string>();
  for (const promotion of sorted) {
    const group =
      promotion.exclusiveGroup ||
      (promotion.mode === "automatic" &&
      promotion.rules.some((rule) => rule.target === "order")
        ? "automatic-order"
        : promotion.combinable
          ? ""
          : "default");
    if (group && usedGroups.has(group)) continue;
    accepted.push(promotion);
    if (group) usedGroups.add(group);
  }
  const remainingProduct = items.map((item) => item.basePrice * item.quantity);
  const remainingAddon = items.map((item) =>
    item.addons.map((addon) => addon.amount * addon.priceExtra * item.quantity),
  );
  const allocationsByPromotion = new Map(
    accepted.map((promotion) => [
      promotion._id,
      items.map((item) => ({
        itemId: item.id,
        productDiscountAmount: 0,
        addonDiscounts: [] as { addonId: string; discountAmount: number }[],
      })),
    ]),
  );

  // Always consume product/add-on/line rewards before any whole-order reward.
  for (const target of ["product", "addon", "line"] as const) {
    for (const promotion of accepted) {
      const allocations = allocationsByPromotion.get(promotion._id)!;
      for (const rule of promotion.rules.filter(
        (candidate) => candidate.target === target,
      )) {
      items.forEach((item, itemIndex) => {
        if (rule.productIds?.length && !rule.productIds.includes(item.id))
          return;
        if (rule.target === "product") {
          const discount = promotionDiscount(remainingProduct[itemIndex]!, {
            ...rule.reward,
            amount:
              rule.reward.type === "value"
                ? rule.reward.amount * item.quantity
                : rule.reward.amount,
          });
          remainingProduct[itemIndex]! -= discount;
          allocations[itemIndex]!.productDiscountAmount += discount;
        } else if (rule.target === "line") {
          let remainingDiscount = promotionDiscount(
            remainingProduct[itemIndex]! +
              remainingAddon[itemIndex]!.reduce(
                (sum, amount) => sum + amount,
                0,
              ),
            {
              ...rule.reward,
              amount:
                rule.reward.type === "value"
                  ? rule.reward.amount * item.quantity
                  : rule.reward.amount,
            },
          );
          const productDiscount = Math.min(
            remainingProduct[itemIndex]!,
            remainingDiscount,
          );
          remainingProduct[itemIndex]! -= productDiscount;
          remainingDiscount -= productDiscount;
          allocations[itemIndex]!.productDiscountAmount += productDiscount;
          item.addons.forEach((addon, addonIndex) => {
            const discount = Math.min(
              remainingAddon[itemIndex]![addonIndex]!,
              remainingDiscount,
            );
            remainingAddon[itemIndex]![addonIndex]! -= discount;
            remainingDiscount -= discount;
            if (discount)
              allocations[itemIndex]!.addonDiscounts.push({
                addonId: addon.id,
                discountAmount: discount,
              });
          });
        } else
          item.addons.forEach((addon, addonIndex) => {
            if (rule.addonIds?.length && !rule.addonIds.includes(addon.id))
              return;
            const discount = promotionDiscount(
              remainingAddon[itemIndex]![addonIndex]!,
              {
                ...rule.reward,
                amount:
                  rule.reward.type === "value"
                    ? rule.reward.amount * item.quantity * addon.amount
                    : rule.reward.amount,
              },
            );
            remainingAddon[itemIndex]![addonIndex]! -= discount;
            if (discount)
              allocations[itemIndex]!.addonDiscounts.push({
                addonId: addon.id,
                discountAmount: discount,
              });
          });
      });
    }
      }
    }

  for (const promotion of accepted) {
    const allocations = allocationsByPromotion.get(promotion._id)!;
    const rule = promotion.rules.find((candidate) => candidate.target === "order");
    if (rule) {
      const subtotal =
        remainingProduct.reduce((sum, amount) => sum + amount, 0) +
        remainingAddon.reduce(
          (sum, addons) =>
            sum + addons.reduce((addonSum, amount) => addonSum + amount, 0),
          0,
        );
      let remainingDiscount = promotionDiscount(subtotal, rule.reward);
      items.forEach((item, itemIndex) => {
        const productDiscount = Math.min(
          remainingProduct[itemIndex]!,
          remainingDiscount,
        );
        remainingProduct[itemIndex]! -= productDiscount;
        remainingDiscount -= productDiscount;
        allocations[itemIndex]!.productDiscountAmount += productDiscount;
        item.addons.forEach((addon, addonIndex) => {
          const addonDiscount = Math.min(
            remainingAddon[itemIndex]![addonIndex]!,
            remainingDiscount,
          );
          remainingAddon[itemIndex]![addonIndex]! -= addonDiscount;
          remainingDiscount -= addonDiscount;
          if (addonDiscount)
            allocations[itemIndex]!.addonDiscounts.push({
              addonId: addon.id,
              discountAmount: addonDiscount,
            });
        });
      });
    }
  }

  const appliedPromotions: AppliedPromotion[] = [];
  for (const promotion of accepted) {
    const allocations = allocationsByPromotion.get(promotion._id)!;
    const discountAmount = allocations.reduce(
      (sum, allocation) =>
        sum +
        allocation.productDiscountAmount +
        allocation.addonDiscounts.reduce(
          (addonSum, addon) => addonSum + addon.discountAmount,
          0,
        ),
      0,
    );
    if (discountAmount)
      appliedPromotions.push({
        promotionId: promotion._id,
        promotionVersion: promotion.version,
        name: promotion.name,
        names: promotion.names,
        mode: promotion.mode,
        targets: [...new Set(promotion.rules.map((rule) => rule.target))],
        discountAmount,
        allocations,
      });
  }
  const total =
    remainingProduct.reduce((sum, amount) => sum + amount, 0) +
    remainingAddon.reduce(
      (sum, addons) =>
        sum + addons.reduce((addonSum, amount) => addonSum + amount, 0),
      0,
    );
  return finalizePromotionPreview(grossSubtotal, total, appliedPromotions);
};

const isAvailableForCatalog = (
  promotion: Promotion,
  now: Date,
  includeConditional = false,
) => {
  if (
    !promotion.enabled ||
    promotion.status !== "active" ||
    promotion.mode !== "automatic" ||
    (!includeConditional && promotion.minSubtotal)
  )
    return false;
  return (
    (!promotion.startsAt || new Date(promotion.startsAt) <= now) &&
    (!promotion.endsAt || new Date(promotion.endsAt) >= now)
  );
};

const productDiscountFor = (price: number, rule: PromotionRule) =>
  Math.min(
    price,
    Math.max(
      0,
      rule.reward.type === "percent"
        ? (price * rule.reward.amount) / 100
        : rule.reward.amount,
    ),
  );

const eligibleCatalogPromotions = (
  promotions: Promotion[],
  now: Date,
  matchesRule: (rule: PromotionRule) => boolean,
  includeConditional = false,
) => {
  const candidates = promotions
    .filter(
      (promotion) =>
        isAvailableForCatalog(promotion, now, includeConditional) &&
        promotion.rules.some(matchesRule),
    )
    .sort((a, b) => b.priority - a.priority || a._id.localeCompare(b._id));
  const usedGroups = new Set<string>();
  return candidates.filter((promotion) => {
    const group =
      promotion.exclusiveGroup || (promotion.combinable ? "" : "default");
    if (group && usedGroups.has(group)) return false;
    if (group) usedGroups.add(group);
    return true;
  });
};

/**
 * Category cards default to unconditional automatic product rules. POS can opt into a
 * conditional preview; add-on, line, and order rules remain visible after configuration.
 */
export const getCatalogProductPromotionPrice = ({
  productId,
  price,
  promotions,
  now = new Date(),
  includeConditional = false,
}: {
  productId: string;
  price: number;
  promotions: Promotion[];
  now?: Date;
  includeConditional?: boolean;
}) => {
  const matchesRule = (rule: PromotionRule) =>
    rule.target === "product" &&
    (!rule.productIds?.length || rule.productIds.includes(productId));
  const accepted = eligibleCatalogPromotions(
    promotions,
    now,
    matchesRule,
    includeConditional,
  );
  return accepted.reduce(
    (remaining, promotion) =>
      promotion.rules
        .filter(
          (rule) =>
            rule.target === "product" &&
            (!rule.productIds?.length || rule.productIds.includes(productId)),
        )
        .reduce(
          (value, rule) => value - productDiscountFor(value, rule),
          remaining,
        ),
    price,
  );
};

export const getCatalogAddonPromotionPrice = ({
  productId,
  addonId,
  price,
  promotions,
  now = new Date(),
}: {
  productId: string;
  addonId: string;
  price: number;
  promotions: Promotion[];
  now?: Date;
}) => {
  const matchesRule = (rule: PromotionRule) =>
    rule.target === "addon" &&
    (!rule.productIds?.length || rule.productIds.includes(productId)) &&
    (!rule.addonIds?.length || rule.addonIds.includes(addonId));
  const accepted = eligibleCatalogPromotions(promotions, now, matchesRule);
  return accepted.reduce(
    (remaining, promotion) =>
      promotion.rules
        .filter(matchesRule)
        .reduce(
          (value, rule) => value - productDiscountFor(value, rule),
          remaining,
        ),
    price,
  );
};
