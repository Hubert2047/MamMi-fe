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
import { toast } from "sonner";
import {
  deleteRevenue,
  type IUpdateRevenue,
  type Revenue,
  type RevenueRange,
} from "@/api/other-revenue.ts";
import { EditOtherRevenue } from "@/components/other-revenue/EditOtherRevenue.tsx";
import { AddOtherRevenue } from "@/components/other-revenue/AddOtherRevenue.tsx";
import { useI18n } from "@/lib/i18n";
import {
  RevenueRangeControls,
  type RevenueRangeMode,
} from "@/components/other-revenue/RevenueRangeControls";

type Props = {
  revenues: Revenue[];
  showOnly?: boolean;
  range?: RevenueRange;
  onRangeChange?: (range: RevenueRange) => void;
  rangeMode?: RevenueRangeMode;
};

const revenuePaymentMethodMessageKeys = {
  cash: "paymentCash",
  bank_transfer: "paymentBank",
  other: "paymentOther",
} as const;

export function OtherRevenueTable({
  revenues,
  showOnly = false,
  range,
  onRangeChange,
  rangeMode = "pos",
}: Props) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [addRevenue, setAddRevenue] = useState<boolean>(false);
  const [editData, setEditData] = useState<IUpdateRevenue | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [currentTime] = useState(() => new Date().toISOString());
  const tableRef = useRef<HTMLDivElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const filteredOrders = revenues.filter((o) => {
    if (!search) return true;
    return o.name.toString().includes(search.trim());
  });
  const totalPrice = revenues.reduce((acc, i) => acc + i.price, 0);
  const dateInputValue = (value?: string) => {
    const date = new Date(value || currentTime);
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
      hourCycle: "h23",
    }).format(new Date(value || currentTime));
  useEffect(() => {
    const element = tableRef.current;
    if (!element) return;
    const resize = () => {
      const toolbarHeight =
        element
          .querySelector<HTMLElement>("[data-revenue-toolbar]")
          ?.getBoundingClientRect().height ?? 148;
      const headerHeight =
        element.querySelector<HTMLElement>("thead")?.getBoundingClientRect()
          .height ?? 48;
      const rows = Array.from(
        element.querySelectorAll<HTMLElement>("tbody tr"),
      );
      const rowHeight = rows.length
        ? Math.max(...rows.map((row) => row.getBoundingClientRect().height))
        : 52;
      setPageSize(
        Math.min(
          16,
          Math.max(
            1,
            Math.floor(
              (element.clientHeight - toolbarHeight - headerHeight - 8) /
                Math.max(rowHeight, 52),
            ),
          ),
        ),
      );
    };
    resize();
    const resizeTimer = window.setTimeout(resize, 80);
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    element
      .querySelectorAll<HTMLElement>("tbody tr")
      .forEach((row) => observer.observe(row));
    return () => {
      window.clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [page, pageSize, revenues.length, search]);
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

  function handleEditData(data: IUpdateRevenue) {
    setEditData(data);
    setOpenEdit(true);
  }

  const deleteMutation = useMutation({
    mutationFn: deleteRevenue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] }).then();
      toast.success(t("deleteSuccess"));
    },
    onError: () => {
      toast.error(t("deleteFailure"));
    },
  });
  const handleDeleteRevenue = (id: string) => {
    deleteMutation.mutate(id);
  };
  return (
    <div
      ref={tableRef}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div data-revenue-toolbar className="mb-2 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-md">{t("totalOtherRevenue")}</span>
          <Input
            value={totalPrice.toLocaleString()}
            disabled
            className="w-48"
          />
          {rangeMode === "pos" && range && (
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
            placeholder={t("searchRevenue")}
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
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setAddRevenue(true)}
          >
            {t("addRevenue")}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {rangeMode === "pos" && range && (
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
          {rangeMode === "admin" && (
            <RevenueRangeControls
              mode={rangeMode}
              range={range}
              onRangeChange={onRangeChange}
            />
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="whitespace-nowrap text-sm text-gray-500">
              {filteredOrders.length} {t("revenueCount")} • {t("page")}{" "}
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
        <TableHeader className="sticky top-0 z-10">
          <TableRow>
            <TableHead>{t("revenueName")}</TableHead>
            <TableHead className="whitespace-nowrap">
              {locale === "en"
                ? "Time"
                : locale === "zh-TW"
                  ? "時間"
                  : "Thời gian"}
            </TableHead>
            <TableHead>{t("price")}</TableHead>
            <TableHead>{t("paymentMethod")}</TableHead>
            <TableHead>{t("note")}</TableHead>
            {!showOnly && <TableHead>{t("actions")}</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedOrders.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={showOnly ? 5 : 6}
                className="py-8 text-center text-gray-400"
              >
                {t("noRevenueFound")}
              </TableCell>
            </TableRow>
          )}
          {paginatedOrders.map((exp) => {
            const isDeleting =
              deleteMutation.isPending && deleteMutation.variables === exp._id;
            return (
              <TableRow key={exp._id} className="h-14">
                <TableCell>{exp.name}</TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDateTime(exp.createdAt)}
                </TableCell>
                <TableCell>{exp.price.toLocaleString()}</TableCell>
                <TableCell>
                  {t(
                    revenuePaymentMethodMessageKeys[
                      exp.paymentMethod ?? "other"
                    ],
                  )}
                </TableCell>
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
                            onClick={() => handleDeleteRevenue(exp._id)}
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
        <EditOtherRevenue
          editData={editData}
          setEditData={setEditData}
          open={openEdit}
          onClose={() => {
            setOpenEdit(false);
          }}
        />
      )}
      {addRevenue && (
        <AddOtherRevenue
          open={addRevenue}
          onClose={() => setAddRevenue(false)}
        />
      )}
    </div>
  );
}
