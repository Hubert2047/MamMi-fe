import {
  createExpense,
  getExpenseUnits,
  type ExpenseUnit,
} from "@/api/expense";
import {
  createInventoryItem,
  createInventoryReceipt,
  getInventoryItems,
} from "@/api/inventory";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { X } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";

type Props = {
  open: boolean;
  onClose: () => void;
  mode?: "expense" | "inventory_purchase";
};

export function AddExpenseDialog({ open, onClose, mode = "expense" }: Props) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const { data: units = [] } = useQuery<ExpenseUnit[]>({
    queryKey: ["expense-units"],
    queryFn: () => getExpenseUnits(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: getInventoryItems,
  });
  const [entryType, setEntryType] = useState<"other" | "inventory_purchase">(
    mode === "inventory_purchase" ? "inventory_purchase" : "other",
  );
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryPickerOpen, setInventoryPickerOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: "",
    unit: "",
    quantity: "1",
    unitPrice: "",
  });
  const nameInputRef = useRef<HTMLInputElement>(null);
  const inventorySearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEntryType(
      mode === "inventory_purchase" ? "inventory_purchase" : "other",
    );
  }, [mode, open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() =>
        (entryType === "other"
          ? nameInputRef.current
          : inventorySearchRef.current
        )?.focus(),
      );
    }
  }, [entryType, open]);

  const [formData, setFormData] = useState({
    name: "",
    quantity: "1",
    unit: "",
    unitPrice: "",
    price: "",
    note: "",
    category: "other",
    paymentMethod: "cash" as "cash" | "bank_transfer" | "other",
  });

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(t("createSuccess"), {
        closeButton: true,
        duration: 1500,
      });
      onClose();
      setFormData({
        name: "",
        quantity: "1",
        unit: "",
        unitPrice: "",
        price: "",
        note: "",
        category: "other",
        paymentMethod: "cash",
      });
      setInventorySearch("");
      setUnitSearch("");
    },
    onError: () => {
      toast.error(t("createFailure"));
    },
  });
  const receiptMutation = useMutation({
    mutationFn: createInventoryReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
      toast.success(t("createSuccess"));
      onClose();
    },
    onError: () => toast.error(t("createFailure")),
  });
  const temporaryItemMutation = useMutation({
    mutationFn: () =>
      createInventoryItem({
        name: quickAddData.name.trim(),
        stockUnitCode: quickAddData.unit,
        purchaseUnits: [{ unitCode: quickAddData.unit, conversionFactor: 1 }],
        minimumStock: 0,
        note: "pending_mapping",
        inventoryStatus: "pending",
      }),
    onSuccess: (item) => {
      queryClient.setQueryData<Awaited<ReturnType<typeof getInventoryItems>>>(
        ["inventory-items"],
        (current = []) =>
          [...current, item].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setInventorySearch(item.name);
      const selectedUnit = units.find(
        (unit) => unit.code === item.stockUnitCode,
      );
      setUnitSearch(
        selectedUnit ? unitLabel(selectedUnit) : item.stockUnitCode,
      );
      setFormData((prev) => ({
        ...prev,
        name: item._id,
        unit: item.stockUnitCode,
        quantity: quickAddData.quantity,
        unitPrice: quickAddData.unitPrice,
      }));
      setQuickAddOpen(false);
      toast.success(t("createSuccess"));
    },
    onError: () => toast.error(t("createFailure")),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const adjustQuantity = (amount: number) => {
    setFormData((prev) => ({
      ...prev,
      quantity: String(Math.max(0.001, Number(prev.quantity || 0) + amount)),
    }));
  };

  const filteredInventoryItems = inventoryItems.filter((item) =>
    item.name
      .toLocaleLowerCase()
      .includes(inventorySearch.toLocaleLowerCase().trim()),
  );
  const unitLabel = (unit: ExpenseUnit) =>
    unit.names[locale] || unit.names.vi || unit.code;
  const selectedInventoryItem = inventoryItems.find(
    (item) => item._id === formData.name,
  );
  const allowedUnitCodes =
    entryType === "inventory_purchase" && selectedInventoryItem
      ? new Set(
          selectedInventoryItem.purchaseUnits.map((unit) => unit.unitCode),
        )
      : null;
  const filteredUnits = units.filter(
    (unit) =>
      (!allowedUnitCodes || allowedUnitCodes.has(unit.code)) &&
      unitLabel(unit)
        .toLocaleLowerCase()
        .includes(unitSearch.toLocaleLowerCase().trim()),
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (entryType === "inventory_purchase") {
      if (!formData.name) {
        toast.warning(t("requiredName"));
        return;
      }
      receiptMutation.mutate({
        paymentMethod: formData.paymentMethod,
        lines: [
          {
            inventoryItemId: formData.name,
            quantity: Number(formData.quantity),
            unitCode: formData.unit,
            unitPrice: Number(formData.unitPrice),
          },
        ],
      });
      return;
    }
    if (!formData.name) {
      toast.warning(t("requiredName"));
      return;
    }

    if (!formData.unitPrice) {
      toast.warning(t("requiredPrice"));
      return;
    }

    createMutation.mutate({
      name: formData.name,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      unitPrice: Number(formData.unitPrice),
      price: Number(formData.quantity) * Number(formData.unitPrice),
      note: formData.note,
      category: formData.category,
      paymentMethod: formData.paymentMethod,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (entryType === "other"
            ? nameInputRef.current
            : inventorySearchRef.current
          )?.focus();
        }}
        onPointerDownOutside={(event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("[data-expense-unit-popover]")
          ) {
            event.preventDefault();
          }
        }}
        onFocusOutside={(event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("[data-expense-unit-popover]")
          ) {
            event.preventDefault();
          }
        }}
        className="top-1 max-h-[calc(100dvh-1rem)] translate-y-0 overflow-y-auto sm:max-w-3xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3 flex flex-wrap items-center justify-start gap-3">
            <DialogHeader className="shrink-0 self-center">
              <DialogTitle className="text-black! font-bold! text-xl">
                {mode === "inventory_purchase"
                  ? t("posInventoryPurchase")
                  : t("expenseAddTitle")}
              </DialogTitle>
            </DialogHeader>
          </div>

          <FieldGroup className="sm:grid sm:grid-cols-4 sm:gap-x-4 sm:gap-y-3">
            <Field className="sm:col-span-4">
              <Label htmlFor="name-1">{t("expenseName")}</Label>
              {entryType === "inventory_purchase" ? (
                <div className="flex items-start gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Input
                      className="pr-9"
                      ref={inventorySearchRef}
                      value={inventorySearch}
                      placeholder={
                        locale === "en"
                          ? "Search ingredients..."
                          : locale === "zh-TW"
                            ? "搜尋原料..."
                            : "Tìm nguyên liệu..."
                      }
                      onFocus={() => setInventoryPickerOpen(true)}
                      onBlur={() =>
                        window.setTimeout(
                          () => setInventoryPickerOpen(false),
                          120,
                        )
                      }
                      onChange={(event) => {
                        setInventorySearch(event.target.value);
                        setInventoryPickerOpen(true);
                        setFormData((prev) => ({
                          ...prev,
                          name: "",
                          unit: "",
                        }));
                      }}
                    />
                    {inventorySearch && (
                      <button
                        type="button"
                        aria-label={
                          locale === "en"
                            ? "Clear ingredient search"
                            : locale === "zh-TW"
                              ? "清除原料搜尋"
                              : "Xóa tìm nguyên liệu"
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setInventorySearch("");
                          setFormData((prev) => ({
                            ...prev,
                            name: "",
                            unit: "",
                          }));
                          setInventoryPickerOpen(true);
                          inventorySearchRef.current?.focus();
                        }}
                      >
                        <X className="size-4" />
                      </button>
                    )}
                    {inventoryPickerOpen && (
                      <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                        {filteredInventoryItems.length ? (
                          filteredInventoryItems.map((item) => (
                            <button
                              className="block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                              key={item._id}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                const selectedUnit = units.find(
                                  (unit) => unit.code === item.stockUnitCode,
                                );
                                setInventorySearch(item.name);
                                setUnitSearch(
                                  selectedUnit
                                    ? unitLabel(selectedUnit)
                                    : item.stockUnitCode,
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  name: item._id,
                                  unit: item.stockUnitCode,
                                }));
                                setInventoryPickerOpen(false);
                              }}
                            >
                              {item.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            {locale === "en"
                              ? "No ingredients found"
                              : locale === "zh-TW"
                                ? "找不到原料"
                                : "Không tìm thấy nguyên liệu"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 shrink-0 px-3"
                    onClick={() => {
                      setQuickAddData((prev) => ({
                        ...prev,
                        name: inventorySearch.trim(),
                      }));
                      setQuickAddOpen(true);
                      setInventoryPickerOpen(false);
                    }}
                  >
                    + {t("addTemporaryIngredient")}
                  </Button>
                </div>
              ) : (
                <Input
                  ref={nameInputRef}
                  id="name-1"
                  name="name"
                  autoFocus
                  value={formData.name}
                  onChange={handleChange}
                />
              )}
            </Field>

            {entryType === "other" && (
              <Field className="sm:col-start-1 sm:row-start-2">
                <Label>Nhóm chi phí</Label>
                <select
                  className="h-8 w-full rounded-md border bg-background px-3 text-sm"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  <option value="other">Khác</option>
                  <option value="utilities">Điện nước</option>
                  <option value="rent">Thuê mặt bằng</option>
                  <option value="transport">Vận chuyển</option>
                  <option value="maintenance">Sửa chữa</option>
                  <option value="salary">Nhân sự</option>
                </select>
              </Field>
            )}

            {entryType === "inventory_purchase" && (
              <>
                <Field className="sm:col-start-1 sm:row-start-2">
                  <Label htmlFor="quantity-1">{t("expenseQuantity")}</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Giảm số lượng"
                      onClick={() => adjustQuantity(-1)}
                    >
                      −
                    </Button>
                    <Input
                      className="min-w-0 text-center"
                      id="quantity-1"
                      name="quantity"
                      type="number"
                      min="0.001"
                      step="any"
                      value={formData.quantity}
                      onChange={handleChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Tăng số lượng"
                      onClick={() => adjustQuantity(1)}
                    >
                      +
                    </Button>
                  </div>
                </Field>

                <Field className="sm:col-start-2 sm:row-start-2">
                  <Label htmlFor="unit-1">{t("expenseUnit")}</Label>
                  <PopoverPrimitive.Root
                    modal={false}
                    open={unitPickerOpen}
                    onOpenChange={setUnitPickerOpen}
                  >
                    <PopoverPrimitive.Anchor asChild>
                      <div className="relative">
                        <Input
                          className="pr-9"
                          value={unitSearch}
                          placeholder={t("expenseUnit")}
                          onFocus={() => setUnitPickerOpen(true)}
                          onChange={(event) => {
                            setUnitSearch(event.target.value);
                            setUnitPickerOpen(true);
                            setFormData((prev) => ({ ...prev, unit: "" }));
                          }}
                        />
                        {unitSearch && (
                          <button
                            type="button"
                            aria-label={
                              locale === "en"
                                ? "Clear unit search"
                                : locale === "zh-TW"
                                  ? "清除單位搜尋"
                                  : "Xóa tìm đơn vị"
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setUnitSearch("");
                              setFormData((prev) => ({ ...prev, unit: "" }));
                              setUnitPickerOpen(true);
                            }}
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </div>
                    </PopoverPrimitive.Anchor>
                    <PopoverPrimitive.Portal>
                      <PopoverPrimitive.Content
                        data-expense-unit-popover
                        side="bottom"
                        align="start"
                        sideOffset={4}
                        onOpenAutoFocus={(event) => event.preventDefault()}
                        onFocusOutside={(event) => event.preventDefault()}
                        onWheel={(event) => event.stopPropagation()}
                        onTouchMove={(event) => event.stopPropagation()}
                        className="z-[100] max-h-48 w-[var(--radix-popover-trigger-width)] touch-pan-y overflow-y-scroll overscroll-contain rounded-md border bg-popover p-1 shadow-md"
                      >
                        {filteredUnits.length ? (
                          filteredUnits.map((unit) => (
                            <button
                              className="block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                              key={unit.code}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setUnitSearch(unitLabel(unit));
                                setFormData((prev) => ({
                                  ...prev,
                                  unit: unit.code,
                                }));
                                setUnitPickerOpen(false);
                              }}
                            >
                              {unitLabel(unit)}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            {locale === "en"
                              ? "No units found"
                              : locale === "zh-TW"
                                ? "找不到單位"
                                : "Không tìm thấy đơn vị"}
                          </div>
                        )}
                      </PopoverPrimitive.Content>
                    </PopoverPrimitive.Portal>
                  </PopoverPrimitive.Root>
                </Field>

                <Field className="sm:col-start-3 sm:row-start-2">
                  <Label htmlFor="unit-price-1">{t("expenseUnitPrice")}</Label>
                  <Input
                    id="unit-price-1"
                    name="unitPrice"
                    type="number"
                    min="0"
                    value={formData.unitPrice}
                    onChange={handleChange}
                  />
                </Field>
              </>
            )}

            {entryType === "other" && (
              <Field className="sm:col-start-2 sm:row-start-2">
                <Label htmlFor="expense-amount-1">{t("expenseTotal")}</Label>
                <Input
                  id="expense-amount-1"
                  name="unitPrice"
                  type="number"
                  min="0"
                  value={formData.unitPrice}
                  onChange={handleChange}
                />
              </Field>
            )}

            <Field
              className={
                entryType === "other"
                  ? "sm:col-start-3 sm:row-start-2"
                  : "sm:col-start-4 sm:row-start-2"
              }
            >
              <Label htmlFor="payment-method-1">{t("paymentMethod")}</Label>
              <select
                id="payment-method-1"
                name="paymentMethod"
                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                value={formData.paymentMethod}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    paymentMethod: event.target.value as
                      "cash" | "bank_transfer" | "other",
                  }))
                }
              >
                <option value="cash">{t("paymentCash")}</option>
                <option value="bank_transfer">{t("paymentBank")}</option>
                <option value="other">{t("paymentOther")}</option>
              </select>
            </Field>

            {entryType === "inventory_purchase" && (
              <Field className="sm:col-span-1">
                <Label htmlFor="expense-total-1">{t("expenseTotal")}</Label>
                <Input
                  id="expense-total-1"
                  value={(
                    Number(formData.quantity || 0) *
                    Number(formData.unitPrice || 0)
                  ).toLocaleString()}
                  disabled
                />
              </Field>
            )}

            <Field
              className={
                entryType === "inventory_purchase"
                  ? "sm:col-span-3"
                  : "sm:col-span-4"
              }
            >
              <Label htmlFor="note-1">{t("expenseNote")}</Label>
              <Input
                id="note-1"
                name="note"
                value={formData.note}
                onChange={handleChange}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4 pb-4">
            <DialogClose asChild>
              <Button className="h-10 min-w-24 px-4" variant="outline">
                {t("cancel")}
              </Button>
            </DialogClose>

            <Button
              className="h-10 min-w-24 px-4"
              type="submit"
              disabled={
                entryType === "inventory_purchase"
                  ? receiptMutation.isPending
                  : createMutation.isPending
              }
            >
              {(
                entryType === "inventory_purchase"
                  ? receiptMutation.isPending
                  : createMutation.isPending
              )
                ? t("saving")
                : t("save")}
            </Button>
          </DialogFooter>
        </form>
        <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
          <DialogContent className="top-1 max-h-[calc(100dvh-1rem)] translate-y-0 overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("addTemporaryIngredient")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label>{t("expenseName")}</Label>
                <Input
                  autoFocus
                  value={quickAddData.name}
                  onChange={(event) =>
                    setQuickAddData((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{t("expenseUnit")}</Label>
                <select
                  className="h-8 w-full rounded-md border bg-background px-3 text-sm"
                  value={quickAddData.unit}
                  onChange={(event) =>
                    setQuickAddData((prev) => ({
                      ...prev,
                      unit: event.target.value,
                    }))
                  }
                >
                  <option value="">{t("expenseUnit")}</option>
                  {units.map((unit) => (
                    <option key={unit.code} value={unit.code}>
                      {unitLabel(unit)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t("expenseQuantity")}</Label>
                <Input
                  type="number"
                  min="0.001"
                  step="any"
                  value={quickAddData.quantity}
                  onChange={(event) =>
                    setQuickAddData((prev) => ({
                      ...prev,
                      quantity: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>{t("expenseUnitPrice")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={quickAddData.unitPrice}
                  onChange={(event) =>
                    setQuickAddData((prev) => ({
                      ...prev,
                      unitPrice: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickAddOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                disabled={
                  temporaryItemMutation.isPending ||
                  !quickAddData.name.trim() ||
                  !quickAddData.unit ||
                  !quickAddData.quantity ||
                  !quickAddData.unitPrice
                }
                onClick={() => temporaryItemMutation.mutate()}
              >
                {temporaryItemMutation.isPending
                  ? t("saving")
                  : t("addTemporaryIngredient")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
