"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Search } from "lucide-react";
import {
  getDailyClosings,
  voidDailyClosing,
  type IDailyClosing,
} from "@/api/daily-closing";
import { getEmployees, type Employee } from "@/api/employee";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/auth";
import { useTablePageSize } from "@/hooks/use-table-page-size";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type StatusFilter = "all" | "confirmed" | "voided";

function getPeriodStart(closing: IDailyClosing) {
  return closing.periodStart ?? closing.createdAt;
}

function getPeriodEnd(closing: IDailyClosing) {
  return closing.periodEnd ?? closing.createdAt;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
        timeStyle: "short",
        hourCycle: "h23",
      }).format(date);
}

function formatAmount(value?: number) {
  return Number(value ?? 0).toLocaleString();
}

function getDifference(closing: IDailyClosing) {
  return closing.difference ?? closing.actualTotal - closing.systemAmount;
}

export default function DailyClosingHistory() {
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const { containerRef, pageSize } = useTablePageSize(60, 100);
  const [selectedDetail, setSelectedDetail] = useState<IDailyClosing | null>(
    null,
  );
  const [selectedEmployeeClosing, setSelectedEmployeeClosing] =
    useState<IDailyClosing | null>(null);
  const [selectedVoid, setSelectedVoid] = useState<IDailyClosing | null>(null);
  const [reason, setReason] = useState("");
  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";
  const employees = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    enabled: isAdmin,
  });
  const history = useQuery({
    queryKey: [
      "daily-closing-history",
      { fromDate, toDate, status, page, pageSize },
    ],
    queryFn: () =>
      getDailyClosings({
        from: fromDate || undefined,
        to: toDate || undefined,
        status: status === "all" ? undefined : status,
        page,
        limit: pageSize,
      }),
  });
  const records = history.data?.data ?? [];
  const latestConfirmedId = history.data?.summary.latestConfirmedId;
  const selectedEmployee = selectedEmployeeClosing?.confirmedByEmployee
    ? employees.data?.find(
        (employee) =>
          employee._id === selectedEmployeeClosing.confirmedByEmployee?.employeeId,
      )
    : undefined;

  const voidMutation = useMutation({
    mutationFn: voidDailyClosing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-closing-history"] });
      queryClient.invalidateQueries({ queryKey: ["daily-closing-summary"] });
      setSelectedVoid(null);
      setReason("");
      toast.success(t("voidSuccess"));
    },
    onError: () => toast.error(t("voidFailure")),
  });

  function openVoid(closing: IDailyClosing) {
    setSelectedDetail(null);
    setSelectedVoid(closing);
    setReason("");
  }

  function clearFilters() {
    setStatus("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return (
    <div className="h-full overflow-hidden p-6 md:p-8">
      <div className="mb-6 flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("dailyClosing")}
        </h1>
      </div>

      <Card
        ref={containerRef}
        className="flex h-[calc(100svh-80px)] min-h-0 flex-col overflow-hidden [&>div:last-child]:flex-1 [&>div:last-child]:min-h-0 [&>div:last-child]:overflow-hidden [&>div:last-child>div]:h-full [&>div:last-child>div]:!max-h-none"
      >
        <CardHeader className="block shrink-0 border-b">
          <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
            <div className="flex min-w-0 w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-1 lg:flex-nowrap">
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as StatusFilter)}
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue placeholder={t("closingFilterStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("closingFilterAll")}</SelectItem>
                  <SelectItem value="confirmed">
                    {t("closingFilterConfirmed")}
                  </SelectItem>
                  <SelectItem value="voided">
                    {t("closingFilterVoided")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t("closingFilterFrom")}
                </span>
                <Input
                  type="datetime-local"
                  value={fromDate}
                  aria-label={t("closingFilterFrom")}
                  onChange={(event) => {
                    setFromDate(event.target.value);
                    setPage(1);
                  }}
                  className="h-8 w-52"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t("closingFilterTo")}
                </span>
                <Input
                  type="datetime-local"
                  value={toDate}
                  aria-label={t("closingFilterTo")}
                  onChange={(event) => {
                    setToDate(event.target.value);
                    setPage(1);
                  }}
                  className="h-8 w-52"
                />
              </div>
              <Button
                size="sm"
                className="h-8 w-8 p-0"
                aria-label={t("closingSearch")}
                onClick={() => {
                  setPage(1);
                  void history.refetch();
                }}
              >
                <Search className="size-4" />
              </Button>
              {(status !== "all" || fromDate || toDate) && (
                <Button variant="ghost" onClick={clearFilters}>
                  {t("closingFilterReset")}
                </Button>
              )}
            </div>
            <div className="order-last ml-auto flex w-full shrink-0 items-center justify-end gap-1 whitespace-nowrap lg:w-auto">
              <span className="mr-2 text-xs text-muted-foreground">
                {t("closingTotal")}: {history.data?.pagination.total ?? 0}
              </span>
              {history.data && (
                <>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {history.data.pagination.page}/
                    {history.data.pagination.pages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    ‹
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= history.data.pagination.pages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    ›
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 p-0">
          {history.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">
              {t("loading")}
            </div>
          ) : history.isError ? (
            <div className="p-6 text-sm text-destructive">
              {t("closingLoadError")}
            </div>
          ) : records.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {t("closingNoData")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("closingPeriod")}</TableHead>
                  <TableHead>{t("closingStatus")}</TableHead>
                  <TableHead>{t("closingEmployee")}</TableHead>
                  <TableHead className="text-right">
                    {t("closingSystemAmount")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("closingActualAmount")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("closingDifference")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("closingAction")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((closing) => {
                  const isConfirmed =
                    (closing.status ?? "confirmed") === "confirmed";
                  const canVoid =
                    isAdmin && isConfirmed && latestConfirmedId === closing._id;
                  return (
                    <TableRow
                      key={closing._id}
                      className="cursor-pointer"
                      onClick={() => setSelectedDetail(closing)}
                    >
                      <TableCell>
                        <div className="font-medium">
                          {formatDate(getPeriodStart(closing))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          → {formatDate(getPeriodEnd(closing))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isConfirmed ? "secondary" : "destructive"}
                        >
                          {isConfirmed
                            ? t("closingConfirmed")
                            : t("closingVoided")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {closing.confirmedByEmployee ? (
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">
                                {closing.confirmedByEmployee.name}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={t("closingEmployeeView")}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedEmployeeClosing(closing);
                              }}
                            >
                              <Eye className="size-4" />
                            </Button>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(closing.systemAmount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(closing.actualTotal)}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${getDifference(closing) === 0 ? "text-muted-foreground" : "font-semibold text-destructive"}`}
                      >
                        {formatAmount(getDifference(closing))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={t("detail")}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedDetail(closing);
                            }}
                          >
                            {t("detail")}
                          </Button>
                          {canVoid && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                openVoid(closing);
                              }}
                            >
                              {t("voidClosing")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(selectedDetail)}
        onOpenChange={(open) => {
          if (!open) setSelectedDetail(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedDetail && (
            <>
              <DialogHeader>
                <DialogTitle>{t("closingDetailsTitle")}</DialogTitle>
                <DialogDescription>
                  {formatDate(getPeriodStart(selectedDetail))} →{" "}
                  {formatDate(getPeriodEnd(selectedDetail))}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail
                  label={t("closingStatus")}
                  value={
                    (selectedDetail.status ?? "confirmed") === "confirmed"
                      ? t("closingConfirmed")
                      : t("closingVoided")
                  }
                />
                <Detail
                  label={t("closingSystemAmount")}
                  value={formatAmount(selectedDetail.systemAmount)}
                />
                <Detail
                  label={t("closingActualAmount")}
                  value={formatAmount(selectedDetail.actualTotal)}
                />
                <Detail
                  label={t("closingDifference")}
                  value={formatAmount(getDifference(selectedDetail))}
                />
                <Detail
                  label={t("closingCashSales")}
                  value={formatAmount(selectedDetail.cashSales)}
                />
                <Detail
                  label={t("closingOtherRevenue")}
                  value={formatAmount(selectedDetail.otherRevenueTotal)}
                />
                <Detail
                  label={t("closingExpenses")}
                  value={formatAmount(selectedDetail.expensesTotal)}
                />
                <Detail
                  label={t("closingPreviousAmount")}
                  value={formatAmount(selectedDetail.previousClosingAmount)}
                />
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-2 text-sm font-semibold">
                  {t("closingAtClosingTime")}
                </p>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <Detail
                    label={t("closingConfirmedAt")}
                    value={formatDate(selectedDetail.confirmedAt)}
                  />
                  <Detail
                    label={t("closingEmployee")}
                    value={
                      selectedDetail.confirmedByEmployee
                        ? `${selectedDetail.confirmedByEmployee.name} (${selectedDetail.confirmedByEmployee.numberId})`
                        : "-"
                    }
                  />
                  {selectedDetail.status === "voided" && (
                    <>
                      <Detail
                        label={t("closingVoidedAt")}
                        value={formatDate(selectedDetail.voidedAt)}
                      />
                      <Detail
                        label={t("closingVoidedBy")}
                        value={selectedDetail.voidedBy ?? "-"}
                      />
                      <Detail
                        label={t("closingVoidReason")}
                        value={selectedDetail.voidReason ?? "-"}
                      />
                    </>
                  )}
                </div>
              </div>
              {isAdmin &&
                (selectedDetail.status ?? "confirmed") === "confirmed" &&
                latestConfirmedId === selectedDetail._id && (
                  <Button
                    variant="destructive"
                    onClick={() => openVoid(selectedDetail)}
                  >
                    {t("voidClosing")}
                  </Button>
                )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedEmployeeClosing)}
        onOpenChange={(open) => {
          if (!open) setSelectedEmployeeClosing(null);
        }}
      >
        <DialogContent className="max-w-lg">
          {selectedEmployeeClosing?.confirmedByEmployee && (
            <>
              <DialogHeader>
                <DialogTitle>{t("closingEmployeeDetailsTitle")}</DialogTitle>
                <DialogDescription>
                  {t("closingEmployeeDetailsDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-3 text-sm font-semibold">
                  {t("closingEmployeeAtClosing")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Detail
                    label={t("closingEmployeeName")}
                    value={selectedEmployeeClosing.confirmedByEmployee.name}
                  />
                  <Detail
                    label={t("closingEmployeeNumberId")}
                    value={selectedEmployeeClosing.confirmedByEmployee.numberId}
                  />
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="mb-3 text-sm font-semibold">
                  {t("closingEmployeeCurrent")}
                </p>
                {selectedEmployee ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail
                      label={t("closingEmployeeName")}
                      value={selectedEmployee.name}
                    />
                    <Detail
                      label={t("closingEmployeeNumberId")}
                      value={selectedEmployee.numberId}
                    />
                    <Detail
                      label={t("closingEmployeeStatus")}
                      value={
                        selectedEmployee.active
                          ? t("closingEmployeeActive")
                          : t("closingEmployeeInactive")
                      }
                    />
                    <Detail
                      label={t("closingEmployeeRole")}
                      value={
                        selectedEmployee.role === "manager"
                          ? t("closingEmployeeManager")
                          : t("closingEmployeeStaff")
                      }
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("closingEmployeeUnavailable")}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(selectedVoid)}
        onOpenChange={(open) => {
          if (!open) setSelectedVoid(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("voidClosingTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("voidClosingDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("voidReasonPlaceholder")}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={!reason.trim() || voidMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (selectedVoid)
                  voidMutation.mutate({ id: selectedVoid._id, reason });
              }}
            >
              {t("voidClosing")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
