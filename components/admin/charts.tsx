"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTHB } from "@/lib/utils/format";

/*
 * Admin charts (ADMIN §4.1 / §4.16). Palette = dataviz reference dark steps, validated on the
 * site surface #12143a (all six checks pass). Categorical hues go in fixed order and follow the
 * entity (sorted by name), never its rank; >6 categories fold into "อื่น ๆ".
 */
export const SERIES = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#9085e9"] as const;
const OTHER = "#8b93c9";
const SURFACE = "#12143a";
const GRID = "#2a2f6b";
const MUTED = "#8b93c9";

const thaiShort = (period: string, group: "day" | "month") =>
  new Intl.DateTimeFormat("th-TH", {
    timeZone: "UTC",
    ...(group === "month" ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" }),
  }).format(new Date(`${period.slice(0, 10)}T00:00:00Z`));

const compact = (n: number) =>
  new Intl.NumberFormat("th-TH", { notation: "compact", maximumFractionDigits: 1 }).format(n);

function TipBox({ title, lines }: { title: string; lines: [string, string][] }) {
  return (
    <div className="rounded-btn border border-line bg-elevated px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-semibold text-ink">{title}</p>
      {lines.map(([k, v]) => (
        <p key={k} className="flex justify-between gap-4 text-ink-soft">
          <span>{k}</span>
          <span className="font-medium text-ink tabular-nums">{v}</span>
        </p>
      ))}
    </div>
  );
}

function Empty({ height, text = "ยังไม่มียอดขายในช่วงวันที่นี้" }: { height: number; text?: string }) {
  return (
    <div
      style={{ height }}
      className="grid place-items-center rounded-btn border border-dashed border-line text-sm text-ink-muted"
    >
      {text}
    </div>
  );
}

type SalesRow = { period: string; sales: number; order_count: number };

/** Sales Overview — one series, so no legend box; the card title names it. */
export function SalesChart({
  rows,
  group,
  height = 300,
}: {
  rows: SalesRow[];
  group: "day" | "month";
  height?: number;
}) {
  if (!rows.some((r) => r.sales > 0)) return <Empty height={height} />;
  const data = rows.map((r) => ({ ...r, label: thaiShort(r.period, group) }));
  return (
    <div style={{ height }} role="img" aria-label="กราฟยอดขาย (ดูตัวเลขในตาราง)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="2 4" />
          <XAxis
            dataKey="label"
            tick={{ fill: MUTED, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            minTickGap={16}
          />
          <YAxis
            tick={{ fill: MUTED, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={compact}
          />
          <Tooltip
            cursor={{ fill: "rgba(88,130,232,0.12)" }}
            content={({ active, payload }) => {
              const p = active && (payload?.[0]?.payload as (SalesRow & { label: string }) | undefined);
              if (!p) return null;
              return (
                <TipBox
                  title={thaiShort(p.period, group)}
                  lines={[
                    ["ยอดขาย", formatTHB(p.sales)],
                    ["Order สำเร็จ", String(p.order_count)],
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="sales" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type CatRow = { category_name: string; sales: number };

/** Assign colors by category name (stable), fold the 7th+ by sales into "อื่น ๆ". */
export function categorySlices(rows: CatRow[]) {
  const sorted = [...rows].filter((r) => r.sales > 0).sort((a, b) => b.sales - a.sales);
  const keep = sorted.slice(0, SERIES.length);
  const rest = sorted.slice(SERIES.length);
  const byName = [...keep].sort((a, b) => a.category_name.localeCompare(b.category_name, "th"));
  const colorOf = new Map(byName.map((r, i) => [r.category_name, SERIES[i]]));
  const total = sorted.reduce((a, r) => a + r.sales, 0);
  const slices: { name: string; value: number; color: string }[] = keep.map((r) => ({
    name: r.category_name,
    value: r.sales,
    color: colorOf.get(r.category_name)!,
  }));
  if (rest.length) slices.push({ name: "อื่น ๆ", value: rest.reduce((a, r) => a + r.sales, 0), color: OTHER });
  return { slices, total };
}

/** Top Categories donut with a legend that also carries the values (identity never color-alone). */
export function CategoryDonut({ rows, size = 300 }: { rows: CatRow[]; size?: number }) {
  const { slices, total } = categorySlices(rows);
  if (!total) return <Empty height={size} />;
  return (
    <div className="flex flex-col gap-3">
      <div style={{ height: size }} role="img" aria-label="สัดส่วนยอดขายตามหมวดหมู่ (ดูตัวเลขในรายการ)">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="90%"
              stroke={SURFACE}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                const p = active && (payload?.[0]?.payload as (typeof slices)[number] | undefined);
                if (!p) return null;
                return (
                  <TipBox
                    title={p.name}
                    lines={[
                      ["ยอดขาย", formatTHB(p.value)],
                      ["สัดส่วน", `${((p.value / total) * 100).toFixed(1)}%`],
                    ]}
                  />
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-col gap-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <span aria-hidden className="size-3 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="min-w-0 flex-1 truncate text-ink-soft">{s.name}</span>
            <span className="text-ink tabular-nums">{((s.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Order Report — one measure (count) per status, so one hue; status names are on the axis. */
export function StatusBars({
  rows,
  height = 260,
}: {
  rows: { label: string; order_count: number }[];
  height?: number;
}) {
  if (!rows.some((r) => r.order_count > 0)) return <Empty height={height} text="ไม่มีคำสั่งซื้อในช่วงวันที่นี้" />;
  return (
    <div style={{ height }} role="img" aria-label="จำนวน Order ตามสถานะ (ดูตัวเลขในตาราง)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          barCategoryGap={6}
        >
          <CartesianGrid horizontal={false} stroke={GRID} strokeDasharray="2 4" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: MUTED, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={150}
            tick={{ fill: MUTED, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(88,130,232,0.12)" }}
            content={({ active, payload }) => {
              const p =
                active && (payload?.[0]?.payload as { label: string; order_count: number } | undefined);
              if (!p) return null;
              return <TipBox title={p.label} lines={[["จำนวน Order", String(p.order_count)]]} />;
            }}
          />
          <Bar dataKey="order_count" fill={SERIES[0]} radius={[0, 4, 4, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
