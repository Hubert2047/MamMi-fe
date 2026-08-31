export const CASH_DENOMINATIONS = [
  1, 5, 10, 50, 100, 200, 500, 1000, 2000,
] as const;

export type CashDenomination = (typeof CASH_DENOMINATIONS)[number];
export type CashCounts = Partial<Record<CashDenomination, number>>;

export function calculateCashFromDenominations(counts: CashCounts): number {
  return CASH_DENOMINATIONS.reduce(
    (total, denomination) =>
      total + denomination * Math.max(0, Math.floor(counts[denomination] ?? 0)),
    0,
  );
}

export function updateCashCount(
  counts: CashCounts,
  denomination: CashDenomination,
  delta: number,
): CashCounts {
  const nextCount = Math.max(
    0,
    Math.floor((counts[denomination] ?? 0) + delta),
  );
  return { ...counts, [denomination]: nextCount };
}

export function setCashCount(
  counts: CashCounts,
  denomination: CashDenomination,
  quantity: number,
): CashCounts {
  return {
    ...counts,
    [denomination]: Math.max(
      0,
      Math.floor(Number.isFinite(quantity) ? quantity : 0),
    ),
  };
}

export function calculateCashChange(cashGiven: number, total: number): number {
  return Math.max(0, cashGiven - total);
}

export function isCashSufficient(cashGiven: number, total: number): boolean {
  return cashGiven >= total;
}
