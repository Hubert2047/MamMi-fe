"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CircleDollarSign, ClipboardList, Info, Landmark, Store } from "lucide-react";
import { getSuperAdminOverview, type SuperAdminOverviewStore } from "@/api/overview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";

const taipeiNow = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date())
    .replace(" ", "T");

function amount(value: number) {
  return `${value.toLocaleString()} TWD`;
}

type OverviewMetric = "revenue" | "expenses" | "orders" | "difference";

function MetricCell({ value, onInfo, ariaLabel, negative = false }: { value: string; onInfo: () => void; ariaLabel: string; negative?: boolean }) {
  return (
    <TableCell className={`text-right tabular-nums ${negative ? "font-semibold text-destructive" : ""}`}>
      <span className="inline-flex items-center justify-end gap-1">
        {value}
        <button type="button" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onInfo} aria-label={ariaLabel}>
          <Info className="size-3.5" />
        </button>
      </span>
    </TableCell>
  );
}

export default function AdminOverviewPage() {
  const { t } = useI18n();
  const initialNow = taipeiNow();
  const [from, setFrom] = useState(`${initialNow.slice(0, 10)}T00:00`);
  const [to, setTo] = useState(initialNow);
  const [selectedMetric, setSelectedMetric] = useState<{ store: SuperAdminOverviewStore; metric: OverviewMetric } | null>(null);
  const overview = useQuery({
    queryKey: ["superadmin-overview", from, to],
    queryFn: () => getSuperAdminOverview({ from, to }),
  });
  const data = overview.data;
  const cards = data
    ? [
        { label: t("overviewStores"), value: String(data.stores.length), icon: Store },
        { label: t("overviewRevenue"), value: amount(data.totals.revenue), icon: CircleDollarSign },
        { label: t("overviewExpenses"), value: amount(data.totals.expenses), icon: Landmark },
        { label: t("overviewOrders"), value: data.totals.orders.toLocaleString(), icon: ClipboardList },
      ]
    : [];

  return (
    <div className="h-full overflow-auto p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("overview")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-muted-foreground">{t("overviewFrom")}</label>
          <Input type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} className="w-52" />
          <label className="text-sm text-muted-foreground">{t("overviewTo")}</label>
          <Input type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} className="w-52" />
        </div>
      </div>
      {overview.isLoading ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">{t("loading")}</CardContent></Card>
      ) : overview.isError ? (
        <Card><CardContent className="p-6 text-sm text-destructive">{t("overviewLoadError")}</CardContent></Card>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="py-2">
                <CardContent className="flex items-center justify-between gap-3 px-5 py-2">
                  <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-xl font-bold tabular-nums">{value}</p></div>
                  <Icon className="size-7 text-primary" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mt-6">
            <CardHeader><CardTitle>{t("overviewByStore")}</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{t("overviewStore")}</TableHead><TableHead className="text-right">{t("overviewRevenue")}</TableHead><TableHead className="text-right">{t("overviewExpenses")}</TableHead><TableHead className="text-right">{t("overviewOrders")}</TableHead><TableHead className="text-right">{t("overviewDifference")}</TableHead><TableHead>{t("overviewClosingStatus")}</TableHead>
                </TableRow></TableHeader>
                <TableBody>{data.stores.map((store) => (
                  <TableRow key={store._id}>
                    <TableCell><div className="font-medium">{store.name}</div><div className="text-xs text-muted-foreground">{store.code}</div></TableCell>
                    <MetricCell value={amount(store.revenue)} ariaLabel={t("overviewRevenueInfo")} onInfo={() => setSelectedMetric({ store, metric: "revenue" })} />
                    <MetricCell value={amount(store.expenses)} ariaLabel={t("overviewExpensesInfo")} onInfo={() => setSelectedMetric({ store, metric: "expenses" })} />
                    <MetricCell value={store.orders.toLocaleString()} ariaLabel={t("overviewOrdersInfo")} onInfo={() => setSelectedMetric({ store, metric: "orders" })} />
                    <MetricCell value={amount(store.closingDifference)} ariaLabel={t("overviewDifferenceInfo")} negative={store.closingDifference !== 0} onInfo={() => setSelectedMetric({ store, metric: "difference" })} />
                    <TableCell>{store.closingCount > 0 ? <Badge variant="secondary">{t("overviewHasClosing")}</Badge> : <Badge variant="outline"><AlertTriangle className="mr-1" />{t("overviewNoClosing")}</Badge>}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
          <Dialog open={Boolean(selectedMetric)} onOpenChange={(open) => !open && setSelectedMetric(null)}>
            <DialogContent className="max-w-md">
              {selectedMetric && (
                <>
                  <DialogHeader>
                    <DialogTitle>{t("overviewDetailsTitle")}: {selectedMetric.store.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {selectedMetric.metric === "revenue" && <>
                      <DetailLine label={t("overviewOrderRevenue")} value={amount(selectedMetric.store.orderRevenue)} />
                      <p className="pt-1 text-sm font-medium">{t("overviewPaymentBreakdown")}</p>
                      {Object.entries(selectedMetric.store.orderRevenueByPayment).map(([method, value]) => (
                        <DetailLine key={method} label={t(method)} value={amount(value)} />
                      ))}
                      <DetailLine label={t("overviewOtherRevenue")} value={amount(selectedMetric.store.otherRevenue)} />
                      <DetailLine label={t("overviewRevenue")} value={amount(selectedMetric.store.revenue)} strong />
                    </>}
                    {selectedMetric.metric === "expenses" && <>
                      <DetailLine label={t("overviewInventoryExpenses")} value={amount(selectedMetric.store.inventoryExpenses)} />
                      <DetailLine label={t("overviewOtherExpenses")} value={amount(selectedMetric.store.otherExpenses)} />
                      <DetailLine label={t("overviewExpenses")} value={amount(selectedMetric.store.expenses)} strong />
                    </>}
                    {selectedMetric.metric === "orders" && <DetailLine label={t("overviewPaidOrders")} value={selectedMetric.store.orders.toLocaleString()} strong />}
                    {selectedMetric.metric === "difference" && <>
                      <DetailLine label={t("overviewDifference")} value={amount(selectedMetric.store.closingDifference)} strong />
                      <DetailLine label={t("overviewClosingCount")} value={selectedMetric.store.closingCount.toLocaleString()} />
                    </>}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  );
}

function DetailLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex justify-between gap-4 border-b pb-2 last:border-0 last:pb-0 ${strong ? "font-semibold" : ""}`}><span className="text-muted-foreground">{label}</span><span className="text-right tabular-nums">{value}</span></div>;
}
