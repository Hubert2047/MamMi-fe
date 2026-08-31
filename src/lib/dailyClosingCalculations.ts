export type SalesTotal = { totalSales: number } | undefined;

export function calculateSalesTotal(
  salesData: Record<string, SalesTotal>,
): number {
  return Object.values(salesData).reduce(
    (total, item) => total + (item?.totalSales ?? 0),
    0,
  );
}

export function calculateIncomeTotal(
  salesData: Record<string, SalesTotal>,
  otherRevenues: number,
): number {
  return calculateSalesTotal(salesData) + otherRevenues;
}

export function calculateSystemAmount(
  previousClosingAmount: number,
  cashSales: number,
  otherRevenues: number,
  expenses: number,
): number {
  return previousClosingAmount + cashSales + otherRevenues - expenses;
}

export function calculateActualCash(
  cash: Record<string, string | number>,
): number {
  return Object.entries(cash).reduce(
    (total, [denomination, count]) =>
      total + Number(denomination) * Number(count || 0),
    0,
  );
}

export function calculateCashDifference(
  actualCash: number,
  systemAmount: number,
): number {
  return actualCash - systemAmount;
}

export function requiresClosingReason(
  difference: number,
  reason: string,
): boolean {
  return difference !== 0 && !reason.trim();
}
