import React, { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft, Info } from "lucide-react";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea";
import NumPad from "@/components/NumPad.tsx";
import {
  createDailyClosing,
  type CashData,
  type ICreateDailyClosing,
} from "@/api/daily-closing";
import { toast } from "sonner";
import {
  calculateActualCash,
  calculateCashDifference,
  requiresClosingReason,
} from "@/lib/dailyClosingCalculations";
import { useI18n } from "@/lib/i18n";
import Loading from "../Loading";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
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
} from "@/components/ui/alert-dialog.tsx";

type Props = {
  systemAmount: number;
  previousClosingAmount: number;
  previousClosingCash: Record<string, number | string>;
  cashSales: number;
  cashOtherRevenue: number;
  expensesTotal: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
};

function DailyClosingStep2({
  systemAmount,
  previousClosingAmount,
  previousClosingCash,
  cashSales,
  cashOtherRevenue,
  expensesTotal,
  setCurrentStep,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [cash, setCash] = useState<CashData>({
    2000: "0",
    1000: "0",
    500: "0",
    200: "0",
    100: "0",
    50: "0",
    10: "0",
    5: "0",
    1: "0",
  });
  const [reason, setReason] = useState("");
  const [focusedDenom, setFocusedDenom] = useState<number | null>(null);
  const createDailyClosingMutation = useMutation({
    mutationFn: createDailyClosing,
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: ["daily-closing-summary"] })
        .then();
      queryClient.invalidateQueries({ queryKey: ["next-order-number"] }).then();
    },
    onError: () => {
      toast.error(t("closeFailure"));
    },
  });
  const actualTotal = calculateActualCash(cash);
  const diff = calculateCashDifference(actualTotal, systemAmount);

  async function handleConfirm() {
    if (requiresClosingReason(diff, reason)) {
      toast.error(t("closingReasonRequired"));
      return;
    }
    const newDailyClosing: ICreateDailyClosing = {
      actualTotal,
      systemAmount,
      cash,
      reason,
    };
    await createDailyClosingMutation.mutateAsync(newDailyClosing);
    toast.success(t("closeSuccess"));
    onClose();
  }

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="grid min-h-10 shrink-0 grid-cols-3 items-center gap-2">
        <Button
          className="h-10 justify-self-start bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90"
          onClick={() => setCurrentStep(1)}
        >
          {t("back")}
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <p className="text-center font-bold text-xl">{t("counting")}</p>
      </div>
      <div className="flex min-h-0 flex-1 justify-between gap-6 rounded border border-[#ccc] px-4 pb-2 pt-4">
        <div className="flex justify-center items-start mt-8 flex-1">
          <NumPad
            large
            columns={4}
            currentValue={focusedDenom ? cash[focusedDenom] : "0"}
            onChange={(val) => {
              if (focusedDenom === null) return;
              setCash((prev) => ({
                ...prev,
                [focusedDenom]: String(val),
              }));
            }}
          />
        </div>
        <div className="flex items-end gap-2 flex-col">
          {Object.keys(cash)
            .map(Number)
            .sort((a, b) => b - a)
            .map((denom) => (
              <div
                key={denom}
                className="variant flex justify-start items-center gap-4 pl-2"
              >
                <Label
                  className={`block w-12 font-semibold ${focusedDenom === denom ? "text-primary" : ""}`}
                  onClick={() => setFocusedDenom(denom)}
                >
                  {denom}
                </Label>
                <Input
                  type="number"
                  value={Number(cash[denom])}
                  onFocus={() => setFocusedDenom(denom)}
                  onChange={(e) =>
                    setCash((prev) => ({
                      ...prev,
                      [denom]: e.target.value,
                    }))
                  }
                  className={`w-20 text-center ${focusedDenom === denom ? "border-primary ring-1 ring-primary/30" : ""}`}
                />
              </div>
            ))}
        </div>
        <div className="flex gap-2 flex-1 flex-col">
          <div className="variant flex justify-start items-center gap-4 pl-2">
            <Label className="block w-30 font-semibold">{t("actual")}</Label>
            <Input
              id="amount"
              value={actualTotal.toLocaleString()}
              disabled
              className="w-20 text-center"
            />
          </div>
          <div className="variant flex justify-start items-center gap-4 pl-2">
            <div className="flex w-30 items-center gap-1">
              <Label className="font-semibold">{t("system")}</Label>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={t("systemAmountCalculationTitle")}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="top-4 max-w-sm translate-y-0">
                  <DialogHeader>
                    <DialogTitle>
                      {t("systemAmountCalculationTitle")}
                    </DialogTitle>
                    <DialogDescription>
                      {t("systemAmountCalculationDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 text-sm">
                    <PreviousClosingRow
                      amount={previousClosingAmount}
                      cash={previousClosingCash}
                      t={t}
                    />
                    <CalculationRow
                      label={t("closingCashSales")}
                      value={cashSales}
                      operator="+"
                    />
                    <CalculationRow
                      label={t("closingOtherRevenue")}
                      value={cashOtherRevenue}
                      operator="+"
                    />
                    <CalculationRow
                      label={t("closingCashExpenses")}
                      value={expensesTotal}
                      operator="−"
                    />
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>{t("system")}</span>
                      <span>{systemAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Input
              id="amount"
              value={systemAmount.toLocaleString()}
              disabled
              className="w-20 text-center"
            />
          </div>
          <div className="variant flex justify-start items-center gap-4 pl-2">
            <Label
              className={`block w-30 font-semibold ${diff !== 0 ? "text-red-600" : ""}`}
            >
              {t("difference")}
            </Label>
            <Input
              id="amount"
              value={diff.toLocaleString()}
              disabled
              className={`w-20 text-center ${diff !== 0 ? "border-red-500 text-red-600" : ""}`}
            />
          </div>
          <div className="variant flex justify-start items-center gap-4 pl-2">
            <Label className="block w-40 font-semibold">{t("reason")}</Label>
            <Textarea
              id="amount"
              value={reason}
              aria-invalid={diff !== 0 && !reason.trim()}
              className="w-full min-h-20"
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="ml-2 mt-4 min-h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {t("closing")}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-sm p-4">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-black! text-lg!">
                  {t("countDialogTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("closingConfirmDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="min-h-11">
                  {t("cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirm}
                  disabled={createDailyClosingMutation.isPending}
                  className="min-h-11 bg-primary! text-primary-foreground! hover:bg-primary/90!"
                >
                  {createDailyClosingMutation.isPending
                    ? t("saving")
                    : t("closing")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {createDailyClosingMutation.isPending && <Loading />}
    </div>
  );
}

function CalculationRow({
  label,
  value,
  operator,
}: {
  label: string;
  value: number;
  operator?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>
        {operator ? `${operator} ` : ""}
        {label}
      </span>
      <span className="tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}

function PreviousClosingRow({
  amount,
  cash,
  t,
}: {
  amount: number;
  cash: Record<string, number | string>;
  t: (key: string) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <span>{t("closingPreviousAmount")}</span>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={t("closingPreviousCashTitle")}
            >
              <Info className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="top-4 max-w-sm translate-y-0">
            <DialogHeader>
              <DialogTitle>{t("closingPreviousCashTitle")}</DialogTitle>
            </DialogHeader>
            {Object.keys(cash).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("closingPreviousCashEmpty")}
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {Object.entries(cash)
                  .sort(([first], [second]) => Number(second) - Number(first))
                  .map(([denomination, quantity]) => (
                    <div
                      key={denomination}
                      className="flex justify-between border-b pb-1 last:border-0"
                    >
                      <span>
                        {t("closingDenomination")}: {denomination}
                      </span>
                      <span>
                        {t("closingQuantity")}: {quantity}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <span className="tabular-nums">{amount.toLocaleString()}</span>
    </div>
  );
}

export default DailyClosingStep2;
