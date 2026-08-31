"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { getAddons } from "@/api/addon";
import { getCatalogItems } from "@/api/catalog-item";
import {
  getPromotions,
  updateStorePromotion,
  type Promotion,
} from "@/api/promotion";
import { useI18n } from "@/lib/i18n";
import { useStorePricingEmbedded } from "./store-pricing-context";

const formatDateTime = (value: string | null | undefined, locale: string) =>
  value
    ? new Intl.DateTimeFormat(locale === "zh-TW" ? "zh-TW" : locale, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

export default function StorePromotionsPanel() {
  const { t, locale } = useI18n();
  const embedded = useStorePricingEmbedded();
  const client = useQueryClient();
  const [previewing, setPreviewing] = useState<Promotion | null>(null);
  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["promotions", locale],
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
  const update = useMutation({
    mutationFn: updateStorePromotion,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["promotions"] });
    },
  });
  const assigned = promotions.filter(
    (promotion) => promotion.assigned && promotion.status === "active",
  );
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
  const targetLabel = (target: Promotion["rules"][number]["target"]) =>
    target === "order"
      ? t("targetOrder")
      : target === "product"
        ? t("targetProduct")
        : target === "addon"
          ? t("targetAddon")
          : t("targetLine");

  return (
    <>
      <div className={embedded ? "px-1 pb-6" : "p-6 md:p-8"}>
        <Card>
          <CardHeader>
            <CardTitle>{t("promotions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p>{t("loading")}</p>
            ) : assigned.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("emptyPromotions")}
              </p>
            ) : (
              assigned.map((promotion) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  key={promotion._id}
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {promotion.names[locale] || promotion.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {promotion.mode === "automatic"
                        ? t("automatic")
                        : t("manual")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewing(promotion)}
                    >
                      {t("previewPromotion")}
                    </Button>
                    <label className="flex items-center gap-2 text-sm">
                      {update.isPending &&
                      update.variables?.id === promotion._id ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-label={t("loading")}
                        />
                      ) : (
                        <Checkbox
                          checked={promotion.enabled}
                          disabled={update.isPending}
                          onCheckedChange={(enabled) =>
                            update.mutate({
                              id: promotion._id,
                              enabled: enabled === true,
                            })
                          }
                        />
                      )}
                      {promotion.enabled ? t("active") : t("hidden")}
                    </label>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={Boolean(previewing)}
        onOpenChange={(open) => !open && setPreviewing(null)}
      >
        <DialogContent className="max-h-[88dvh] w-[min(94vw,48rem)] max-w-none overflow-y-auto sm:max-w-none">
          {previewing && (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("promotionMode")}:{" "}
                  {previewing.mode === "automatic"
                    ? t("automatic")
                    : t("manual")}
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
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    {t("combinable")}
                  </p>
                  <label className="mt-1 flex items-center gap-2 font-medium">
                    <Checkbox checked={previewing.combinable} disabled />
                    {previewing.combinable ? t("active") : t("hidden")}
                  </label>
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  {t("exclusiveGroup")}
                </p>
                <p className="mt-1 font-medium">
                  {previewing.exclusiveGroup || "—"}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">{t("promotionRules")}</h3>
                <div className="space-y-2">
                  {previewing.rules.map((rule, index) => (
                    <div className="rounded-lg border p-3" key={index}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">
                          {t("promotionRules")} #{index + 1}:{" "}
                          {targetLabel(rule.target)}
                        </p>
                        <p className="font-semibold">
                          {rule.reward.type === "percent"
                            ? `${rule.reward.amount}%`
                            : rule.reward.amount}
                        </p>
                      </div>
                      <div className="mt-2 rounded-md bg-muted/50 p-2 text-sm">
                        <span className="font-medium">
                          {t("promotionPreviewScope")}:
                        </span>{" "}
                        {rule.target === "order"
                          ? t("promotionPreviewOrderScope")
                          : rule.target === "product"
                            ? `${t("promotionPreviewProductScope")}: ${labelsFor(rule.productIds, items, t("promotionPreviewAllProducts"))}`
                            : rule.target === "addon"
                              ? `${t("promotionPreviewAddonScope")}: ${labelsFor(rule.addonIds, addons, t("promotionPreviewAllAddons"))}`
                              : `${t("promotionPreviewLineScope")}: ${labelsFor(rule.productIds, items, t("promotionPreviewAllProducts"))}; ${t("promotionPreviewLineIncludesAddons")}`}
                      </div>
                      {rule.target === "addon" && rule.productIds?.length ? (
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
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
