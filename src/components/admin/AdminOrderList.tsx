"use client";

import { useMemo, useState } from "react";
import { Eye, RefreshCw } from "lucide-react";
import type { BaseOrder, IOrder } from "@/api/order";
import { useDailyClosingSummary, useOrders } from "@/hooks/queries";
import { useTablePageSize } from "@/hooks/use-table-page-size";
import { useI18n } from "@/lib/i18n";
import OrderDetailDialog from "@/components/orders/OrderDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

type StatusFilter = "all" | BaseOrder["status"];

const statusKey = {
  pending: "orderStatusPending",
  paid: "orderStatusPaid",
  cancelled: "orderStatusCancelled",
} as const;

const sourceKey = (source: BaseOrder["source"]) =>
  source === "online"
    ? "orderSourceOnline"
    : source === "qr"
      ? "orderSourceQr"
      : source === "uber"
        ? "uber"
        : source === "foodpanda"
          ? "foodpanda"
          : "orderSourcePos";

const typeKey = (type: BaseOrder["type"]) =>
  type === "dine_in" ? "dineIn" : type === "takeaway" ? "takeaway" : type;

export default function AdminOrderList() {
  const { t, locale } = useI18n();
  const { data: summary } = useDailyClosingSummary();
  const range = summary ? { from: summary.periodStart } : undefined;
  const ordersQuery = useOrders(range);
  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const { containerRef, pageSize } = useTablePageSize(52, 100);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesStatus = status === "all" || order.status === status;
        const matchesSearch =
          !search.trim() || String(order.number).includes(search.trim());
        return matchesStatus && matchesSearch;
      }),
    [orders, search, status],
  );
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const formatDate = (value: Date | string | undefined) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "short",
          timeStyle: "short",
          hourCycle: "h23",
        }).format(new Date(value))
      : "-";

  return (
    <div className="h-full overflow-hidden p-6 md:p-8">
      <div className="mb-6 flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("adminOrdersTitle")}
        </h1>
      </div>
      <Card
        ref={containerRef}
        className="flex h-[calc(100svh-180px)] min-h-0 flex-col overflow-hidden [&>div:last-child]:flex-1 [&>div:last-child]:min-h-0 [&>div:last-child]:overflow-hidden [&>div:last-child>div]:h-full [&>div:last-child>div]:!max-h-none"
      >
        <CardHeader className="block shrink-0 border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-1 lg:flex-nowrap">
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as StatusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue placeholder={t("orderStatusFilter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allOrders")}</SelectItem>
                  <SelectItem value="paid">{t("paidOrders")}</SelectItem>
                  <SelectItem value="pending">{t("pendingPayment")}</SelectItem>
                  <SelectItem value="cancelled">
                    {t("cancelledOrders")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="h-8 w-48"
                placeholder={t("searchOrder")}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
              <Button
                className="h-8 w-8 p-0"
                size="sm"
                variant="outline"
                aria-label={t("refreshOrders")}
                title={t("refreshOrders")}
                onClick={() => void ordersQuery.refetch()}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
            <div className="order-last ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap">
              <span className="mr-2 text-xs text-muted-foreground">
                {t("adminOrdersTotal")}: {filteredOrders.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentPage}/{totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                ‹
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                ›
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 p-0">
          {ordersQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">
              {t("loading")}
            </div>
          ) : ordersQuery.isError ? (
            <div className="p-6 text-sm text-destructive">
              {t("adminOrdersLoadError")}
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {t("adminOrdersNoData")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("orderNumber")}</TableHead>
                  <TableHead>{t("adminOrdersTime")}</TableHead>
                  <TableHead>{t("orderSource")}</TableHead>
                  <TableHead>{t("orderStatus")}</TableHead>
                  <TableHead className="text-right">{t("total")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">
                      #{order.number}
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      {t(sourceKey(order.source))} · {t(typeKey(order.type))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {t(statusKey[order.status])}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {order.totalPrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="size-4" />
                        {t("adminOrdersView")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <OrderDetailDialog
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
