"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  createExpenseUnit,
  getExpenseUnits,
  updateExpenseUnit,
  type ExpenseUnit,
} from "@/api/expense";
import { useI18n } from "@/lib/i18n";
import { useTablePageSize } from "@/hooks/use-table-page-size";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Copy = {
  title: string;
  addTitle: string;
  editTitle: string;
  code: string;
  codeHeader: string;
  nameHeader: string;
  vi: string;
  en: string;
  zh: string;
  group: string;
  count: string;
  weight: string;
  volume: string;
  add: string;
  update: string;
  list: string;
  total: string;
  page: string;
  previous: string;
  next: string;
  off: string;
  on: string;
  edit: string;
  actions: string;
  cancel: string;
};
const texts: Record<"vi" | "en" | "zh-TW", Copy> = {
  vi: {
    title: "Đơn Vị",
    addTitle: "Thêm đơn vị",
    editTitle: "Sửa đơn vị",
    code: "Mã đơn vị, ví dụ: tray",
    codeHeader: "Mã đơn vị",
    nameHeader: "Tên",
    vi: "Tên tiếng Việt",
    en: "Tên tiếng Anh",
    zh: "Tên tiếng Trung",
    group: "Nhóm",
    count: "Số lượng",
    weight: "Khối lượng",
    volume: "Thể tích",
    add: "Thêm đơn vị",
    update: "Cập nhật",
    list: "Danh sách đơn vị",
    total: "Tổng cộng",
    page: "Trang",
    previous: "Trước",
    next: "Sau",
    off: "Tắt sử dụng",
    on: "Bật sử dụng",
    edit: "Sửa",
    actions: "Thao Tác",
    cancel: "Hủy",
  },
  en: {
    title: "Units",
    addTitle: "Add unit",
    editTitle: "Edit unit",
    code: "Unit code, e.g. tray",
    codeHeader: "Unit code",
    nameHeader: "Name",
    vi: "Vietnamese name",
    en: "English name",
    zh: "Chinese name",
    group: "Group",
    count: "Count",
    weight: "Weight",
    volume: "Volume",
    add: "Add unit",
    update: "Update",
    list: "Unit list",
    total: "Total",
    page: "Page",
    previous: "Previous",
    next: "Next",
    off: "Disable",
    on: "Enable",
    edit: "Edit",
    actions: "Actions",
    cancel: "Cancel",
  },
  "zh-TW": {
    title: "單位",
    addTitle: "新增單位",
    editTitle: "編輯單位",
    code: "單位代碼，例如 tray",
    codeHeader: "單位代碼",
    nameHeader: "名稱",
    vi: "越南文名稱",
    en: "英文名稱",
    zh: "中文名稱",
    group: "類別",
    count: "數量",
    weight: "重量",
    volume: "體積",
    add: "新增單位",
    update: "更新",
    list: "單位清單",
    total: "總計",
    page: "頁",
    previous: "上一頁",
    next: "下一頁",
    off: "停用",
    on: "啟用",
    edit: "編輯",
    actions: "操作",
    cancel: "取消",
  },
};
const duplicateMessages = {
  vi: "Mã đơn vị đã tồn tại",
  en: "Unit code already exists",
  "zh-TW": "單位代碼已存在",
} as const;
const saveErrorMessages = {
  vi: "Không thể lưu đơn vị",
  en: "Unable to save unit",
  "zh-TW": "無法儲存單位",
} as const;
const empty = {
  code: "",
  vi: "",
  en: "",
  zh: "",
  category: "count" as ExpenseUnit["category"],
};

export default function UnitManagement() {
  const { locale } = useI18n();
  const t = texts[locale];
  const client = useQueryClient();
  const { data: units = [] } = useQuery({
    queryKey: ["expense-units-all"],
    queryFn: () => getExpenseUnits(true),
  });
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<ExpenseUnit | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // Use the actual card/table headers so the last row is not clipped.
  const { containerRef, pageSize } = useTablePageSize(
    38,
    100,
    undefined,
    true,
    5,
    true,
  );
  const reset = () => {
    setForm(empty);
    setEditing(null);
    setOpen(false);
  };
  const edit = (unit: ExpenseUnit) => {
    setEditing(unit);
    setForm({
      code: unit.code,
      vi: unit.names.vi,
      en: unit.names.en,
      zh: unit.names["zh-TW"],
      category: unit.category,
    });
    setOpen(true);
  };
  const save = useMutation({
    mutationFn: () =>
      editing
        ? updateExpenseUnit({
            id: editing._id,
            data: {
              names: { vi: form.vi, en: form.en, "zh-TW": form.zh },
              category: form.category,
            },
          })
        : createExpenseUnit({
            code: form.code.trim().toLowerCase(),
            names: { vi: form.vi, en: form.en, "zh-TW": form.zh },
            category: form.category,
            active: true,
          }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["expense-units"] });
      void client.invalidateQueries({ queryKey: ["expense-units-all"] });
      reset();
    },
    onError: (error: unknown) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        toast.error(duplicateMessages[locale]);
        return;
      }
      toast.error(saveErrorMessages[locale]);
    },
  });
  const toggle = useMutation({
    mutationFn: (unit: ExpenseUnit) =>
      updateExpenseUnit({ id: unit._id, data: { active: !unit.active } }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["expense-units"] });
      void client.invalidateQueries({ queryKey: ["expense-units-all"] });
    },
  });
  const normalizeSearchText = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const filteredUnits = useMemo(() => {
    const query = normalizeSearchText(search.trim());
    if (!query) return units;
    return units.filter((unit) =>
      normalizeSearchText(
        `${unit.names[locale] || unit.names.vi || unit.code} ${unit.code}`,
      ).includes(query),
    );
  }, [locale, search, units]);
  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filteredUnits.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);
  useEffect(() => setPage(1), [search]);
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-6 md:p-8">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <Button
          onClick={() => {
            setForm(empty);
            setEditing(null);
            setOpen(true);
          }}
        >
          {t.addTitle}
        </Button>
      </div>
      <Card
        ref={containerRef}
        data-table-header-align="left"
        className="flex h-[calc(100svh-5rem)] min-h-0 flex-1 flex-col overflow-hidden"
      >
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.nameHeader}
              aria-label={t.nameHeader}
              className="h-8 w-36 sm:w-52"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal text-muted-foreground">
                {t.total}: {units.length} · {currentPage}/{totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                {t.previous}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                {t.next}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.nameHeader}</TableHead>
                <TableHead>{t.codeHeader}</TableHead>
                <TableHead>{t.group}</TableHead>
                <TableHead>{t.on}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((unit) => (
                <TableRow key={unit._id}>
                  <TableCell className="font-medium">
                    {unit.names[locale] || unit.names.vi || unit.code}
                  </TableCell>
                  <TableCell className="font-mono">{unit.code}</TableCell>
                  <TableCell>{unit.category}</TableCell>
                  <TableCell>{unit.active ? t.on : t.off}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => edit(unit)}
                      >
                        {t.edit}
                      </Button>
                      <Button
                        size="sm"
                        variant={unit.active ? "outline" : "default"}
                        onClick={() => toggle.mutate(unit)}
                      >
                        {unit.active ? t.off : t.on}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={(value) => !value && reset()}>
        <DialogContent className="top-4 max-h-[calc(100dvh-2rem)] translate-y-0 overflow-y-auto sm:top-8 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? t.editTitle : t.addTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t.code}</Label>
              <Input
                value={form.code}
                disabled={Boolean(editing)}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.group}</Label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
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
            </div>
            <div className="space-y-1.5">
              <Label>{t.vi}</Label>
              <Input
                value={form.vi}
                onChange={(e) => setForm({ ...form, vi: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.en}</Label>
              <Input
                value={form.en}
                onChange={(e) => setForm({ ...form, en: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.zh}</Label>
              <Input
                value={form.zh}
                onChange={(e) => setForm({ ...form, zh: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={reset}>
              {t.cancel}
            </Button>
            <Button
              disabled={!form.code || !form.vi || !form.en || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? t.update : editing ? t.update : t.addTitle}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
