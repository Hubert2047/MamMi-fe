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
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRevenue } from "@/api/other-revenue.ts";
import { Button } from "@/components/ui/button.tsx";
import { useI18n } from "@/lib/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddOtherRevenue({ open, onClose }: Props) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    note: "",
    paymentMethod: "cash" as "cash" | "bank_transfer" | "other",
  });

  useEffect(() => {
    if (open) requestAnimationFrame(() => nameInputRef.current?.focus());
  }, [open]);
  const createRevenueMutation = useMutation({
    mutationFn: createRevenue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] }).then();
      toast.success(t("createSuccess"), {
        closeButton: true,
        duration: 1500,
      });
      onClose();
      setFormData({ name: "", price: "", note: "", paymentMethod: "cash" });
    },
    onError: () => {
      toast.error(t("createFailure"));
    },
  });

  const handleChangeRevenue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name) {
      toast.warning(t("requiredName"));
      return;
    }

    if (!formData.price) {
      toast.warning(t("requiredPrice"));
      return;
    }

    createRevenueMutation.mutate({
      ...formData,
      price: Number(formData.price),
      paymentMethod: formData.paymentMethod,
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
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          nameInputRef.current?.focus();
        }}
        className="top-1 max-h-[calc(100dvh-1rem)] translate-y-0 overflow-y-auto sm:max-w-xl"
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-black! font-bold! text-xl">
              {t("addRevenueTitle")}
            </DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <Label htmlFor="name-1">{t("revenueName")}</Label>
              <Input
                ref={nameInputRef}
                id="name-1"
                name="name"
                autoFocus
                value={formData.name}
                onChange={handleChangeRevenue}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label htmlFor="price-1">{t("price")}</Label>
                <Input
                  id="price-1"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChangeRevenue}
                />
              </Field>
              <Field>
                <Label htmlFor="payment-method-1">{t("paymentMethod")}</Label>
                <select
                  id="payment-method-1"
                  className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={formData.paymentMethod}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      paymentMethod: event.target.value as
                        "cash" | "bank_transfer" | "other",
                    }))
                  }
                >
                  <option value="cash">{t("paymentCash")}</option>
                  <option value="bank_transfer">{t("paymentBank")}</option>
                  <option value="other">{t("paymentOther")}</option>
                </select>
              </Field>
            </div>

            <Field>
              <Label htmlFor="note-1">{t("note")}</Label>
              <Input
                id="note-1"
                name="note"
                value={formData.note}
                onChange={handleChangeRevenue}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4 pb-4">
            <DialogClose asChild>
              <Button className="h-10 min-w-24 px-4" variant="outline">
                {t("cancel")}
              </Button>
            </DialogClose>

            <Button
              className="h-10 min-w-24 px-4"
              type="submit"
              disabled={createRevenueMutation.isPending}
            >
              {createRevenueMutation.isPending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
