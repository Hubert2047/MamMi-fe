import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  deleteExpense,
  type Expense,
  type ExpenseRange,
  type IUpdateExpense,
} from "@/api/expense";
import { deleteInventoryReceipt } from "@/api/inventory";
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
} from "../ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { EditExpenses } from "@/components/expense/EditExpenses.tsx";
import { toast } from "sonner";
import { AddExpenseDialog } from "@/components/expense/AddExpenseDialog.tsx";
import { useI18n } from "@/lib/i18n";

type Props = {
  expenses: Expense[];
  showOnly?: boolean;
  range?: ExpenseRange;
  onRangeChange?: (range: ExpenseRange) => void;
};

export function ExpenseTable({
  expenses,
  showOnly = false,
  range,
  onRangeChange,
}: Props) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [addExpense, setAddExpense] = useState<boolean>(false);
  const [addExpenseType, setAddExpenseType] = useState<
    "other" | "inventory_purchase"
  >("other");
  const [editData, setEditData] = useState<IUpdateExpense | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [currentTime] = useState(() => new Date().toISOString());
  const tableRef = useRef<HTMLDivElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const dateInputValue = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
  const dateInputToIso = (value: string) =>
    value ? new Date(value).toISOString() : undefined;
  const formatDateTime = (value?: string) =>
    new Intl.DateTimeFormat(locale === "zh-TW" ? "zh-TW" : locale, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value || currentTime));
  const expenseTypeLabel = (expense: Expense) => {
    if (expense.type === "inventory_purchase")
      return locale === "en"
        ? "Ingredient"
        : locale === "zh-TW"
          ? "原料"
          : "Nguyên liệu";
    const labels =
      locale === "en"
        ? {
            utilities: "Utilities",
            rent: "Rent",
            transport: "Transport",
            maintenance: "Maintenance",
            salary: "Salary",
            other: "Other",
          }
        : locale === "zh-TW"
          ? {
              utilities: "水電",
              rent: "租金",
              transport: "運輸",
              maintenance: "維修",
              salary: "薪資",
              other: "其他",
            }
          : {
              utilities: "Điện nước",
              rent: "Thuê mặt bằng",
              transport: "Vận chuyển",
              maintenance: "Sửa chữa",
              salary: "Nhân sự",
              other: "Khác",
            };
    return labels[expense.category as keyof typeof labels] || labels.other;
  };
  const filteredOrders = expenses.filter((o) => {
    if (!search) return true;
    return o.name.toString().includes(search.trim());
  });
  const totalPrice = expenses.reduce((acc, i) => acc + i.price, 0);
  useEffect(() => {
    const element = tableRef.current;
    if (!element) return;
    const resize = () => {
      const toolbarHeight =
        element
          .querySelector<HTMLElement>("[data-expense-toolbar]")
          ?.getBoundingClientRect().height ?? 148;
      const tableHeaderHeight =
        element.querySelector<HTMLElement>("thead")?.getBoundingClientRect()
          .height ?? 48;
      const rows = Array.from(
        element.querySelectorAll<HTMLElement>("tbody tr"),
      );
      const rowHeight = rows.length
        ? Math.max(...rows.map((row) => row.getBoundingClientRect().height))
        : 52;
      const calculatedPageSize = Math.floor(
        (element.clientHeight - toolbarHeight - tableHeaderHeight - 8) /
          Math.max(rowHeight, 52),
      );
      setPageSize(Math.min(10, Math.max(1, calculatedPageSize)));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    element
      .querySelectorAll<HTMLElement>("tbody tr")
      .forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [expenses.length, page, pageSize, search]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  function handleEditData(data: IUpdateExpense) {
    setEditData(data);
    setOpenEdit(true);
  }

  const deleteMutation = useMutation({
    mutationFn: (expense: Expense) =>
      expense.type === "inventory_purchase" && expense.receiptId
        ? deleteInventoryReceipt(expense.receiptId)
        : deleteExpense(expense._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] }).then();
      toast.success(t("deleteSuccess"));
    },
    onError: () => {
      toast.error(t("deleteFailure"));
    },
  });
  const handleDelete = (expense: Expense) => {
    deleteMutation.mutate(expense);
  };
  return (
    <div
      ref={tableRef}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div data-expense-toolbar className="mb-2 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-lg">{t("totalExpense")}</span>
          <Input
            value={totalPrice.toLocaleString()}
            disabled
            className="w-48"
          />
          {range && (
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {locale === "en"
                ? "Period:"
                : locale === "zh-TW"
                  ? "期間："
                  : "Kỳ:"}{" "}
              {formatDateTime(range.from)} → {formatDateTime(range.to)}
            </span>
          )}
          <Input
            placeholder={t("searchExpense")}
            value={search}
            onChange={handleSearchChange}
            className="w-48"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
            >
              {t("delete")}
            </Button>
          )}
          {!showOnly && (
            <Button
              className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setAddExpenseType("other");
                setAddExpense(true);
              }}
            >
              {t("addExpense")}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {range && (
            <>
              <span className="text-xs text-muted-foreground">
                {locale === "en" ? "From" : locale === "zh-TW" ? "從" : "Từ"}
              </span>
              <Input
                disabled={!onRangeChange}
                ref={fromInputRef}
                type="datetime-local"
                className="h-8 w-48 px-2 text-xs"
                defaultValue={dateInputValue(range.from)}
                key={`from-${range.from}`}
              />
              <span className="text-xs text-muted-foreground">
                {locale === "en" ? "to" : locale === "zh-TW" ? "至" : "đến"}
              </span>
              <Input
                disabled={!onRangeChange}
                ref={toInputRef}
                type="datetime-local"
                className="h-8 w-48 px-2 text-xs"
                defaultValue={dateInputValue(range.to || currentTime)}
                key={`to-${range.to || "current"}`}
              />
              <Button
                disabled={!onRangeChange}
                size="sm"
                onClick={() =>
                  onRangeChange?.({
                    from: dateInputToIso(fromInputRef.current?.value || ""),
                    to: dateInputToIso(toInputRef.current?.value || ""),
                  })
                }
              >
                {locale === "en"
                  ? "Search"
                  : locale === "zh-TW"
                    ? "搜尋"
                    : "Tìm"}
              </Button>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="whitespace-nowrap text-sm text-gray-500">
              {filteredOrders.length} {t("expenseCount")} • {t("page")}{" "}
              {currentPage}/{totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={currentPage >= totalPages}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      </div>
      <Table>
        <TableHeader className="sticky top-0  z-10">
          <TableRow>
            <TableHead>{t("expenseName")}</TableHead>
            <TableHead className="whitespace-nowrap">
              {locale === "en"
                ? "Time"
                : locale === "zh-TW"
                  ? "時間"
                  : "Thời gian"}
            </TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>{t("expenseQuantity")}</TableHead>
            <TableHead>{t("expenseUnit")}</TableHead>
            <TableHead>{t("expenseUnitPrice")}</TableHead>
            <TableHead>{t("expenseTotal")}</TableHead>
            <TableHead>{t("expenseNote")}</TableHead>
            {!showOnly && <TableHead>{t("expenseActions")}</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedOrders.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                {t("noExpenseFound")}
              </TableCell>
            </TableRow>
          )}
          {paginatedOrders.map((exp) => {
            const isDeleting =
              deleteMutation.isPending &&
              deleteMutation.variables?._id === exp._id;
            return (
              <TableRow key={exp._id} className="h-14">
                <TableCell>{exp.name}</TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDateTime(exp.createdAt)}
                </TableCell>
                <TableCell>{expenseTypeLabel(exp)}</TableCell>
                <TableCell>{exp.quantity ?? 1}</TableCell>
                <TableCell>{exp.unit || "—"}</TableCell>
                <TableCell>
                  {(exp.unitPrice ?? exp.price).toLocaleString()}
                </TableCell>
                <TableCell>{exp.price.toLocaleString()}</TableCell>
                <TableCell>{exp.note}</TableCell>
                {!showOnly && (
                  <TableCell>
                    <Button
                      variant="default"
                      className="h-10 w-20 px-3 text-base"
                      onClick={() => handleEditData(exp)}
                    >
                      {t("edit")}
                    </Button>

                    {/* Confirm Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="ml-2 h-10 w-20 px-3 text-base"
                          variant="destructive"
                          disabled={isDeleting}
                        >
                          {t("delete")}
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent className="max-w-sm p-4">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-black!">
                            {t("confirmDelete")}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("deleteDescription")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>

                          <AlertDialogAction
                            onClick={() => handleDelete(exp)}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isDeleting ? t("deleting") : t("delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {openEdit && editData && (
        <EditExpenses
          editData={editData}
          setEditData={setEditData}
          open={openEdit}
          onClose={() => {
            setOpenEdit(false);
          }}
        />
      )}
      {addExpense && (
        <AddExpenseDialog
          initialEntryType={addExpenseType}
          open={addExpense}
          onClose={() => setAddExpense(false)}
        />
      )}
    </div>
  );
}
