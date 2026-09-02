"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getExpenseUnits, type ExpenseUnit } from "@/api/expense";
import {
  createInventoryItem,
  createInventoryReceipt,
  approveInventoryReceipt,
  getInventoryItems,
  getInventoryStock,
  getInventoryReceipts,
  updateInventoryItem,
  type InventoryItem,
  type InventoryPurchaseUnit,
} from "@/api/inventory";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { useTablePageSize } from "@/hooks/use-table-page-size";

type Tab = "items" | "receipts";
const labels = {
  vi: {
    title: "Kho nguyên liệu",
    items: "Nguyên liệu",
    receipts: "Nhập kho",
    name: "Tên nguyên liệu",
    stockUnit: "Đơn vị tồn kho",
    safety: "Mức tồn an toàn",
    purchase: "Quy cách nhập",
    unit: "Đơn vị mua",
    factor: "Hệ số",
    addRule: "Thêm quy cách",
    save: "Lưu",
    add: "Thêm nguyên liệu",
    edit: "Sửa",
    actions: "Thao Tác",
    cancel: "Hủy",
    choose: "Chọn nguyên liệu",
    quantity: "Số lượng",
    price: "Đơn giá",
    current: "Tồn hiện tại",
    invalid: "Quy cách không hợp lệ",
  },
  en: {
    title: "Inventory",
    items: "Ingredients",
    receipts: "Receipts",
    name: "Ingredient name",
    stockUnit: "Stock unit",
    safety: "Safety stock",
    purchase: "Purchase units",
    unit: "Purchase unit",
    factor: "Factor",
    addRule: "Add unit",
    save: "Save",
    add: "Add ingredient",
    edit: "Edit",
    actions: "Actions",
    cancel: "Cancel",
    choose: "Choose ingredient",
    quantity: "Quantity",
    price: "Unit price",
    current: "Current stock",
    invalid: "Invalid purchase unit",
  },
  "zh-TW": {
    title: "原料庫存",
    items: "原料",
    receipts: "進貨",
    name: "原料名稱",
    stockUnit: "庫存單位",
    safety: "安全庫存",
    purchase: "進貨規格",
    unit: "進貨單位",
    factor: "換算係數",
    addRule: "新增規格",
    save: "儲存",
    add: "新增原料",
    edit: "編輯",
    actions: "操作",
    cancel: "取消",
    choose: "選擇原料",
    quantity: "數量",
    price: "單價",
    current: "目前庫存",
    invalid: "進貨規格無效",
  },
} as const;

const pendingLabels = {
  vi: "Chờ xác nhận tồn kho",
  en: "Pending inventory confirmation",
  "zh-TW": "等待庫存確認",
} as const;
const approveLabels = {
  vi: "Xác nhận và cộng tồn",
  en: "Confirm and post stock",
  "zh-TW": "確認並入庫",
} as const;
const paymentLabels = {
  vi: {
    method: "Phương thức thanh toán",
    cash: "Tiền mặt",
    bank: "Ngân hàng",
    other: "Khác",
  },
  en: {
    method: "Payment method",
    cash: "Cash",
    bank: "Bank transfer",
    other: "Other",
  },
  "zh-TW": {
    method: "付款方式",
    cash: "現金",
    bank: "銀行轉帳",
    other: "其他",
  },
} as const;
const errorLabels = {
  vi: {
    generic: "Thao tác thất bại",
    stockUnitLocked:
      "Không thể đổi đơn vị tồn kho vì nguyên liệu đã phát sinh giao dịch.",
  },
  en: {
    generic: "Operation failed",
    stockUnitLocked:
      "The stock unit cannot be changed because inventory activity already exists.",
  },
  "zh-TW": {
    generic: "操作失敗",
    stockUnitLocked: "此原料已有庫存交易，無法變更庫存單位。",
  },
} as const;

export default function InventoryPanel({
  initialTab = "items",
}: {
  initialTab?: Tab;
}) {
  const { locale, t: translate } = useI18n();
  const t = labels[locale];
  const pendingText = pendingLabels[locale];
  const approveText = approveLabels[locale];
  const paymentText = paymentLabels[locale];
  const errors = errorLabels[locale];
  const client = useQueryClient();
  const { pageSize } = useTablePageSize();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [name, setName] = useState("");
  const [stockUnit, setStockUnit] = useState("piece");
  const [rules, setRules] = useState<InventoryPurchaseUnit[]>([]);
  const [ruleUnit, setRuleUnit] = useState("");
  const [factor, setFactor] = useState("1");
  const [safetyStock, setSafetyStock] = useState("0");
  const [selectedId, setSelectedId] = useState("");
  const [receiptUnit, setReceiptUnit] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "bank_transfer" | "other"
  >("cash");
  const [page, setPage] = useState(1);
  const { data: units = [] } = useQuery<ExpenseUnit[]>({
    queryKey: ["expense-units"],
    queryFn: () => getExpenseUnits(),
  });
  const { data: items = [] } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: getInventoryItems,
  });
  const { data: stock = [] } = useQuery({
    queryKey: ["inventory-stock"],
    queryFn: getInventoryStock,
  });
  const { data: receipts = [] } = useQuery({
    queryKey: ["inventory-receipts"],
    queryFn: getInventoryReceipts,
  });
  const selected = items.find((item) => item._id === selectedId);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = items.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);
  const stockByItemId = new Map(
    stock.map((item) => [item._id, item.currentQuantity]),
  );
  const unitLabel = (code: string) =>
    units.find((unit) => unit.code === code)?.names[locale] || code;
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["inventory-items"] });
    void client.invalidateQueries({ queryKey: ["inventory-stock"] });
    void client.invalidateQueries({ queryKey: ["expenses"] });
    void client.invalidateQueries({ queryKey: ["inventory-receipts"] });
  };
  const showMutationError = (error: unknown) => {
    const message = (error as { response?: { data?: { message?: string } } })
      ?.response?.data?.message;
    toast.error(
      message === "Stock unit cannot be changed after inventory activity"
        ? errors.stockUnitLocked
        : errors.generic,
    );
  };
  const resetForm = () => {
    setEditing(null);
    setName("");
    setStockUnit("piece");
    setRules([]);
    setRuleUnit("");
    setFactor("1");
    setSafetyStock("0");
    setIsFormOpen(false);
  };
  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };
  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setName(item.name);
    setStockUnit(item.stockUnitCode);
    setRules(
      item.purchaseUnits.filter((rule) => rule.unitCode !== item.stockUnitCode),
    );
    setSafetyStock(String(item.minimumStock));
    setIsFormOpen(true);
  };
  const currentName = editing?.name ?? name;
  const currentStockUnit = editing?.stockUnitCode ?? stockUnit;
  const currentRules = editing?.purchaseUnits ?? rules;
  const setCurrentRules = (next: InventoryPurchaseUnit[]) =>
    editing ? setEditing({ ...editing, purchaseUnits: next }) : setRules(next);
  const normalizedRules = [
    { unitCode: currentStockUnit, conversionFactor: 1 },
    ...currentRules.filter((rule) => rule.unitCode !== currentStockUnit),
  ];
  const addRule = () => {
    const value = Number(factor);
    if (
      !ruleUnit ||
      value <= 0 ||
      !Number.isFinite(value) ||
      currentRules.some((rule) => rule.unitCode === ruleUnit)
    )
      return toast.error(t.invalid);
    setCurrentRules([
      ...currentRules.filter((rule) => rule.unitCode !== currentStockUnit),
      { unitCode: ruleUnit, conversionFactor: value },
    ]);
    setRuleUnit("");
    setFactor("1");
  };
  const create = useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => {
      refresh();
      resetForm();
    },
    onError: showMutationError,
  });
  const update = useMutation({
    mutationFn: updateInventoryItem,
    onSuccess: () => {
      refresh();
      resetForm();
    },
    onError: showMutationError,
  });
  const receipt = useMutation({
    mutationFn: createInventoryReceipt,
    onSuccess: () => {
      refresh();
      setQuantity("1");
      setPrice("0");
      setPaymentMethod("cash");
    },
    onError: showMutationError,
  });
  const approveReceipt = useMutation({
    mutationFn: approveInventoryReceipt,
    onSuccess: refresh,
    onError: showMutationError,
  });
  const save = () => {
    const data = {
      name: currentName.trim(),
      stockUnitCode: currentStockUnit,
      purchaseUnits: normalizedRules,
      minimumStock: Math.max(
        0,
        Number(editing ? editing.minimumStock : safetyStock) || 0,
      ),
      note: editing?.note,
      active: editing?.active ?? true,
    };
    if (editing) update.mutate({ id: editing._id, data });
    else create.mutate(data);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        {tab === "items" && <Button onClick={openCreate}>{t.add}</Button>}
      </div>
      <div className="flex shrink-0 gap-2 border-b pb-2">
        {(
          [
            ["items", t.items],
            ["receipts", t.receipts],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={tab === id ? "default" : "outline"}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      {tab === "items" && (
        <Card className="flex h-[calc(100svh-180px)] min-h-0 flex-col overflow-hidden">
          <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3">
            <CardTitle>{t.items}</CardTitle>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentPage}/{totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setPage((current) => current - 1)}
                aria-label={translate("previous")}
              >
                ‹
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setPage((current) => current + 1)}
                aria-label={translate("next")}
              >
                ›
              </Button>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.stockUnit}</TableHead>
                  <TableHead>{t.safety}</TableHead>
                  <TableHead>{t.current}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleItems.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{unitLabel(item.stockUnitCode)}</TableCell>
                    <TableCell>{item.minimumStock}</TableCell>
                    <TableCell>
                      {stockByItemId.get(item._id) ?? 0}
                      {item.inventoryStatus === "pending" && (
                        <span className="ml-2 text-xs text-amber-600">
                          ({pendingText})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.inventoryStatus !== "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(item)}
                        >
                          {t.edit}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {tab === "receipts" && (
        <>
          <Card className="border-muted-foreground/20 shadow-sm">
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
              <div className="space-y-1.5">
                <Label>{t.choose}</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    const item = items.find(
                      (entry) => entry._id === e.target.value,
                    );
                    setReceiptUnit(item?.stockUnitCode || "");
                  }}
                >
                  <option value="">{t.choose}</option>
                  {items.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t.unit}</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={receiptUnit}
                  onChange={(e) => setReceiptUnit(e.target.value)}
                  disabled={!selected}
                >
                  <option value="">{t.unit}</option>
                  {selected?.purchaseUnits.map((rule) => (
                    <option key={rule.unitCode} value={rule.unitCode}>
                      {unitLabel(rule.unitCode)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t.quantity}</Label>
                <Input
                  className="h-8"
                  type="number"
                  min="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.price}</Label>
                <Input
                  className="h-8"
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="whitespace-nowrap">
                  {paymentText.method}
                </Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value as typeof paymentMethod)
                  }
                >
                  <option value="cash">{paymentText.cash}</option>
                  <option value="bank_transfer">{paymentText.bank}</option>
                  <option value="other">{paymentText.other}</option>
                </select>
              </div>
              <Button
                className="h-8 w-fit lg:col-span-full"
                disabled={!selected || receipt.isPending}
                onClick={() =>
                  receipt.mutate({
                    paymentMethod,
                    lines: [
                      {
                        inventoryItemId: selectedId,
                        quantity: Number(quantity),
                        unitCode: receiptUnit,
                        unitPrice: Number(price),
                      },
                    ],
                  })
                }
              >
                {t.save}
              </Button>
            </CardContent>
          </Card>
          {receipts.some((entry) => entry.inventoryStatus === "pending") && (
            <Card>
              <CardHeader>
                <CardTitle>{pendingText}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {receipts
                  .filter((entry) => entry.inventoryStatus === "pending")
                  .map((entry) => (
                    <div
                      key={entry._id}
                      className="space-y-3 rounded border p-3"
                    >
                      <div className="text-sm">
                        <div className="text-sm">
                          <div className="font-medium">
                            {entry.lines.length} {t.items}
                          </div>
                          <div className="text-muted-foreground">
                            {entry.totalAmount.toLocaleString()} · {pendingText}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {entry.lines.map((line, index) => {
                          const itemId =
                            typeof line.inventoryItemId === "string"
                              ? line.inventoryItemId
                              : line.inventoryItemId._id;
                          const item = items.find(
                            (candidate) => candidate._id === itemId,
                          );
                          return (
                            <div
                              key={itemId}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <span className="min-w-0 flex-1">
                                {item?.name ||
                                  (typeof line.inventoryItemId === "string"
                                    ? line.inventoryItemId
                                    : line.inventoryItemId.name)}
                              </span>
                              <div className="flex shrink-0 gap-2">
                                {item && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEdit(item)}
                                  >
                                    {t.edit}
                                  </Button>
                                )}
                                {index === 0 && (
                                  <Button
                                    size="sm"
                                    disabled={approveReceipt.isPending}
                                    onClick={() =>
                                      approveReceipt.mutate(entry._id)
                                    }
                                  >
                                    {approveText}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? t.edit : t.add}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-2">
                <Label>{t.name}</Label>
                <Input
                  value={currentName}
                  onChange={(e) =>
                    editing
                      ? setEditing({ ...editing, name: e.target.value })
                      : setName(e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{t.stockUnit}</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={currentStockUnit}
                  disabled={Boolean(
                    editing && editing.inventoryStatus !== "pending",
                  )}
                  onChange={(e) =>
                    editing
                      ? setEditing({
                          ...editing,
                          stockUnitCode: e.target.value,
                          purchaseUnits: editing.purchaseUnits.filter(
                            (rule) =>
                              rule.unitCode !== editing.stockUnitCode &&
                              rule.unitCode !== e.target.value,
                          ),
                        })
                      : setStockUnit(e.target.value)
                  }
                >
                  {units.map((unit) => (
                    <option key={unit.code} value={unit.code}>
                      {unit.names[locale]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t.safety}</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={editing ? editing.minimumStock : safetyStock}
                  onChange={(e) =>
                    editing
                      ? setEditing({
                          ...editing,
                          minimumStock: Number(e.target.value),
                        })
                      : setSafetyStock(e.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <p className="font-medium">{t.purchase}</p>
              <div className="flex flex-wrap gap-2">
                {normalizedRules.map((rule) => (
                  <span
                    key={rule.unitCode}
                    className="relative rounded bg-muted px-2 py-1 pr-8 text-sm"
                  >
                    {unitLabel(rule.unitCode)} × {rule.conversionFactor}
                    {rule.unitCode !== currentStockUnit && (
                      <button
                        type="button"
                        aria-label={t.cancel}
                        className="absolute right-0 top-0 inline-flex size-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                        onClick={() =>
                          setCurrentRules(
                            currentRules.filter(
                              (entry) => entry.unitCode !== rule.unitCode,
                            ),
                          )
                        }
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <select
                  className="h-8 rounded-md border px-2 text-sm"
                  value={ruleUnit}
                  onChange={(e) => setRuleUnit(e.target.value)}
                >
                  <option value="">{t.unit}</option>
                  {units.map((unit) => (
                    <option key={unit.code} value={unit.code}>
                      {unit.names[locale]}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="0.000001"
                  value={factor}
                  onChange={(e) => setFactor(e.target.value)}
                  placeholder={t.factor}
                />
                <Button type="button" variant="outline" onClick={addRule}>
                  {t.addRule}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetForm}>
              {t.cancel}
            </Button>
            <Button
              disabled={
                !currentName.trim() ||
                !currentStockUnit ||
                create.isPending ||
                update.isPending
              }
              onClick={save}
            >
              {create.isPending || update.isPending
                ? t.save
                : editing
                  ? t.save
                  : t.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
