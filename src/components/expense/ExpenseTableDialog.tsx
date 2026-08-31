import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpenseTable } from "./ExpenseTable";
import { useDailyClosingSummary, useExpenses } from "@/hooks/queries";
import type { ExpenseRange } from "@/api/expense";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};
export default function ExpenseTableDialog({ open, onClose }: Props) {
  const { t } = useI18n();
  const { data: summary } = useDailyClosingSummary();
  const [selectedRange, setSelectedRange] = useState<ExpenseRange | null>(null);
  const defaultRange = summary ? { from: summary.periodStart } : undefined;
  const range = selectedRange ?? defaultRange;
  const { data: expenses = [], isLoading, isFetching } = useExpenses(range);
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="left-0 top-0 flex h-dvh min-h-0 max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col rounded-none p-3 pb-[env(safe-area-inset-bottom)] sm:max-w-none"
      >
        <DialogHeader>
          <DialogTitle className="text-center capitalize text-black! font-bold! text-xl">
            {t("expenseTableTitle")}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
            {t("loading")}...
          </div>
        ) : (
          <div className="relative flex min-h-0 flex-1">
            <ExpenseTable
              expenses={expenses}
              range={range}
              onRangeChange={setSelectedRange}
            />
            {isFetching && (
              <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-2 rounded-md bg-background/85 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                {t("loading")}...
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
