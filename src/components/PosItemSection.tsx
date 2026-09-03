import { Button } from "@/components/ui/button.tsx";
import type { Item } from "@/api/item.ts";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group.tsx";

const MAX_NOTE_LENGTH = 40;
import NumPad from "@/components/NumPad.tsx";
import React from "react";
import { type BaseOrder, type OrderItem } from "@/api/order.ts";
import { DEFAULT_ORDER_ITEM } from "@/constants";
import { generateUUID, getPriceByType } from "@/lib/utils.ts";
import { toast } from "sonner";

import { useI18n } from "@/lib/i18n";
import {
  calculateOrderItemTotal,
  getUnavailableAddonIds,
} from "@/lib/posCalculations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  getCatalogAddonPromotionPrice,
  getCatalogProductPromotionPrice,
  type Promotion,
} from "@/api/promotion";

type Props = {
  isDetail: boolean;
  isOrderEditing: boolean;
  currentOrder: BaseOrder;
  currentOrderNumber: number;
  promotions: Promotion[];
  itemsByCategory: Record<string, Item[]>;
  selectedCategory: string;
  selectedItem: Item | null;
  filteredItems: Item[];
  currentOrderItem: OrderItem;
  isEditItem: boolean;
  setCurrentOrderItem: React.Dispatch<React.SetStateAction<OrderItem>>;
  setCurrentOrder: React.Dispatch<React.SetStateAction<BaseOrder>>;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  setSelectedItem: React.Dispatch<React.SetStateAction<Item | null>>;
  setIsEditItem: React.Dispatch<React.SetStateAction<boolean>>;
  promotionInfoOpen: boolean;
  setPromotionInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

function PosItemSection({
  isDetail,
  isOrderEditing,
  currentOrder,
  itemsByCategory,
  selectedCategory,
  selectedItem,
  setSelectedCategory,
  filteredItems,
  isEditItem,
  currentOrderItem,
  setCurrentOrderItem,
  setCurrentOrder,
  setSelectedItem,
  setIsEditItem,
  promotionInfoOpen,
  setPromotionInfoOpen,
  currentOrderNumber,
  promotions,
}: Props) {
  const { locale, t } = useI18n();
  const optionName = (option: {
    names: { vi: string; en: string; "zh-TW": string };
  }) =>
    option.names[locale] ||
    option.names.vi ||
    option.names.en ||
    option.names["zh-TW"];
  const catalogItems = Object.values(itemsByCategory).flat();
  const catalogAddons = catalogItems.flatMap((item) => item.addons);
  const visiblePromotions = promotions.filter((promotion) => {
    const now = new Date();
    return (
      promotion.mode === "automatic" &&
      (!promotion.startsAt || new Date(promotion.startsAt) <= now) &&
      (!promotion.endsAt || new Date(promotion.endsAt) >= now)
    );
  });
  const labelsFor = (
    ids: string[] | undefined,
    entries: Array<{ _id: string; name: string }>,
    allLabel: string,
  ) =>
    !ids?.length
      ? allLabel
      : ids
          .map((id) => entries.find((entry) => entry._id === id)?.name || id)
          .join(", ");
  const targetLabel = (target: Promotion["rules"][number]["target"]) =>
    target === "order"
      ? t("targetOrder")
      : target === "product"
        ? t("targetProduct")
        : target === "addon"
          ? t("targetAddon")
          : t("targetLine");
  const formatPromotionDate = (value?: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale === "zh-TW" ? "zh-TW" : locale, {
          dateStyle: "short",
          timeStyle: "short",
          hourCycle: "h23",
        }).format(new Date(value))
      : "—";
  const selectedItemPrice = calculateOrderItemTotal(currentOrderItem);
  const selectedItemOriginalPrice = selectedItem
    ? getPriceByType(currentOrder.type, selectedItem.price)
    : 0;
  const selectedItemPromotionPrice = selectedItem
    ? getCatalogProductPromotionPrice({
        productId: selectedItem._id,
        price: selectedItemOriginalPrice,
        promotions,
        includeConditional: true,
      })
    : 0;
  const selectedItemAddonPromotionTotal = selectedItem
    ? currentOrderItem.addons.reduce(
        (total, addon) =>
          total +
          addon.amount *
            getCatalogAddonPromotionPrice({
              productId: selectedItem._id,
              addonId: addon.id,
              price: addon.priceExtra,
              promotions,
            }) *
            currentOrderItem.quantity,
        0,
      )
    : 0;
  const selectedItemPromotionTotal = selectedItem
    ? selectedItemPromotionPrice * currentOrderItem.quantity +
      selectedItemAddonPromotionTotal
    : 0;
  const unavailableAddonIds = selectedItem
    ? getUnavailableAddonIds(
        selectedItem,
        currentOrderItem.addons.map((addon) => addon.id),
      )
    : [];
  const selectionUnavailable =
    selectedItem?.temporarilyUnavailable === true ||
    unavailableAddonIds.length > 0;
  const isReadOnly = isDetail && !isOrderEditing;
  const numericAddonValue = (addon: Item["addons"][number]) => {
    const match = addon.name.trim().match(/^\+?\s*(\d+(?:\.\d+)?)$/);
    return match ? Number(match[1]) : null;
  };
  const displayedAddons = selectedItem
    ? (() => {
        const numericAddons = selectedItem.addons
          .filter((addon) => numericAddonValue(addon) !== null)
          .sort(
            (left, right) =>
              numericAddonValue(left)! - numericAddonValue(right)!,
          );
        let numericIndex = 0;
        return selectedItem.addons.map((addon) =>
          numericAddonValue(addon) === null
            ? addon
            : numericAddons[numericIndex++]!,
        );
      })()
    : [];
  const displayItemName = (item: Item) => {
    const name = item.name.trim();
    const category = item.categoryName.trim();
    if (
      !category ||
      name.localeCompare(category, undefined, { sensitivity: "accent" }) === 0
    )
      return name;
    const prefix = new RegExp(
      `^${category.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?:\\s*[-:|–—]\\s*|\\s+)`,
      "i",
    );
    return name.replace(prefix, "").trim() || name;
  };
  const selectItem = (item: Item) => {
    let variant = "";
    if (item.variants.length > 0) {
      variant = item.variants[0]?.id || "";
    }
    const optionSelections = (item.optionGroups || []).flatMap((group) => {
      const defaultId =
        group.defaultOptionId ||
        (group.required ? group.options[0]?.id : undefined);
      return defaultId ? [{ groupId: group.id, optionId: defaultId }] : [];
    });
    setCurrentOrderItem((prev) => ({
      ...prev,
      id: item._id,
      itemId: generateUUID(),
      number: currentOrderNumber,
      name: item.name,
      addonDisplayMode: item.addonDisplayMode === "merged" ? "merged" : "named",
      variant,
      optionSelections,
      basePrice: getPriceByType(currentOrder.type, item.price),
      addons: item.type === "combo" ? [] : prev.addons,
      componentSelections:
        item.type === "combo"
          ? (item.components || []).flatMap((component, index) => {
              const componentItem = catalogItems.find(
                (candidate) => candidate._id === component.itemId,
              );
              return Array.from(
                { length: component.quantity },
                (_, instance) => ({
                  componentId: `${component.itemId}-${index}-${instance}`,
                  itemId: component.itemId,
                  noteOptions: [],
                  note: "",
                  name: componentItem?.name || component.itemId,
                }),
              );
            })
          : [],
    }));
    setSelectedItem(item);
  };
  const setAddonAmount = (addon: Item["addons"][number], amount: number) => {
    if (isReadOnly) return;
    setCurrentOrderItem((prev) => {
      const existing = prev.addons.find((entry) => entry.id === addon._id);
      if (amount <= 0)
        return {
          ...prev,
          addons: prev.addons.filter((entry) => entry.id !== addon._id),
        };
      if (addon.temporarilyUnavailable === true && !existing) return prev;
      const maxQuantity = addon.maxQuantity ?? null;
      const nextAmount =
        maxQuantity === null ? amount : Math.min(amount, maxQuantity);
      const nextAddon = existing
        ? { ...existing, amount: nextAmount }
        : { ...addon, id: addon._id, amount: nextAmount };
      return {
        ...prev,
        addons: [
          ...prev.addons.filter((entry) => entry.id !== addon._id),
          nextAddon,
        ],
      };
    });
  };
  const addItem = () => {
    if (selectionUnavailable) {
      toast.error(t("selectionUnavailable"));
      return;
    }
    setCurrentOrder((prev) => ({
      ...prev,
      items: [...prev.items, currentOrderItem],
    }));
    setCurrentOrderItem(DEFAULT_ORDER_ITEM);
    setSelectedItem(null);
    setIsEditItem(false);
  };
  const cancelAddItem = () => {
    // Hủy ở cấp món chỉ thoát khỏi màn hình cấu hình món hiện tại.
    // Khi đang cập nhật đơn, vẫn giữ trạng thái sửa đơn để người dùng
    // có thể chọn thêm một món khác ngay lập tức.
    setCurrentOrderItem(DEFAULT_ORDER_ITEM);
    setSelectedItem(null);
    setIsEditItem(false);
  };
  const updateItem = () => {
    if (selectionUnavailable) {
      toast.error(t("selectionUnavailable"));
      return;
    }
    setCurrentOrder((prev) => {
      const items = prev.items.map((i) => {
        if (i.itemId === currentOrderItem.itemId) return currentOrderItem;
        return i;
      });
      return { ...prev, items };
    });
    setCurrentOrderItem(DEFAULT_ORDER_ITEM);
    setSelectedItem(null);
    setIsEditItem(false);
  };
  const deleteItem = () => {
    setCurrentOrder((prev) => {
      const items = prev.items.filter((i) => {
        return i.itemId !== currentOrderItem.itemId;
      });
      return { ...prev, items };
    });
    setCurrentOrderItem(DEFAULT_ORDER_ITEM);
    setSelectedItem(null);
    setIsEditItem(false);
  };

  return (
    <>
      <Dialog open={promotionInfoOpen} onOpenChange={setPromotionInfoOpen}>
        <DialogContent className="top-[8%] max-h-[88dvh] w-[min(94vw,40rem)] max-w-none translate-y-0 overflow-y-auto sm:max-w-none">
          <div className="space-y-4">
            <DialogTitle className="text-xl">{t("promotions")}</DialogTitle>
            {visiblePromotions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("emptyPromotions")}
              </p>
            ) : (
              visiblePromotions.map((promotion) => (
                <div className="rounded-lg border p-3" key={promotion._id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold">
                        {promotion.names[locale] || promotion.name}
                      </p>
                      {promotion.minSubtotal !== undefined &&
                      promotion.minSubtotal > 0 ? (
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {t("minSubtotal")}:{" "}
                          {promotion.minSubtotal.toLocaleString(locale)}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>
                        {t("startsAt")}:{" "}
                        {formatPromotionDate(promotion.startsAt)}
                        <br />
                        {t("endsAt")}: {formatPromotionDate(promotion.endsAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {promotion.rules.map((rule, index) => (
                      <div
                        className="rounded-md bg-muted/50 px-2.5 py-2 text-sm"
                        key={index}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">
                            {targetLabel(rule.target)}
                          </span>
                          <span className="font-semibold text-primary">
                            -
                            {rule.reward.type === "percent"
                              ? `${rule.reward.amount}%`
                              : rule.reward.amount}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {rule.target === "order"
                            ? t("promotionPreviewOrderScope")
                            : rule.target === "addon"
                              ? labelsFor(
                                  rule.addonIds,
                                  catalogAddons,
                                  t("promotionPreviewAllAddons"),
                                )
                              : labelsFor(
                                  rule.productIds,
                                  catalogItems,
                                  t("promotionPreviewAllProducts"),
                                )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      <div className="categories flex w-26 flex-col gap-2 rounded border border-[#ccc] p-1">
        {!isReadOnly &&
          Object.keys(itemsByCategory).map((categoryName) => {
            return (
              <Button
                key={categoryName}
                className="h-10"
                variant={
                  categoryName === selectedCategory ? "default" : "outline"
                }
                onClick={() => {
                  if (selectedItem) {
                    toast.error(t("cancelPosItemBeforeCategory"));
                    return;
                  }
                  setSelectedCategory(categoryName);
                }}
              >
                {categoryName}
              </Button>
            );
          })}
      </div>
      <div className="select-items flex h-full w-50 flex-1 flex-wrap items-start justify-start gap-2 rounded border border-[#ccc] p-1">
        {selectedItem === null ? (
          <div className="w-full">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
              {filteredItems.map((item) => (
                <Button
                  key={item._id}
                  className="h-auto min-h-18 w-full px-2 py-1.5"
                  variant="default"
                  disabled={item.temporarilyUnavailable === true}
                  onClick={() => selectItem(item)}
                >
                  <div className="flex min-w-0 w-full justify-center items-center flex-col gap-1">
                    <span className="w-full truncate text-sm" title={item.name}>
                      {displayItemName(item)}
                    </span>
                    {item.temporarilyUnavailable ? (
                      <span>{t("temporaryUnavailableShort")}</span>
                    ) : (
                      (() => {
                        const originalPrice = getPriceByType(
                          currentOrder.type,
                          item.price,
                        );
                        const promotionPrice = getCatalogProductPromotionPrice({
                          productId: item._id,
                          price: originalPrice,
                          promotions,
                          includeConditional: true,
                        });
                        return promotionPrice < originalPrice ? (
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-[11px] text-primary-foreground/70">
                              {t("originalPrice")}:{" "}
                              <span className="line-through">
                                {originalPrice.toLocaleString(locale)}
                              </span>
                            </span>
                            <span className="mt-0.5 text-base font-bold text-primary-foreground">
                              {t("price")}:{" "}
                              {promotionPrice.toLocaleString(locale)}
                            </span>
                          </div>
                        ) : (
                          <span>
                            {t("price")}: {originalPrice.toLocaleString(locale)}
                          </span>
                        );
                      })()
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
              <div className="border-b pb-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {t(isEditItem ? "posEditItem" : "posAddItem")}
                </div>
                <div className="mt-1 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p
                    className="min-w-0 flex-1 truncate text-xl"
                    title={currentOrderItem.name}
                  >
                    {currentOrderItem.name}
                  </p>
                  <div className="shrink-0 text-right text-sm">
                    {selectedItemPromotionTotal < selectedItemPrice ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {t("originalPrice")}:{" "}
                          <span className="line-through">
                            {selectedItemPrice.toLocaleString(locale)}
                          </span>
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {t("price")}:{" "}
                          {selectedItemPromotionTotal.toLocaleString(locale)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        {t("price")}: {selectedItemPrice.toLocaleString(locale)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {selectionUnavailable && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {t("selectionUnavailable")}
                </div>
              )}
              <div className="variant flex justify-start items-center gap-4">
                <Label className="block w-27 font-semibold text-start">
                  {t("quantity")}:
                </Label>
                <Input
                  id="amount"
                  disabled={isReadOnly}
                  value={currentOrderItem.quantity}
                  onChange={(e) => {
                    setCurrentOrderItem((prev) => ({
                      ...prev,
                      quantity: Number(e.target.value),
                    }));
                  }}
                />
              </div>
              {/* variants */}
              {selectedItem.variants.length > 0 && (
                <div className="variants flex justify-start items-center gap-4">
                  <Label className="block w-27 font-semibold text-start">
                    {t("variant")}:
                  </Label>
                  <RadioGroup
                    value={
                      selectedItem.variants.find(
                        (option) =>
                          option.id === currentOrderItem.variant ||
                          optionName(option) === currentOrderItem.variant,
                      )?.id || currentOrderItem.variant
                    }
                    onValueChange={(value) => {
                      if (isReadOnly) return;
                      setCurrentOrderItem((prev) => ({
                        ...prev,
                        variant: value,
                      }));
                    }}
                    className="flex gap-4"
                  >
                    {selectedItem.variants?.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem value={variant.id} id={variant.id} />
                        <Label htmlFor={variant.id}>
                          {optionName(variant)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
              {(selectedItem.optionGroups || []).map((group) => {
                const selected = (currentOrderItem.optionSelections || [])
                  .filter((entry) => entry.groupId === group.id)
                  .map((entry) => entry.optionId);
                const setGroupSelection = (values: string[]) => {
                  if (isReadOnly) return;
                  setCurrentOrderItem((prev) => ({
                    ...prev,
                    optionSelections: [
                      ...(prev.optionSelections || []).filter(
                        (entry) => entry.groupId !== group.id,
                      ),
                      ...values.map((optionId) => ({
                        groupId: group.id,
                        optionId,
                      })),
                    ],
                  }));
                };
                return (
                  <div
                    key={group.id}
                    className="option-group flex items-center gap-4"
                  >
                    <Label className="block w-27 shrink-0 text-start font-semibold">
                      {optionName(group)}:
                    </Label>
                    {group.selection === "single" ? (
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        spacing={0}
                        className="w-full flex-wrap"
                        value={selected[0] || ""}
                        onValueChange={(value) =>
                          setGroupSelection(value ? [value] : [])
                        }
                      >
                        {group.options.map((option) => (
                          <ToggleGroupItem
                            key={option.id}
                            value={option.id}
                            className="h-auto min-h-8 whitespace-normal px-2 py-1 text-sm data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                          >
                            {optionName(option)}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    ) : (
                      <ToggleGroup
                        type="multiple"
                        variant="outline"
                        spacing={0}
                        className="w-full flex-wrap"
                        value={selected}
                        onValueChange={(value) => setGroupSelection(value)}
                      >
                        {group.options.map((option) => (
                          <ToggleGroupItem
                            key={option.id}
                            value={option.id}
                            className="h-auto min-h-8 whitespace-normal px-2 py-1 text-sm data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                          >
                            {optionName(option)}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    )}
                  </div>
                );
              })}
              {/* note options */}
              {selectedItem.noteOptions.length > 0 && (
                <div className="note-options flex justify-start items-center gap-4">
                  <Label className="block w-22 font-semibold text-start">
                    {t("noAddons")}:{" "}
                  </Label>
                  <ToggleGroup
                    size="lg"
                    variant="outline"
                    type="multiple"
                    spacing={2}
                    className="w-full flex-wrap gap-2"
                    value={currentOrderItem.noteOptions.map(
                      (value) =>
                        selectedItem.noteOptions.find(
                          (option) =>
                            option.id === value || optionName(option) === value,
                        )?.id || value,
                    )}
                    onValueChange={(value) => {
                      if (isReadOnly) return;
                      setCurrentOrderItem((prev) => ({
                        ...prev,
                        noteOptions: value,
                      }));
                    }}
                  >
                    {selectedItem.noteOptions.map((note) => (
                      <ToggleGroupItem
                        key={note.id}
                        className="h-auto min-h-8 min-w-16 max-w-28 rounded-lg whitespace-normal break-words border-primary/40 px-1.5 py-1 text-sm text-center leading-tight data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-primary/10"
                        value={note.id}
                      >
                        {optionName(note)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )}
              {selectedItem.type === "combo" &&
                (currentOrderItem.componentSelections || []).length > 0 && (
                  <div className="space-y-2 rounded border p-3">
                    <Label className="font-semibold">
                      {t("comboComponents")}
                    </Label>
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {(currentOrderItem.componentSelections || []).map(
                        (component, index) => {
                          const componentItem = catalogItems.find(
                            (candidate) => candidate._id === component.itemId,
                          );
                          if (!componentItem) return null;
                          return (
                            <details
                              key={component.componentId}
                              className="rounded border px-3 py-2"
                              open={index === 0}
                            >
                              <summary className="cursor-pointer text-sm font-medium">
                                {component.name || componentItem.name}
                                {(
                                  currentOrderItem.componentSelections || []
                                ).filter(
                                  (entry) => entry.itemId === component.itemId,
                                ).length > 1
                                  ? ` ${index + 1}`
                                  : ""}
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {component.noteOptions.length
                                    ? component.noteOptions
                                        .map((id) =>
                                          optionName(
                                            componentItem.noteOptions.find(
                                              (option) => option.id === id,
                                            ) || {
                                              names: {
                                                vi: id,
                                                en: id,
                                                "zh-TW": id,
                                              },
                                            },
                                          ),
                                        )
                                        .join(", ")
                                    : t("noNoteSelected")}
                                </span>
                              </summary>
                              <div className="mt-2 space-y-2">
                                {componentItem.noteOptions.length > 0 && (
                                  <ToggleGroup
                                    type="multiple"
                                    variant="outline"
                                    className="flex-wrap gap-2"
                                    value={component.noteOptions}
                                    onValueChange={(value) =>
                                      setCurrentOrderItem((prev) => ({
                                        ...prev,
                                        componentSelections: (
                                          prev.componentSelections || []
                                        ).map((entry) =>
                                          entry.componentId ===
                                          component.componentId
                                            ? { ...entry, noteOptions: value }
                                            : entry,
                                        ),
                                      }))
                                    }
                                  >
                                    {componentItem.noteOptions.map((option) => (
                                      <ToggleGroupItem
                                        key={option.id}
                                        value={option.id}
                                        className="h-auto min-h-8 whitespace-normal px-2 py-1 text-sm"
                                      >
                                        {optionName(option)}
                                      </ToggleGroupItem>
                                    ))}
                                  </ToggleGroup>
                                )}
                                {
                                  <Input
                                    value={component.note}
                                    maxLength={MAX_NOTE_LENGTH}
                                    placeholder={t("note")}
                                    onChange={(event) =>
                                      setCurrentOrderItem((prev) => ({
                                        ...prev,
                                        componentSelections: (
                                          prev.componentSelections || []
                                        ).map((entry) =>
                                          entry.componentId ===
                                          component.componentId
                                            ? {
                                                ...entry,
                                                note: event.target.value,
                                              }
                                            : entry,
                                        ),
                                      }))
                                    }
                                  />
                                }
                              </div>
                            </details>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}
              {/* add-on */}
              {selectedItem.addons.length > 0 && (
                <div className="add-on mt-6 space-y-2">
                  <Label className="block font-semibold text-start">
                    {t("addons")}:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {displayedAddons.map((addon) => {
                      const selectedAddon = currentOrderItem.addons.find(
                        (entry) => entry.id === addon._id,
                      );
                      const maxQuantity =
                        addon.maxQuantity === null
                          ? null
                          : (addon.maxQuantity ?? 1);
                      const supportsQuantity =
                        maxQuantity === null || maxQuantity > 1;
                      const unavailable =
                        addon.temporarilyUnavailable === true && !selectedAddon;
                      const promotionPrice = getCatalogAddonPromotionPrice({
                        productId: selectedItem._id,
                        addonId: addon._id,
                        price: addon.priceExtra,
                        promotions,
                      });
                      const priceLabel =
                        selectedItem.addonDisplayMode ===
                        "merged" ? null : promotionPrice < addon.priceExtra ? (
                          <span className="text-[11px] opacity-80">
                            <span className="mr-1 line-through">
                              +{addon.priceExtra.toLocaleString(locale)}
                            </span>
                            +{promotionPrice.toLocaleString(locale)}
                          </span>
                        ) : (
                          <span className="text-[11px] opacity-80">
                            +{addon.priceExtra.toLocaleString(locale)}
                          </span>
                        );
                      if (!supportsQuantity)
                        return (
                          <Button
                            key={addon._id}
                            type="button"
                            variant={selectedAddon ? "default" : "outline"}
                            disabled={unavailable || isReadOnly}
                            onClick={() =>
                              setAddonAmount(addon, selectedAddon ? 0 : 1)
                            }
                            className="flex h-auto min-h-12 min-w-20 max-w-32 flex-col whitespace-normal break-words border-primary/40 px-2 py-1 text-center leading-tight"
                          >
                            <span className="line-clamp-2">{addon.name}</span>
                            {priceLabel}
                          </Button>
                        );
                      const maxReached =
                        maxQuantity !== null &&
                        (selectedAddon?.amount || 0) >= maxQuantity;
                      return (
                        <div
                          key={addon._id}
                          className="flex min-h-12 min-w-40 items-center gap-1 rounded-lg border border-primary/40 px-2 py-1"
                        >
                          <div className="min-w-0 flex-1 text-center">
                            <div className="line-clamp-1 text-sm">
                              {addon.name}
                            </div>
                            {priceLabel}
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="size-8 shrink-0"
                            aria-label={t("decreaseQuantity")}
                            disabled={isReadOnly || !selectedAddon}
                            onClick={() =>
                              setAddonAmount(
                                addon,
                                (selectedAddon?.amount || 0) - 1,
                              )
                            }
                          >
                            −
                          </Button>
                          <span className="w-5 text-center text-sm font-semibold tabular-nums">
                            {selectedAddon?.amount || 0}
                          </span>
                          <Button
                            type="button"
                            size="icon"
                            className="size-8 shrink-0"
                            aria-label={t("increaseQuantity")}
                            disabled={isReadOnly || unavailable || maxReached}
                            onClick={() =>
                              setAddonAmount(
                                addon,
                                (selectedAddon?.amount || 0) + 1,
                              )
                            }
                          >
                            +
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="note flex justify-start items-center gap-4">
                <Label className="w-22 block font-semibold text-start">
                  {t("note")}:{" "}
                </Label>
                <Input
                  id="note"
                  disabled={isReadOnly}
                  value={currentOrderItem.note}
                  maxLength={MAX_NOTE_LENGTH}
                  onChange={(e) => {
                    setCurrentOrderItem((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }));
                  }}
                />
              </div>
            </div>
            {!isReadOnly && (
              <div className="shrink-0 border-t pb-5 pt-3">
                <div className="flex items-end justify-start gap-3">
                  <NumPad
                    currentValue={currentOrderItem.quantity.toString()}
                    large
                    columns={4}
                    onChange={(value) => {
                      setCurrentOrderItem((prev) => ({
                        ...prev,
                        quantity: Number(value),
                      }));
                    }}
                  />
                  <div className="flex-1"></div>
                  <div className="flex shrink-0 flex-col gap-3 self-start">
                    {isEditItem ? (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              className="h-12 min-w-24 text-lg"
                              variant="default"
                              size="lg"
                              disabled={selectionUnavailable}
                            >
                              {t("edit")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("update")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("confirmUpdateProduct")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={updateItem}>
                                {t("confirm")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              className="h-12 min-w-24 text-lg"
                              variant="destructive"
                              size="lg"
                            >
                              {t("delete")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("confirmDeleteProduct")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={deleteItem}>
                                {t("confirm")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <Button
                        className="h-12 min-w-24 text-lg"
                        variant="default"
                        size="lg"
                        disabled={selectionUnavailable}
                        onClick={addItem}
                      >
                        {t("confirm")}
                      </Button>
                    )}
                    <Button
                      className="h-12 min-w-24 text-lg"
                      variant="outline"
                      size="lg"
                      onClick={cancelAddItem}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default PosItemSection;
