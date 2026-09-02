import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { checkIn, checkOut, getAttendances } from "@/api/shift-attendance";
import { toast } from "sonner";
import NumPad from "./NumPad";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Loading from "@/components/Loading.tsx";
import axios from "axios";
import { useI18n } from "@/lib/i18n";
import { getEmployees } from "@/api/employee";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

function ShiftAttendance({ open, onClose }: Props) {
  const { t } = useI18n();
  const [numberId, setNumberId] = useState("");
  const queryClient = useQueryClient();
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    enabled: open,
  });
  const taiwanToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const { data: todayAttendances = [], isLoading: isAttendanceLoading } =
    useQuery({
      queryKey: ["shift-attendances", "today"],
      queryFn: () => getAttendances({ date: taiwanToday }),
      enabled: open,
    });
  const matchedEmployee = employees.find(
    (employee) => employee.numberId === numberId,
  );
  const [verifiedNumberId, setVerifiedNumberId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0);
  const verifiedEmployee =
    matchedEmployee &&
    verifiedNumberId === numberId &&
    matchedEmployee.active !== false
      ? matchedEmployee
      : null;
  const todayAttendance = todayAttendances.find(
    (attendance) => attendance.numberId === numberId,
  );
  const hasOpenSession = Boolean(
    todayAttendance?.sessions?.some((session) => !session.checkOut) ||
    (!todayAttendance?.sessions?.length &&
      todayAttendance?.checkIn &&
      !todayAttendance.checkOuts?.length),
  );
  const actionLabel =
    verifiedEmployee && !isAttendanceLoading && lockedUntil === 0
      ? hasOpenSession
        ? t("checkOut")
        : t("checkIn")
      : "";
  useEffect(() => {
    if (!lockedUntil) return;
    const updateRemaining = () => {
      const remaining = Math.max(0, lockedUntil - Date.now());
      setLockRemaining(Math.ceil(remaining / 1000));
      if (!remaining) setLockedUntil(0);
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 250);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);
  const updateNumberId = (value: string) => {
    setNumberId(value);
    setVerifiedNumberId(null);
  };
  const verifyEmployee = async () => {
    if (lockedUntil || isVerifying || !numberId) return;
    setIsVerifying(true);
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    if (!matchedEmployee || matchedEmployee.active === false) {
      toast.error(
        matchedEmployee?.active === false
          ? t("employeeInactive")
          : t("employeeNotFound"),
      );
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 3) {
        setLockedUntil(Date.now() + 60_000);
        setFailedAttempts(0);
      }
      setIsVerifying(false);
      return;
    }
    setVerifiedNumberId(numberId);
    setFailedAttempts(0);
    setIsVerifying(false);
  };
  const checkInMutation = useMutation({
    mutationFn: checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-attendances"] }).then();
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      if (message === "Already checked in today") {
        toast.error(t("alreadyCheckedIn"));
      } else if (message === "Employee not found") {
        toast.error(t("employeeNotFound"));
      } else {
        toast.error(t("attendanceFailure"));
      }
    },
  });
  const checkOutMutation = useMutation({
    mutationFn: checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-attendances"] }).then();
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      if (message === "No check-in found for today") {
        toast.error(t("noCheckIn"));
      } else {
        toast.error(t("attendanceFailure"));
      }
    },
  });
  const handleCheckIn = async () => {
    await checkInMutation.mutateAsync(numberId);
    toast.success(t("checkInSuccess"));
    onClose();
  };
  const handleCheckOut = async () => {
    await checkOutMutation.mutateAsync(numberId);
    toast.success(t("checkOutSuccess"));
    onClose();
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setNumberId("");
          setVerifiedNumberId(null);
          setIsVerifying(false);
          setFailedAttempts(0);
          setLockedUntil(0);
          onClose();
        }
      }}
    >
      <DialogContent className="top-4 max-h-[calc(100dvh-2rem)] -translate-y-0 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-black! font-bold! text-xl text-center">
            {t("attendance")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-0 px-2">
          <span className="font-bold text-md">{t("employeeId")}</span>
          <div className="flex items-center gap-2">
            <Input
              value={numberId}
              className="mt-0 h-10 min-w-0 flex-1 text-lg"
              onChange={(e) => updateNumberId(e.target.value)}
            />
            {!verifiedEmployee && !lockedUntil && (
              <Button
                className="h-10 shrink-0 px-4"
                onClick={verifyEmployee}
                disabled={!numberId || !employees.length || isVerifying}
              >
                {isVerifying ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("attendanceVerify")}...
                  </span>
                ) : (
                  t("attendanceVerify")
                )}
              </Button>
            )}
          </div>
          <div className="mt-1 flex h-5 items-center justify-center">
            {verifiedEmployee && (
              <p className="text-center text-base font-semibold text-emerald-600">
                {t("employeeName")}: {verifiedEmployee.name}
              </p>
            )}
          </div>
        </div>
        <div className="mt-0 flex w-full items-stretch gap-2 px-2">
          <NumPad
            currentValue={numberId}
            onChange={updateNumberId}
            large
            columns={6}
            clearAll
          />
          <div className="flex min-w-0 flex-1">
            <Button
              className={`h-auto min-h-full w-full whitespace-normal border-2 text-lg text-white ${
                verifiedEmployee && !isAttendanceLoading && lockedUntil === 0
                  ? hasOpenSession
                    ? "border-red-500 bg-red-500 hover:bg-red-600"
                    : "border-green-500 bg-green-500 hover:bg-green-600"
                  : "border-gray-300 bg-slate-100 text-slate-400 opacity-70 shadow-inner"
              }`}
              onClick={hasOpenSession ? handleCheckOut : handleCheckIn}
              disabled={
                !verifiedEmployee ||
                isAttendanceLoading ||
                Boolean(lockedUntil) ||
                checkInMutation.isPending ||
                checkOutMutation.isPending
              }
            >
              {actionLabel}
            </Button>
          </div>
        </div>
        {lockedUntil > 0 && (
          <p className="text-center text-sm font-semibold text-red-600">
            {t("employeeLocked")} ({lockRemaining}s)
          </p>
        )}
        {(checkOutMutation.isPending || checkInMutation.isPending) && (
          <Loading />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ShiftAttendance;
