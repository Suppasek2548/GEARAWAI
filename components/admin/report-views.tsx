import Image from "next/image";
import type { ReportBundle } from "@/lib/data/admin-reports";
import type { ReportRange, ReportTab } from "@/lib/admin/report-range";
import { formatTHB } from "@/lib/utils/format";
import { orderStatusLabel } from "@/components/orders/status-badge";
import { CategoryDonut, SalesChart, StatusBars } from "@/components/admin/charts";
import { AdminTable, td, th } from "@/components/admin/ui";
import { StatCard } from "@/components/ui/misc";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const periodLabel = (p: string, group: "day" | "month") =>
  new Intl.DateTimeFormat("th-TH", {
    timeZone: "UTC",
    ...(group === "month"
      ? { month: "long", year: "numeric" }
      : { day: "numeric", month: "short", year: "numeric" }),
  }).format(new Date(`${p.slice(0, 10)}T00:00:00Z`));

/**
 * One report tab, shared by /admin/reports and /admin/reports/print.
 * `print` (the Print-to-PDF page) keeps the stat cards + tables and drops the charts, whose
 * colours are tuned for the dark screen theme; it also hides empty rows of the daily table.
 */
export function ReportView({
  tab,
  data,
  range,
  print = false,
}: {
  tab: ReportTab;
  data: ReportBundle;
  range: ReportRange;
  print?: boolean;
}) {
  if (tab === "sales") {
    const rows = print ? data.sales.rows.filter((r) => r.order_count > 0) : data.sales.rows;
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          <StatCard label="ยอดขายรวม" value={formatTHB(data.sales.totalSales)} />
          <StatCard label="จำนวน Order สำเร็จ" value={data.sales.totalOrders.toLocaleString("th-TH")} />
          <StatCard label="ค่าเฉลี่ยต่อ Order" value={formatTHB(data.sales.average)} />
        </div>
        {!print && (
          <section className="rounded-card border border-line bg-surface p-4">
            <h2 className="mb-3 font-display text-lg font-semibold">
              ยอดขาย{range.group === "month" ? "รายเดือน" : "รายวัน"}
            </h2>
            <SalesChart rows={data.sales.rows} group={range.group} height={320} />
          </section>
        )}
        <Table
          head={[range.group === "month" ? "เดือน" : "วันที่", "Order สำเร็จ", "ยอดขาย"]}
          align={["l", "r", "r"]}
          rows={rows.map((r) => [
            periodLabel(r.period, range.group),
            r.order_count.toLocaleString("th-TH"),
            formatTHB(r.sales),
          ])}
          foot={["รวม", data.sales.totalOrders.toLocaleString("th-TH"), formatTHB(data.sales.totalSales)]}
        />
      </div>
    );
  }

  if (tab === "orders") {
    const rows = data.orders.rows.map((r) => ({
      label: orderStatusLabel(r.status),
      order_count: r.order_count,
    }));
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          <StatCard label="Order ทั้งหมด" value={data.orders.total.toLocaleString("th-TH")} />
          <StatCard label="ยกเลิก" value={data.orders.cancelled.toLocaleString("th-TH")} />
          <StatCard label="อัตรายกเลิก" value={pct(data.orders.cancelRate)} />
        </div>
        {!print && (
          <section className="rounded-card border border-line bg-surface p-4">
            <h2 className="mb-3 font-display text-lg font-semibold">จำนวน Order ตามสถานะ</h2>
            <StatusBars rows={rows} />
          </section>
        )}
        <Table
          head={["สถานะ", "จำนวน", "สัดส่วน"]}
          align={["l", "r", "r"]}
          rows={rows.map((r) => [
            r.label,
            r.order_count.toLocaleString("th-TH"),
            pct(data.orders.total ? r.order_count / data.orders.total : 0),
          ])}
          foot={["รวม", data.orders.total.toLocaleString("th-TH"), data.orders.total ? "100%" : "0%"]}
        />
        <p className="text-xs text-ink-muted">
          นับทุกสถานะตามวันที่สร้าง Order · ยอดขายในแท็บอื่นนับเฉพาะ ชำระแล้ว/จัดส่งแล้ว/สำเร็จ
        </p>
      </div>
    );
  }

  if (tab === "products") {
    return (
      <div className="flex flex-col gap-2">
        <AdminTable minWidth={640}>
          <thead className="bg-surface">
            <tr>
              <th className={th}>#</th>
              <th className={th}>สินค้า</th>
              <th className={`${th} text-right`}>จำนวนชิ้น</th>
              <th className={`${th} text-right`}>ยอดเงิน</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p, i) => (
              <tr key={p.product_id} className="border-t border-line">
                <td className={td}>{i + 1}</td>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-btn bg-elevated">
                      {p.image_url && (
                        <Image src={p.image_url} alt="" fill sizes="64px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-ink-muted">{p.sku}</p>
                    </div>
                  </div>
                </td>
                <td className={`${td} text-right tabular-nums`}>{p.quantity.toLocaleString("th-TH")}</td>
                <td className={`${td} text-right tabular-nums`}>{formatTHB(p.sales)}</td>
              </tr>
            ))}
            {data.products.length === 0 && <EmptyRow cols={4} />}
          </tbody>
        </AdminTable>
        <p className="text-xs text-ink-muted">{LINE_NOTE}</p>
      </div>
    );
  }

  if (tab === "customers") {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          <StatCard label="สมาชิกใหม่ในช่วงนี้" value={data.customers.newMembers.toLocaleString("th-TH")} />
          <StatCard label="ลูกค้าที่มียอดซื้อ (Top 10)" value={data.customers.top.length.toLocaleString("th-TH")} />
        </div>
        <Table
          head={["#", "ลูกค้า", "อีเมล", "Order สำเร็จ", "ยอดซื้อ"]}
          align={["l", "l", "l", "r", "r"]}
          rows={data.customers.top.map((c, i) => [
            String(i + 1),
            c.full_name,
            c.email,
            c.order_count.toLocaleString("th-TH"),
            formatTHB(c.total_spent),
          ])}
        />
      </div>
    );
  }

  return (
    <div className={print ? "flex flex-col gap-4" : "grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]"}>
      {!print && (
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="mb-3 font-display text-lg font-semibold">สัดส่วนยอดขาย</h2>
          <CategoryDonut rows={data.categories.rows} size={260} />
        </section>
      )}
      <Table
        head={["หมวดหมู่", "จำนวนชิ้น", "ยอดขาย", "สัดส่วน"]}
        align={["l", "r", "r", "r"]}
        rows={data.categories.rows.map((c) => [
          c.category_name,
          c.quantity.toLocaleString("th-TH"),
          formatTHB(c.sales),
          pct(c.share),
        ])}
        foot={[
          "รวม",
          data.categories.rows.reduce((a, c) => a + c.quantity, 0).toLocaleString("th-TH"),
          formatTHB(data.categories.total),
          data.categories.total ? "100%" : "0%",
        ]}
      />
      <p className="text-xs text-ink-muted lg:col-span-2">{LINE_NOTE}</p>
    </div>
  );
}

const LINE_NOTE =
  "ยอดเงินในรายงานนี้คิดจากราคาสินค้าในแต่ละรายการ (ก่อนหักคูปอง ไม่รวมค่าส่ง) จึงอาจต่างจากยอดขายรวมที่ใช้ยอดชำระของ Order";

function Table({
  head,
  rows,
  foot,
  align,
}: {
  head: string[];
  rows: string[][];
  foot?: string[];
  align: ("l" | "r")[];
}) {
  const a = (i: number) => (align[i] === "r" ? "text-right tabular-nums" : "");
  return (
    <AdminTable minWidth={480}>
      <thead className="bg-surface">
        <tr>
          {head.map((h, i) => (
            <th key={h} className={`${th} ${a(i)}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} className="border-t border-line">
            {r.map((c, i) => (
              <td key={i} className={`${td} ${a(i)}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && <EmptyRow cols={head.length} />}
      </tbody>
      {foot && rows.length > 0 && (
        <tfoot>
          <tr className="border-t-2 border-line font-semibold">
            {foot.map((c, i) => (
              <td key={i} className={`${td} ${a(i)}`}>
                {c}
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </AdminTable>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className={`${td} text-center text-ink-muted`}>
        ไม่มีข้อมูลในช่วงวันที่นี้
      </td>
    </tr>
  );
}
