import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group.tsx";
import React, { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { ArrowRight, Info } from "lucide-react";
import { PAYMENT_METHODS, type PaymentMethod } from "@/constants";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import Loading from "@/components/Loading.tsx";
import type { SalesByPayment } from "@/api/order";
import type { Expense } from "@/api/expense";
import { calculateIncomeTotal } from "@/lib/dailyClosingCalculations";
import { useI18n } from "@/lib/i18n";

const paymentMethodClosingMessageKeys = {
  cash: "paymentCash",
  uber: "uber",
  linepay: "paymentLinepay",
  bank: "paymentBank",
  foodpanda: "foodpanda",
} as const;

const expensePaymentMethods = [
  { method: "cash", messageKey: "paymentCash" },
  { method: "bank_transfer", messageKey: "paymentBank" },
  { method: "other", messageKey: "paymentOther" },
] as const;

type Props = {
  totalOtherRevenues: number;
  otherRevenueByPayment: {
    cash: number;
    bank_transfer: number;
    other: number;
  };
  expenses: Expense[];
  salesData: Record<PaymentMethod, SalesByPayment>;
  isSalesLoading: boolean;
  isExpenseLoading: boolean;
  isRefreshing: boolean;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
};

function DailyClosingStep1({
  expenses,
  totalOtherRevenues,
  otherRevenueByPayment,
  salesData,
  isSalesLoading,
  isExpenseLoading,
  isRefreshing,
  setCurrentStep,
}: Props) {
  const { t, locale } = useI18n();
  const [type, setType] = useState<"income" | "expense">("income");
  const formatExpenseDate = (value: string) =>
    new Intl.DateTimeFormat(locale === "zh-TW" ? "zh-TW" : locale, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(value));

  function getPaymentMethodValue(type: PaymentMethod) {
    const value = salesData[type];
    if (!value) return { count: 0, totalSales: 0 };
    return value;
  }

  const totalIncome = calculateIncomeTotal(salesData, totalOtherRevenues);
  const totalExpenses = expenses.reduce(
    (total, expense) => total + expense.price,
    0,
  );
  return (
    <>
      <div className="flex justify-between">
        <ToggleGroup
          size="lg"
          variant="outline"
          type="single"
          spacing={2}
          className="flex-wrap gap-2"
          value={type}
          onValueChange={(value) => {
            if (value) setType(value as "income" | "expense");
          }}
        >
          <ToggleGroupItem
            className="h-10 w-20 rounded-lg border-primary/40 data-[state=on]:!border-primary data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground"
            value="income"
          >
            {t("income")}
          </ToggleGroupItem>
          <ToggleGroupItem
            className="h-10 w-20 rounded-lg border-primary/40 data-[state=on]:!border-primary data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground"
            value="expense"
          >
            {t("expense")}
          </ToggleGroupItem>
        </ToggleGroup>
        <Button
          disabled={isRefreshing}
          className="h-10 px-4 text-sm flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setCurrentStep(2)}
        >
          {t("next")}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {type === "income" ? (
        <div className="flex border border-[#ccc] py-4 rounded px-6 flex-col gap-1 justify-center">
          {!isSalesLoading &&
            PAYMENT_METHODS.map((method) => {
              const otherRevenueMethod =
                method === "cash"
                  ? "cash"
                  : method === "bank"
                    ? "bank_transfer"
                    : null;
              let totalSales = getPaymentMethodValue(method).totalSales;
              if (otherRevenueMethod)
                totalSales += otherRevenueByPayment[otherRevenueMethod];
              return (
                <div
                  key={method}
                  className="variant flex justify-start items-center gap-4 pt-2"
                >
                  <div className="flex w-28 items-center gap-1">
                    <Label className="font-semibold">
                      {t(paymentMethodClosingMessageKeys[method])}
                    </Label>
                    {otherRevenueMethod && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={t("incomeDetailsTitle")}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="top-1 translate-y-0 sm:max-w-sm">
                          <DialogHeader>
                            <DialogTitle>
                              {t("incomeDetailsTitle")} -{" "}
                              {t(paymentMethodClosingMessageKeys[method])}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div className="flex justify-between gap-4">
                              <span>{t("incomeFromOrders")}</span>
                              <span className="font-semibold">
                                {getPaymentMethodValue(
                                  "cash",
                                ).totalSales.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span>{t("incomeFromOtherRevenue")}</span>
                              <span className="font-semibold">
                                {otherRevenueByPayment[
                                  otherRevenueMethod
                                ].toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4 border-t pt-3">
                              <span className="font-semibold">
                                {t("incomeTotal")}
                              </span>
                              <span className="font-semibold">
                                {(
                                  getPaymentMethodValue("cash").totalSales +
                                  otherRevenueByPayment[otherRevenueMethod]
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  <Input
                    id={`amount-${method}`}
                    value={totalSales.toLocaleString()}
                    className="w-40 text-center"
                    disabled
                  />
                </div>
              );
            })}
          <div className="variant flex justify-start items-center gap-4 pt-6 border-t mt-4">
            <Label className="block w-28 font-semibold">{t("total")}</Label>
            <Input
              id="amount"
              value={totalIncome.toLocaleString()}
              className="w-40 text-center"
              disabled
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded border border-[#ccc] px-6 py-4">
          {!isExpenseLoading &&
            expensePaymentMethods.map(({ method, messageKey }) => {
              const methodExpenses = expenses.filter(
                (expense) =>
                  expense.paymentMethod === method ||
                  (method === "cash" && !expense.paymentMethod),
              );
              const methodTotal = methodExpenses.reduce(
                (total, expense) => total + expense.price,
                0,
              );

              return (
                <div
                  key={method}
                  className="flex items-center justify-start gap-4 pt-2"
                >
                  <div className="flex w-28 items-center gap-1">
                    <Label className="font-semibold">{t(messageKey)}</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={t("expenseDetailsTitle")}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="top-1 max-h-[calc(100dvh-1rem)] translate-y-0 overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {t("expenseDetailsTitle")} - {t(messageKey)}
                          </DialogTitle>
                        </DialogHeader>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("expenseName")}</TableHead>
                              <TableHead>{t("time")}</TableHead>
                              <TableHead>{t("expenseType")}</TableHead>
                              <TableHead>{t("expenseQuantity")}</TableHead>
                              <TableHead className="text-right">
                                {t("expenseTotal")}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {methodExpenses.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                  {t("noExpenseFound")}
                                </TableCell>
                              </TableRow>
                            ) : (
                              methodExpenses.map((expense) => (
                                <TableRow key={expense._id}>
                                  <TableCell>{expense.name}</TableCell>
                                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                    {formatExpenseDate(expense.createdAt)}
                                  </TableCell>
                                  <TableCell>
                                    {expense.type === "inventory_purchase"
                                      ? t("expenseInventoryTab")
                                      : t("expenseOtherTab")}
                                  </TableCell>
                                  <TableCell>{expense.quantity ?? 1}</TableCell>
                                  <TableCell className="text-right">
                                    {expense.price.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input
                    id={`expense-amount-${method}`}
                    value={methodTotal.toLocaleString()}
                    className="w-40 text-center"
                    disabled
                  />
                </div>
              );
            })}
          <div className="flex items-center justify-start gap-4 border-t pt-3">
            <Label className="w-28 font-bold">{t("totalExpense")}</Label>
            <Input
              id="expense-total"
              value={totalExpenses.toLocaleString()}
              className="w-40 text-center font-bold"
              disabled
            />
          </div>
        </div>
      )}
      {isSalesLoading && <Loading />}
    </>
  );
}

export default DailyClosingStep1;
