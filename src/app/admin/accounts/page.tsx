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
  type ManagedUserRole,
} from "@/api/user";
import { useAuth } from "@/hooks/auth";
import { useI18n } from "@/lib/i18n";
import { useTablePageSize } from "@/hooks/use-table-page-size";

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
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
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
      createManagedUser({
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
      setIsFormOpen(false);
      toast.success(t("accountCreateSuccess"));
    },
    onError: (error) =>
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || t("accountSaveError")
          : t("accountSaveError"),
      ),
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateManagedUser(id, { active }),
    onSuccess: refresh,
    onError: () => toast.error(t("accountSaveError")),
  });
  const changePassword = useMutation({
    mutationFn: ({
      id,
      password: nextPassword,
    }: {
      id: string;
      password: string;
    }) => updateManagedUser(id, { password: nextPassword }),
    onSuccess: () => {
      setPasswordUserId(null);
      setNewPassword("");
      toast.success(t("passwordChangeSuccess"));
    },
    onError: () => toast.error(t("passwordChangeError")),
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
  };
  return (
    <div className="h-full overflow-hidden p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold capitalize">{t("userAccounts")}</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          {t("createAccount")}
        </Button>
      </div>
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 md:p-8">
          <Card className="w-full max-w-5xl">
            <CardHeader>
              <CardTitle>{t("createAccount")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!storeId) return toast.error(t("accountStoreRequired"));
                  save.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label>{t("account")}</Label>
                  <Input
                    value={account}
                    onChange={(event) => setAccount(event.target.value)}
                    placeholder={t("accountNamePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("password")}</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("accountPasswordPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("accountRole")}</Label>
                  <Select
                    value={role}
                    onValueChange={(value) => setRole(value as ManagedUserRole)}
                  >
                    <SelectTrigger>
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
                  <Select value={storeId} onValueChange={setStoreId}>
                    <SelectTrigger>
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
                <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
                  <Button
                    type="submit"
                    disabled={
                      save.isPending || !account || !password || !storeId
                    }
                  >
                    {save.isPending ? t("saving") : t("createAccount")}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeForm}>
                    {t("cancel")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
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
                            onClick={() => {
                              setPasswordUserId(managedUser._id);
                              setNewPassword("");
                            }}
                          >
                            {t("changePassword")}
                          </Button>
                          {!isSuperAdmin && (
                            <Checkbox
                              checked={managedUser.active}
                              onCheckedChange={(active) =>
                                toggle.mutate({
                                  id: managedUser._id,
                                  active: active === true,
                                })
                              }
                            />
                          )}
                        </div>
                        {passwordUserId === managedUser._id && (
                          <div className="mt-2 flex justify-end gap-2">
                            <Input
                              className="max-w-xs"
                              type="password"
                              value={newPassword}
                              onChange={(event) =>
                                setNewPassword(event.target.value)
                              }
                              placeholder={t("accountPasswordPlaceholder")}
                            />
                            <Button
                              size="sm"
                              disabled={
                                newPassword.length < 6 ||
                                changePassword.isPending
                              }
                              onClick={() =>
                                changePassword.mutate({
                                  id: managedUser._id,
                                  password: newPassword,
                                })
                              }
                            >
                              {t("savePassword")}
                            </Button>
                            <Button
                              size="sm"
                              type="button"
                              variant="outline"
                              onClick={() => setPasswordUserId(null)}
                            >
                              {t("cancel")}
                            </Button>
                          </div>
                        )}
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
