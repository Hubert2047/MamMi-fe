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
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(1);
  const { data: summary, isLoading: isSummaryLoading } =
    useDailyClosingSummary();
  const { data: expenses = [], isLoading: isExpenseLoading } = useExpenses();
  const salesData =
    summary?.salesByPayment ?? ({} as Record<PaymentMethod, SalesByPayment>);
  const totalOtherRevenues = summary?.otherRevenueTotal ?? 0;
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
          {currentStep === 1 && (
            <DailyClosingStep1
              expenses={expenses}
              periodRange={
                summary
                  ? { from: summary.periodStart, to: summary.periodEnd }
                  : undefined
              }
              totalOtherRevenues={totalOtherRevenues}
              salesData={salesData}
              isExpenseLoading={isExpenseLoading}
              isSalesLoading={isSummaryLoading}
              setCurrentStep={setCurrentStep}
            />
          )}
          {currentStep === 2 && (
            <DailyClosingStep2
              systemAmount={systemAmount}
              setCurrentStep={setCurrentStep}
              onClose={onClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DailyClosing;
