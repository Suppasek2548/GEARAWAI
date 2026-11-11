/**
 * Formatting helpers — all dates shown in Thai time (Asia/Bangkok) per R-06 / UI §15.
 * Prices are displayed only; they are always calculated in the database (calc_effective_price, R-12).
 */
export const TH_TIME_ZONE = "Asia/Bangkok";

// Whole baht → "฿4,990"; with satang → always 2 decimals "฿314.10"
const thbWhole = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});
const thbCents = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatTHB(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? thbWhole.format(rounded) : thbCents.format(rounded);
}

export function formatThaiDate(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", { timeZone: TH_TIME_ZONE, ...options }).format(d);
}

export function formatThaiDateTime(value: string | Date | null | undefined): string {
  return formatThaiDate(value, { dateStyle: "medium", timeStyle: "short" });
}

/** Today's date in Thai time as YYYY-MM-DD (matches public.th_today() in the database). */
export function thTodayISO(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
