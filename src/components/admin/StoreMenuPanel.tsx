"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCatalogItems } from "@/api/catalog-item";
import { addStoreItem, getStoreItems, updateStoreItem } from "@/api/store-item";
import { getCategories, type Category } from "@/api/category";
import type { Item, PriceType } from "@/api/item";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/auth";
import { useTablePageSize } from "@/hooks/use-table-page-size";
import { useStorePricingEmbedded } from "@/app/admin/store-pricing/store-pricing-context";
import { Loader2 } from "lucide-react";
import { isValidPriceMap, normalizePriceMap } from "@/lib/money";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const emptyPrice: PriceType = { base: 0, uber: 0, foodpanda: 0 };
const priceKeys = ["base", "uber", "foodpanda"] as const;
const normalizeSearchText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

export default function StoreMenuPanel() {
  const { locale, t } = useI18n();
  const { user } = useAuth();
  const canChangePermanentAvailability =
    user?.role === "Admin" || user?.role === "SuperAdmin";
  const embedded = useStorePricingEmbedded();
  const queryClient = useQueryClient();
  const [selectedItemId, setSelectedItemId] = useState("");
  const [price, setPrice] = useState<PriceType>(emptyPrice);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [draftPrice, setDraftPrice] = useState<PriceType>(emptyPrice);
  const [draftPermanentlyActive, setDraftPermanentlyActive] = useState(true);
  const [draftTemporarilyUnavailable, setDraftTemporarilyUnavailable] =
    useState(false);
  const [draftVisibility, setDraftVisibility] = useState({
    pos: true,
    qr: true,
    online: true,
  });
  const [draftAddonDisplayMode, setDraftAddonDisplayMode] = useState<
    "named" | "merged"
  >("named");
  const [draftKitchenPrintEnabled, setDraftKitchenPrintEnabled] =
    useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { containerRef, pageSize } = useTablePageSize(
    70,
    100,
    undefined,
    true,
    5,
    true,
  );
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { data: catalog = [] } = useQuery({
    queryKey: ["catalog-items", locale],
    queryFn: () => getCatalogItems(locale),
  });
  const { data: menu = [] } = useQuery({
    queryKey: ["store-items", locale],
    queryFn: () => getStoreItems(locale),
  });
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["store-items"] });
  const add = useMutation({
    mutationFn: addStoreItem,
    onSuccess: () => {
      refresh();
      setSelectedItemId("");
      setPrice(emptyPrice);
      setCreateOpen(false);
      toast.success(t("createSuccess"));
    },
    onError: () => toast.error(t("saveError")),
  });
  const update = useMutation({
    mutationFn: updateStoreItem,
    onSuccess: async () => {
      await refresh();
      setEditing(null);
      toast.success(t("updateSuccess"));
    },
    onError: () => toast.error(t("saveError")),
  });
  const matchesCategory = (item: Item) =>
    categoryFilter === "all" ||
    (typeof item.categoryId === "string"
      ? item.categoryId
      : item.categoryId?._id) === categoryFilter;
  const available = catalog.filter(
    (item) =>
      matchesCategory(item) &&
      !menu.some((menuItem) => menuItem._id === item._id),
  );
  const filteredMenu = menu.filter(matchesCategory);
  const searchedMenu = useMemo(() => {
    const normalizedSearch = normalizeSearchText(search.trim());
    if (!normalizedSearch) return filteredMenu;
    return filteredMenu.filter((item) =>
      normalizeSearchText(item.name).includes(normalizedSearch),
    );
  }, [filteredMenu, search]);
  const totalPages = Math.max(1, Math.ceil(searchedMenu.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () =>
      searchedMenu.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, pageSize, searchedMenu],
  );
  useEffect(() => setPage(1), [search]);
  const startEdit = (item: Item) => {
    setEditing(item);
    setDraftPrice(normalizePriceMap(item.price));
    setDraftPermanentlyActive(item.permanentlyActive);
    setDraftTemporarilyUnavailable(
      item.permanentlyActive && item.temporarilyUnavailable,
    );
    setDraftVisibility(
      item.visibility ?? { pos: true, qr: true, online: true },
    );
    setDraftAddonDisplayMode(
      item.addonDisplayMode === "merged" ? "merged" : "named",
    );
    setDraftKitchenPrintEnabled(item.kitchenPrintEnabled !== false);
  };

  return (
    <div
      className={`flex h-full min-h-0 flex-col gap-3 overflow-hidden ${embedded ? "px-0 pb-0" : "p-6 md:p-8"}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        {!embedded && (
          <h1 className="text-3xl font-bold">{t("storePricing")}</h1>
        )}
        <Button
          className={embedded ? "ml-auto" : ""}
          onClick={() => setCreateOpen(true)}
        >
          {t("createProduct")}
        </Button>
      </div>
      <Card
        ref={containerRef}
        data-table-header-align="left"
        className="flex min-h-0 flex-1 flex-col border border-slate-300 shadow-sm"
      >
        <CardHeader className="shrink-0 px-4 py-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>{t("productList")}</CardTitle>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchProduct")}
                aria-label={t("searchProduct")}
                className="h-8 w-36 sm:w-52"
              />
              <div className="w-36">
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => {
                    setCategoryFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allCategories")}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.names[locale] ||
                          category.names.vi ||
                          category.names.en ||
                          category.names["zh-TW"]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {t("total")}: {searchedMenu.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  ‹
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  ›
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-hidden px-4 pt-0 pb-0">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-full">{t("products")}</TableHead>
                {priceKeys.map((key) => (
                  <TableHead className="w-24 text-right capitalize" key={key}>
                    {key}
                  </TableHead>
                ))}
                <TableHead className="min-w-[300px]">{t("status")}</TableHead>
                <TableHead className="w-24 text-right">
                  {t("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((item) => (
                <TableRow
                  data-store-row="true"
                  className="h-[70px]"
                  key={item._id}
                >
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.categoryName}
                    </div>
                  </TableCell>
                  {priceKeys.map((key) => (
                    <TableCell className="text-right" key={key}>
                      {(item.price[key] ?? 0).toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="min-w-[300px] whitespace-normal">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm">
                        {item.permanentlyActive
                          ? t("permanentSelling")
                          : t("permanentHidden")}
                      </span>
                      {item.permanentlyActive && (
                        <span className="text-sm">
                          {item.temporarilyUnavailable
                            ? t("temporaryUnavailable")
                            : t("temporaryAvailable")}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {[
                          item.visibility?.pos !== false &&
                            t("storeVisibilityPos"),
                          item.visibility?.qr !== false &&
                            t("storeVisibilityQr"),
                          item.visibility?.online !== false &&
                            t("storeVisibilityOnline"),
                        ]
                          .filter(Boolean)
                          .join(" / ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(item)}
                    >
                      {t("edit")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent aria-describedby={undefined} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("createProduct")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_repeat(3,96px)] sm:items-end">
            <div className="space-y-1">
              <Label>{t("products")}</Label>
              <Select
                value={selectedItemId}
                onValueChange={setSelectedItemId}
                disabled={!available.length}
              >
                <SelectTrigger className="h-8">
                  <SelectValue
                    placeholder={available.length ? t("products") : ""}
                  />
                </SelectTrigger>
                <SelectContent>
                  {available.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {priceKeys.map((key) => (
              <div className="space-y-1" key={key}>
                <Label className="capitalize">{key}</Label>
                <Input
                  className="h-8"
                  type="number"
                  min="0"
                  step="1"
                  value={price[key] ?? 0}
                  onChange={(event) =>
                    setPrice({ ...price, [key]: Number(event.target.value) })
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              disabled={
                !selectedItemId || !isValidPriceMap(price) || add.isPending
              }
              onClick={() =>
                add.mutate({
                  itemId: selectedItemId,
                  price: normalizePriceMap(price),
                })
              }
            >
              {add.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("createProduct")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent aria-describedby={undefined} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing?.name ? `${t("edit")}: ${editing.name}` : t("edit")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            {priceKeys.map((key) => (
              <div className="space-y-1" key={key}>
                <Label className="capitalize">{key}</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={draftPrice[key] ?? 0}
                  onChange={(event) =>
                    setDraftPrice({
                      ...draftPrice,
                      [key]: Number(event.target.value),
                    })
                  }
                />
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-lg border p-3">
            {canChangePermanentAvailability && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draftPermanentlyActive}
                  onCheckedChange={(value) => {
                    setDraftPermanentlyActive(value === true);
                    if (value !== true) setDraftTemporarilyUnavailable(false);
                  }}
                />
                {t("permanentSelling")}
              </label>
            )}
            {draftPermanentlyActive && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draftTemporarilyUnavailable}
                  onCheckedChange={(value) =>
                    setDraftTemporarilyUnavailable(value === true)
                  }
                />
                {t("temporaryUnavailable")}
              </label>
            )}
            <div className="border-t pt-3 text-sm font-medium">
              {t("storeVisibilityPos")} / {t("storeVisibilityQr")} /{" "}
              {t("storeVisibilityOnline")}
            </div>
            {(["pos", "qr", "online"] as const).map((channel) => (
              <label className="flex items-center gap-2 text-sm" key={channel}>
                <Checkbox
                  checked={draftVisibility[channel]}
                  onCheckedChange={(value) =>
                    setDraftVisibility((current) => ({
                      ...current,
                      [channel]: value === true,
                    }))
                  }
                />
                {channel === "pos"
                  ? t("storeVisibilityPos")
                  : channel === "qr"
                    ? t("storeVisibilityQr")
                    : t("storeVisibilityOnline")}
              </label>
            ))}
            <label className="flex items-center justify-between gap-3 border-t pt-3 text-sm">
              <span>{t("storeAddonDisplayMode")}</span>
              <select
                className="h-8 rounded-md border bg-background px-2"
                value={draftAddonDisplayMode}
                onChange={(event) =>
                  setDraftAddonDisplayMode(
                    event.target.value === "merged" ? "merged" : "named",
                  )
                }
              >
                <option value="named">{t("storeAddonDisplayNamed")}</option>
                <option value="merged">{t("storeAddonDisplayMerged")}</option>
              </select>
            </label>
            <label className="flex items-center gap-2 border-t pt-3 text-sm">
              <Checkbox
                checked={draftKitchenPrintEnabled}
                onCheckedChange={(value) =>
                  setDraftKitchenPrintEnabled(value === true)
                }
              />
              {t("storeKitchenPrintEnabled")}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t("cancel")}
            </Button>
            <Button
              disabled={update.isPending || !isValidPriceMap(draftPrice)}
              onClick={() =>
                editing &&
                update.mutate({
                  itemId: editing._id,
                  data: {
                    price: normalizePriceMap(draftPrice),
                    visibility: draftVisibility,
                    addonDisplayMode: draftAddonDisplayMode,
                    kitchenPrintEnabled: draftKitchenPrintEnabled,
                    ...(canChangePermanentAvailability
                      ? { permanentlyActive: draftPermanentlyActive }
                      : {}),
                    temporarilyUnavailable:
                      draftPermanentlyActive && draftTemporarilyUnavailable,
                  },
                })
              }
            >
              {update.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
