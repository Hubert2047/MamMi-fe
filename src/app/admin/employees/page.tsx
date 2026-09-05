"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  Dices,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { useTablePageSize } from "@/hooks/use-table-page-size";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
  type Employee,
} from "@/api/employee";
import { useI18n } from "@/lib/i18n";
import { useStoreContext } from "@/lib/store-context";

type EmployeeForm = {
  name: string;
  numberId: string;
  note: string;
  active: boolean;
  employmentType: "official" | "part_time";
  role: "manager" | "employee";
  salaryType: "monthly" | "hourly";
  salaryAmount: number;
  startDate: string;
  endDate: string;
};
const emptyForm = (): EmployeeForm => ({
  name: "",
  numberId: "",
  note: "",
  active: true,
  employmentType: "official",
  role: "employee",
  salaryType: "hourly",
  salaryAmount: 0,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
});

function generateEmployeeNumberId(employees: Employee[]) {
  const used = new Set(employees.map((employee) => employee.numberId));
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = String(Math.floor(Math.random() * 10000)).padStart(
      4,
      "0",
    );
    if (!used.has(candidate)) return candidate;
  }
  for (let value = 0; value <= 9999; value += 1) {
    const candidate = String(value).padStart(4, "0");
    if (!used.has(candidate)) return candidate;
  }
  return "";
}

export default function EmployeesPage() {
  const { t } = useI18n();
  const { activeStore } = useStoreContext();
  const client = useQueryClient();
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [open, setOpen] = useState(false);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set());
  const [page, setPage] = useState(1);
  const { pageSize } = useTablePageSize();
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees", activeStore?._id],
    queryFn: getEmployees,
    enabled: Boolean(activeStore?._id),
  });
  const totalPages = Math.max(1, Math.ceil(employees.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleEmployees = employees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);
  const reset = () => {
    setForm(emptyForm());
    setOpen(false);
  };
  const save = useMutation({
    mutationFn: () =>
      editing
        ? updateEmployee({ id: editing._id, data: form })
        : createEmployee(form),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["employees"] });
      toast.success(t(editing ? "employeeUpdated" : "employeeCreated"));
      reset();
    },
    onError: (error) => {
      const message = isAxiosError<{ code?: string; message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      const code = isAxiosError<{ code?: string }>(error)
        ? error.response?.data?.code
        : undefined;
      toast.error(
        message === "Employee already exists"
          ? t("employeeDuplicate")
          : code === "EMPLOYEE_NUMBER_ID_INVALID"
            ? t("employeeNumberIdInvalid")
            : t("employeeSaveError"),
      );
    },
  });
  const remove = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["employees"] });
      toast.success(t("employeeDeleted"));
    },
    onError: () => toast.error(t("employeeDeleteError")),
  });
  const beginCreate = () => {
    setForm({ ...emptyForm(), numberId: generateEmployeeNumberId(employees) });
    setEditing(null);
    setOpen(true);
  };
  const beginEdit = (employee: Employee) => {
    setEditing(employee);
    setForm({
      name: employee.name,
      numberId: employee.numberId,
      note: employee.note || "",
      active: employee.active !== false,
      employmentType: employee.employmentType || "official",
      role: employee.role || "employee",
      salaryType: employee.salaryType || "hourly",
      salaryAmount: employee.salaryAmount || 0,
      startDate: employee.startDate?.slice(0, 10) || "",
      endDate: employee.endDate?.slice(0, 10) || "",
    });
    setOpen(true);
  };
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-6 md:p-8">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t("employees")}</h1>
        <Button onClick={beginCreate}>
          <Plus className="mr-2 size-4" />
          {t("employeeCreate")}
        </Button>
      </div>
      <Card className="flex h-[calc(100svh-80px)] min-h-0 flex-col overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t("employeeList")} · {employees.length}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentPage}/{totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setPage((current) => current - 1)}
                aria-label={t("previous")}
              >
                ‹
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setPage((current) => current + 1)}
                aria-label={t("next")}
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
                <TableHead>{t("employeeName")}</TableHead>
                <TableHead>{t("employeeNumberId")}</TableHead>
                <TableHead>{t("employeeStatus")}</TableHead>
                <TableHead>{t("employeeType")}</TableHead>
                <TableHead>{t("employeeRole")}</TableHead>
                <TableHead>{t("employeeSalary")}</TableHead>
                <TableHead>{t("employeeNote")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {t("loading")}
                    </span>
                  </TableCell>
                </TableRow>
              ) : visibleEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground">
                    {t("employeeEmpty")}
                  </TableCell>
                </TableRow>
              ) : (
                visibleEmployees.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell className="font-medium">
                      {employee.name}
                    </TableCell>
                    <TableCell>
                      <span className="mr-2 font-mono">
                        {visibleIds.has(employee._id)
                          ? employee.numberId
                          : "••••••"}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() =>
                          setVisibleIds((current) => {
                            const next = new Set(current);
                            if (next.has(employee._id))
                              next.delete(employee._id);
                            else next.add(employee._id);
                            return next;
                          })
                        }
                        aria-label={t(
                          visibleIds.has(employee._id)
                            ? "employeeHideNumberId"
                            : "employeeShowNumberId",
                        )}
                      >
                        {visibleIds.has(employee._id) ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          employee.active === false
                            ? "text-muted-foreground"
                            : "text-emerald-600"
                        }
                      >
                        {employee.active === false
                          ? t("employeeInactive")
                          : t("employeeActive")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {employee.employmentType === "part_time"
                        ? t("employeePartTime")
                        : t("employeeOfficial")}
                    </TableCell>
                    <TableCell>
                      {employee.role === "manager"
                        ? t("employeeManager")
                        : t("employeeStaff")}
                    </TableCell>
                    <TableCell>
                      {(employee.salaryAmount ?? 0).toLocaleString()} TWD/
                      {employee.salaryType === "monthly"
                        ? t("employeeMonthShort")
                        : t("employeeHourShort")}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {employee.note || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => beginEdit(employee)}
                        >
                          <Pencil className="mr-2 size-4" />
                          {t("edit")}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="mr-2 size-4" />
                              {t("delete")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("employeeDelete")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("employeeDeleteConfirm")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                disabled={remove.isPending}
                                onClick={() => remove.mutate(employee._id)}
                              >
                                {remove.isPending ? t("loading") : t("confirm")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("employeeEdit") : t("employeeCreate")}
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1">
            <div className="space-y-1.5">
              <Label>{t("employeeName")}</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("employeeNumberId")}</Label>
              <div className="flex gap-2">
                <Input
                  value={form.numberId}
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  onChange={(event) =>
                    setForm({
                      ...form,
                      numberId: event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 4),
                    })
                  }
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setForm({
                      ...form,
                      numberId: generateEmployeeNumberId(employees),
                    })
                  }
                  aria-label={t("employeeGenerateNumberId")}
                  title={t("employeeGenerateNumberId")}
                >
                  <Dices className="size-4" />
                  <span className="hidden sm:inline">
                    {t("employeeGenerateNumberId")}
                  </span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("employeeNumberIdHint")}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>{t("employeeStatus")}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.active ? "active" : "inactive"}
                onChange={(event) =>
                  setForm({
                    ...form,
                    active: event.target.value === "active",
                    endDate:
                      event.target.value === "active"
                        ? ""
                        : form.endDate || new Date().toISOString().slice(0, 10),
                  })
                }
              >
                <option value="active">{t("employeeActive")}</option>
                <option value="inactive">{t("employeeInactive")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("employeeNote")}</Label>
              <Textarea
                value={form.note}
                onChange={(event) =>
                  setForm({ ...form, note: event.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("employeeType")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.employmentType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      employmentType: event.target
                        .value as EmployeeForm["employmentType"],
                    })
                  }
                >
                  <option value="official">{t("employeeOfficial")}</option>
                  <option value="part_time">{t("employeePartTime")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("employeeRole")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role: event.target.value as EmployeeForm["role"],
                    })
                  }
                >
                  <option value="employee">{t("employeeStaff")}</option>
                  <option value="manager">{t("employeeManager")}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("employeeSalaryType")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.salaryType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      salaryType: event.target
                        .value as EmployeeForm["salaryType"],
                    })
                  }
                >
                  <option value="hourly">{t("employeeHourly")}</option>
                  <option value="monthly">{t("employeeMonthly")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("employeeSalaryAmount")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.salaryAmount}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      salaryAmount: Number(event.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("employeeStartDate")}</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm({ ...form, startDate: event.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("employeeEndDate")}</Label>
                <Input
                  type="date"
                  disabled={form.active}
                  value={form.endDate}
                  onChange={(event) =>
                    setForm({ ...form, endDate: event.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t pt-4">
            <Button variant="outline" onClick={reset}>
              {t("cancel")}
            </Button>
            <Button
              disabled={
                !form.name.trim() ||
                !/^\d{4}$/.test(form.numberId) ||
                save.isPending
              }
              onClick={() => save.mutate()}
            >
              {save.isPending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
