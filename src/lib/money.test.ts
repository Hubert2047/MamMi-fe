import { describe, expect, it } from "vitest";
import { isNonNegativeTwd, isValidPromotionAmount } from "./money";

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
});
