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
const emptyNames: CategoryNames = { vi: "", en: "", "zh-TW": "" };
export default function CategoriesPage() {
  const client = useQueryClient();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [names, setNames] = useState(emptyNames);
  const [sortOrder, setSortOrder] = useState(0);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { pageSize } = useTablePageSize();
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize));
  const visible = categories.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage((p) => Math.min(p, totalPages)), [totalPages]);
  useEffect(() => {
    if (!isFormOpen) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, [isFormOpen]);
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
  const display = (c: Category) =>
    c.names[locale] || c.names.vi || c.names.en || c.names["zh-TW"];
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
      <Card
        className={
          isFormOpen
            ? "fixed inset-4 z-50 max-h-[calc(100svh-2rem)] overflow-y-auto bg-card shadow-xl md:inset-8 md:max-h-[calc(100svh-4rem)]"
            : "hidden"
        }
      >
        <CardHeader>
          <CardTitle>
            {editing ? t("editCategory") : t("createCategory")}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            <div className="flex gap-2">
              <Button type="submit" disabled={save.isPending}>
                {t("save")}
              </Button>
              <Button type="button" variant="outline" onClick={close}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card className="flex h-[calc(100svh-180px)] min-h-0 flex-col overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{t("categoryList")}</CardTitle>
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
