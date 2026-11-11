import ExcelJS from "exceljs";
import { getCurrentUser, isActiveAdmin } from "@/lib/auth/dal";
import { parseRange, REPORT_TABS } from "@/lib/admin/report-range";
import { getReportBundle } from "@/lib/data/admin-reports";
import { getPublicSettings } from "@/lib/data/site";
import { formatThaiDate, formatThaiDateTime, thTodayISO } from "@/lib/utils/format";
import { orderStatusLabel } from "@/components/orders/status-badge";

/**
 * Excel export (ADMIN §4.16): every report as its own sheet, each with the required header —
 * store name, report name, date range, generated time and the "รวม Demo Data" note.
 * Guarded here as well as by the report_* RPCs (which raise for non-admins).
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isActiveAdmin(user)) return new Response("Forbidden", { status: 403 });

  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const range = parseRange(sp, thTodayISO());
  const [data, settings] = await Promise.all([getReportBundle(range), getPublicSettings()]);
  if (data.error) return new Response("Report failed", { status: 500 });

  const wb = new ExcelJS.Workbook();
  wb.creator = settings.store_info.name;
  wb.created = new Date();
  const generatedAt = formatThaiDateTime(new Date());
  const money = "#,##0.00";
  const title = (key: (typeof REPORT_TABS)[number][0]) => REPORT_TABS.find(([k]) => k === key)![1];

  const sheet = (
    key: (typeof REPORT_TABS)[number][0],
    name: string,
    columns: { header: string; width: number; money?: boolean }[],
    rows: (string | number)[][],
    total?: (string | number)[],
  ) => {
    const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 6 }] });
    ws.addRow([settings.store_info.name]).font = { bold: true, size: 14 };
    ws.addRow([title(key)]).font = { bold: true, size: 12 };
    ws.addRow([`ช่วงวันที่ ${formatThaiDate(range.from)} – ${formatThaiDate(range.to)} (เวลาไทย)`]);
    ws.addRow([`ออกรายงานเมื่อ ${generatedAt}`]);
    ws.addRow([
      `ยอดขายนับเฉพาะ Order ชำระแล้ว/จัดส่งแล้ว/สำเร็จ${data.hasDemo ? " · รวม Demo Data" : ""}${range.includeDemo ? "" : " · ไม่รวม Demo Data"}`,
    ]);
    const head = ws.addRow(columns.map((c) => c.header));
    head.font = { bold: true };
    head.eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6E9F5" } };
      c.border = { bottom: { style: "thin" } };
    });
    columns.forEach((c, i) => {
      ws.getColumn(i + 1).width = c.width;
      if (c.money) ws.getColumn(i + 1).numFmt = money;
    });
    rows.forEach((r) => ws.addRow(r));
    if (rows.length === 0) ws.addRow(["ไม่มีข้อมูลในช่วงวันที่นี้"]);
    if (total && rows.length) ws.addRow(total).font = { bold: true };
  };

  sheet(
    "sales",
    "Sales",
    [
      { header: range.group === "month" ? "เดือน" : "วันที่", width: 16 },
      { header: "Order สำเร็จ", width: 14 },
      { header: "ยอดขาย (บาท)", width: 18, money: true },
    ],
    data.sales.rows.map((r) => [
      range.group === "month" ? r.period.slice(0, 7) : r.period.slice(0, 10),
      r.order_count,
      r.sales,
    ]),
    ["รวม", data.sales.totalOrders, data.sales.totalSales],
  );
  wb.getWorksheet("Sales")!.addRow(["ค่าเฉลี่ยต่อ Order", "", data.sales.average]);

  sheet(
    "orders",
    "Orders",
    [
      { header: "สถานะ", width: 28 },
      { header: "จำนวน", width: 12 },
    ],
    data.orders.rows.map((r) => [orderStatusLabel(r.status), r.order_count]),
    ["รวม", data.orders.total],
  );
  wb.getWorksheet("Orders")!.addRow([`อัตรายกเลิก ${(data.orders.cancelRate * 100).toFixed(1)}%`]);

  sheet(
    "products",
    "Best Sellers",
    [
      { header: "#", width: 6 },
      { header: "SKU", width: 18 },
      { header: "สินค้า", width: 40 },
      { header: "จำนวนชิ้น", width: 12 },
      { header: "ยอดเงิน (บาท)", width: 18, money: true },
    ],
    data.products.map((p, i) => [i + 1, p.sku, p.name, p.quantity, p.sales]),
  );

  sheet(
    "customers",
    "Customers",
    [
      { header: "#", width: 6 },
      { header: "ลูกค้า", width: 28 },
      { header: "อีเมล", width: 32 },
      { header: "Order สำเร็จ", width: 14 },
      { header: "ยอดซื้อ (บาท)", width: 18, money: true },
    ],
    data.customers.top.map((c, i) => [i + 1, c.full_name, c.email, c.order_count, c.total_spent]),
  );
  wb.getWorksheet("Customers")!.addRow([`สมาชิกใหม่ในช่วงนี้: ${data.customers.newMembers}`]);

  sheet(
    "categories",
    "Categories",
    [
      { header: "หมวดหมู่", width: 28 },
      { header: "จำนวนชิ้น", width: 12 },
      { header: "ยอดขาย (บาท)", width: 18, money: true },
      { header: "สัดส่วน (%)", width: 12 },
    ],
    data.categories.rows.map((c) => [
      c.category_name,
      c.quantity,
      c.sales,
      Number((c.share * 100).toFixed(1)),
    ]),
    [
      "รวม",
      data.categories.rows.reduce((a, c) => a + c.quantity, 0),
      data.categories.total,
      data.categories.total ? 100 : 0,
    ],
  );

  const buf = await wb.xlsx.writeBuffer();
  const file = `gearawai-report_${range.from}_${range.to}.xlsx`;
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    },
  });
}
