import { describe, expect, it } from "vitest";
import {
  calculateActualCash,
  calculateCashDifference,
  calculateIncomeTotal,
  calculateSalesTotal,
  calculateSystemAmount,
  requiresClosingReason,
} from "./dailyClosingCalculations";

describe("daily closing calculations", () => {
  it("sums sales from all payment methods and treats missing values as zero", () => {
    expect(
      calculateSalesTotal({
        cash: { totalSales: 120000 },
        bank: { totalSales: 80000 },
        linepay: undefined,
      }),
    ).toBe(200000);
  });

  it("calculates the system amount from opening balance, cash sales, other revenue and expenses", () => {
    expect(calculateSystemAmount(50000, 200000, 30000, 45000)).toBe(235000);
  });

  it("includes other revenue in the displayed income total", () => {
    expect(
      calculateIncomeTotal(
        { cash: { totalSales: 120000 }, bank: { totalSales: 80000 } },
        30000,
      ),
    ).toBe(230000);
  });

  it("calculates actual cash from denomination counts", () => {
    expect(calculateActualCash({ "2000": "2", "500": 3, "100": "0" })).toBe(
      5500,
    );
  });

  it("treats blank denomination counts as zero", () => {
    expect(calculateActualCash({ "2000": "", "500": "2" })).toBe(1000);
  });

  it("returns the correct positive and negative differences", () => {
    expect(calculateCashDifference(105000, 100000)).toBe(5000);
    expect(calculateCashDifference(95000, 100000)).toBe(-5000);
  });

  it("requires a reason when there is a cash difference", () => {
    expect(requiresClosingReason(5000, "")).toBe(true);
    expect(requiresClosingReason(-5000, "   ")).toBe(true);
  });

  it("allows closing when there is no difference or a reason is provided", () => {
    expect(requiresClosingReason(0, "")).toBe(false);
    expect(requiresClosingReason(5000, "Đã kiểm tra lại tiền mặt")).toBe(false);
  });
});
