"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createInventoryStocktake,
  getInventoryStock,
  type InventoryStockRow,
} from "@/api/inventory";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const labels = {
  vi: {
    title: "Kiểm kho",
    search: "Tìm nguyên liệu...",
    empty: "Không tìm thấy nguyên liệu",
    system: "Tồn hệ thống",
    actual: "Tồn thực tế",
    unit: "Đơn vị",
    status: "Trạng thái",
    counted: "Đã nhập",
    pending: "Chưa kiểm",
    save: "Xác nhận kiểm kho",
    low: "Dưới mức tồn an toàn",
    safe: "Mức an toàn",
    suggest: "Gợi ý mua",
    saved: "Đã lưu phiếu kiểm kho",
    required: "Hãy nhập ít nhất một nguyên liệu",
    last: "Kiểm lần cuối",
  },
  en: {
    title: "Stocktake",
    search: "Search ingredients...",
    empty: "No ingredients found",
    system: "System stock",
    actual: "Actual stock",
    unit: "Unit",
    status: "Status",
    counted: "Counted",
    pending: "Not counted",
    save: "Confirm stocktake",
    low: "Below safety stock",
    safe: "Safety stock",
    suggest: "Suggested purchase",
    saved: "Stocktake saved",
    required: "Enter at least one ingredient",
    last: "Last checked",
  },
  "zh-TW": {
    title: "盤點庫存",
    search: "搜尋原料...",
    empty: "找不到原料",
    system: "系統庫存",
    actual: "實際庫存",
    unit: "單位",
    status: "狀態",
    counted: "已輸入",
    pending: "尚未盤點",
    save: "確認盤點",
    low: "低於安全庫存",
    safe: "安全庫存",
    suggest: "建議採購",
    saved: "盤點已儲存",
    required: "請至少輸入一項原料",
    last: "上次盤點",
  },
} as const;

export default function PosStocktakeDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { locale } = useI18n();
  const t = labels[locale];
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const { data: stock = [] } = useQuery({
    queryKey: ["inventory-stock"],
    queryFn: getInventoryStock,
    enabled: open,
  });
  const filtered = useMemo(
    () =>
      stock.filter((item) =>
        item.name
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase().trim()),
      ),
    [stock, search],
  );
  const preview = (item: InventoryStockRow) => {
    const value = Number(draft[item._id]);
    return draft[item._id] !== undefined && Number.isFinite(value)
      ? value
      : item.currentQuantity;
  };
  const lowStock = stock.filter((item) => preview(item) < item.minimumStock);
  const mutation = useMutation({
    mutationFn: createInventoryStocktake,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["inventory-stock"] });
      void client.invalidateQueries({ queryKey: ["inventory-items"] });
      setDraft({});
      setSearch("");
      toast.success(t.saved);
    },
  });
  const submit = () => {
    const lines = Object.entries(draft)
      .filter(([, value]) => value.trim() !== "")
      .map(([inventoryItemId, value]) => ({
        inventoryItemId,
        actualQuantity: Number(value),
      }))
      .filter(
        (line) =>
          Number.isFinite(line.actualQuantity) && line.actualQuantity >= 0,
      );
    if (!lines.length) {
      toast.warning(t.required);
      return;
    }
    mutation.mutate({ lines });
  };
  const formatDate = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(locale === "zh-TW" ? "zh-TW" : locale, {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(value))
      : "—";
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="top-1 max-h-[calc(100dvh-1rem)] translate-y-0 overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={search}
            placeholder={t.search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="max-h-[50dvh] overflow-auto rounded border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="p-2 text-left">{t.status}</th>
                  <th className="p-2 text-left">{t.system}</th>
                  <th className="p-2 text-left">{t.actual}</th>
                  <th className="p-2 text-left">{t.unit}</th>
                  <th className="p-2 text-left">{t.last}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isCounted = draft[item._id] !== undefined;
                  return (
                    <tr key={item._id} className="border-t">
                      <td className="p-2">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {isCounted ? t.counted : t.pending}
                        </div>
                      </td>
                      <td className="p-2">{item.currentQuantity}</td>
                      <td className="p-2">
                        <Input
                          className="h-8 w-28"
                          type="number"
                          min="0"
                          step="any"
                          value={draft[item._id] ?? ""}
                          placeholder={String(item.currentQuantity)}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              [item._id]: event.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="p-2">{item.stockUnitCode}</td>
                      <td className="p-2 text-muted-foreground">
                        {formatDate(item.lastStocktakeAt)}
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center text-muted-foreground"
                    >
                      {t.empty}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {lowStock.length > 0 && (
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
              <div className="mb-2 font-semibold text-amber-900">{t.low}</div>
              <div className="space-y-1">
                {lowStock.map((item) => (
                  <div className="flex justify-between gap-2" key={item._id}>
                    <span>{item.name}</span>
                    <span>
                      {t.suggest}:{" "}
                      {Math.max(0, item.minimumStock - preview(item))}{" "}
                      {item.stockUnitCode} ({t.safe}: {item.minimumStock})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button
            className="w-full"
            onClick={submit}
            disabled={mutation.isPending}
          >
            {t.save} ({Object.keys(draft).length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
