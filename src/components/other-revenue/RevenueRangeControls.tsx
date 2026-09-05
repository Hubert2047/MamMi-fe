import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RevenueRange } from "@/api/other-revenue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

export type RevenueRangeMode = "admin" | "pos";

type Props = {
  mode: RevenueRangeMode;
  range?: RevenueRange;
  onRangeChange?: (range: RevenueRange) => void;
  messageKeys?: Partial<RangeMessageKeys>;
};

export type RangeMessageKeys = {
  from: string;
  to: string;
  apply: string;
  reset: string;
  previous: string;
  next: string;
};

const defaultMessageKeys: RangeMessageKeys = {
  from: "revenueFrom",
  to: "revenueTo",
  apply: "revenueApplyFilter",
  reset: "revenueFilterReset",
  previous: "revenuePreviousDay",
  next: "revenueNextDay",
};

function inputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function shiftDayRange(value: string, days: number) {
  const [date] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const start = new Date(year, month - 1, day + days, 0, 0);
  const end = new Date(year, month - 1, day + days + 1, 0, 0);
  const pad = (part: number) => String(part).padStart(2, "0");
  const format = (shifted: Date) =>
    `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}T00:00`;
  return { from: format(start), to: format(end) };
}

function getTodayRange() {
  const now = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date())
    .replace(" ", "T");
  return { from: `${now.slice(0, 10)}T00:00`, to: now };
}

export function RevenueRangeControls({ mode, range, onRangeChange, messageKeys }: Props) {
  const { t } = useI18n();
  const keys = { ...defaultMessageKeys, ...messageKeys };
  const [draftFrom, setDraftFrom] = useState(() => inputValue(range?.from));
  const [draftTo, setDraftTo] = useState(() => inputValue(range?.to));
  const appliedFrom = inputValue(range?.from);
  const appliedTo = inputValue(range?.to);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setDraftFrom(appliedFrom);
      setDraftTo(appliedTo);
    });
    return () => cancelAnimationFrame(frame);
  }, [appliedFrom, appliedTo]);

  if (mode !== "admin" || !onRangeChange || !range) return null;

  const hasDraftChanges = draftFrom !== appliedFrom || draftTo !== appliedTo;
  const today = getTodayRange();
  const isToday = appliedFrom === today.from && appliedTo === today.to;
  const emitRange = (from: string, to: string) => {
    onRangeChange({
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
    });
  };
  const shiftDay = (days: number) => {
    const next = shiftDayRange(appliedFrom, days);
    setDraftFrom(next.from);
    setDraftTo(next.to);
    emitRange(next.from, next.to);
  };
  const reset = () => {
    const next = getTodayRange();
    setDraftFrom(next.from);
    setDraftTo(next.to);
    emitRange(next.from, next.to);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="icon" className="size-8" aria-label={t(keys.previous)} title={t(keys.previous)} onClick={() => shiftDay(-1)}>
        <ChevronLeft />
      </Button>
      <span className="text-xs text-muted-foreground">{t(keys.from)}</span>
      <Input type="datetime-local" value={draftFrom} onChange={(event) => setDraftFrom(event.target.value)} className="h-8 w-48 px-2 text-xs" aria-label={t(keys.from)} />
      <span className="text-xs text-muted-foreground">{t(keys.to)}</span>
      <Input type="datetime-local" value={draftTo} onChange={(event) => setDraftTo(event.target.value)} className="h-8 w-48 px-2 text-xs" aria-label={t(keys.to)} />
      <Button type="button" variant="outline" size="icon" className="size-8" aria-label={t(keys.next)} title={t(keys.next)} onClick={() => shiftDay(1)}>
        <ChevronRight />
      </Button>
      {hasDraftChanges && <Button type="button" size="sm" className="h-8" onClick={() => emitRange(draftFrom, draftTo)}>{t(keys.apply)}</Button>}
      {(!isToday || hasDraftChanges) && <Button type="button" variant="ghost" size="sm" className="h-8" onClick={reset}>{t(keys.reset)}</Button>}
    </div>
  );
}
