"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createExpenseUnit,
  getExpenseUnits,
  updateExpenseUnit,
  type ExpenseUnit,
} from "@/api/expense";
import { useI18n } from "@/lib/i18n";

const empty = {
  code: "",
  vi: "",
  en: "",
  zh: "",
  category: "count" as ExpenseUnit["category"],
};
const texts = {
  vi: {
    title: "Đơn vị tính",
    addTitle: "Thêm đơn vị",
    code: "Mã đơn vị, ví dụ: tray",
    vi: "Tên tiếng Việt",
    en: "Tên tiếng Anh",
    zh: "Tên tiếng Trung",
    group: "Nhóm",
    count: "Số lượng",
    weight: "Khối lượng",
    volume: "Thể tích",
    add: "Thêm đơn vị",
    list: "Danh sách đơn vị",
    total: "Tổng cộng",
    page: "Trang",
    previous: "Trước",
    next: "Sau",
    off: "Tắt sử dụng",
    on: "Bật sử dụng",
  },
  en: {
    title: "Units",
    addTitle: "Add unit",
    code: "Unit code, e.g. tray",
    vi: "Vietnamese name",
    en: "English name",
    zh: "Chinese name",
    group: "Group",
    count: "Count",
    weight: "Weight",
    volume: "Volume",
    add: "Add unit",
    list: "Unit list",
    total: "Total",
    page: "Page",
    previous: "Previous",
    next: "Next",
    off: "Disable",
    on: "Enable",
  },
  "zh-TW": {
    title: "單位",
    addTitle: "新增單位",
    code: "單位代碼，例如 tray",
    vi: "越南文名稱",
    en: "英文名稱",
    zh: "中文名稱",
    group: "類別",
    count: "數量",
    weight: "重量",
    volume: "體積",
    add: "新增單位",
    list: "單位清單",
    total: "總計",
    page: "頁",
    previous: "上一頁",
    next: "下一頁",
    off: "停用",
    on: "啟用",
  },
} as const;

export default function UnitManagement() {
  const { locale } = useI18n();
  const t = texts[locale];
  const queryClient = useQueryClient();
  const { data: units = [] } = useQuery({
    queryKey: ["expense-units-all"],
    queryFn: () => getExpenseUnits(true),
  });
  const [form, setForm] = useState(empty);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setPageSize(Math.max(1, Math.floor((element.clientHeight - 48) / 64))),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const element = listRef.current;
      if (element && element.scrollHeight > element.clientHeight + 1)
        setPageSize((value) => Math.max(1, value - 1));
    });
    return () => cancelAnimationFrame(frame);
  }, [pageSize, units.length]);
  const save = useMutation({
    mutationFn: () =>
      createExpenseUnit({
        code: form.code.trim().toLowerCase(),
        names: { vi: form.vi, en: form.en, "zh-TW": form.zh },
        category: form.category,
        active: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-units"] });
      queryClient.invalidateQueries({ queryKey: ["expense-units-all"] });
      setForm(empty);
    },
  });
  const toggle = useMutation({
    mutationFn: (unit: ExpenseUnit) =>
      updateExpenseUnit({ id: unit._id, data: { active: !unit.active } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-units"] });
      queryClient.invalidateQueries({ queryKey: ["expense-units-all"] });
    },
  });
  const totalPages = Math.max(1, Math.ceil(units.length / pageSize));
  const visibleUnits = units.slice((page - 1) * pageSize, page * pageSize);
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-6 md:p-8">
      <h1 className="shrink-0 text-3xl font-bold">{t.title}</h1>
      <Card className="shrink-0">
        <CardHeader>
          <CardTitle>{t.addTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder={t.code}
          />
          <Input
            value={form.vi}
            onChange={(e) => setForm({ ...form, vi: e.target.value })}
            placeholder={t.vi}
          />
          <Input
            value={form.en}
            onChange={(e) => setForm({ ...form, en: e.target.value })}
            placeholder={t.en}
          />
          <Input
            value={form.zh}
            onChange={(e) => setForm({ ...form, zh: e.target.value })}
            placeholder={t.zh}
          />
          <select
            aria-label={t.group}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value as ExpenseUnit["category"],
              })
            }
          >
            <option value="count">{t.count}</option>
            <option value="weight">{t.weight}</option>
            <option value="volume">{t.volume}</option>
          </select>
          <Button
            className="md:col-span-3 md:w-fit"
            disabled={!form.code || !form.vi || !form.en || save.isPending}
            onClick={() => save.mutate()}
          >
            {t.add}
          </Button>
        </CardContent>
      </Card>
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <span>{t.list}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-normal text-muted-foreground">
                {t.total}: {units.length}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {t.page} {page}/{totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  {t.previous}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  {t.next}
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent
          ref={listRef}
          className="min-h-0 flex-1 space-y-2 overflow-hidden"
        >
          {visibleUnits.map((unit) => (
            <div
              key={unit.code}
              className="flex h-14 shrink-0 flex-wrap items-center justify-between gap-3 rounded border p-3"
            >
              <div>
                <div className="font-medium">
                  {unit.names[locale]}{" "}
                  <span className="text-muted-foreground">({unit.code})</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {unit.category}
                </div>
              </div>
              <Button
                size="sm"
                variant={unit.active ? "outline" : "default"}
                onClick={() => toggle.mutate(unit)}
              >
                {unit.active ? t.off : t.on}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
