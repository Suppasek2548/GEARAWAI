import Link from "next/link";
import type { ReportRange } from "@/lib/admin/report-range";
import { cn } from "@/lib/utils/cn";

const pill = (on: boolean) =>
  cn(
    "inline-flex h-10 items-center rounded-full border px-3 text-sm",
    on ? "border-brand-lime bg-brand-lime text-canvas" : "border-line hover:border-brand-accent",
  );

/** Date filter shared by Dashboard + every Reports tab (ADMIN §4.16 — Thai dates, last day inclusive). */
export function DateRangeFilter({
  basePath,
  range,
  extra = {},
  showDemo = false,
  showGroup = false,
}: {
  basePath: string;
  range: ReportRange;
  extra?: Record<string, string>;
  showDemo?: boolean;
  showGroup?: boolean;
}) {
  const href = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(extra);
    const merged: Record<string, string | null> = {
      range: range.preset,
      from: range.preset === "custom" ? range.from : null,
      to: range.preset === "custom" ? range.to : null,
      demo: range.includeDemo ? null : "0",
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `${basePath}?${p.toString()}`;
  };
  const presets = [
    ["today", "วันนี้"],
    ["7d", "7 วัน"],
    ["30d", "30 วัน"],
  ] as const;

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3 print:hidden">
      <div className="flex flex-wrap items-end gap-2">
        <nav aria-label="ช่วงวันที่" className="flex flex-wrap gap-2">
          {presets.map(([k, l]) => (
            <Link
              key={k}
              href={href({ range: k, from: null, to: null })}
              aria-current={range.preset === k ? "page" : undefined}
              className={pill(range.preset === k)}
            >
              {l}
            </Link>
          ))}
        </nav>
        <form action={basePath} className="flex flex-wrap items-end gap-2 text-sm">
          {Object.entries(extra).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <input type="hidden" name="range" value="custom" />
          {!range.includeDemo && <input type="hidden" name="demo" value="0" />}
          <label className="flex flex-col gap-1">
            <span className="text-ink-soft">ตั้งแต่</span>
            <input
              type="date"
              name="from"
              required
              defaultValue={range.from}
              className="h-10 rounded-btn border border-line bg-canvas px-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-ink-soft">ถึง</span>
            <input
              type="date"
              name="to"
              required
              defaultValue={range.to}
              className="h-10 rounded-btn border border-line bg-canvas px-2"
            />
          </label>
          <button type="submit" className={cn(pill(range.preset === "custom"), "cursor-pointer")}>
            กำหนดเอง
          </button>
        </form>
      </div>
      {(showDemo || showGroup) && (
        <div className="flex flex-wrap gap-2">
          {showGroup && (
            <nav aria-label="จัดกลุ่มยอดขาย" className="flex gap-2">
              <Link href={href({ group: "day" })} className={pill(range.group === "day")}>
                รายวัน
              </Link>
              <Link href={href({ group: "month" })} className={pill(range.group === "month")}>
                รายเดือน
              </Link>
            </nav>
          )}
          {showDemo && (
            <nav aria-label="Demo Data" className="flex gap-2">
              <Link href={href({ demo: null })} className={pill(range.includeDemo)}>
                รวม Demo Data
              </Link>
              <Link href={href({ demo: "0" })} className={pill(!range.includeDemo)}>
                ไม่รวม Demo Data
              </Link>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
