"use client";

import { AddExpenseDialog } from "@/components/expense/AddExpenseDialog";

export default function InventoryPurchaseDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AddExpenseDialog open={open} onClose={onClose} mode="inventory_purchase" />
  );
}
