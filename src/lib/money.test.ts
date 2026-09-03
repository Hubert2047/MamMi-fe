import { describe, expect, it } from "vitest";
import {
  isNonNegativeTwd,
  isValidPromotionAmount,
  normalizePriceMap,
} from "./money";

describe("money input validation", () => {
  it("rejects negative and decimal TWD values", () => {
    expect(isNonNegativeTwd(10)).toBe(true);
    expect(isNonNegativeTwd(-1)).toBe(false);
    expect(isNonNegativeTwd(10.5)).toBe(false);
  });

  it("allows decimal percentages but not decimal fixed discounts", () => {
    expect(isValidPromotionAmount("percent", 12.5)).toBe(true);
    expect(isValidPromotionAmount("value", 12.5)).toBe(false);
  });

  it("fills missing store prices with explicit zero values", () => {
    expect(normalizePriceMap({})).toEqual({ base: 0, uber: 0, foodpanda: 0 });
    expect(normalizePriceMap({ base: 0 })).toEqual({
      base: 0,
      uber: 0,
      foodpanda: 0,
    });
  });
});
