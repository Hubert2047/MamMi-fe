"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import QRCode from "qrcode";
import {
  Copy,
  Download,
  Loader2,
  Pencil,
  Power,
  RefreshCw,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createStoreTable,
  getStoreTables,
  regenerateAllStoreTableQr,
  regenerateStoreTableQr,
  updateStoreTable,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const orderWebBaseUrl = (
  process.env.NEXT_PUBLIC_ORDER_WEB_URL || "http://localhost:3001"
).replace(/\/$/, "");
const qrUrlFor = (table: StoreTable) => `${orderWebBaseUrl}/q/${table.qrToken}`;

export default function TablesPanel() {
  const { t } = useI18n();
  const client = useQueryClient();
  const { containerRef, pageSize } = useTablePageSize(
    38,
    100,
    undefined,
    false,
    1,
    true,
  );
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["store-tables"],
    queryFn: getStoreTables,
  });
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<StoreTable | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [images, setImages] = useState<Record<string, string>>({});
  const [onlineQrImage, setOnlineQrImage] = useState("");
  const tablePageSize = pageSize;
  const sorted = useMemo(
    () =>
      tables
        .filter((table) => table.active === (activeTab === "active"))
        .sort((a, b) =>
          a.code.localeCompare(b.code, undefined, { numeric: true }),
        ),
    [activeTab, tables],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(
      (sorted.length + (activeTab === "active" ? 1 : 0)) / tablePageSize,
    ),
  );
  const currentPage = Math.min(page, totalPages);
  const rows = [
    ...(activeTab === "active" ? [{ online: true as const }] : []),
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
    onError: (error) =>
      toast.error(
        isAxiosError(error) && error.response?.status === 409
          ? t("tableCodeDuplicate")
          : t("tableCreateFailure"),
      ),
  });
  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { code?: string; name?: string; active?: boolean };
    }) => updateStoreTable(id, data),
    onSuccess: () => {
      refresh();
      setIsEditOpen(false);
      setEditingTable(null);
      toast.success(t("tableUpdateSuccess"));
    },
    onError: () => toast.error(t("tableUpdateFailure")),
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
  const openCreate = () => {
    setEditingTable(null);
    setCode("");
    setName("");
    setIsCreateOpen(true);
  };
  const openEdit = (table: StoreTable) => {
    if (!table.active) return;
    setEditingTable(table);
    setCode(table.code);
    setName(table.name);
    setIsEditOpen(true);
  };
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t("tables")}</h1>
        <Button onClick={openCreate}>{t("tableCreate")}</Button>
      </div>
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setCode("");
            setName("");
            setEditingTable(null);
          }
        }}
      >
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
                onClick={() => {
                  setIsCreateOpen(false);
                  setCode("");
                  setName("");
                  setEditingTable(null);
                }}
              >
                {t("cancel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditingTable(null);
            setCode("");
            setName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tableEdit")}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (editingTable) {
                update.mutate({
                  id: editingTable._id,
                  data: { code, name },
                });
              }
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
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? t("saving") : t("save")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingTable(null);
                  setCode("");
                  setName("");
                }}
              >
                {t("cancel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Tabs
        className="min-h-0 flex-1"
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as "active" | "inactive");
          setPage(1);
        }}
      >
        <TabsList className="mb-4 shrink-0">
          <TabsTrigger value="active">
            {t("tableActiveTab")} (
            {tables.filter((table) => table.active).length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            {t("tableInactiveTab")} (
            {tables.filter((table) => !table.active).length})
          </TabsTrigger>
        </TabsList>
        <Card
          ref={containerRef}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
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
          <CardContent className="min-h-0 flex-1 !overflow-auto">
            <Table className="min-w-max">
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
                        <TableCell className="whitespace-nowrap text-right">
                          <div className="flex flex-nowrap justify-end gap-2">
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
                        <TableCell className="whitespace-nowrap text-right">
                          <div className="flex flex-nowrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void copy(qrUrlFor(row.table))}
                            >
                              <Copy className="size-4" />
                              {t("tableQrCopyShort")}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <RefreshCw className="size-4" />
                                  {t("tableQrRegenerateShort")}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t("tableQrRegenerate")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("tableQrRegenerateConfirm")}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {t("cancel")}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    disabled={regenerate.isPending}
                                    onClick={() =>
                                      regenerate.mutate(row.table._id)
                                    }
                                  >
                                    {regenerate.isPending
                                      ? t("saving")
                                      : t("confirm")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            {row.table.active && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(row.table)}
                              >
                                <Pencil className="size-4" />
                                {t("tableEdit")}
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Power className="size-4" />
                                  {row.table.active
                                    ? t("tableDeactivate")
                                    : t("tableActivate")}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {row.table.active
                                      ? t("tableDeactivate")
                                      : t("tableActivate")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {row.table.active
                                      ? t("tableDeactivateConfirm")
                                      : t("tableActivateConfirm")}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {t("cancel")}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      update.mutate({
                                        id: row.table._id,
                                        data: { active: !row.table.active },
                                      })
                                    }
                                  >
                                    {update.isPending
                                      ? t("saving")
                                      : t("confirm")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
      </Tabs>
    </div>
  );
}
