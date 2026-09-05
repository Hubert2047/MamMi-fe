"use client";

import { ExpenseTable } from "@/components/expense/ExpenseTable";
import { useExpenses } from "@/hooks/queries";
import { useI18n } from "@/lib/i18n";
import type { ExpenseRange } from "@/api/expense";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

function getTodayExpenseRange(): ExpenseRange {
  const now = new Intl.DateTimeFormat("sv-SE", {
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
  return {
    from: `${now.slice(0, 10)}T00:00:00+08:00`,
    to: new Date().toISOString(),
  };
}

export default function ExpensesPage() {
  const { t } = useI18n();
  const [range, setRange] = useState<ExpenseRange>({});
  useEffect(() => {
    const frame = requestAnimationFrame(() => setRange(getTodayExpenseRange()));
    return () => cancelAnimationFrame(frame);
  }, []);
  const { data: expenses = [], isLoading, isFetching } = useExpenses(range);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 md:p-6">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("expenses")}
          </h1>
        </div>
        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            {t("loading")}...
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 rounded-lg border bg-background p-3 shadow-sm md:p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin text-primary" />
            {t("loading")}...
          </div>
        ) : (
          <ExpenseTable
            expenses={expenses}
            range={range}
            onRangeChange={setRange}
            rangeMode="admin"
          />
        )}
      </div>
    </div>
  );
}
