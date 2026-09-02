"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Pencil, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAttendances } from "@/api/shift-attendance";
import { useTablePageSize } from "@/hooks/use-table-page-size";
import { useStoreContext } from "@/lib/store-context";
import { useI18n } from "@/lib/i18n";
import {
  formatTaipeiDateTimeInput,
  parseTaipeiDateTimeInput,
} from "@/lib/promotionDate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/auth";
import {
  updateAttendance,
  type IShiftAttendance,
} from "@/api/shift-attendance";

const taiwanToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const defaultRange = () => {
  const today = taiwanToday();
  return { startTime: `${today}T00:00`, endTime: `${today}T23:59` };
};

const time = (value?: Date) =>
  value
    ? new Intl.DateTimeFormat("zh-TW", {
        timeZone: "Asia/Taipei",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date(value))
    : "—";

const sessionSummary = (item: {
  checkInAt?: Date;
  checkOutAt?: Date;
  sessions?: { checkIn: Date; checkOut?: Date }[];
  checkIn?: Date;
  checkOuts?: Date[];
}) => {
  if (item.sessions?.length) {
    return item.sessions
      .map((session) => `${time(session.checkIn)}–${time(session.checkOut)}`)
      .join(", ");
  }
  if (item.checkInAt) {
    return `${time(item.checkInAt)}–${time(item.checkOutAt)}`;
  }
  return `${time(item.checkIn)}–${time(item.checkOuts?.at(-1))}`;
};

const sessionList = (item: {
  checkInAt?: Date;
  checkOutAt?: Date;
  sessions?: { checkIn: Date; checkOut?: Date }[];
  checkIn?: Date;
  checkOuts?: Date[];
}) =>
  item.sessions?.length
    ? item.sessions
    : item.checkInAt
      ? [{ checkIn: item.checkInAt, checkOut: item.checkOutAt }]
      : item.checkIn
        ? [{ checkIn: item.checkIn, checkOut: item.checkOuts?.at(-1) }]
        : [];

const workingTime = (
  item: Parameters<typeof sessionList>[0],
  labels: { hours: string; minutes: string },
) => {
  const totalMinutes = Math.max(
    0,
    Math.floor(
      sessionList(item).reduce((total, session) => {
        const end = session.checkOut ? new Date(session.checkOut) : new Date();
        return (
          total +
          Math.max(0, end.getTime() - new Date(session.checkIn).getTime())
        );
      }, 0) / 60000,
    ),
  );
  return `${Math.floor(totalMinutes / 60)} ${labels.hours} ${totalMinutes % 60} ${labels.minutes}`;
};

export default function AttendancePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { activeStore } = useStoreContext();
  const client = useQueryClient();
  const isSuperAdmin = user?.role === "SuperAdmin";
  const { pageSize } = useTablePageSize();
  const [range, setRange] = useState(defaultRange);
  const [appliedRange, setAppliedRange] = useState(defaultRange);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<IShiftAttendance | null>(null);
  const [editForm, setEditForm] = useState({
    checkInAt: "",
    checkOutAt: "",
    reason: "",
  });
  const { data: attendances = [], isLoading } = useQuery({
    queryKey: ["shift-attendances", activeStore?._id, appliedRange],
    queryFn: () =>
      getAttendances({
        startTime: parseTaipeiDateTimeInput(appliedRange.startTime),
        endTime: parseTaipeiDateTimeInput(appliedRange.endTime),
      }),
    enabled: Boolean(activeStore?._id),
  });
  const editMutation = useMutation({
    mutationFn: () =>
      updateAttendance({
        id: editing?._id || "",
        data: {
          checkInAt: parseTaipeiDateTimeInput(editForm.checkInAt) || "",
          checkOutAt: parseTaipeiDateTimeInput(editForm.checkOutAt),
          reason: editForm.reason.trim(),
        },
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["shift-attendances"] });
      toast.success(t("attendanceEditSuccess"));
      setEditing(null);
    },
    onError: (error) => {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(
        message === "Check-out must be after check-in"
          ? t("attendanceInvalidTime")
          : message === "Attendance session overlaps another session"
            ? t("attendanceOverlap")
            : message === "Adjustment reason is required"
              ? t("attendanceReasonRequired")
              : t("attendanceEditFailure"),
      );
    },
  });
  const beginEdit = (item: IShiftAttendance) => {
    if (!item._id || !item.checkInAt) return;
    setEditing(item);
    setEditForm({
      checkInAt: formatTaipeiDateTimeInput(String(item.checkInAt)),
      checkOutAt: item.checkOutAt
        ? formatTaipeiDateTimeInput(String(item.checkOutAt))
        : "",
      reason: "",
    });
  };
  const submitEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing || !editForm.reason.trim()) {
      toast.error(t("attendanceReasonRequired"));
      return;
    }
    editMutation.mutate();
  };
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredAttendances = attendances.filter(
    (item) =>
      !normalizedSearch ||
      item.numberId.toLocaleLowerCase().includes(normalizedSearch) ||
      (item.employeeName || "").toLocaleLowerCase().includes(normalizedSearch),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAttendances.length / pageSize),
  );
  const currentPage = Math.min(page, totalPages);
  const visible = filteredAttendances.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  useEffect(
    () => setPage((current) => Math.min(current, totalPages)),
    [totalPages],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-6 md:p-8">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold capitalize">
            {t("attendancePage")}
          </h1>
        </div>
      </div>
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex shrink-0 items-end gap-2">
            <label className="text-xs text-muted-foreground">
              {t("attendanceStartTime")}
              <input
                type="datetime-local"
                value={range.startTime}
                onChange={(event) =>
                  setRange({ ...range, startTime: event.target.value })
                }
                className="mt-1 block h-9 rounded-md border border-input bg-background px-2 text-sm"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              {t("attendanceEndTime")}
              <input
                type="datetime-local"
                value={range.endTime}
                onChange={(event) =>
                  setRange({ ...range, endTime: event.target.value })
                }
                className="mt-1 block h-9 rounded-md border border-input bg-background px-2 text-sm"
              />
            </label>
            <Button
              size="icon"
              className="size-9"
              onClick={() => {
                setAppliedRange(range);
                setPage(1);
              }}
              aria-label={t("attendanceSearch")}
              title={t("attendanceSearch")}
            >
              <Search className="size-4" />
            </Button>
          </div>
          <Input
            placeholder={t("attendanceEmployeeSearch")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="ml-auto h-9 w-40 shrink-0"
          />
          <div className="flex shrink-0 items-center gap-2">
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
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("employeeName")}</TableHead>
                <TableHead>{t("employeeNumberId")}</TableHead>
                <TableHead>{t("attendanceWorkDate")}</TableHead>
                <TableHead>{t("attendanceSessions")}</TableHead>
                <TableHead>{t("workingHours")}</TableHead>
                <TableHead>{t("attendanceStatus")}</TableHead>
                {isSuperAdmin && (
                  <TableHead className="text-right">{t("actions")}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={isSuperAdmin ? 7 : 6}
                    className="text-muted-foreground"
                  >
                    <Loader2 className="mr-2 inline size-4 animate-spin" />
                    {t("loading")}
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isSuperAdmin ? 7 : 6}
                    className="text-muted-foreground"
                  >
                    {t("attendanceEmpty")}
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((item) => (
                  <TableRow key={item._id || `${item.numberId}-${item.date}`}>
                    <TableCell className="font-medium">
                      {item.employeeName || item.numberId}
                    </TableCell>
                    <TableCell>{item.numberId}</TableCell>
                    <TableCell>{item.workDate || item.date}</TableCell>
                    <TableCell>{sessionSummary(item)}</TableCell>
                    <TableCell>
                      {workingTime(item, {
                        hours: t("attendanceHours"),
                        minutes: t("attendanceMinutes"),
                      })}
                    </TableCell>
                    <TableCell>
                      {item.status === "done"
                        ? t("attendanceDone")
                        : t("attendanceWorking")}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell className="text-right">
                        {item._id && item.checkInAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => beginEdit(item)}
                          >
                            <Pencil className="mr-2 size-4" />
                            {t("edit")}
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("attendanceEdit")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("attendanceStartTime")}</Label>
              <Input
                type="datetime-local"
                value={editForm.checkInAt}
                onChange={(event) =>
                  setEditForm({ ...editForm, checkInAt: event.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("attendanceEndTime")}</Label>
              <Input
                type="datetime-local"
                value={editForm.checkOutAt}
                onChange={(event) =>
                  setEditForm({ ...editForm, checkOutAt: event.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("attendanceEditReason")}</Label>
              <Textarea
                value={editForm.reason}
                onChange={(event) =>
                  setEditForm({ ...editForm, reason: event.target.value })
                }
                placeholder={t("attendanceEditReasonPlaceholder")}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={editMutation.isPending}>
                {editMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {editMutation.isPending ? t("saving") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
