"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createAddon,
  deleteAddon,
  getAddons,
  updateAddon,
  type Addon,
  type AddonInput,
} from "@/api/addon";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/auth";
import { useTablePageSize } from "@/hooks/use-table-page-size";
const initial: AddonInput = {
  names: { vi: "", en: "", "zh-TW": "" },
  priceExtra: 0,
  active: true,
};
export default function AddonsPage() {
  const client = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SuperAdmin";
  const { t, locale } = useI18n();
  const [form, setForm] = useState<AddonInput>(initial);
  const [editing, setEditing] = useState<Addon | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { pageSize } = useTablePageSize();
  const { data: addons = [], isLoading } = useQuery({
    queryKey: ["addons", locale],
    queryFn: () => getAddons(locale),
  });
  const totalPages = Math.max(1, Math.ceil(addons.length / pageSize));
  const visible = addons.slice((page - 1) * pageSize, page * pageSize);
  useEffect(
    () => setPage((current) => Math.min(current, totalPages)),
    [totalPages],
  );
  const closeForm = () => {
    setForm(initial);
    setEditing(null);
    setIsFormOpen(false);
  };
  const save = useMutation({
    mutationFn: () =>
      editing
        ? updateAddon({ id: editing._id, data: { names: form.names } })
        : createAddon({ names: form.names, priceExtra: 0, active: true }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["addons"] });
      toast.success(
        editing ? t("updateAddonSuccess") : t("createAddonSuccess"),
      );
      closeForm();
    },
    onError: () => toast.error(t("addonSaveError")),
  });
  const remove = useMutation({
    mutationFn: deleteAddon,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["addons"] });
      setPage(1);
      toast.success(t("deleteAddonSuccess"));
    },
    onError: () => toast.error(t("addonDeleteError")),
  });
  const name = (addon: Addon) =>
    addon.names[locale] ||
    addon.names.vi ||
    addon.names.en ||
    addon.names["zh-TW"] ||
    addon.name;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !form.names.vi.trim() &&
      !form.names.en.trim() &&
      !form.names["zh-TW"].trim()
    )
      return toast.error(t("requiredAddonName"));
    save.mutate();
  };
  const edit = (addon: Addon) => {
    setEditing(addon);
    setForm({ ...initial, names: addon.names });
    setIsFormOpen(true);
  };
  if (!isSuperAdmin)
    return (
      <div className="p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("superAdminOnly")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("catalogSuperAdminHint")}
          </CardContent>
        </Card>
      </div>
    );
  return (
    <div className="h-full overflow-hidden p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t("addons")}</h1>
        <Button
          onClick={() => {
            closeForm();
            setIsFormOpen(true);
          }}
        >
          {t("createAddon")}
        </Button>
      </div>
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent
          aria-describedby={undefined}
          className="max-h-[85vh] max-w-lg overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editAddon") : t("createAddon")}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            {(["vi", "en", "zh-TW"] as const).map((language) => (
              <div className="space-y-2" key={language}>
                <Label>
                  {t("addonName")} (
                  {language === "zh-TW" ? "繁中" : language.toUpperCase()})
                </Label>
                <Input
                  value={form.names[language]}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      names: { ...form.names, [language]: event.target.value },
                    })
                  }
                />
              </div>
            ))}
            <DialogFooter>
              <Button type="submit" disabled={save.isPending}>
                {t("save")}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                {t("cancel")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Card className="flex h-[calc(100svh-180px)] min-h-0 flex-col overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{t("addonList")}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {page}/{totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                ‹
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                ›
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2}>{t("loading")}</TableCell>
                </TableRow>
              ) : (
                visible.map((addon) => (
                  <TableRow key={addon._id}>
                    <TableCell>{name(addon)}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => edit(addon)}
                      >
                        {t("edit")}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            {t("delete")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("confirmDeleteTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("confirmDeleteAddon")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => remove.mutate(addon._id)}
                            >
                              {t("confirm")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
