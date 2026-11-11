import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { FileSpreadsheet, Printer } from "lucide-react";
import { isReportTab, parseRange, rangeQuery, REPORT_TABS } from "@/lib/admin/report-range";
import { getReportBundle } from "@/lib/data/admin-reports";
import { formatThaiDate, thTodayISO } from "@/lib/utils/format";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { ReportView } from "@/components/admin/report-views";
import { AdminPageHeader, AdminShell, FilterLinks, sp1 } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Reports & Analytics" };

/** ADMIN §4.16 (S17) — 5 tabs, one shared date filter, Excel export + Print-to-PDF (D-09). */
export default function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  return (
    <AdminShell>
      <AdminPageHeader
        title="Reports & Analytics"
        description="ยอดขายนับเฉพาะ Order สถานะ ชำระแล้ว / จัดส่งแล้ว / สำเร็จ · วันที่ตามเวลาไทย รวมวันสุดท้าย"
      />
      <Suspense fallback={<Skeleton className="h-[640px]" />}>
        <Reports searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

async function Reports({ searchParams }: { searchParams: PageProps<"/admin/reports">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const tab = isReportTab(sp1(sp.tab)) ? (sp1(sp.tab) as (typeof REPORT_TABS)[number][0]) : "sales";
  const range = parseRange(sp, thTodayISO());
  const data = await getReportBundle(range);
  const q = rangeQuery(range, { tab });

  return (
    <>
      <FilterLinks
        label="ประเภทรายงาน"
        current={tab}
        items={REPORT_TABS.map(([k, l]) => ({
          href: `/admin/reports?${rangeQuery(range, { tab: k })}`,
          label: l,
          value: k,
        }))}
      />
      <DateRangeFilter
        basePath="/admin/reports"
        range={range}
        extra={{ tab }}
        showDemo
        showGroup={tab === "sales"}
      />
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-ink-soft">
          {formatThaiDate(range.from)} – {formatThaiDate(range.to)}
          {data.hasDemo && <span className="ml-2 text-warning">· รวม Demo Data</span>}
          {!range.includeDemo && <span className="ml-2">· ไม่รวม Demo Data</span>}
        </p>
        <a
          href={`/admin/reports/export?${q}`}
          className={buttonClasses({ variant: "secondary", size: "md" })}
          download
        >
          <FileSpreadsheet className="size-4" aria-hidden /> Export Excel
        </a>
        <a
          href={`/admin/reports/print?${q}`}
          target="_blank"
          rel="noopener"
          className={buttonClasses({ variant: "outline", size: "md" })}
        >
          <Printer className="size-4" aria-hidden /> พิมพ์ / บันทึก PDF
        </a>
      </div>
      {data.error && (
        <p className="rounded-btn border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          โหลดรายงานบางส่วนไม่สำเร็จ — ลองใหม่อีกครั้ง
        </p>
      )}
      <ReportView tab={tab} data={data} range={range} />
    </>
  );
}
