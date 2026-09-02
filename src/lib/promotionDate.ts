const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, "0");

export const formatTaipeiDateTimeInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const taipeiTime = new Date(date.getTime() + TAIPEI_OFFSET_MS);
  return `${taipeiTime.getUTCFullYear()}-${pad(taipeiTime.getUTCMonth() + 1)}-${pad(taipeiTime.getUTCDate())}T${pad(taipeiTime.getUTCHours())}:${pad(taipeiTime.getUTCMinutes())}`;
};

export const parseTaipeiDateTimeInput = (value: string) => {
  if (!value) return undefined;
  const date = new Date(`${value}:00+08:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};
