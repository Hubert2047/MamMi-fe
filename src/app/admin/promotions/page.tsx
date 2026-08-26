"use client";

import { useEffect, useState } from "react";
import { CircleHelp } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  createPromotion,
  deletePromotion,
  getPromotions,
  updatePromotion,
  type Promotion,
  type PromotionInput,
  type PromotionRule,
} from "@/api/promotion";
import { getCatalogItems } from "@/api/catalog-item";
import { getAddons } from "@/api/addon";
import { getStores } from "@/api/store";
import { useI18n } from "@/lib/i18n";

const emptyRule = (): PromotionRule => ({
  target: "order",
  reward: { type: "percent", amount: 0 },
});
const initial = (): PromotionInput => ({
  names: { vi: "", en: "", "zh-TW": "" },
  mode: "automatic",
  status: "draft",
  priority: 0,
  combinable: false,
  exclusiveGroup: "",
  rules: [emptyRule()],
  storeIds: [],
});
const dateInput = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";
const formatDateTime = (value: string | null | undefined, locale: string) =>
  value
    ? new Intl.DateTimeFormat(locale === "zh-TW" ? "zh-TW" : locale, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
const responseMessage = (error: unknown) =>
  isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message
    : undefined;

export default function PromotionsPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PromotionInput>(initial);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [previewing, setPreviewing] = useState<Promotion | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | Promotion["status"]>(
    "all",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [ruleSearch, setRuleSearch] = useState<Record<string, string>>({});
  const [ruleCategory, setRuleCategory] = useState<Record<string, string>>({});
  const { data: promotions = [] } = useQuery({
    queryKey: ["promotions"],
    queryFn: getPromotions,
  });
  const { data: items = [] } = useQuery({
    queryKey: ["promotion-items", locale],
    queryFn: () => getCatalogItems(locale),
  });
  const { data: addons = [] } = useQuery({
    queryKey: ["promotion-addons", locale],
    queryFn: () => getAddons(locale),
  });
  const { data: stores = [] } = useQuery({
    queryKey: ["promotion-stores"],
    queryFn: getStores,
  });
  const labelsFor = (
    ids: string[] | undefined,
    entries: Array<{ _id: string; name: string }>,
    allLabel: string,
  ) =>
    !ids?.length
      ? allLabel
      : ids
          .map((id) => entries.find((entry) => entry._id === id)?.name || id)
          .join(", ");
  useEffect(() => {
    const measure = () =>
      setPageSize(Math.max(3, Math.floor((window.innerHeight - 290) / 86)));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const save = useMutation({
    mutationFn: () =>
      editing
        ? updatePromotion({ id: editing._id, data: form })
        : createPromotion(form),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["promotions"] });
      setForm(initial());
      setEditing(null);
      setFormOpen(false);
    },
    onError: (error) =>
      toast.error(responseMessage(error) || t("promotionSaveError")),
  });
  const remove = useMutation({
    mutationFn: deletePromotion,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["promotions"] }),
    onError: (error) =>
      toast.error(responseMessage(error) || t("promotionDeleteError")),
  });
  const setRule = (index: number, update: Partial<PromotionRule>) =>
    setForm((current) => ({
      ...current,
      rules: current.rules.map((rule, i) =>
        i === index ? { ...rule, ...update } : rule,
      ),
    }));
  const beginEdit = (promotion: Promotion) => {
    setEditing(promotion);
    setForm({
      names: promotion.names,
      mode: promotion.mode,
      status: promotion.status,
      minSubtotal: promotion.minSubtotal,
      priority: promotion.priority,
      combinable: promotion.combinable,
      exclusiveGroup: promotion.exclusiveGroup,
      rules: promotion.rules,
      startsAt: promotion.startsAt || undefined,
      endsAt: promotion.endsAt || undefined,
      storeIds: promotion.assignedStoreIds,
    });
    setFormOpen(true);
  };
  const filteredPromotions = promotions
    .filter(
      (promotion) =>
        statusFilter === "all" || promotion.status === statusFilter,
    )
    .sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
  const pageCount = Math.max(
    1,
    Math.ceil(filteredPromotions.length / pageSize),
  );
  const activePage = Math.min(page, pageCount);
  const visiblePromotions = filteredPromotions.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );
  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{t("promotions")}</h1>
          <div className="group relative">
            <button
              type="button"
              className="inline-flex text-muted-foreground hover:text-foreground"
              aria-label={t("promotionHelp")}
            >
              <CircleHelp className="size-5" />
            </button>
            <div className="pointer-events-none absolute left-0 top-7 z-50 hidden w-80 rounded-md border bg-popover p-3 text-sm text-popover-foreground shadow-md group-hover:block group-focus-within:block">
              <p className="font-medium">{t("promotionHelp")}</p>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">
                {t("promotionHelpBody")}
              </p>
            </div>
          </div>
        </div>
        <Button
          className="shrink-0"
          onClick={() => {
            setEditing(null);
            setForm(initial());
            setFormOpen(true);
          }}
        >
          {t("createPromotion")}
        </Button>
      </div>
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
            setForm(initial());
          }
        }}
      >
        <DialogContent className="flex w-[min(96vw,72rem)] max-w-none flex-col overflow-hidden p-0 sm:max-w-none">
          <Card className="flex max-h-[90dvh] min-h-0 flex-1 flex-col border-0 shadow-none">
            <CardHeader className="shrink-0">
              <DialogTitle>
                {editing ? t("editPromotion") : t("createPromotion")}
              </DialogTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-hidden">
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  save.mutate();
                }}
              >
                <div className="grid gap-2 md:grid-cols-3">
                  {(["vi", "en", "zh-TW"] as const).map((language) => (
                    <Input
                      key={language}
                      placeholder={`${t("name")} (${language})`}
                      value={form.names[language]}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          names: {
                            ...form.names,
                            [language]: event.target.value,
                          },
                        })
                      }
                    />
                  ))}
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>{t("promotionMode")}</Label>
                    <Select
                      value={form.mode}
                      onValueChange={(mode) =>
                        setForm({
                          ...form,
                          mode: mode as PromotionInput["mode"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">
                          {t("automatic")}
                        </SelectItem>
                        <SelectItem value="manual">{t("manual")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("promotionStatus")}</Label>
                    <Select
                      value={form.status}
                      onValueChange={(status) =>
                        setForm({
                          ...form,
                          status: status as PromotionInput["status"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{t("draft")}</SelectItem>
                        <SelectItem value="active">{t("active")}</SelectItem>
                        <SelectItem value="expired" disabled>
                          {t("expired")}
                        </SelectItem>
                        <SelectItem value="archived">
                          {t("archived")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("priority")}</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.priority}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          priority: Number(event.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>{t("startsAt")}</Label>
                    <Input
                      type="datetime-local"
                      value={dateInput(form.startsAt)}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          startsAt: event.target.value
                            ? new Date(event.target.value).toISOString()
                            : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("endsAt")}</Label>
                    <Input
                      type="datetime-local"
                      value={dateInput(form.endsAt)}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          endsAt: event.target.value
                            ? new Date(event.target.value).toISOString()
                            : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("minSubtotal")}</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.minSubtotal ?? ""}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          minSubtotal: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                </div>
                <label className="flex gap-2 text-sm">
                  <Checkbox
                    checked={form.combinable}
                    onCheckedChange={(value) =>
                      setForm({ ...form, combinable: value === true })
                    }
                  />
                  {t("combinable")}
                </label>
                <div className="space-y-3 rounded border p-3">
                  <div className="flex justify-between">
                    <Label>{t("promotionRules")}</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setForm({
                          ...form,
                          rules: [...form.rules, emptyRule()],
                        })
                      }
                    >
                      {t("addRule")}
                    </Button>
                  </div>
                  <div className="max-h-[28dvh] space-y-2 overflow-y-auto pr-1">
                    {form.rules.map((rule, index) => (
                      <div className="space-y-2 border-t pt-3" key={index}>
                      <div className="grid gap-2 md:grid-cols-3">
                        <Select
                          value={rule.target}
                          onValueChange={(target) =>
                            setRule(index, {
                              target: target as PromotionRule["target"],
                              productIds: [],
                              addonIds: [],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="order">
                              {t("targetOrder")}
                            </SelectItem>
                            <SelectItem value="product">
                              {t("targetProduct")}
                            </SelectItem>
                            <SelectItem value="addon">
                              {t("targetAddon")}
                            </SelectItem>
                            <SelectItem value="line">
                              {t("targetLine")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={rule.reward.type}
                          onValueChange={(type) =>
                            setRule(index, {
                              reward: {
                                ...rule.reward,
                                type: type as PromotionRule["reward"]["type"],
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">
                              {t("discountPercent")}
                            </SelectItem>
                            <SelectItem value="value">
                              {t("discountValue")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="0"
                          value={rule.reward.amount}
                          onChange={(event) =>
                            setRule(index, {
                              reward: {
                                ...rule.reward,
                                amount: Number(event.target.value),
                              },
                            })
                          }
                        />
                      </div>
                      {rule.target !== "order" &&
                        (() => {
                          const searchKey = `${index}-${rule.target}`;
                          const query = (
                            ruleSearch[searchKey] || ""
                          ).toLowerCase();
                          const category = ruleCategory[searchKey] || "all";
                          const entries = (
                            rule.target === "addon" ? addons : items
                          ).filter((entry) => {
                            const matchesSearch = entry.name.toLowerCase().includes(query);
                            const entryCategory = "categoryName" in entry ? entry.categoryName : "";
                            const matchesCategory = rule.target === "addon" || category === "all" || entryCategory === category;
                            return matchesSearch && matchesCategory;
                          });
                          const categories = rule.target === "addon" ? [] : [...new Set(items.map((item) => item.categoryName).filter(Boolean))].sort((a, b) => a.localeCompare(b));
                          const selected =
                            rule.target === "addon"
                              ? rule.addonIds || []
                              : rule.productIds || [];
                          return (
                            <details className="rounded-md border">
                              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                                {rule.target === "addon" ? t("eligibleAddons") : t("eligibleProducts")} ({selected.length})
                              </summary>
                              <div className="space-y-2 border-t p-3">
                                <div className="flex flex-wrap gap-2">
                                <Input
                                  className="w-56"
                                  placeholder={t("searchPromotionTargets")}
                                  value={ruleSearch[searchKey] || ""}
                                  onChange={(event) =>
                                    setRuleSearch({
                                      ...ruleSearch,
                                      [searchKey]: event.target.value,
                                    })
                                  }
                                />
                                {rule.target !== "addon" && (
                                  <Select
                                    value={category}
                                    onValueChange={(value) => setRuleCategory({ ...ruleCategory, [searchKey]: value })}
                                  >
                                    <SelectTrigger className="h-8 w-52">
                                      <SelectValue placeholder={t("promotionCategoryFilter")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">{t("allCategories")}</SelectItem>
                                      {categories.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                )}
                                </div>
                                <div className="max-h-40 space-y-2 overflow-y-auto">
                                {entries.map((entry) => {
                                  const checked = selected.includes(entry._id);
                                  return (
                                    <label
                                      className="flex cursor-pointer items-center gap-2 text-sm"
                                      key={entry._id}
                                    >
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={(value) =>
                                          setRule(
                                            index,
                                            rule.target === "addon"
                                              ? {
                                                  addonIds:
                                                    value === true
                                                      ? [...selected, entry._id]
                                                      : selected.filter(
                                                          (id) =>
                                                            id !== entry._id,
                                                        ),
                                                }
                                              : {
                                                  productIds:
                                                    value === true
                                                      ? [...selected, entry._id]
                                                      : selected.filter(
                                                          (id) =>
                                                            id !== entry._id,
                                                        ),
                                                },
                                          )
                                        }
                                      />
                                      {entry.name}
                                    </label>
                                  );
                                })}
                                </div>
                              </div>
                            </details>
                          );
                        })()}
                      {form.rules.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setForm({
                              ...form,
                              rules: form.rules.filter((_, i) => i !== index),
                            })
                          }
                        >
                          {t("removeRule")}
                        </Button>
                      )}
                      </div>
                    ))}
                  </div>
                </div>
                <details className="rounded-md border">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                    {t("assignedStores")} ({(form.storeIds ?? []).length})
                  </summary>
                  <div className="max-h-48 space-y-2 overflow-y-auto border-t p-3">
                    {stores.map((store) => {
                      const checked = (form.storeIds ?? []).includes(store._id);
                      return (
                        <label
                          className="flex cursor-pointer items-center gap-2 text-sm"
                          key={store._id}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                storeIds:
                                  value === true
                                    ? [
                                        ...new Set([
                                          ...(current.storeIds ?? []),
                                          store._id,
                                        ]),
                                      ]
                                    : (current.storeIds ?? []).filter(
                                        (id) => id !== store._id,
                                      ),
                              }))
                            }
                          />
                          {store.name}
                        </label>
                      );
                    })}
                  </div>
                </details>
                <div className="flex flex-wrap gap-3">
                  <Button disabled={save.isPending}>{t("save")}</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormOpen(false);
                      setEditing(null);
                      setForm(initial());
                    }}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(previewing)}
        onOpenChange={(open) => !open && setPreviewing(null)}
      >
        <DialogContent className="w-[min(94vw,48rem)] max-w-none sm:max-w-none max-h-[88dvh] overflow-y-auto">
          {previewing && (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("promotionMode")}: {previewing.mode === "automatic" ? t("automatic") : t("manual")}
                </p>
                <DialogTitle className="text-2xl font-semibold">
                  {previewing.names[locale] || previewing.name}
                </DialogTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("promotionPreviewRulesTogether")}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    {t("promotionStatus")}
                  </p>
                  <p className="font-medium">{t(previewing.status)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    {t("priority")}
                  </p>
                  <p className="font-medium">{previewing.priority}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    {t("startsAt")}
                  </p>
                  <p className="font-medium">
                    {formatDateTime(previewing.startsAt, locale)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t("endsAt")}</p>
                  <p className="font-medium">
                    {formatDateTime(previewing.endsAt, locale)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    {t("minSubtotal")}
                  </p>
                  <p className="font-medium">{previewing.minSubtotal ?? "—"}</p>
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  {t("assignedStores")}
                </p>
                <p className="mt-1 font-medium">
                  {previewing.assignedStoreIds.length
                    ? labelsFor(
                        previewing.assignedStoreIds,
                        stores,
                        t("promotionPreviewNoStores"),
                      )
                    : t("promotionPreviewNoStores")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">{t("promotionRules")}</h3>
                <div className="space-y-2">
                  {previewing.rules.map((rule, index) => (
                    <div className="rounded-lg border p-3" key={index}>
                      <p className="font-medium">
                        {rule.target === "order"
                          ? t("targetOrder")
                          : rule.target === "product"
                            ? t("targetProduct")
                            : rule.target === "addon"
                              ? t("targetAddon")
                              : t("targetLine")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {rule.reward.type === "percent"
                          ? `${rule.reward.amount}%`
                          : `${rule.reward.amount}`}
                      </p>
                      <div className="mt-2 rounded-md bg-muted/50 p-2 text-sm">
                        <span className="font-medium">{t("promotionPreviewScope")}:</span>{" "}
                        {rule.target === "order"
                          ? t("promotionPreviewOrderScope")
                          : rule.target === "product"
                            ? `${t("promotionPreviewProductScope")}: ${labelsFor(rule.productIds, items, t("promotionPreviewAllProducts"))}`
                            : rule.target === "addon"
                              ? `${t("promotionPreviewAddonScope")}: ${labelsFor(rule.addonIds, addons, t("promotionPreviewAllAddons"))}`
                              : `${t("promotionPreviewLineScope")}: ${labelsFor(rule.productIds, items, t("promotionPreviewAllProducts"))}; ${t("promotionPreviewLineIncludesAddons")}`}
                      </div>
                      {rule.target !== "order" && rule.target !== "addon" && (
                        <p className="mt-2 text-sm">
                          <span className="text-muted-foreground">
                            {t("promotionPreviewProducts")}:
                          </span>{" "}
                          {labelsFor(
                            rule.productIds,
                            items,
                            t("promotionPreviewAllProducts"),
                          )}
                        </p>
                      )}
                      {rule.target === "addon" && (
                        <>
                          <p className="mt-2 text-sm">
                            <span className="text-muted-foreground">
                              {t("promotionPreviewAddons")}:
                            </span>{" "}
                            {labelsFor(
                              rule.addonIds,
                              addons,
                              t("promotionPreviewAllAddons"),
                            )}
                          </p>
                          {rule.productIds?.length ? (
                            <p className="mt-1 text-sm">
                              <span className="text-muted-foreground">
                                {t("promotionPreviewProducts")}:
                              </span>{" "}
                              {labelsFor(
                                rule.productIds,
                                items,
                                t("promotionPreviewAllProducts"),
                              )}
                            </p>
                          ) : null}
                        </>
                      )}
                      {rule.target === "line" && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {t("promotionPreviewLineIncludesAddons")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <style>
        {
          '[data-slot="card-header"] { display:flex !important; flex-direction:row !important; align-items:center !important; justify-content:flex-start !important; } [data-slot="card-header"] > :first-child { margin-right:auto; }'
        }
      </style>
      <Card>
        <CardHeader className="flex-row items-center justify-end gap-3">
          <Select
            value={statusFilter}
            onValueChange={(status) => {
              setStatusFilter(status as "all" | Promotion["status"]);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="draft">{t("draft")}</SelectItem>
              <SelectItem value="active">{t("active")}</SelectItem>
              <SelectItem value="expired">{t("expired")}</SelectItem>
              <SelectItem value="archived">{t("archived")}</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {activePage}/{pageCount}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={activePage <= 1}
            onClick={() => setPage(activePage - 1)}
          >
            {t("pagePrevious")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={activePage >= pageCount}
            onClick={() => setPage(activePage + 1)}
          >
            {t("pageNext")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {visiblePromotions.map((promotion) => (
            <div
              className="flex items-center justify-between rounded border p-3"
              key={promotion._id}
            >
              <div>
                <p className="font-medium">
                  {promotion.names[locale] || promotion.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {promotion.mode === "automatic"
                    ? t("automatic")
                    : t("manual")}{" "}
                  · {t("priority")}: {promotion.priority} ·{" "}
                  {promotion.assignedStoreIds.length} {t("assignedStores")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("startsAt")}: {formatDateTime(promotion.startsAt, locale)}{" "}
                  · {t("endsAt")}: {formatDateTime(promotion.endsAt, locale)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPreviewing(promotion)}
                >
                  {t("previewPromotion")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => beginEdit(promotion)}
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
                        {t("confirmDeletePromotion")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => remove.mutate(promotion._id)}
                      >
                        {t("confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
