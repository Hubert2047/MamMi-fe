"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import { X } from "lucide-react";
const initial: AddonInput = {
  names: { vi: "", en: "", "zh-TW": "" },
  priceExtra: 0,
  active: true,
};
const normalizeSearchText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
export default function AddonsPage() {
  const client = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SuperAdmin";
  const { t, locale } = useI18n();
  const [form, setForm] = useState<AddonInput>(initial);
  const [editing, setEditing] = useState<Addon | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { containerRef, pageSize } = useTablePageSize(
    51,
    100,
    undefined,
    true,
    5,
    true,
    true,
  );
  const { data: addons = [], isLoading } = useQuery({
    queryKey: ["addons", locale],
    queryFn: () => getAddons(locale),
  });
  const name = (addon: Addon) =>
    addon.names[locale] ||
    addon.names.vi ||
    addon.names.en ||
    addon.names["zh-TW"] ||
    addon.name;
  const filteredAddons = useMemo(() => {
    const query = normalizeSearchText(search.trim());
    if (!query) return addons;
    return addons.filter((addon) => normalizeSearchText(name(addon)).includes(query));
  }, [addons, locale, search]);
  const totalPages = Math.max(1, Math.ceil(filteredAddons.length / pageSize));
  const visible = filteredAddons.slice((page - 1) * pageSize, page * pageSize);
  useEffect(
    () => setPage((current) => Math.min(current, totalPages)),
    [totalPages],
  );
  useEffect(() => setPage(1), [search]);
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
      <Card
        className={
          isFormOpen
            ? "fixed left-1/2 top-4 z-50 m-0 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 max-h-[calc(100svh-2rem)] overflow-y-auto bg-card shadow-xl md:top-8 md:max-h-[calc(100svh-4rem)]"
            : "hidden"
        }
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-4 top-4 z-10"
          aria-label={t("close")}
          onClick={closeForm}
        >
          <X />
        </Button>
        <CardHeader className="pr-12">
          <CardTitle>{editing ? t("editAddon") : t("createAddon")}</CardTitle>
        </CardHeader>
        <CardContent>
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
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-w-24"
                onClick={closeForm}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="min-w-24"
                disabled={save.isPending}
              >
                {t("save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card
        ref={containerRef}
        data-table-header-align="left"
        className="flex h-[calc(100svh-180px)] min-h-0 flex-col overflow-hidden"
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle>{t("addonList")}</CardTitle>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchAddon")}
                aria-label={t("searchAddon")}
                className="h-8 w-36 sm:w-52"
              />
            </div>
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
