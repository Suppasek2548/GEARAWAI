/**
 * Shared date filter for Dashboard + Reports (ADMIN §4.16 — Thai dates, last day inclusive, R-06).
 * Pure: the caller passes today's Thai date, so the clock is only read after `connection()`.
 */
export type RangePreset = "today" | "7d" | "30d" | "custom";
export type ReportRange = {
  from: string; // YYYY-MM-DD (Thai)
  to: string;
  preset: RangePreset;
  includeDemo: boolean;
  group: "day" | "month";
};

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 731;

const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const validDay = (s: string) => DAY_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

export function parseRange(sp: Record<string, string | string[] | undefined>, today: string): ReportRange {
  const raw = one(sp.range);
  let preset: RangePreset = raw === "today" || raw === "7d" || raw === "custom" ? raw : "30d";
  let from = addDays(today, -29);
  let to = today;
  if (preset === "today") from = today;
  if (preset === "7d") from = addDays(today, -6);
  if (preset === "custom") {
    const f = one(sp.from);
    const t = one(sp.to);
    if (validDay(f) && validDay(t)) {
      [from, to] = f <= t ? [f, t] : [t, f];
      if (daysBetween(from, to) > MAX_DAYS) from = addDays(to, -(MAX_DAYS - 1));
    } else {
      preset = "30d";
    }
  }
  const g = one(sp.group);
  const group = g === "day" || g === "month" ? g : daysBetween(from, to) > 62 ? "month" : "day";
  return { from, to, preset, includeDemo: one(sp.demo) !== "0", group };
}

/** Query string for links/exports that keeps the current filter. */
export function rangeQuery(r: ReportRange, extra: Record<string, string> = {}) {
  const p = new URLSearchParams({ range: r.preset });
  if (r.preset === "custom") {
    p.set("from", r.from);
    p.set("to", r.to);
  }
  if (!r.includeDemo) p.set("demo", "0");
  p.set("group", r.group);
  for (const [k, v] of Object.entries(extra)) p.set(k, v);
  return p.toString();
}

/** Every day (or month) in the range, so charts show 0 instead of skipping empty periods. */
export function fillPeriods<T extends { period: string }>(
  rows: T[],
  r: ReportRange,
  empty: (period: string) => T,
): T[] {
  const byKey = new Map(rows.map((row) => [row.period.slice(0, r.group === "month" ? 7 : 10), row]));
  const out: T[] = [];
  if (r.group === "month") {
    let y = Number(r.from.slice(0, 4));
    let m = Number(r.from.slice(5, 7));
    const endKey = r.to.slice(0, 7);
    for (;;) {
      const key = `${y}-${String(m).padStart(2, "0")}`;
      out.push(byKey.get(key) ?? empty(`${key}-01`));
      if (key >= endKey) break;
      m += 1;
      if (m > 12) [m, y] = [1, y + 1];
    }
  } else {
    for (let d = r.from; d <= r.to; d = addDays(d, 1)) out.push(byKey.get(d) ?? empty(d));
  }
  return out;
}

export const REPORT_TABS = [
  ["sales", "Sales Report"],
  ["orders", "Order Report"],
  ["products", "Best Selling Products"],
  ["customers", "Customer Report"],
  ["categories", "Category Report"],
] as const;
export type ReportTab = (typeof REPORT_TABS)[number][0];
export const isReportTab = (v: string): v is ReportTab => REPORT_TABS.some(([k]) => k === v);
