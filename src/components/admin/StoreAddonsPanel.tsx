"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAuth } from "@/hooks/auth";
import { useTablePageSize } from "@/hooks/use-table-page-size";
import { useStorePricingEmbedded } from "@/app/admin/store-pricing/store-pricing-context";
import { isNonNegativeTwd } from "@/lib/money";
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

export default function StoreAddonsPanel() {
  const { locale, t } = useI18n();
  const { user } = useAuth();
  const canChangePermanentAvailability =
    user?.role === "Admin" || user?.role === "SuperAdmin";
  const embedded = useStorePricingEmbedded();
  const client = useQueryClient();
  const [addonId, setAddonId] = useState("");
  const [priceExtra, setPriceExtra] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState(0);
  const [draftPermanentlyActive, setDraftPermanentlyActive] = useState(true);
  const [draftTemporarilyUnavailable, setDraftTemporarilyUnavailable] =
    useState(false);
  const [page, setPage] = useState(1);
  const { containerRef, pageSize } = useTablePageSize(
    52,
    100,
    undefined,
    true,
    5,
    true,
  );
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
  const editing = storeAddons.find((addon) => addon._id === editingId) ?? null;
  const startEdit = (addon: Addon) => {
    setEditingId(addon._id);
    setDraftPrice(addon.priceExtra);
    setDraftPermanentlyActive(addon.permanentlyActive !== false);
    setDraftTemporarilyUnavailable(
      addon.permanentlyActive !== false &&
        addon.temporarilyUnavailable === true,
    );
  };
  useEffect(
    () => setPage((current) => Math.min(current, totalPages)),
    [totalPages],
  );
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
          ref={containerRef}
          className="min-h-0 flex-1 overflow-hidden px-4 pt-0 pb-2"
        >
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-full">{t("name")}</TableHead>
                <TableHead className="w-32 text-right">
                  {t("extraPrice")}
                </TableHead>
                <TableHead className="min-w-[280px]">{t("status")}</TableHead>
                <TableHead className="w-24 text-right">
                  {t("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((addon) => (
                <TableRow key={addon._id} className="h-[52px]">
                  <TableCell className="font-medium">{name(addon)}</TableCell>
                  <TableCell className="text-right">
                    {addon.priceExtra.toLocaleString()}
                  </TableCell>
                  <TableCell className="min-w-[280px] whitespace-normal">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span>
                        {addon.permanentlyActive !== false
                          ? t("permanentSelling")
                          : t("permanentHidden")}
                      </span>
                      {addon.permanentlyActive !== false && (
                        <span>
                          {addon.temporarilyUnavailable
                            ? t("temporaryUnavailable")
                            : t("temporaryAvailable")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(addon)}
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
        <DialogContent aria-describedby={undefined} className="max-w-lg">
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
              disabled={
                !addonId || !isNonNegativeTwd(priceExtra) || add.isPending
              }
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
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditingId(null)}
      >
        <DialogContent aria-describedby={undefined} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing?.name ? `${t("edit")}: ${editing.name}` : t("editAddon")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t("extraPrice")}</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={draftPrice}
                onChange={(event) => setDraftPrice(Number(event.target.value))}
              />
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              {t("cancel")}
            </Button>
            <Button
              disabled={
                update.isPending || !isNonNegativeTwd(draftPrice) || !editing
              }
              onClick={() =>
                editing &&
                update.mutate({
                  addonId: editing._id,
                  data: {
                    priceExtra: draftPrice,
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
