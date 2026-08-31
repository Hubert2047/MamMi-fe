"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, Loader2, RefreshCw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createStoreTable,
  getStoreTables,
  regenerateAllStoreTableQr,
  regenerateStoreTableQr,
  type StoreTable,
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
import { useI18n } from "@/lib/i18n";
import { useTablePageSize } from "@/hooks/use-table-page-size";

const orderWebBaseUrl = (
  process.env.NEXT_PUBLIC_ORDER_WEB_URL || "http://localhost:3001"
).replace(/\/$/, "");
const qrUrlFor = (table: StoreTable) => `${orderWebBaseUrl}/q/${table.qrToken}`;

export default function TablesPanel() {
  const { t } = useI18n();
  const client = useQueryClient();
  const { containerRef, pageSize } = useTablePageSize();
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["store-tables"],
    queryFn: getStoreTables,
  });
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});
  const [onlineQrImage, setOnlineQrImage] = useState("");
  const tablePageSize = pageSize;
  const sorted = useMemo(
    () =>
      [...tables].sort((a, b) =>
        a.code.localeCompare(b.code, undefined, { numeric: true }),
      ),
    [tables],
  );
  const totalPages = Math.max(
    1,
    Math.ceil((sorted.length + 1) / tablePageSize),
  );
  const currentPage = Math.min(page, totalPages);
  const rows = [
    { online: true as const },
    ...sorted.map((table) => ({ online: false as const, table })),
  ];
  const visible = rows.slice(
    (currentPage - 1) * tablePageSize,
    currentPage * tablePageSize,
  );
  useEffect(
    () => setPage((current) => Math.min(current, totalPages)),
    [totalPages],
  );
  const refresh = () =>
    void client.invalidateQueries({ queryKey: ["store-tables"] });
  const create = useMutation({
    mutationFn: createStoreTable,
    onSuccess: () => {
      refresh();
      setCode("");
      setName("");
      setIsCreateOpen(false);
      toast.success(t("tableCreateSuccess"));
    },
    onError: () => toast.error(t("tableCreateFailure")),
  });
  const regenerate = useMutation({
    mutationFn: regenerateStoreTableQr,
    onSuccess: refresh,
  });
  const regenerateAll = useMutation({
    mutationFn: regenerateAllStoreTableQr,
    onSuccess: refresh,
  });
  useEffect(() => {
    let active = true;
    void Promise.all(
      sorted.map(
        async (table) =>
          [
            table._id,
            await QRCode.toDataURL(qrUrlFor(table), { width: 160, margin: 1 }),
          ] as const,
      ),
    ).then((result) => active && setImages(Object.fromEntries(result)));
    return () => {
      active = false;
    };
  }, [sorted]);
  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(orderWebBaseUrl, { width: 160, margin: 1 }).then(
      (result) => active && setOnlineQrImage(result),
    );
    return () => {
      active = false;
    };
  }, []);
  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("tableCopySuccess"));
    } catch {
      toast.error(t("tableCopyFailure"));
    }
  };
  return (
    <div className="h-full overflow-hidden p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t("tables")}</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          {t("tableCreate")}
        </Button>
      </div>
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tableCreate")}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate({ code, name: name || undefined });
            }}
          >
            <div className="space-y-2">
              <Label>{t("tableCode")}</Label>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("tableName")}</Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={create.isPending}>
                {t("tableCreate")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                {t("cancel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Card className="flex h-[calc(100svh-80px)] min-h-0 flex-col overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{t("tables")}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentPage}/{totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tableName")}</TableHead>
                <TableHead>{t("tableCode")}</TableHead>
                <TableHead>{t("onlineQrTitle")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>{t("loading")}</TableCell>
                </TableRow>
              ) : (
                visible.map((row, index) =>
                  row.online ? (
                    <TableRow key="online-ordering">
                      <TableCell className="font-medium">
                        {t("onlineQrTitle")}
                      </TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>
                        {onlineQrImage && (
                          <img
                            src={onlineQrImage}
                            alt={t("onlineQrAlt")}
                            className="size-16"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void copy(orderWebBaseUrl)}
                          >
                            <Copy className="size-4" />
                            {t("onlineQrCopyLink")}
                          </Button>
                          {onlineQrImage && (
                            <Button asChild size="sm">
                              <a
                                href={onlineQrImage}
                                download="mammi-online-order.png"
                              >
                                <Download className="size-4" />
                                {t("onlineQrDownload")}
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={row.table._id}>
                      <TableCell className="font-medium">
                        {row.table.name}
                      </TableCell>
                      <TableCell>{row.table.code}</TableCell>
                      <TableCell>
                        {images[row.table._id] && (
                          <img
                            src={images[row.table._id]}
                            alt={t("tableQrAlt")}
                            className="size-16"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void copy(qrUrlFor(row.table))}
                          >
                            <Copy className="size-4" />
                            {t("tableQrCopyShort")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => regenerate.mutate(row.table._id)}
                          >
                            <RefreshCw className="size-4" />
                            {t("tableQrRegenerateShort")}
                          </Button>
                          {images[row.table._id] && (
                            <Button asChild size="sm">
                              <a
                                href={images[row.table._id]}
                                download={`mammi-table-${row.table.code}.png`}
                              >
                                <Download className="size-4" />
                                {t("tableDownload")}
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
