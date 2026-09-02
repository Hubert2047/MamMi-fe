"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Play, Square, TimerReset } from "lucide-react";
import { toast } from "sonner";
import {
  closeStoreTableSession,
  extendStoreTableSession,
  getStoreTables,
  openStoreTableSession,
} from "@/api/table";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

type Props = { open: boolean; onClose: () => void };

const formatExpiry = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale === "zh-TW" ? "zh-TW" : locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
const formatRemaining = (
  value: string,
  now: number,
  expired: string,
  hoursLabel: string,
  minutesLabel: string,
) => {
  const remaining = new Date(value).getTime() - now;
  if (remaining <= 0) return expired;
  const minutes = Math.floor(remaining / 60000);
  const hours = Math.floor(minutes / 60);
  return hours > 0
    ? `${hours} ${hoursLabel} ${minutes % 60} ${minutesLabel}`
    : `${minutes} ${minutesLabel}`;
};
const sessionBorder = (expiresAt: string | undefined, now: number) => {
  if (!expiresAt) return "border-border";
  const remaining = new Date(expiresAt).getTime() - now;
  if (remaining <= 15 * 60 * 1000) return "border-red-500";
  if (remaining <= 60 * 60 * 1000) return "border-yellow-500";
  return "border-emerald-500";
};

export default function PosTableSessions({ open, onClose }: Props) {
  const { locale, t } = useI18n();
  const client = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(1);
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["store-tables"],
    queryFn: getStoreTables,
    enabled: open,
  });
  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [open]);
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["store-tables"] });
  };
  const action = useMutation({
    mutationFn: ({
      id,
      type,
    }: {
      id: string;
      type: "open" | "extend" | "close";
    }) =>
      type === "open"
        ? openStoreTableSession(id)
        : type === "extend"
          ? extendStoreTableSession(id)
          : closeStoreTableSession(id),
    onSuccess: (_, variables) => {
      refresh();
      toast.success(
        t(
          variables.type === "open"
            ? "tableSessionOpened"
            : variables.type === "extend"
              ? "tableSessionExtended"
              : "tableSessionClosed",
        ),
      );
    },
    onError: () => toast.error(t("tableSessionActionFailure")),
  });
  useEffect(() => {
    const updatePageSize = () =>
      setPageSize(
        window.innerWidth >= 1024 ? 9 : window.innerWidth >= 768 ? 4 : 1,
      );
    updatePageSize();
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);
  const sortedTables = [...tables]
    .filter((table) => table.active)
    .sort((a, b) => {
      const byName = a.name.localeCompare(b.name, undefined, { numeric: true });
      return (
        byName || a.code.localeCompare(b.code, undefined, { numeric: true })
      );
    });
  const bulkAction = useMutation({
    mutationFn: async (type: "open" | "extend" | "close") => {
      const targets = sortedTables.filter((table) =>
        type === "open"
          ? table.session?.status !== "active"
          : table.session?.status === "active",
      );
      await Promise.all(
        targets.map((table) =>
          type === "open"
            ? openStoreTableSession(table._id)
            : type === "extend"
              ? extendStoreTableSession(table._id)
              : closeStoreTableSession(table._id),
        ),
      );
      return type;
    },
    onSuccess: (type) => {
      refresh();
      toast.success(
        t(
          type === "open"
            ? "posTableSessionAllOpened"
            : type === "extend"
              ? "posTableSessionAllExtended"
              : "posTableSessionAllClosed",
        ),
      );
    },
    onError: () => toast.error(t("tableSessionActionFailure")),
  });
  const totalPages = Math.max(1, Math.ceil(sortedTables.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleTables = sortedTables.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const canOpenAll = sortedTables.some(
    (table) => table.session?.status !== "active",
  );
  const canExtendOrCloseAll = sortedTables.some(
    (table) => table.session?.status === "active",
  );

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="!fixed !inset-0 !left-0 !top-0 !h-dvh !w-screen !max-h-dvh !max-w-none !translate-x-0 !translate-y-0 flex min-h-0 flex-col rounded-none p-6">
        <DialogHeader className="shrink-0 items-center pb-2">
          <DialogTitle className="text-center text-xl">
            {t("posTableSessionTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {!isLoading && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      disabled={!canOpenAll || bulkAction.isPending}
                    >
                      {t("posTableSessionOpenAll")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-sm p-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("posTableSessionOpenAllTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("posTableSessionOpenAllConfirm")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => bulkAction.mutate("open")}
                        disabled={bulkAction.isPending}
                      >
                        {t("posTableSessionOpenAll")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canExtendOrCloseAll || bulkAction.isPending}
                    >
                      {t("posTableSessionExtendAll")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-sm p-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("posTableSessionExtendAllTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("posTableSessionExtendAllConfirm")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => bulkAction.mutate("extend")}
                        disabled={bulkAction.isPending}
                      >
                        {t("posTableSessionExtendAll")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!canExtendOrCloseAll || bulkAction.isPending}
                    >
                      {t("posTableSessionCloseAll")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-sm p-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("posTableSessionCloseAllTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("posTableSessionCloseAllConfirm")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => bulkAction.mutate("close")}
                        disabled={bulkAction.isPending}
                      >
                        {t("posTableSessionCloseAll")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  {t("previous")}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t("page")} {currentPage}/{totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  {t("next")}
                </Button>
              </div>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center gap-2 p-4 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("loading")}
            </div>
          ) : (
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {visibleTables.map((table) => {
                const active = table.session?.status === "active";
                const busy = action.isPending;
                return (
                  <Card
                    key={table._id}
                    className={`min-h-44 min-w-0 gap-2 overflow-hidden border-2 py-2 ${sessionBorder(active && table.session ? table.session.expiresAt : undefined, now)} shadow-sm`}
                  >
                    <CardHeader className="px-3 pb-1 pt-2">
                      <CardTitle className="flex items-center justify-between gap-2 text-sm">
                        <span>{table.name}</span>
                        <span className="rounded bg-muted px-2 py-1 text-xs">
                          {t("tableCode")} {table.code}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 px-3 pb-2">
                      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-2 py-1.5 text-xs">
                        <div>
                          <p className="font-medium">
                            {active
                              ? t("tableSessionActive")
                              : t("tableSessionInactive")}
                          </p>
                          {active && table.session && (
                            <>
                              <p className="mt-1 text-muted-foreground">
                                {t("tableSessionExpires")}:{" "}
                                {formatExpiry(table.session.expiresAt, locale)}
                              </p>
                              <p className="text-muted-foreground">
                                {t("tableSessionRemaining")}:{" "}
                                {formatRemaining(
                                  table.session.expiresAt,
                                  now,
                                  t("tableSessionExpired"),
                                  t("tableSessionHours"),
                                  t("tableSessionMinutes"),
                                )}
                              </p>
                            </>
                          )}
                        </div>
                        <span
                          className={
                            active
                              ? "size-2 rounded-full bg-emerald-500"
                              : "size-2 rounded-full bg-muted-foreground/40"
                          }
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          className="h-8 min-w-0 px-1 text-xs"
                          size="sm"
                          disabled={active || busy}
                          onClick={() =>
                            action.mutate({ id: table._id, type: "open" })
                          }
                        >
                          <Play className="size-3" />
                          {t("posTableSessionOpen")}
                        </Button>
                        <Button
                          className="h-8 min-w-0 px-1 text-xs"
                          size="sm"
                          variant="outline"
                          disabled={!active || busy}
                          onClick={() =>
                            action.mutate({ id: table._id, type: "extend" })
                          }
                        >
                          <TimerReset className="size-3" />
                          {t("posTableSessionExtend")}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              className="h-8 min-w-0 px-1 text-xs"
                              size="sm"
                              variant="outline"
                              disabled={!active || busy}
                            >
                              <Square className="size-3" />
                              {t("posTableSessionClose")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-sm p-4">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("tableSessionClose")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("tableSessionCloseConfirm")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  action.mutate({
                                    id: table._id,
                                    type: "close",
                                  })
                                }
                                disabled={action.isPending}
                              >
                                {t("confirm")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
