import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { useState } from "react";
import DailyClosingStep1 from "@/components/daily-closing/DailyClosingStep1.tsx";
import DailyClosingStep2 from "@/components/daily-closing/DailyClosingStep2.tsx";
import type { PaymentMethod } from "@/constants";
import type { SalesByPayment } from "@/api/order.ts";
import { useDailyClosingSummary, useExpenses } from "@/hooks/queries";
import { useI18n } from "@/lib/i18n";
type Props = {
  open: boolean;
  onClose: () => void;
};

function DailyClosing({ open, onClose }: Props) {
  const { t, locale } = useI18n();
  const [currentStep, setCurrentStep] = useState(1);
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isFetching: isSummaryFetching,
  } = useDailyClosingSummary();
  const {
    data: expenses = [],
    isLoading: isExpenseLoading,
    isFetching: isExpenseFetching,
  } = useExpenses();
  const salesData =
    summary?.salesByPayment ?? ({} as Record<PaymentMethod, SalesByPayment>);
  const totalOtherRevenues = summary?.otherRevenueTotal ?? 0;
  const otherRevenueByPayment = summary?.otherRevenueByPayment ?? {
    cash: totalOtherRevenues,
    bank_transfer: 0,
    other: 0,
  };
  const systemAmount = summary?.systemAmount ?? 0;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose();
        }}
      >
        <DialogContent className="left-0 top-0 flex h-dvh min-h-0 max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col rounded-none p-3 pb-[env(safe-area-inset-bottom)] sm:max-w-none">
          <DialogHeader>
            <DialogTitle className="capitalize text-black! font-bold! text-xl text-center">
              {t("closingTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex shrink-0 items-center justify-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <span className="font-semibold">{t("closingPeriod")}:</span>
            <span className="tabular-nums">
              {summary
                ? formatClosingPeriod(
                    summary.periodStart,
                    summary.periodEnd,
                    locale,
                  )
                : "—"}
            </span>
          </div>
          {currentStep === 1 && (
            <DailyClosingStep1
              expenses={expenses}
              totalOtherRevenues={totalOtherRevenues}
              otherRevenueByPayment={otherRevenueByPayment}
              salesData={salesData}
              isExpenseLoading={isExpenseLoading}
              isSalesLoading={isSummaryLoading}
              isRefreshing={isSummaryFetching || isExpenseFetching}
              setCurrentStep={setCurrentStep}
            />
          )}
          {currentStep === 2 && (
            <DailyClosingStep2
              systemAmount={systemAmount}
              previousClosingAmount={summary?.previousClosingAmount ?? 0}
              previousClosingCash={summary?.previousClosingCash ?? {}}
              cashSales={summary?.cashSales ?? 0}
              cashOtherRevenue={summary?.otherRevenueByPayment.cash ?? 0}
              expensesTotal={summary?.expensesTotal ?? 0}
              setCurrentStep={setCurrentStep}
              onClose={onClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatClosingPeriod(start: string, end: string, locale: string) {
  const formatter = new Intl.DateTimeFormat(
    locale === "zh-TW" ? "zh-TW" : locale,
    {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Asia/Taipei",
      hourCycle: "h23",
    },
  );
  return `${formatter.format(new Date(start))} → ${formatter.format(new Date(end))}`;
}

export default DailyClosing;
