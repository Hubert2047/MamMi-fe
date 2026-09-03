"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAddons, type Addon } from "@/api/addon";
import {
  addStoreAddon,
  getStoreAddons,
  updateStoreAddon,
} from "@/api/store-addon";
import { useI18n } from "@/lib/i18n";
import { useStorePricingEmbedded } from "@/app/admin/store-pricing/store-pricing-context";
import { isNonNegativeTwd } from "@/lib/money";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function StoreAddonsPanel() {
  const { locale, t } = useI18n();
  const embedded = useStorePricingEmbedded();
  const client = useQueryClient();
  const listRef = useRef<HTMLDivElement>(null);
  const [addonId, setAddonId] = useState("");
  const [priceExtra, setPriceExtra] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const { data: addons = [] } = useQuery({
    queryKey: ["addons", locale],
    queryFn: () => getAddons(locale),
  });
  const { data: storeAddons = [] } = useQuery({
    queryKey: ["store-addons", locale],
    queryFn: () => getStoreAddons(locale),
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["store-addons"] });
  const add = useMutation({
    mutationFn: addStoreAddon,
    onSuccess: () => {
      refresh();
      setAddonId("");
      setPriceExtra(0);
      setCreateOpen(false);
    },
  });
  const update = useMutation({
    mutationFn: updateStoreAddon,
    onSuccess: () => {
      refresh();
      setEditingId(null);
    },
  });
  const available = addons.filter(
    (addon) => !storeAddons.some((current) => current._id === addon._id),
  );
  const name = (addon: Addon) =>
    addon.names[locale] || addon.names.vi || addon.name;
  const totalPages = Math.max(1, Math.ceil(storeAddons.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () =>
      storeAddons.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, pageSize, storeAddons],
  );
  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    const resize = () => {
      const columns =
        window.innerWidth >= 1280 ? 3 : window.innerWidth >= 768 ? 2 : 1;
      const rows = Math.max(1, Math.floor((element.clientHeight + 8) / 52));
      setPageSize(columns * rows);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <div
      className={`flex h-full min-h-0 flex-col gap-3 overflow-hidden ${embedded ? "px-1 pb-0" : "p-6 md:p-8"}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        {!embedded && <h1 className="text-3xl font-bold">{t("addons")}</h1>}
        <Button
          className={embedded ? "ml-auto" : ""}
          onClick={() => setCreateOpen(true)}
        >
          {t("createAddon")}
        </Button>
      </div>
      <Card className="flex min-h-0 flex-1 flex-col gap-0 border border-slate-300 shadow-sm">
        <CardHeader className="shrink-0 px-4 py-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t("total")}: {storeAddons.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 px-0"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                ‹
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentPage}/{totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 px-0"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                ›
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent
          ref={listRef}
          className="min-h-0 flex-1 overflow-auto px-4 pt-0 pb-2"
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {paginated.map((addon) => {
              const isEditing = editingId === addon._id;
              return (
                <div
                  key={addon._id}
                  className="flex min-h-[48px] min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-300 p-2 shadow-sm"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {name(addon)}
                  </span>
                  {isEditing ? (
                    <>
                      <Input
                        className="h-7 w-24"
                        type="number"
                        min="0"
                        step="1"
                        value={draftPrice}
                        onChange={(event) =>
                          setDraftPrice(Number(event.target.value))
                        }
                      />
                      <Button
                        size="sm"
                        className="h-7"
                        disabled={!isNonNegativeTwd(draftPrice)}
                        onClick={() =>
                          update.mutate({
                            addonId: addon._id,
                            data: { priceExtra: draftPrice },
                          })
                        }
                      >
                        {t("save")}
                      </Button>
                      <Button
                        size="sm"
                        className="h-7"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        {t("cancel")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="shrink-0 text-sm">
                        {addon.priceExtra.toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        className="h-7"
                        variant="outline"
                        onClick={() => {
                          setEditingId(addon._id);
                          setDraftPrice(addon.priceExtra);
                        }}
                      >
                        {t("edit")}
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("createAddon")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-end">
            <div className="space-y-2">
              <Label>{t("addons")}</Label>
              <Select
                value={addonId}
                onValueChange={setAddonId}
                disabled={!available.length}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={available.length ? t("addons") : ""}
                  />
                </SelectTrigger>
                <SelectContent>
                  {available.map((addon) => (
                    <SelectItem key={addon._id} value={addon._id}>
                      {name(addon)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("extraPrice")}</Label>
              <Input
              type="number"
                min="0"
                step="1"
                value={priceExtra}
                onChange={(event) => setPriceExtra(Number(event.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              disabled={!addonId || !isNonNegativeTwd(priceExtra) || add.isPending}
              onClick={() =>
                add.mutate({ addonId, priceExtra, permanentlyActive: true })
              }
            >
              {add.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("createAddon")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
