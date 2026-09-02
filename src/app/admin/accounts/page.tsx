"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStores } from "@/api/store";
import {
  createManagedUser,
  getManagedUsers,
  updateManagedUser,
  type ManagedUser,
  type ManagedUserRole,
} from "@/api/user";
import { useAuth } from "@/hooks/auth";
import { useI18n } from "@/lib/i18n";
import { useTablePageSize } from "@/hooks/use-table-page-size";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AccountsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const client = useQueryClient();
  const { pageSize } = useTablePageSize();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<ManagedUserRole>("Employee");
  const [storeId, setStoreId] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [active, setActive] = useState(true);
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: getStores,
  });
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["managed-users"],
    queryFn: getManagedUsers,
    enabled: user?.role === "SuperAdmin",
  });
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = users.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  useEffect(
    () => setPage((current) => Math.min(current, totalPages)),
    [totalPages],
  );
  useEffect(() => {
    if (!isFormOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isFormOpen]);
  const refresh = () =>
    void client.invalidateQueries({ queryKey: ["managed-users"] });
  const save = useMutation({
    mutationFn: () =>
      editingUser
        ? updateManagedUser(editingUser._id, {
            ...(editingUser.role !== "SuperAdmin" ? { account } : {}),
            ...(password ? { password } : {}),
            ...(editingUser.role !== "SuperAdmin"
              ? { role: role as "Admin" | "Employee", storeId, active }
              : {}),
          })
        : createManagedUser({
            account,
            password,
            role: role as "Admin" | "Employee",
            storeId,
          }),
    onSuccess: () => {
      refresh();
      setAccount("");
      setPassword("");
      setRole("Employee");
      setStoreId("");
      setActive(true);
      setEditingUser(null);
      setIsFormOpen(false);
      toast.success(
        t(editingUser ? "accountEditSuccess" : "accountCreateSuccess"),
      );
    },
    onError: (error) =>
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || t("accountSaveError")
          : t("accountSaveError"),
      ),
  });
  if (user?.role !== "SuperAdmin")
    return (
      <div className="p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("superAdminOnly")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("accountSuperAdminHint")}
          </CardContent>
        </Card>
      </div>
    );
  const closeForm = () => {
    setIsFormOpen(false);
    setAccount("");
    setPassword("");
    setRole("Employee");
    setStoreId("");
    setActive(true);
    setEditingUser(null);
  };
  const openCreate = () => {
    closeForm();
    setIsFormOpen(true);
  };
  const openEdit = (managedUser: ManagedUser) => {
    setEditingUser(managedUser);
    setAccount(managedUser.account);
    setPassword("");
    setRole(managedUser.role);
    setActive(managedUser.active);
    const firstStore = managedUser.storeIds[0];
    setStoreId(
      typeof firstStore === "string" ? firstStore : firstStore?._id || "",
    );
    setIsFormOpen(true);
  };
  return (
    <div className="h-full overflow-hidden p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold capitalize">{t("userAccounts")}</h1>
        <Button onClick={openCreate}>{t("createAccount")}</Button>
      </div>
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t(editingUser ? "editAccount" : "createAccount")}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!editingUser && !storeId)
                return toast.error(t("accountStoreRequired"));
              if (!editingUser && !password) return;
              save.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>{t("account")}</Label>
              <Input
                className="h-9 w-full"
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                placeholder={t("accountNamePlaceholder")}
                disabled={editingUser?.role === "SuperAdmin"}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("password")}</Label>
              <Input
                className="h-9 w-full"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  editingUser
                    ? t("accountPasswordOptional")
                    : t("accountPasswordPlaceholder")
                }
              />
            </div>
            <div
              className={`grid gap-4 ${editingUser ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
            >
              <div className="space-y-2">
                <Label>{t("accountRole")}</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as ManagedUserRole)}
                  disabled={editingUser?.role === "SuperAdmin"}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">
                      {t("employeeRole")}
                    </SelectItem>
                    <SelectItem value="Admin">{t("adminRole")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("store")}</Label>
                <Select
                  value={storeId}
                  onValueChange={setStoreId}
                  disabled={editingUser?.role === "SuperAdmin"}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder={t("selectStore")} />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store._id} value={store._id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingUser && (
                <div className="flex items-center gap-3 bg-muted/30 p-3">
                  <Checkbox
                    id="account-active"
                    checked={active}
                    disabled={editingUser.role === "SuperAdmin"}
                    onCheckedChange={(checked) => setActive(checked === true)}
                  />
                  <Label htmlFor="account-active">
                    {active ? t("accountActive") : t("accountInactive")}
                  </Label>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="submit"
                disabled={
                  save.isPending ||
                  !account ||
                  (!editingUser && (!password || !storeId))
                }
              >
                {save.isPending
                  ? t("saving")
                  : t(editingUser ? "saveChanges" : "createAccount")}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Card
        className={`flex h-[calc(100svh-80px)] min-h-0 flex-col overflow-hidden ${isFormOpen ? "hidden" : ""}`}
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{t("accountList")}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentPage}/{totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                ‹
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setPage((current) => current + 1)}
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
                <TableHead>{t("account")}</TableHead>
                <TableHead>{t("accountRole")}</TableHead>
                <TableHead>{t("store")}</TableHead>
                <TableHead>{t("accountActive")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>{t("loading")}</TableCell>
                </TableRow>
              ) : visibleUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>{t("accountEmpty")}</TableCell>
                </TableRow>
              ) : (
                visibleUsers.map((managedUser) => {
                  const isSuperAdmin = managedUser.role === "SuperAdmin";
                  return (
                    <TableRow key={managedUser._id}>
                      <TableCell className="font-medium">
                        {managedUser.account}
                      </TableCell>
                      <TableCell>
                        {isSuperAdmin
                          ? "SuperAdmin"
                          : managedUser.role === "Admin"
                            ? t("adminRole")
                            : t("employeeRole")}
                      </TableCell>
                      <TableCell>
                        {isSuperAdmin
                          ? t("allStores")
                          : managedUser.storeIds
                              .map((store) =>
                                typeof store === "string" ? store : store.name,
                              )
                              .join(", ") || t("allStores")}
                      </TableCell>
                      <TableCell>
                        {managedUser.active
                          ? t("accountActive")
                          : t("accountInactive")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(managedUser)}
                          >
                            {t("editAccount")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
