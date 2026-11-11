import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { isReportTab, parseRange, rangeQuery, REPORT_TABS, type ReportTab } from "@/lib/admin/report-range";
import { getReportBundle } from "@/lib/data/admin-reports";
import { getPublicSettings } from "@/lib/data/site";
import { formatThaiDate, formatThaiDateTime, thTodayISO } from "@/lib/utils/format";
import { PrintButton } from "@/components/admin/print-button";
import { ReportView } from "@/components/admin/report-views";
import { sp1 } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Print Report" };

/**
 * Print-friendly report (D-09): the browser's "Print → Save as PDF" keeps the Thai fonts
 * loaded by next/font. Admin header/sidebar are `print:hidden` in the admin layout.
 * ?tab=all prints every report in one document.
 */
export default function PrintReportPage({ searchParams }: PageProps<"/admin/reports/print">) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-96" />}>
      <PrintSheet searchParams={searchParams} />
    </Suspense>
  );
}

async function PrintSheet({
  searchParams,
}: {
  searchParams: PageProps<"/admin/reports/print">["searchParams"];
}) {
  await connection();
  const sp = await searchParams;
  const raw = sp1(sp.tab);
  const tabs: ReportTab[] = raw === "all" ? REPORT_TABS.map(([k]) => k) : [isReportTab(raw) ? raw : "sales"];
  const range = parseRange(sp, thTodayISO());
  const [data, settings] = await Promise.all([getReportBundle(range), getPublicSettings()]);
  const generatedAt = formatThaiDateTime(new Date());
  const title = tabs.length > 1 ? "รายงานสรุปทั้งหมด" : REPORT_TABS.find(([k]) => k === tabs[0])![1];

  return (
    <div className="print-sheet flex-1 p-4 md:p-8 print:p-0">
      <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
        <PrintButton />
        <Link
          href={`/admin/reports/print?${rangeQuery(range, { tab: tabs.length > 1 ? tabs[0] : "all" })}`}
          className="rounded-btn border border-line px-4 py-2 text-sm hover:border-brand-accent"
        >
          {tabs.length > 1 ? "พิมพ์เฉพาะรายงานนี้" : "พิมพ์ทุกรายงาน"}
        </Link>
        <Link
          href={`/admin/reports?${rangeQuery(range, { tab: tabs[0] })}`}
          className="text-sm text-brand-accent hover:underline"
        >
          กลับไปหน้ารายงาน
        </Link>
        <p className="w-full text-xs text-ink-muted">
          ในหน้าต่างพิมพ์ เลือกปลายทาง “บันทึกเป็น PDF” เพื่อได้ไฟล์ PDF ที่แสดงภาษาไทยถูกต้อง
        </p>
      </div>

      <header className="mb-6 border-b-2 border-ink pb-3">
        <p className="font-display text-2xl font-bold">{settings.store_info.name}</p>
        <h1 className="font-display text-xl font-semibold">{title}</h1>
        <p className="text-sm text-ink-soft">
          ช่วงวันที่ {formatThaiDate(range.from)} – {formatThaiDate(range.to)} (เวลาไทย) · ออกรายงานเมื่อ{" "}
          {generatedAt}
        </p>
        <p className="text-sm text-ink-soft">
          ยอดขายนับเฉพาะ Order สถานะ ชำระแล้ว / จัดส่งแล้ว / สำเร็จ
          {data.hasDemo && <strong className="ml-1 text-warning">· รวม Demo Data</strong>}
          {!range.includeDemo && <span className="ml-1">· ไม่รวม Demo Data</span>}
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {tabs.map((t) => (
          <section key={t} className="flex break-inside-avoid-page flex-col gap-3">
            {tabs.length > 1 && (
              <h2 className="font-display text-lg font-bold">{REPORT_TABS.find(([k]) => k === t)![1]}</h2>
            )}
            <ReportView tab={t} data={data} range={range} print />
          </section>
        ))}
      </div>
    </div>
  );
}
