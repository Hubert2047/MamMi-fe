import {
  getExpenseUnits,
  type ExpenseUnit,
  type IUpdateExpense,
  updateExpense,
} from "@/api/expense";
import { updateInventoryReceipt } from "@/api/inventory";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  editData: IUpdateExpense;
  open: boolean;
  setEditData: React.Dispatch<React.SetStateAction<IUpdateExpense | null>>;
  onClose: () => void;
};

export function EditExpenses({ editData, setEditData, open, onClose }: Props) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const { data: units = [] } = useQuery<ExpenseUnit[]>({
    queryKey: ["expense-units"],
    queryFn: () => getExpenseUnits(),
    staleTime: 5 * 60 * 1000,
  });
  const editMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<IUpdateExpense>;
    }) => {
      if (editData.type === "inventory_purchase" && editData.receipt) {
        const line = editData.receipt.lines[0];
        return updateInventoryReceipt({
          id: editData.receipt._id,
          data: {
            note: data.note,
            lines: [
              {
                inventoryItemId: line.inventoryItemId,
                quantity: Number(data.quantity),
                unitCode: String(data.unit),
                unitPrice: Number(data.unitPrice),
              },
            ],
          },
        });
      }
      return updateExpense({ id, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] }).then();
      toast.success(t("updateSuccess"), {
        closeButton: true,
        duration: 1500,
      });
      onClose();
    },
    onError: () => {
      toast.error(t("updateFailure"));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]:
          name === "quantity" || name === "unitPrice" ? Number(value) : value,
      };
    });
  };

  const adjustQuantity = (amount: number) => {
    setEditData((prev) =>
      prev
        ? {
            ...prev,
            quantity: Math.max(0.001, Number(prev.quantity ?? 0) + amount),
          }
        : prev,
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editData?.name) {
      toast.warning(t("requiredName"));
      return;
    }
    if (!editData?.unitPrice && !editData?.price) {
      toast.warning(t("requiredPrice"));
      return;
    }
    editMutation.mutate({
      id: editData._id!,
      data: {
        ...editData,
        quantity: Number(editData.quantity ?? 1),
        unit: editData.unit ?? "",
        unitPrice: Number(editData.unitPrice ?? editData.price),
        price:
          Number(editData.quantity ?? 1) *
          Number(editData.unitPrice ?? editData.price),
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="top-4 max-h-[calc(100dvh-2rem)] translate-y-0 overflow-y-auto sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-black! font-bold! text-xl">
              {t("expenseEditTitle")}
            </DialogTitle>
          </DialogHeader>

          <FieldGroup className="sm:grid sm:grid-cols-3 sm:gap-x-4 sm:gap-y-3">
            <Field className="sm:col-span-3">
              <Label htmlFor="name-1">{t("expenseName")}</Label>
              <Input
                id="name-1"
                name="name"
                value={editData.name}
                onChange={handleChange}
                disabled={editData.type === "inventory_purchase"}
              />
            </Field>

            <Field>
              <Label htmlFor="quantity-1">{t("expenseQuantity")}</Label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Giảm số lượng"
                  onClick={() => adjustQuantity(-1)}
                >
                  −
                </Button>
                <Input
                  className="min-w-0 text-center"
                  id="quantity-1"
                  name="quantity"
                  type="number"
                  min="0.001"
                  step="any"
                  value={editData.quantity ?? 1}
                  onChange={handleChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Tăng số lượng"
                  onClick={() => adjustQuantity(1)}
                >
                  +
                </Button>
              </div>
            </Field>

            <Field>
              <Label htmlFor="unit-1">{t("expenseUnit")}</Label>
              <Select
                value={editData.unit ?? ""}
                onValueChange={(value) =>
                  setEditData((prev) =>
                    prev ? { ...prev, unit: value } : prev,
                  )
                }
              >
                <SelectTrigger id="unit-1" className="w-full">
                  <SelectValue placeholder={t("expenseUnit")} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.code} value={unit.code}>
                      {unit.names[locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <Label htmlFor="unit-price-1">{t("expenseUnitPrice")}</Label>
              <Input
                id="unit-price-1"
                name="unitPrice"
                type="number"
                min="0"
                value={editData.unitPrice ?? editData.price}
                onChange={handleChange}
              />
            </Field>

            <Field className="sm:col-span-3">
              <Label htmlFor="note-1">{t("expenseNote")}</Label>
              <Input
                id="note-1"
                name="note"
                value={editData.note}
                onChange={handleChange}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" size="lg" className="w-20">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={editMutation.isPending}
              size="lg"
              className="w-20"
            >
              {editMutation.isPending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
