import { describe, expect, it } from "vitest";
import type { OrderItem } from "./order";
import type { Promotion } from "./promotion";
import { calculatePromotionPreview } from "./promotion";

const items = [
  {
    id: "tea",
    itemId: "line-1",
    basePrice: 60,
    quantity: 2,
    addons: [
      { id: "boba", amount: 1, priceExtra: 20 },
      { id: "pudding", amount: 1, priceExtra: 30 },
    ],
  },
] as OrderItem[];

const promotion = (overrides: Partial<Promotion>): Promotion => ({
  _id: "promotion",
  names: { vi: "Promotion", en: "Promotion", "zh-TW": "Promotion" },
  name: "Promotion",
  mode: "automatic",
  priority: 1,
  combinable: true,
  exclusiveGroup: "",
  rules: [],
  status: "active",
  version: 1,
  startsAt: null,
  endsAt: null,
  enabled: true,
  assigned: true,
  assignedStoreIds: [],
  ...overrides,
});

describe("POS promotion preview", () => {
  it("matches backend product and add-on pricing stages", () => {
    const result = calculatePromotionPreview({
      items,
      promotions: [
        promotion({
          rules: [
            {
              target: "product",
              productIds: ["tea"],
              reward: { type: "percent", amount: 10 },
            },
            {
              target: "addon",
              addonIds: ["boba"],
              reward: { type: "value", amount: 10 },
            },
          ],
        }),
      ],
    });
    expect(result.total).toBe(188);
    expect(result.appliedPromotions[0]?.discountAmount).toBe(32);
  });

  it("respects minimum subtotal before applying an order promotion", () => {
    const orderPromotion = promotion({
      minSubtotal: 200,
      rules: [{ target: "order", reward: { type: "value", amount: 50 } }],
    });
    expect(
      calculatePromotionPreview({ items, promotions: [orderPromotion] }).total,
    ).toBe(170);
    expect(
      calculatePromotionPreview({
        items,
        promotions: [{ ...orderPromotion, minSubtotal: 300 }],
      }).total,
    ).toBe(220);
  });

  it("marks whole-order discounts so the POS does not display them on the first item", () => {
    const result = calculatePromotionPreview({
      items,
      promotions: [
        promotion({
          rules: [{ target: "order", reward: { type: "value", amount: 50 } }],
        }),
      ],
    });
    expect(result.appliedPromotions[0]?.targets).toEqual(["order"]);
    expect(
      result.appliedPromotions[0]?.allocations[0]?.productDiscountAmount,
    ).toBe(50);
  });

  it("keeps only the highest-priority automatic whole-order promotion", () => {
    const result = calculatePromotionPreview({
      items,
      promotions: [
        promotion({
          _id: "low",
          priority: 1,
          rules: [{ target: "order", reward: { type: "value", amount: 20 } }],
        }),
        promotion({
          _id: "high",
          priority: 2,
          rules: [{ target: "order", reward: { type: "value", amount: 40 } }],
        }),
      ],
    });
    expect(result.appliedPromotions.map((entry) => entry.promotionId)).toEqual([
      "high",
    ]);
    expect(result.total).toBe(180);
  });
});
