"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { type Item } from "@/api/item";
import {
  type BaseOrder,
  type OrderItem,
  updatePendingOrder,
} from "@/api/order.ts";
import ExpenseTableDialog from "@/components/expense/ExpenseTableDialog";
import PosOrderList from "@/components/orders/PosOrderList";
import { DEFAULT_ORDER, DEFAULT_ORDER_ITEM } from "@/constants";
import PosItemSection from "@/components/PosItemSection.tsx";
import PosHeader from "@/components/PosHeader.tsx";
import Loading from "@/components/Loading.tsx";
import Checkout from "@/components/Checkout.tsx";
import {
  usePromotions,
  useItems,
  useNextOrderNumber,
  useStoreAddons,
} from "@/hooks/queries";
import { getStoreTables } from "@/api/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OrderTable } from "@/components/orders/OrderTable.tsx";
import { FloatingButton } from "@/components/FloatingButton.tsx";
import DailyClosing from "@/components/daily-closing/DailyClosing.tsx";
import OtherRevenue from "@/components/other-revenue/OtherRevenue.tsx";
import ShiftAttendance from "@/components/ShiftAttendance.tsx";
import TemporaryAvailabilityTable from "@/components/TemporaryAvailabilityTable";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  calculateOrderTotal,
  findFreshSelectedItem,
  syncOrderItemsWithCatalog,
} from "@/lib/posCalculations";
import { useI18n } from "@/lib/i18n";
import { useStoreContext } from "@/lib/store-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { generateUUID } from "@/lib/utils";
import PosStocktakeDialog from "@/components/inventory/PosStocktakeDialog";
import InventoryPurchaseDialog from "@/components/inventory/InventoryPurchaseDialog";
import PosTableSessions from "@/components/PosTableSessions";
import {
  calculatePromotionPreview,
  getCatalogProductPromotionPrice,
} from "@/api/promotion";

const POSPage: React.FC = () => {
  const { t } = useI18n();
  const { stores, activeStoreId, setActiveStoreId } = useStoreContext();
  const [selectedCategory, setSelectedCategory] = useState<string>("牛肉河粉");
  const [currentOrder, setCurrentOrder] = useState<BaseOrder>(DEFAULT_ORDER);
  const [currentOrderItem, setCurrentOrderItem] =
    useState<OrderItem>(DEFAULT_ORDER_ITEM);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [openOrderTable, setOpenOrderTable] = useState<boolean>(false);
  const [openExpense, setOpenExpense] = useState<boolean>(false);
  const [openInventoryPurchase, setOpenInventoryPurchase] = useState(false);
  const [isEditItem, setIsEditItem] = useState<boolean>(false);
  const [isCheckout, setIsCheckout] = useState<boolean>(false);
  const [isDetail, setIsDetail] = useState<boolean>(false);
  const [isOrderEditing, setIsOrderEditing] = useState(false);
  const [orderBeforeEdit, setOrderBeforeEdit] = useState<BaseOrder | null>(
    null,
  );
  const [isPendingOrder, setIsPendingOrder] = useState<boolean>(false);
  const [isCheckoutPendingOrder, setIsCheckoutPendingOrder] =
    useState<boolean>(false);
  const [openBtns, setOpenBtns] = useState(true);
  const openBtnsBeforeCheckout = useRef<boolean | null>(null);
  const [openDailyClosing, setOpenDailyClosing] = useState(false);
  const [openOtherRevenue, setOpenOtherRevenue] = useState(false);
  const [openShiftAttendance, setOpenShiftAttendance] = useState(false);
  const [openStocktake, setOpenStocktake] = useState(false);
  const [openTableSessions, setOpenTableSessions] = useState(false);
  const [openAdvanced, setOpenAdvanced] = useState(false);
  const [promotionInfoOpen, setPromotionInfoOpen] = useState(false);
  const [openTemporaryAvailability, setOpenTemporaryAvailability] =
    useState(false);
  const { data: items = [], isLoading: isItemsLoading } = useItems(true);
  const { data: allItems = [] } = useItems();
  const { data: storeAddons = [] } = useStoreAddons();
  const { data: promotions = [], isLoading: isPromotionsLoading } =
    usePromotions();
  const { data: nextOrderNumber, isLoading: isOrderNumberLoading } =
    useNextOrderNumber();
  const { data: tables = [] } = useQuery({
    queryKey: ["store-tables"],
    queryFn: getStoreTables,
  });
  const sortedTables = useMemo(
    () =>
      [...tables].sort((left, right) => {
        const leftCode = Number(String(left.code).trim());
        const rightCode = Number(String(right.code).trim());
        if (Number.isFinite(leftCode) && Number.isFinite(rightCode))
          return leftCode - rightCode;
        return String(left.code).localeCompare(String(right.code), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }),
    [tables],
  );
  const queryClient = useQueryClient();
  const [currentOrderNumber, setCurrentOrderNumber] = useState<number>(
    nextOrderNumber ?? 1,
  );
  useEffect(() => {
    if (
      nextOrderNumber === undefined ||
      currentOrder.items.length > 0 ||
      isCheckout ||
      isPendingOrder
    )
      return;
    // The POS can render once before the store-scoped query resolves.
    // Keep the displayed number synchronized with the backend preview.
    setCurrentOrderNumber(nextOrderNumber);
  }, [currentOrder.items.length, isCheckout, isPendingOrder, nextOrderNumber]);
  // Keep temporarily unavailable products visible but not selectable.
  const sellableItems = useMemo(
    () => items.filter((item) => item.permanentlyActive !== false),
    [items],
  );
  const activePromotions = useMemo(
    () =>
      promotions.filter(
        (promotion) => promotion.enabled && promotion.status === "active",
      ),
    [promotions],
  );
  const promotionPreview = useMemo(
    () =>
      calculatePromotionPreview({
        items: currentOrder.items,
        promotions: activePromotions,
        selectedPromotionIds: currentOrder.selectedPromotionIds,
      }),
    [activePromotions, currentOrder.items, currentOrder.selectedPromotionIds],
  );
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, Item[]> = {};
    sellableItems.forEach((item) => {
      if (!grouped[item.categoryName]) grouped[item.categoryName] = [];
      grouped[item.categoryName].push(item);
    });
    const orderedGroups = Object.entries(grouped).sort(
      ([leftName, leftItems], [rightName, rightItems]) => {
        const orderDifference =
          (leftItems[0]?.categorySortOrder ?? 0) -
          (rightItems[0]?.categorySortOrder ?? 0);
        if (orderDifference) return orderDifference;
        const leftId =
          typeof leftItems[0]?.categoryId === "string"
            ? leftItems[0].categoryId
            : (leftItems[0]?.categoryId?._id ?? leftName);
        const rightId =
          typeof rightItems[0]?.categoryId === "string"
            ? rightItems[0].categoryId
            : (rightItems[0]?.categoryId?._id ?? rightName);
        return String(leftId).localeCompare(String(rightId));
      },
    );
    return Object.fromEntries(orderedGroups);
  }, [sellableItems]);

  useEffect(() => {
    if (Object.keys(itemsByCategory).includes(selectedCategory)) return;
    setSelectedCategory(Object.keys(itemsByCategory)[0] ?? "");
  }, [itemsByCategory, selectedCategory]);

  useEffect(() => {
    if (!selectedItem) return;
    const freshItem = findFreshSelectedItem(selectedItem._id, items);
    if (freshItem && freshItem !== selectedItem) setSelectedItem(freshItem);
  }, [items, selectedItem]);

  useEffect(() => {
    setCurrentOrder((current) => {
      const syncedItems = syncOrderItemsWithCatalog(current.items, items);
      const changed = syncedItems.some(
        (item, index) => item !== current.items[index],
      );
      return changed ? { ...current, items: syncedItems } : current;
    });
    setCurrentOrderItem((current) => {
      const freshItem = findFreshSelectedItem(current.id, items);
      if (!freshItem) return current;
      const synced = syncOrderItemsWithCatalog([current], [freshItem])[0];
      return synced ?? current;
    });
  }, [items]);

  useEffect(() => {
    if (isPromotionsLoading) return;
    setCurrentOrder((current) => {
      if (!current.selectedPromotionIds?.length) return current;
      const stillActive = current.selectedPromotionIds.every((id) =>
        activePromotions.some((promotion) => promotion._id === id),
      );
      if (stillActive) return current;
      toast.error(t("discountUnavailable"));
      return { ...current, selectedPromotionIds: [] };
    });
  }, [activePromotions, isPromotionsLoading, t]);

  const filteredItems = itemsByCategory[selectedCategory] ?? [];

  const selectUpdateOrderItem = (orderItem: OrderItem) => {
    setCurrentOrderItem(orderItem);
    const item = items.find((item) => orderItem.id === item._id);
    if (item) setSelectedItem(item);
    setIsEditItem(true);
  };

  const draftTotal = useMemo(
    () => calculateOrderTotal(currentOrder),
    [currentOrder],
  );
  const totalPrice = promotionPreview?.total ?? draftTotal;
  const updatePendingOrderMutation = useMutation({
    mutationFn: updatePendingOrder,
    onSuccess: (updatedOrder) => {
      setCurrentOrder(updatedOrder);
      setOrderBeforeEdit(null);
      setIsOrderEditing(false);
      setIsDetail(false);
      setOpenOrderTable(true);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(t("updateSuccess"));
    },
    onError: (error: unknown) => {
      const code = isAxiosError(error) ? error.response?.data?.code : undefined;
      if (code === "ORDER_PRICING_CHANGED" || code === "PROMOTION_PRICE_CHANGED") {
        const data = isAxiosError(error) ? error.response?.data?.data : undefined;
        if (data?.items && data.pricing) {
          setCurrentOrder((previous) => ({
            ...previous,
            items: data.items,
            expectedPricing: data.pricing,
          }));
        }
        void queryClient.invalidateQueries({ queryKey: ["promotions"] });
        toast.error(t("promotionPriceChanged"));
        return;
      }
      toast.error(
        code === "ORDER_VERSION_CONFLICT"
          ? t("orderChangedElsewhere")
          : t("updateFailure"),
      );
    },
  });
  function setCheckoutOpen(checkout: boolean) {
    if (checkout && !isCheckout) {
      openBtnsBeforeCheckout.current = openBtns;
      setOpenBtns(false);
    } else if (
      !checkout &&
      isCheckout &&
      openBtnsBeforeCheckout.current !== null
    ) {
      setOpenBtns(openBtnsBeforeCheckout.current);
      openBtnsBeforeCheckout.current = null;
    }
    setIsCheckout(checkout);
  }

  function handleOpenCheckout(checkout: boolean) {
    if (isCheckoutPendingOrder) {
      setIsCheckoutPendingOrder(false);
      setCurrentOrder(DEFAULT_ORDER);
    }
    setCheckoutOpen(checkout);
    setSelectedItem(null);
    setCurrentOrderItem(DEFAULT_ORDER_ITEM);
  }

  function handlePendingOrder(open: boolean) {
    setCurrentOrder((prev) => ({
      ...prev,
      customer: open ? { name: "", phone: "" } : null,
      ...(open
        ? { pickupAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() }
        : {}),
    }));
    if (!open) {
      setIsDetail(false);
      setIsOrderEditing(false);
      setIsEditItem(false);
      setOrderBeforeEdit(null);
    }
    setSelectedItem(null);
    setCurrentOrderItem(DEFAULT_ORDER_ITEM);
    setIsPendingOrder(open);
  }

  function displayOrderDetail(order: BaseOrder) {
    const lineIds = new Set<string>();
    const orderWithLineIds: BaseOrder = {
      ...order,
      items: order.items.map((orderItem) => {
        const itemId =
          orderItem.itemId && !lineIds.has(orderItem.itemId)
            ? orderItem.itemId
            : generateUUID();
        lineIds.add(itemId);
        return { ...orderItem, itemId };
      }),
    };
    setCurrentOrder(orderWithLineIds);
    setOrderBeforeEdit(orderWithLineIds);
    // Start order editing on the first category without opening the first
    // existing line item; staff can choose which item to edit explicitly.
    setSelectedCategory(Object.keys(itemsByCategory)[0] ?? "");
    setCurrentOrderItem(DEFAULT_ORDER_ITEM);
    setSelectedItem(null);
    setIsEditItem(false);
    setOpenOrderTable(false);
    setIsDetail(true);
    setIsOrderEditing(true);
    setCheckoutOpen(false);
  }

  function closeDisplayOrderDetail() {
    setIsDetail(false);
    setIsOrderEditing(false);
    setOrderBeforeEdit(null);
    setIsEditItem(false);
    setCurrentOrderItem(DEFAULT_ORDER_ITEM);
    setCurrentOrder(DEFAULT_ORDER);
    setSelectedItem(null);
  }

  function checkoutPendingOrder(order: BaseOrder) {
    setCurrentOrder(order);
    setSelectedItem(null);
    setOpenOrderTable(false);
    setIsDetail(false);
    setIsOrderEditing(false);
    setCheckoutOpen(true);
    setIsCheckoutPendingOrder(true);
  }

  function cancelOrderEdit() {
    setIsDetail(false);
    setIsOrderEditing(false);
    setOrderBeforeEdit(null);
    setSelectedItem(null);
    setCurrentOrderItem(DEFAULT_ORDER_ITEM);
    setCurrentOrder(DEFAULT_ORDER);
    setIsEditItem(false);
    setOpenOrderTable(true);
  }

  function startOrderEdit() {
    setOrderBeforeEdit(currentOrder);
    setIsOrderEditing(true);
  }

  function startAddOrderItem() {
    setSelectedItem(null);
    setCurrentOrderItem(DEFAULT_ORDER_ITEM);
    setIsEditItem(false);
  }

  function saveOrderEdit() {
    if (currentOrder.items.length === 0) {
      toast.error(t("noProductsToOrder"));
      return;
    }
    if (currentOrder.type === "dine_in" && !currentOrder.table?.trim()) {
      toast.error(t("tableRequired"));
      return;
    }
    void updatePendingOrderMutation.mutateAsync({
      id: currentOrder._id,
      data: {
        items: currentOrder.items,
        type: currentOrder.type,
        table: currentOrder.table,
        selectedPromotionIds: currentOrder.selectedPromotionIds,
        expectedPricing: promotionPreview,
        paymentMethod: currentOrder.paymentMethod,
        version: currentOrder.version,
        pickupAt: currentOrder.pickupAt,
      },
    });
  }
  if (isItemsLoading || isOrderNumberLoading) return <Loading />;

  return (
    <div className="pos-screen fixed inset-0 flex h-dvh w-full gap-2 overflow-hidden overscroll-none p-2">
      <div className="left flex min-h-0 min-w-0 flex-1 flex-col">
        <PosHeader
          items={items}
          isDetail={isDetail}
          isOrderEditing={isOrderEditing}
          isPendingOrder={isPendingOrder}
          currentOrder={currentOrder}
          setCurrentOrder={setCurrentOrder}
          handleOpenCheckout={handleOpenCheckout}
          handlePendingOrder={handlePendingOrder}
          isCheckout={isCheckout}
          currentOrderNumber={currentOrderNumber}
          totalPrice={totalPrice}
          closeDisplayOrderDetail={closeDisplayOrderDetail}
          openBtns={openBtns}
          setOpenBtns={setOpenBtns}
          tables={sortedTables}
          onCheckoutPendingOrder={() => checkoutPendingOrder(currentOrder)}
          onCancelOrderEdit={cancelOrderEdit}
          onSaveOrderEdit={saveOrderEdit}
        />
        <div className="flex min-h-0 flex-1 gap-2">
          <div className="ordered-items max-w-80 flex-1 rounded border border-[#ccc] p-2">
            <PosOrderList
              items={currentOrder.items}
              appliedPromotions={
                promotionPreview?.appliedPromotions ??
                currentOrder.appliedPromotions
              }
              updateItem={selectUpdateOrderItem}
              currentOrderItem={currentOrderItem}
              canEdit={isDetail && currentOrder.status === "pending"}
              isOrderEditing={isOrderEditing}
              onStartOrderEdit={startOrderEdit}
              onStartAddItem={startAddOrderItem}
              onCancelOrderEdit={cancelOrderEdit}
              onSaveOrderEdit={saveOrderEdit}
            />
          </div>
          {isCheckout || isPendingOrder ? (
            <Checkout
              totalPrice={totalPrice}
              isPendingOrder={isPendingOrder}
              currentOrderNumber={currentOrderNumber}
              setCurrentOrder={setCurrentOrder}
              currentOrder={currentOrder}
              isCheckoutPendingOrder={isCheckoutPendingOrder}
              setIsCheckoutPendingOrder={setIsCheckoutPendingOrder}
              promotions={activePromotions}
              promotionPreview={promotionPreview}
              onPromotionPriceChanged={() => {
                void queryClient.invalidateQueries({
                  queryKey: ["promotions"],
                });
              }}
              handlePendingOrder={handlePendingOrder}
              handleOpenCheckout={handleOpenCheckout}
              setCurrentOrderNumber={setCurrentOrderNumber}
            />
          ) : (
            <PosItemSection
              isDetail={isDetail}
              isOrderEditing={isOrderEditing}
              currentOrderNumber={currentOrderNumber}
              promotions={activePromotions}
              itemsByCategory={itemsByCategory}
              currentOrder={currentOrder}
              selectedCategory={selectedCategory}
              selectedItem={selectedItem}
              filteredItems={filteredItems}
              currentOrderItem={currentOrderItem}
              isEditItem={isEditItem}
              setCurrentOrderItem={setCurrentOrderItem}
              setCurrentOrder={setCurrentOrder}
              setSelectedCategory={setSelectedCategory}
              setSelectedItem={setSelectedItem}
              setIsEditItem={setIsEditItem}
              promotionInfoOpen={promotionInfoOpen}
              setPromotionInfoOpen={setPromotionInfoOpen}
            />
          )}
        </div>
      </div>
      {openBtns && (
        <div className="right flex w-40 shrink-0 flex-col justify-between gap-2 rounded border border-[#ccc] p-2">
          <FloatingButton open={true} setOpenBtns={setOpenBtns} />
          <div className="mt-auto flex flex-col gap-2">
            {stores.length > 1 && (
              <div className="flex flex-col gap-1 border-b pb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("switchStore")}
                </span>
                <Select value={activeStoreId} onValueChange={setActiveStoreId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("store")} />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store._id} value={store._id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="mb-1 border-b pb-2">
              <Button
                className="h-11 w-full text-base"
                variant="outline"
                onClick={() => setOpenAdvanced(true)}
              >
                {t("advanced")}
              </Button>
            </div>
            <Button
              className="h-11 text-base"
              variant="outline"
              onClick={() => setOpenOrderTable(true)}
            >
              {t("orderTableTitle")}
            </Button>
            <Button
              className="h-11 text-base"
              variant="outline"
              onClick={() => setOpenTableSessions(true)}
            >
              {t("posTableSessions")}
            </Button>
            <Button
              className="h-11 text-base"
              variant="outline"
              onClick={() => setPromotionInfoOpen(true)}
            >
              {t("promotions")}
            </Button>
            <Button
              className="h-11 text-base"
              variant="outline"
              onClick={() => setOpenTemporaryAvailability(true)}
            >
              {t("temporaryAvailabilityTitle")}
            </Button>
            {/* Temporarily hidden; keep the stocktake dialog and state for later. */}
          </div>
        </div>
      )}
      <Dialog open={openAdvanced} onOpenChange={setOpenAdvanced}>
        <DialogContent className="top-4 max-w-lg translate-y-0 p-8">
          <DialogHeader>
            <DialogTitle>{t("advanced")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            <Button
              className="h-11 text-base"
              variant="outline"
              onClick={() => {
                setOpenAdvanced(false);
                setOpenOtherRevenue(true);
              }}
            >
              {t("otherRevenue")}
            </Button>
            <Button
              className="h-11 text-base"
              variant="outline"
              onClick={() => {
                setOpenAdvanced(false);
                setOpenExpense(true);
              }}
            >
              {t("expenses")}
            </Button>
            <Button
              className="h-11 text-base"
              variant="outline"
              onClick={() => {
                setOpenAdvanced(false);
                setOpenInventoryPurchase(true);
              }}
            >
              {t("posInventoryPurchase")}
            </Button>
            <Button
              className="h-11 text-base"
              variant="outline"
              onClick={() => {
                setOpenAdvanced(false);
                setOpenShiftAttendance(true);
              }}
            >
              {t("attendance")}
            </Button>
            <Button
              className="h-11 text-base"
              variant="outline"
              onClick={() => {
                setOpenAdvanced(false);
                setOpenDailyClosing(true);
                void queryClient.invalidateQueries({
                  queryKey: ["daily-closing-summary"],
                });
              }}
            >
              {t("dailyClosing")}
            </Button>
            <div className="flex min-h-11 items-center justify-center rounded-md border px-3">
              <LanguageSwitcher />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {openExpense && (
        <ExpenseTableDialog
          open={openExpense}
          onClose={() => {
            setOpenExpense(false);
          }}
        />
      )}
      <InventoryPurchaseDialog
        open={openInventoryPurchase}
        onClose={() => setOpenInventoryPurchase(false)}
      />
      <PosStocktakeDialog
        open={openStocktake}
        onClose={() => setOpenStocktake(false)}
      />
      <PosTableSessions
        open={openTableSessions}
        onClose={() => setOpenTableSessions(false)}
      />
      {openOrderTable && (
        <OrderTable
          open={openOrderTable}
          displayOrderDetail={displayOrderDetail}
          checkoutPendingOrder={checkoutPendingOrder}
          onClose={() => {
            setOpenOrderTable(false);
          }}
        />
      )}
      {openTemporaryAvailability && (
        <TemporaryAvailabilityTable
          items={allItems}
          addons={storeAddons}
          open={openTemporaryAvailability}
          onClose={() => setOpenTemporaryAvailability(false)}
        />
      )}
      {openDailyClosing && (
        <DailyClosing
          open={openDailyClosing}
          onClose={() => setOpenDailyClosing(false)}
        />
      )}
      {openOtherRevenue && (
        <OtherRevenue
          open={openOtherRevenue}
          onClose={() => setOpenOtherRevenue(false)}
        />
      )}
      {openShiftAttendance && (
        <ShiftAttendance
          open={openShiftAttendance}
          onClose={() => {
            setOpenShiftAttendance(false);
          }}
        />
      )}
    </div>
  );
};

export default POSPage;
