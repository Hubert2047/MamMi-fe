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
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type Category,
  type CategoryNames,
} from "@/api/category";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/auth";
import { useTablePageSize } from "@/hooks/use-table-page-size";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
const emptyNames: CategoryNames = { vi: "", en: "", "zh-TW": "" };
const normalizeSearchText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
export default function CategoriesPage() {
  const client = useQueryClient();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [names, setNames] = useState(emptyNames);
  const [sortOrder, setSortOrder] = useState(0);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { containerRef, pageSize } = useTablePageSize();
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const display = (c: Category) =>
    c.names[locale] || c.names.vi || c.names.en || c.names["zh-TW"];
  const filteredCategories = useMemo(() => {
    const query = normalizeSearchText(search.trim());
    if (!query) return categories;
    return categories.filter((category) =>
      normalizeSearchText(display(category)).includes(query),
    );
  }, [categories, locale, search]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / pageSize),
  );
  const visible = filteredCategories.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  useEffect(() => setPage((p) => Math.min(p, totalPages)), [totalPages]);
  useEffect(() => setPage(1), [search]);
  const close = () => {
    setNames(emptyNames);
    setSortOrder(0);
    setEditing(null);
    setIsFormOpen(false);
  };
  const save = useMutation({
    mutationFn: () =>
      editing
        ? updateCategory(editing._id, { names, sortOrder })
        : createCategory({ names, sortOrder }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["categories"] });
      client.invalidateQueries({ queryKey: ["admin-items"] });
      toast.success(
        editing ? t("updateCategorySuccess") : t("createCategorySuccess"),
      );
      close();
    },
    onError: () => toast.error(t("categorySaveError")),
  });
  const remove = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["categories"] });
      setPage(1);
      toast.success(t("deleteCategorySuccess"));
    },
    onError: () => toast.error(t("categoryDeleteError")),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!names.vi.trim() && !names.en.trim() && !names["zh-TW"].trim())
      return toast.error(t("requiredCategoryName"));
    save.mutate();
  };
  const edit = (c: Category) => {
    setEditing(c);
    setNames(c.names);
    setSortOrder(c.sortOrder ?? 0);
    setIsFormOpen(true);
  };
  if (user?.role !== "SuperAdmin")
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("superAdminOnly")}</CardTitle>
          </CardHeader>
          <CardContent>{t("catalogSuperAdminHint")}</CardContent>
        </Card>
      </div>
    );
  return (
    <div className="h-full overflow-hidden p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("categories")}</h1>
        <Button
          onClick={() => {
            close();
            setIsFormOpen(true);
          }}
        >
          {t("createCategory")}
        </Button>
      </div>
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && close()}>
        <DialogContent
          aria-describedby={undefined}
          className="max-h-[85vh] max-w-lg overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editCategory") : t("createCategory")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {(["vi", "en", "zh-TW"] as const).map((l) => (
              <div className="space-y-2" key={l}>
                <Label>
                  {t("categoryName")} (
                  {l === "zh-TW" ? "繁中" : l.toUpperCase()})
                </Label>
                <Input
                  value={names[l]}
                  onChange={(e) => setNames({ ...names, [l]: e.target.value })}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label>{t("categorySortOrder")}</Label>
              <Input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(Math.max(0, Number(e.target.value) || 0))
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Card
        ref={containerRef}
        data-table-header-align="left"
        className="flex h-[calc(100svh-180px)] min-h-0 flex-col overflow-hidden"
      >
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle>{t("categoryList")}</CardTitle>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchCategory")}
                aria-label={t("searchCategory")}
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
                onClick={() => setPage((p) => p - 1)}
              >
                ‹
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
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
                <TableHead>{t("categorySortOrder")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3}>{t("loading")}</TableCell>
                </TableRow>
              ) : (
                visible.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.sortOrder ?? 0}</TableCell>
                    <TableCell>{display(c)}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => edit(c)}
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
                              {t("confirmDeleteCategory")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => remove.mutate(c._id)}
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
