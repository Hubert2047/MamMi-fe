export const isNonNegativeTwd = (value: number) =>
  Number.isSafeInteger(value) && value >= 0;

export const isValidPriceMap = (price: Record<string, number | undefined>) =>
  Object.values(price).every(
    (amount) => amount === undefined || isNonNegativeTwd(amount),
  );

export const normalizePriceMap = (price: {
  base?: number;
  uber?: number;
  foodpanda?: number;
}) => ({
  base: price.base ?? 0,
  uber: price.uber ?? 0,
  foodpanda: price.foodpanda ?? 0,
});

export const isValidPromotionAmount = (
  type: "percent" | "value",
  amount: number,
) =>
  type === "percent"
    ? Number.isFinite(amount) && amount >= 0 && amount <= 100
    : isNonNegativeTwd(amount);
