import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label";
import React from "react";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import { getPaymentMethodByType, getPriceByType } from "@/lib/utils.ts";
import type { Item } from "@/api/item.ts";
import type { BaseOrder } from "@/api/order";
import { useI18n } from "@/lib/i18n";
import { FloatingButton } from "@/components/FloatingButton";
import type { StoreTable } from "@/api/table";
import { calculateOrderSubtotal } from "@/lib/posCalculations";
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
} from "@/components/ui/alert-dialog";

type Props = {
  items: Item[];
  isDetail: boolean;
  isOrderEditing: boolean;
  isPendingOrder: boolean;
  totalPrice: number;
  currentOrderNumber: number;
  currentOrder: BaseOrder;
  isCheckout: boolean;
  setCurrentOrder: React.Dispatch<React.SetStateAction<BaseOrder>>;
  handleOpenCheckout(checkout: boolean): void;
  closeDisplayOrderDetail(): void;
  handlePendingOrder(open: boolean): void;
  openBtns: boolean;
  setOpenBtns: React.Dispatch<React.SetStateAction<boolean>>;
  tables: StoreTable[];
  onCheckoutPendingOrder(): void;
  onCancelOrderEdit(): void;
  onSaveOrderEdit(): void;
};

function PosHeader({
  currentOrder,
  items,
  isPendingOrder,
  isDetail,
  isOrderEditing,
  totalPrice,
  isCheckout,
  setCurrentOrder,
  currentOrderNumber,
  handleOpenCheckout,
  closeDisplayOrderDetail,
  handlePendingOrder,
  openBtns,
  setOpenBtns,
  tables,
  onCheckoutPendingOrder,
  onCancelOrderEdit,
  onSaveOrderEdit,
}: Props) {
  const { t } = useI18n();
  const isReadOnly = isDetail && !isOrderEditing;
  const originalTotal = calculateOrderSubtotal(currentOrder.items);
  const hasPromotionDiscount = totalPrice < originalTotal;

  return (
    <div className="mb-2 flex items-center justify-start gap-1 rounded border border-[#ccc] p-1">
      <div className="flex items-center space-x-1 ">
        <Label htmlFor="stt" className="whitespace-nowrap">
          {t("orderNumber")}:
        </Label>
        <Input
          id="stt"
          className="h-8 w-14 px-1 text-sm"
          value={isDetail ? currentOrder.number : currentOrderNumber}
          disabled
        />
      </div>

      <ToggleGroup
        size="sm"
        variant="outline"
        type="single"
        value={currentOrder.type}
        onValueChange={(value) => {
          if (value)
            setCurrentOrder((prev) => ({
              ...prev,
              type: value as "dine_in" | "takeaway" | "uber" | "foodpanda",
              paymentMethod: getPaymentMethodByType(
                value as "dine_in" | "takeaway" | "uber" | "foodpanda",
              ),
              items: prev.items.map((item) => {
                const originItem = items.find((i) => i._id === item.id);
                if (originItem)
                  return {
                    ...item,
                    basePrice: getPriceByType(
                      value as "dine_in" | "takeaway" | "uber" | "foodpanda",
                      originItem.price,
                    ),
                  };
                return item;
              }),
            }));
        }}
      >
        <ToggleGroupItem
          value="takeaway"
          disabled={isReadOnly}
          className="h-10 px-3 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
        >
          外帶
        </ToggleGroupItem>
        <ToggleGroupItem
          value="dine_in"
          disabled={isReadOnly}
          className="h-10 px-3 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
        >
          內用
        </ToggleGroupItem>
        <ToggleGroupItem
          value="uber"
          disabled={isReadOnly}
          className="h-10 px-3 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
        >
          Uber
        </ToggleGroupItem>
        <ToggleGroupItem
          value="foodpanda"
          disabled={isReadOnly}
          className="h-10 px-3 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
        >
          FoodPanda
        </ToggleGroupItem>
      </ToggleGroup>

      {currentOrder.type === "dine_in" && (
        <div className="flex items-center gap-1">
          <Label htmlFor="order-table" className="whitespace-nowrap text-sm">
            {t("posTable")}:
          </Label>
          <select
            id="order-table"
            disabled={isReadOnly}
            className="h-8 w-14 rounded-md border bg-background px-1 text-sm"
            value={currentOrder.table || ""}
            onChange={(event) =>
              setCurrentOrder((prev) => ({
                ...prev,
                table: event.target.value,
              }))
            }
          >
            <option value=""></option>
            {tables
              .filter((table) => table.active)
              .sort((a, b) => {
                const aCode = Number(a.code);
                const bCode = Number(b.code);
                if (Number.isFinite(aCode) && Number.isFinite(bCode))
                  return aCode - bCode;
                return a.code.localeCompare(b.code, undefined, {
                  sensitivity: "base",
                });
              })
              .map((table) => (
                <option key={table._id} value={table.code}>
                  {table.code}
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="flex-1"></div>

      <div className="ml-auto flex shrink-0 items-center space-x-1">
        <Label className="whitespace-nowrap text-sm font-semibold">
          {t("total")}:
        </Label>
        {hasPromotionDiscount ? (
          <div className="flex min-w-30 items-baseline justify-center gap-1 leading-tight">
            <span className="text-xl font-extrabold tabular-nums text-primary">
              {totalPrice.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground line-through">
              {originalTotal.toLocaleString()}
            </span>
          </div>
        ) : (
          <Input
            className="h-8 w-24 !text-lg font-extrabold tabular-nums"
            value={totalPrice.toLocaleString()}
            disabled
          />
        )}
      </div>
      <div className="ml-2 flex shrink-0 justify-end">
        {isDetail ? (
          isOrderEditing ? (
            <div className="flex gap-1">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="h-10 px-3 text-sm" variant="outline">
                    {t("cancel")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("cancel")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("confirmDiscardOrderChanges")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={onCancelOrderEdit}
                    >
                      {t("confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="h-10 px-3 text-sm">{t("update")}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("update")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("confirmSaveOrderChanges")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={onSaveOrderEdit}>
                      {t("confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="flex gap-1">
              {currentOrder.status === "pending" && (
                <Button
                  className="h-10 px-3 text-sm bg-green-600 text-white hover:bg-green-700"
                  onClick={onCheckoutPendingOrder}
                >
                  {t("pay")}
                </Button>
              )}
              <Button
                className="h-10 px-3 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={closeDisplayOrderDetail}
              >
                {t("createNewOrder")}
              </Button>
            </div>
          )
        ) : isCheckout || isPendingOrder ? (
          <Button
            className="h-10 w-32 text-sm"
            variant="default"
            onClick={
              isPendingOrder
                ? () => handlePendingOrder(false)
                : () => handleOpenCheckout(false)
            }
          >
            {t("backToOrder")}
          </Button>
        ) : (
          <div className="flex justify-end gap-1">
            {currentOrder.items.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="h-10 min-w-18 px-3 text-sm"
                    variant="destructive"
                  >
                    {t("cancelOrder")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("cancelOrder")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("confirmCancelOrder")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={closeDisplayOrderDetail}
                    >
                      {t("confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              className="h-10 min-w-18 px-3 text-sm bg-yellow-400 text-black hover:bg-yellow-500"
              onClick={() => {
                if (currentOrder.items.length === 0) {
                  toast.error(t("noProductsToOrder"));
                  return;
                }
                if (
                  currentOrder.type === "dine_in" &&
                  !currentOrder.table?.trim()
                ) {
                  toast.error(t("tableRequired"));
                  return;
                }
                handlePendingOrder(true);
              }}
            >
              {t("placeOrder")}
            </Button>
            <Button
              className="h-10 min-w-18 px-3 text-sm bg-green-600 text-white hover:bg-green-700"
              onClick={() => {
                if (currentOrder.items.length === 0) {
                  toast.error(t("noProductsToPay"));
                  return;
                }
                if (
                  currentOrder.type === "dine_in" &&
                  !currentOrder.table?.trim()
                ) {
                  toast.error(t("tableRequired"));
                  return;
                }
                handleOpenCheckout(true);
              }}
            >
              {t("pay")}
            </Button>
          </div>
        )}
      </div>
      {!openBtns && (
        <div className="ml-2">
          <FloatingButton open={false} setOpenBtns={setOpenBtns} />
        </div>
      )}
    </div>
  );
}

export default PosHeader;
