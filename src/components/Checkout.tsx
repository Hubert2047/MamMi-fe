import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group.tsx";
import {
  DEFAULT_ORDER,
  PAYMENT_METHOD_ICONS,
  type PaymentMethod,
} from "@/constants";
import { type BaseOrder, createOrder, type PricingConflictData } from "@/api/order.ts";
import React, { useMemo, useState } from "react";
import { capitalize } from "@/lib/utils.ts";
import { previewPromotions, type Promotion } from "@/api/promotion.ts";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import NumPad from "@/components/NumPad.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Loading from "@/components/Loading.tsx";
import PendingOrder from "@/components/PendingOrder.tsx";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n";
import CashDenominationInput from "@/components/CashDenominationInput";
import {
  calculateCashChange,
  calculateCashFromDenominations,
  setCashCount,
  type CashCounts,
  type CashDenomination,
} from "@/lib/cashDenominations";
import { isAxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { calculateOrderPriceBreakdown } from "@/lib/posCalculations";

type Props = {
  isPendingOrder: boolean;
  isCheckoutPendingOrder: boolean;
  currentOrderNumber: number;
  totalPrice: number;
  promotions: Promotion[];
  promotionPreview?: {
    total: number;
    appliedPromotions: NonNullable<BaseOrder["appliedPromotions"]>;
  } | null;
  onPromotionPriceChanged?(): void;
  currentOrder: BaseOrder;
  setCurrentOrder: React.Dispatch<React.SetStateAction<BaseOrder>>;
  setCurrentOrderNumber: React.Dispatch<React.SetStateAction<number>>;
  handleOpenCheckout(checkout: boolean): void;
  handlePendingOrder(open: boolean): void;
  setIsCheckoutPendingOrder: React.Dispatch<React.SetStateAction<boolean>>;
};

function Checkout({
  currentOrder,
  isPendingOrder,
  currentOrderNumber,
  isCheckoutPendingOrder,
  setCurrentOrder,
  promotions,
  promotionPreview: externalPromotionPreview,
  onPromotionPriceChanged,
  totalPrice,
  handleOpenCheckout,
  setCurrentOrderNumber,
  handlePendingOrder,
  setIsCheckoutPendingOrder,
}: Props) {
  const { locale, t } = useI18n();
  const cashGivenLabel = locale === "vi" ? "Tiền khách đưa" : t("cashGiven");
  const cashBackLabel = locale === "vi" ? "Tiền trả lại khách" : t("cashBack");
  const [isPrint, setIsPrint] = useState(!isCheckoutPendingOrder);
  const queryClient = useQueryClient();
  const [cash, setCash] = useState<number>(0);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [promotionPreview, setPromotionPreview] = useState<{
    total: number;
    appliedPromotions: NonNullable<BaseOrder["appliedPromotions"]>;
  } | null>(null);
  const [cashDenominations, setCashDenominations] = useState<CashCounts>({});
  const [selectedDenomination, setSelectedDenomination] =
    useState<CashDenomination>(100);
  const isDeferredPayment =
    currentOrder.paymentMethod === "uber" ||
    currentOrder.paymentMethod === "foodpanda";
  const displayedCash = isDeferredPayment ? totalPrice : cash;
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient
        .invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === "sale-by-payment" ||
            query.queryKey[0] === "orders" ||
            query.queryKey[0] === "next-order-number",
        })
        .then();
    },
    onError: (error) => {
      const code = isAxiosError(error) ? error.response?.data?.code : undefined;
      if (
        code === "ITEM_NOT_AVAILABLE" ||
        code === "ITEM_STORE_CONFIG_NOT_FOUND" ||
        code === "ITEM_CATALOG_NOT_FOUND" ||
        code === "ITEM_PRICE_NOT_CONFIGURED" ||
        code === "ADDON_NOT_AVAILABLE"
      ) {
        void queryClient.invalidateQueries({ queryKey: ["items"] });
      }
      if (code === "ORDER_PRICING_CHANGED" || code === "PROMOTION_PRICE_CHANGED") {
        const data = isAxiosError(error)
          ? (error.response?.data?.data as PricingConflictData | undefined)
          : undefined;
        if (data?.items && data.pricing) {
          setCurrentOrder((previous) => ({
            ...previous,
            items: data.items,
            expectedPricing: data.pricing,
          }));
          setCash(0);
          setCashDenominations({});
        }
        onPromotionPriceChanged?.();
      }
      toast.error(
        code === "ITEM_NOT_AVAILABLE"
          ? t("itemNotAvailable")
          : code === "ITEM_STORE_CONFIG_NOT_FOUND"
            ? t("itemStoreConfigNotFound")
            : code === "ITEM_CATALOG_NOT_FOUND"
              ? t("itemCatalogNotFound")
              : code === "ITEM_PRICE_NOT_CONFIGURED"
                ? t("itemPriceNotConfigured")
          : code === "ADDON_NOT_AVAILABLE"
            ? t("addonNotAvailable")
            : code === "ITEM_QUANTITY_INVALID"
              ? t("itemQuantityInvalid")
              : code === "ADDON_QUANTITY_INVALID"
                ? t("addonQuantityInvalid")
                : code === "INVALID_OPTION"
                  ? t("invalidOption")
                  : code === "INSUFFICIENT_CASH"
                    ? t("insufficientCash")
                    : code === "ORDER_PRICING_CHANGED" || code === "PROMOTION_PRICE_CHANGED"
                      ? t("promotionPriceChanged")
                      : t("createOrderFailure"),
      );
    },
  });
  const handleCreateOrder = async (status: "paid" | "pending") => {
    if (currentOrder.type === "dine_in" && !currentOrder.table?.trim()) {
      toast.error(t("tableRequired"));
      return;
    }
    if (
      status === "paid" &&
      currentOrder.paymentMethod === "cash" &&
      cash < effectiveTotal
    ) {
      toast.error(t("insufficientCash"));
      return;
    }
    if (!effectivePromotionPreview) {
      toast.error(t("loading"));
      return;
    }
    const newOrder: BaseOrder = {
      ...currentOrder,
      number: currentOrderNumber,
      status: status,
      checkoutPending: isCheckoutPendingOrder,
      printOnConfirm: isPrint,
      expectedPricing: effectivePromotionPreview,
      ...(status === "paid" && currentOrder.paymentMethod === "cash"
        ? { cashReceived: cash }
        : {}),
    };
    const nextOrder = await createOrderMutation.mutateAsync(newOrder);
    handleOpenCheckout(false);
    handlePendingOrder(false);
    setCurrentOrder(DEFAULT_ORDER);
    setCashDenominations({});
    setCurrentOrderNumber(nextOrder);
    setIsCheckoutPendingOrder(false);
    toast.success(status === "paid" ? t("paidSuccess") : t("pendingSuccess"));
  };

  React.useEffect(() => {
    if (externalPromotionPreview) return;
    let cancelled = false;
    void previewPromotions({
      items: currentOrder.items,
      selectedPromotionIds: currentOrder.selectedPromotionIds,
    })
      .then((preview) => {
        if (!cancelled) setPromotionPreview(preview);
      })
      .catch(() => {
        if (!cancelled) setPromotionPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [
    currentOrder.items,
    currentOrder.selectedPromotionIds,
    externalPromotionPreview,
  ]);
  const effectivePromotionPreview =
    externalPromotionPreview ?? promotionPreview;
  const previewOrder = {
    ...currentOrder,
    appliedPromotions: effectivePromotionPreview?.appliedPromotions ?? [],
  };
  const priceBreakdown = calculateOrderPriceBreakdown(previewOrder);
  const effectiveTotal = effectivePromotionPreview?.total ?? totalPrice;
  const cashBack = calculateCashChange(displayedCash, effectiveTotal);
  const appliedPromotions = effectivePromotionPreview?.appliedPromotions ?? [];
  const itemDiscountTotal = appliedPromotions
    .filter(
      (promotion) =>
        !promotion.targets?.length ||
        !promotion.targets.every((target) => target === "order"),
    )
    .reduce((total, promotion) => total + promotion.discountAmount, 0);
  const orderDiscountTotal = appliedPromotions
    .filter(
      (promotion) =>
        promotion.targets?.length &&
        promotion.targets.every((target) => target === "order"),
    )
    .reduce((total, promotion) => total + promotion.discountAmount, 0);
  const afterItemDiscount = Math.max(
    0,
    priceBreakdown.subtotal - itemDiscountTotal,
  );
  const allocationFor = (itemId: string) =>
    (effectivePromotionPreview?.appliedPromotions ?? [])
      .filter(
        (promotion) =>
          !promotion.targets?.length ||
          !promotion.targets.every((target) => target === "order"),
      )
      .flatMap((promotion) => promotion.allocations)
      .filter((allocation) => allocation.itemId === itemId)
      .reduce(
        (total, allocation) => ({
          product: total.product + allocation.productDiscountAmount,
          addons: [...total.addons, ...allocation.addonDiscounts],
        }),
        {
          product: 0,
          addons: [] as { addonId: string; discountAmount: number }[],
        },
      );
  const formatPrice = (value: number) => value.toLocaleString(locale);
  const promotionRuleLabel = (promotionId: string) => {
    const promotion = promotions.find((entry) => entry._id === promotionId);
    if (!promotion) return "";
    return promotion.rules
      .map((rule) => {
        const target =
          rule.target === "order"
            ? t("targetOrder")
            : rule.target === "product"
              ? t("targetProduct")
              : rule.target === "addon"
                ? t("targetAddon")
                : t("targetLine");
        const reward =
          rule.reward.type === "percent"
            ? `${rule.reward.amount}%`
            : formatPrice(rule.reward.amount);
        return `${target} ${reward}`;
      })
      .join(", ");
  };

  function onPromotionChange(value: string) {
    setCurrentOrder((prev) => ({
      ...prev,
      selectedPromotionIds: value ? [value] : [],
    }));
  }

  const paymentMethods = useMemo(() => {
    if (currentOrder.type === "dine_in" || currentOrder.type === "takeaway")
      return ["cash", "bank", "linepay"];
    if (currentOrder.type === "uber") return ["uber"];
    if (currentOrder.type === "foodpanda") return ["foodpanda"];
    return [];
  }, [currentOrder.type]);

  return (
    <div className="flex h-full min-h-0 flex-1 gap-2 overflow-hidden">
      {isPendingOrder ? (
        <PendingOrder
          isPrint={isPrint}
          setIsPrint={setIsPrint}
          currentOrder={currentOrder}
          setCurrentOrder={setCurrentOrder}
          handleCreateOrder={handleCreateOrder}
        />
      ) : (
        <>
          <div className="discounts md:w-30 border border-[#ccc] rounded p-2">
            <p className="text-xl">{t("discount")}</p>
            <div className="flex justify-center pt-6">
              <ToggleGroup
                type="single"
                size="lg"
                variant="outline"
                className="flex flex-col gap-2"
                value={currentOrder.selectedPromotionIds?.[0] ?? ""}
                onValueChange={(value: string) => onPromotionChange(value)}
              >
                {promotions
                  .filter((promotion) => promotion.mode === "manual")
                  .map((promotion) => (
                    <ToggleGroupItem
                      key={promotion._id}
                      value={promotion._id}
                      className="flex min-w-24 max-w-full items-center justify-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-primary/10 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <div className="flex flex-col">
                        <span>
                          {" "}
                          {promotion.rules
                            .map((rule) =>
                              rule.reward.type === "percent"
                                ? `${rule.reward.amount}%`
                                : rule.reward.amount,
                            )
                            .join(", ")}
                        </span>
                        <span className="text-[10px]">{promotion.name}</span>
                      </div>
                    </ToggleGroupItem>
                  ))}
              </ToggleGroup>
            </div>
          </div>
          <div className="payment-method h-full min-h-0 flex-1 space-y-2 overflow-y-auto rounded border border-[#ccc] p-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <p className="text-xl">{t("paymentMethodTitle")}</p>
              <Button
                variant="outline"
                onClick={() => setIsBreakdownOpen(true)}
              >
                {t("detail")}
              </Button>
            </div>
            <div className="flex justify-start items-center gap-4 pt-6 pl-2">
              <ToggleGroup
                size="lg"
                variant="outline"
                type="single"
                className="w-max"
                value={currentOrder.paymentMethod}
                onValueChange={(value: PaymentMethod) => {
                  setCurrentOrder((prev) => ({
                    ...prev,
                    paymentMethod: value,
                  }));
                  if (value === "uber" || value === "foodpanda") {
                    setCash(totalPrice);
                    setCashDenominations({});
                  } else {
                    setCash(0);
                    setCashDenominations({});
                  }
                }}
              >
                {paymentMethods.map((method) => (
                  <ToggleGroupItem
                    key={method}
                    className="flex w-max items-center justify-center rounded-md border-primary/40 transition-colors hover:bg-primary/10 data-[state=on]:!border-primary data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground"
                    value={method}
                  >
                    <span>
                      {
                        PAYMENT_METHOD_ICONS[
                          method as
                            "cash" | "uber" | "linepay" | "bank" | "foodpanda"
                        ]
                      }
                    </span>
                    <span className="w-max">{capitalize(method)}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="flex flex-nowrap items-center gap-2 pt-2 pl-2">
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <Label className="block shrink-0 text-xs font-semibold">
                  {cashGivenLabel}:
                </Label>
                <Input
                  id="cash-given"
                  value={displayedCash.toLocaleString()}
                  className="w-24 shrink-0 text-lg font-bold tabular-nums"
                  readOnly={isDeferredPayment}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/,/g, "");
                    setCash(Number(rawValue));
                    setCashDenominations({});
                  }}
                />
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <Label className="block shrink-0 text-xs font-semibold">
                  {cashBackLabel}:
                </Label>
                <Input
                  id="cash-back"
                  value={cashBack.toLocaleString()}
                  className="w-24 shrink-0 text-lg font-bold tabular-nums"
                  disabled
                />
              </div>
            </div>
            {currentOrder.paymentMethod === "cash" && (
              <div className="flex items-start gap-1 pt-1">
                <div className="min-w-0 flex-1">
                  <CashDenominationInput
                    counts={cashDenominations}
                    selectedDenomination={selectedDenomination}
                    onSelect={setSelectedDenomination}
                    onChange={(counts) => {
                      setCashDenominations(counts);
                      setCash(calculateCashFromDenominations(counts));
                    }}
                    onClear={() => {
                      setCashDenominations({});
                      setCash(0);
                    }}
                  />
                </div>
                <NumPad
                  currentValue={(
                    cashDenominations[selectedDenomination] ?? 0
                  ).toString()}
                  resetKey={selectedDenomination}
                  onChange={(num) => {
                    const counts = setCashCount(
                      cashDenominations,
                      selectedDenomination,
                      Number(num),
                    );
                    setCashDenominations(counts);
                    setCash(calculateCashFromDenominations(counts));
                  }}
                />
              </div>
            )}
            {/* print option */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pl-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="print-confirm"
                  checked={isPrint}
                  onCheckedChange={(checked) => setIsPrint(!!checked)}
                />
                <Label htmlFor="print-confirm">{t("printOnConfirm")}</Label>
              </div>
              <div className="flex shrink-0 justify-end gap-3">
                <Button
                  variant="default"
                  size="lg"
                  className="h-12 min-w-28 bg-primary px-5 text-base text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleCreateOrder("paid")}
                >
                  {t("pay")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 min-w-24 px-5 text-base"
                  onClick={() => handleOpenCheckout(false)}
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
      {createOrderMutation.isPending && <Loading />}
      <Dialog open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
        <DialogContent className="left-0 top-0 flex h-dvh min-h-0 max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-none">
          <DialogHeader className="items-center border-b px-6 py-5 pr-14 text-center">
            <DialogTitle className="capitalize">
              {t("checkoutBreakdown")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="h-full min-h-0 overflow-y-auto pr-2">
              <div className="space-y-3">
                {currentOrder.items.map((item, index) => {
                  const allocation = allocationFor(item.id);
                  const productOriginal = item.basePrice * item.quantity;
                  const addonOriginal = item.addons.reduce(
                    (total, addon) =>
                      total + addon.priceExtra * addon.amount * item.quantity,
                    0,
                  );
                  const itemOriginal = productOriginal + addonOriginal;
                  const addonDiscount = item.addons.reduce(
                    (total, addon) =>
                      total +
                      allocation.addons
                        .filter((entry) => entry.addonId === addon.id)
                        .reduce(
                          (addonTotal, entry) =>
                            addonTotal + entry.discountAmount,
                          0,
                        ),
                    0,
                  );
                  const itemDiscount = allocation.product + addonDiscount;
                  return (
                    <div
                      key={`${item.id}-${index}`}
                      className="border-b py-3 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium">
                            {item.name} x {item.quantity}
                          </p>
                          <p className="text-sm">
                            <span className="capitalize text-muted-foreground">
                              {t("productSubtotal")}:
                            </span>{" "}
                            <span
                              className={
                                allocation.product > 0 ? "line-through" : ""
                              }
                            >
                              {formatPrice(productOriginal)}
                            </span>
                            {allocation.product > 0 ? (
                              <span className="ml-2 text-destructive">
                                →{" "}
                                {formatPrice(
                                  productOriginal - allocation.product,
                                )}
                              </span>
                            ) : null}
                          </p>
                          {addonOriginal > 0 && (
                            <p className="text-sm">
                              <span className="capitalize text-muted-foreground">
                                {t("addonSubtotal")}:
                              </span>{" "}
                              <span
                                className={
                                  addonDiscount > 0 ? "line-through" : ""
                                }
                              >
                                {formatPrice(addonOriginal)}
                              </span>
                              {addonDiscount > 0 ? (
                                <span className="ml-2 text-destructive">
                                  → {formatPrice(addonOriginal - addonDiscount)}
                                </span>
                              ) : null}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs capitalize text-muted-foreground">
                            {t("subtotal")}
                          </span>
                          <p className="font-medium tabular-nums">
                            {formatPrice(itemOriginal - itemDiscount)}
                          </p>
                        </div>
                      </div>
                      {item.addonDisplayMode !== "merged" &&
                        item.addons.length > 0 && (
                          <div className="mt-2 space-y-1 pl-3 text-sm text-muted-foreground">
                            {item.addons.map((addon) => {
                              const original =
                                addon.priceExtra * addon.amount * item.quantity;
                              const discount = allocation.addons
                                .filter((entry) => entry.addonId === addon.id)
                                .reduce(
                                  (total, entry) =>
                                    total + entry.discountAmount,
                                  0,
                                );
                              return (
                                <p key={addon.id}>
                                  + {addon.name}:{" "}
                                  <span
                                    className={discount ? "line-through" : ""}
                                  >
                                    {formatPrice(original)}
                                  </span>
                                  {discount ? (
                                    <span className="ml-2 text-destructive">
                                      → {formatPrice(original - discount)}
                                    </span>
                                  ) : null}
                                </p>
                              );
                            })}
                          </div>
                        )}
                      {(allocation.product > 0 || addonDiscount > 0) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {allocation.product > 0 && (
                            <span className="inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                              {t("discount")} {t("targetProduct")}: -
                              {formatPrice(allocation.product)}
                            </span>
                          )}
                          {addonDiscount > 0 && (
                            <span className="inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                              {t("discount")} {t("targetAddon")}: -
                              {formatPrice(addonDiscount)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
            <aside className="h-fit rounded-lg border p-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between gap-4">
                  <span className="capitalize">{t("productSubtotal")}</span>
                  <span>{formatPrice(priceBreakdown.productSubtotal)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="capitalize">{t("addonSubtotal")}</span>
                  <span>{formatPrice(priceBreakdown.addonSubtotal)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t pt-3">
                  <span className="capitalize">{t("subtotal")}</span>
                  <span>{formatPrice(priceBreakdown.subtotal)}</span>
                </div>
                {itemDiscountTotal > 0 && (
                  <div className="flex justify-between gap-4 text-destructive">
                    <span>{t("itemDiscountTotal")}</span>
                    <span>-{formatPrice(itemDiscountTotal)}</span>
                  </div>
                )}
                {itemDiscountTotal > 0 && (
                  <div className="flex justify-between gap-4 border-t pt-3">
                    <span>{t("afterItemDiscount")}</span>
                    <span>{formatPrice(afterItemDiscount)}</span>
                  </div>
                )}
                {orderDiscountTotal > 0
                  ? appliedPromotions
                      .filter(
                        (promotion) =>
                          promotion.targets?.length &&
                          promotion.targets.every(
                            (target) => target === "order",
                          ),
                      )
                      .map((promotion) => (
                        <div
                          key={promotion.promotionId}
                          className="flex justify-between gap-4 text-destructive"
                        >
                          <span>
                            {t("orderDiscount")}: {promotion.name}
                            {promotionRuleLabel(promotion.promotionId)
                              ? ` (${promotionRuleLabel(promotion.promotionId)})`
                              : ""}
                          </span>
                          <span>-{formatPrice(promotion.discountAmount)}</span>
                        </div>
                      ))
                  : null}
                {!itemDiscountTotal && !orderDiscountTotal && (
                  <p className="text-muted-foreground">
                    {t("noDiscountApplied")}
                  </p>
                )}
                <div className="flex justify-between gap-4 border-t pt-3 text-lg font-bold">
                  <span className="capitalize">{t("amountDue")}</span>
                  <span>{formatPrice(priceBreakdown.total)}</span>
                </div>
              </div>
            </aside>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Checkout;
