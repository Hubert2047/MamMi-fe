import { describe, expect, it } from "vitest";
import {
  calculateCashChange,
  calculateCashFromDenominations,
  isCashSufficient,
} from "./cashDenominations";
import { calculateOrderTotal } from "./posCalculations";

const orderItem = {
  id: "item-1",
  itemId: "item-1",
  name: "Item",
  quantity: 2,
  basePrice: 100,
  variant: "",
  noteOptions: [],
  note: "",
  addons: [{ id: "addon-1", name: "Addon", amount: 1, priceExtra: 20 }],
};

describe("checkout total and cash change", () => {
  it("uses the discounted total when calculating change", () => {
    const total = calculateOrderTotal({
      items: [orderItem],
      appliedPromotions: [
        {
          promotionId: "ten",
          promotionVersion: 1,
          name: "10%",
          mode: "manual",
          discountAmount: 24,
          allocations: [],
        },
      ],
    });

    expect(total).toBe(216);
    expect(isCashSufficient(500, total)).toBe(true);
    expect(calculateCashChange(500, total)).toBe(284);
  });

  it("applies a fixed discount before calculating change", () => {
    const total = calculateOrderTotal({
      items: [orderItem],
      appliedPromotions: [
        {
          promotionId: "fifty",
          promotionVersion: 1,
          name: "50 off",
          mode: "manual",
          discountAmount: 50,
          allocations: [],
        },
      ],
    });

    expect(total).toBe(190);
    expect(calculateCashChange(200, total)).toBe(10);
  });

  it("supports cash entered by denomination counts", () => {
    const total = calculateOrderTotal({
      items: [orderItem],
      appliedPromotions: [
        {
          promotionId: "ten",
          promotionVersion: 1,
          name: "10%",
          mode: "manual",
          discountAmount: 24,
          allocations: [],
        },
      ],
    });
    const cashGiven = calculateCashFromDenominations({ 100: 3 });

    expect(cashGiven).toBe(300);
    expect(calculateCashChange(cashGiven, total)).toBe(84);
  });

  it("does not allow an excessive discount to produce a negative total", () => {
    const total = calculateOrderTotal({
      items: [orderItem],
      appliedPromotions: [
        {
          promotionId: "free",
          promotionVersion: 1,
          name: "Free",
          mode: "manual",
          discountAmount: 999,
          allocations: [],
        },
      ],
    });

    expect(total).toBe(0);
    expect(calculateCashChange(50, total)).toBe(50);
  });

  it("does not return change when the customer has not paid enough", () => {
    const total = calculateOrderTotal({
      items: [orderItem],
      appliedPromotions: [],
    });

    expect(total).toBe(240);
    expect(isCashSufficient(239, total)).toBe(false);
    expect(calculateCashChange(239, total)).toBe(0);
  });
});
