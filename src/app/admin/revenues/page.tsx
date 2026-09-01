"use client";

import type { RevenueRange } from "@/api/other-revenue";
import { OtherRevenueTable } from "@/components/other-revenue/OtherRevenueTable";
import { useDailyClosingSummary, useRevenues } from "@/hooks/queries";
import { useI18n } from "@/lib/i18n";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function RevenuesPage() {
  const { t } = useI18n();
  const { data: summary } = useDailyClosingSummary();
  const [selectedRange, setSelectedRange] = useState<RevenueRange | null>(null);
  const defaultRange = summary ? { from: summary.periodStart } : undefined;
  const range = selectedRange ?? defaultRange;
  const { data: revenues = [], isLoading, isFetching } = useRevenues(range);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 md:p-6">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("revenues")}
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
          <OtherRevenueTable
            revenues={revenues}
            range={range}
            onRangeChange={setSelectedRange}
          />
        )}
      </div>
    </div>
  );
}
