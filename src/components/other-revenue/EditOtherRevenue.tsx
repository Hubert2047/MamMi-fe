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
import { type IUpdateRevenue, updateRevenue } from "@/api/other-revenue.ts";
import { useI18n } from "@/lib/i18n";

type Props = {
  editData: IUpdateRevenue;
  open: boolean;
  setEditData: React.Dispatch<React.SetStateAction<IUpdateRevenue | null>>;
  onClose: () => void;
};

export function EditOtherRevenue({
  editData,
  setEditData,
  open,
  onClose,
}: Props) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const editMutation = useMutation({
    mutationFn: updateRevenue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] }).then();
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

  const handleChangeRevenue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: name === "price" ? Number(value) : value,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editData?.name) {
      toast.warning(t("requiredName"));
      return;
    }
    if (!editData?.price) {
      toast.warning(t("requiredPrice"));
      return;
    }
    editMutation.mutate({
      id: editData._id!,
      data: {
        ...editData,
        price: Number(editData.price),
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
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-black! font-bold! text-xl">
              {t("editRevenueTitle")}
            </DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <Label htmlFor="name-1">{t("revenueName")}</Label>
              <Input
                id="name-1"
                name="name"
                value={editData.name}
                onChange={handleChangeRevenue}
              />
            </Field>

            <Field>
              <Label htmlFor="price-1">{t("price")}</Label>
              <Input
                id="price-1"
                name="price"
                type="number"
                value={editData.price}
                onChange={handleChangeRevenue}
              />
            </Field>

            <Field>
              <Label htmlFor="note-1">{t("note")}</Label>
              <Input
                id="note-1"
                name="note"
                value={editData.note}
                onChange={handleChangeRevenue}
              />
            </Field>
            <Field>
              <Label htmlFor="payment-method-1">{t("paymentMethod")}</Label>
              <select
                id="payment-method-1"
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                value={editData.paymentMethod ?? "cash"}
                onChange={(event) =>
                  setEditData((current) =>
                    current
                      ? {
                          ...current,
                          paymentMethod: event.target.value as
                            "cash" | "bank_transfer" | "other",
                        }
                      : current,
                  )
                }
              >
                <option value="cash">{t("paymentCash")}</option>
                <option value="bank_transfer">{t("paymentBank")}</option>
                <option value="other">{t("paymentOther")}</option>
              </select>
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
