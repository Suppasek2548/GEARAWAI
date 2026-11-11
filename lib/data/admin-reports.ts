import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fillPeriods, type ReportRange } from "@/lib/admin/report-range";
import type { OrderStatus } from "@/lib/data/member";

/* Reports (ADMIN §4.16) — every number comes from the admin-only report_* RPCs (migration 0019). */

const num = (v: unknown) => Number(v ?? 0) || 0;

export type ReportBundle = Awaited<ReturnType<typeof getReportBundle>>;

export async function getReportBundle(r: ReportRange) {
  const supabase = await createClient();
  const base = { p_from: r.from, p_to: r.to, p_include_demo: r.includeDemo };

  let members = supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "member")
    .gte("created_at", new Date(`${r.from}T00:00:00+07:00`).toISOString())
    .lt("created_at", new Date(Date.parse(`${r.to}T00:00:00+07:00`) + 86_400_000).toISOString());
  if (!r.includeDemo) members = members.eq("is_demo", false);

  const [sales, status, best, customers, categories, newMembers, demoOrders] = await Promise.all([
    supabase.rpc("report_sales", { ...base, p_group: r.group }),
    supabase.rpc("report_order_status", base),
    supabase.rpc("report_best_sellers", { ...base, p_limit: 10 }),
    supabase.rpc("report_customers", { ...base, p_limit: 10 }),
    supabase.rpc("report_category_sales", base),
    members,
    // Is there any Demo order in the range? Drives the "รวม Demo Data" note in report headers.
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("is_demo", true)
      .gte("created_at", new Date(`${r.from}T00:00:00+07:00`).toISOString())
      .lt("created_at", new Date(Date.parse(`${r.to}T00:00:00+07:00`) + 86_400_000).toISOString()),
  ]);
  const error = [sales, status, best, customers, categories].find((x) => x.error)?.error ?? null;

  const salesRows = (sales.data ?? []).map((x) => ({
    period: x.period,
    order_count: num(x.order_count),
    sales: num(x.sales),
  }));
  const totalSales = salesRows.reduce((a, x) => a + x.sales, 0);
  const totalOrders = salesRows.reduce((a, x) => a + x.order_count, 0);

  const statusRows = (status.data ?? []).map((x) => ({
    status: x.status as OrderStatus,
    order_count: num(x.order_count),
  }));
  const allOrders = statusRows.reduce((a, x) => a + x.order_count, 0);
  const cancelled = statusRows.find((x) => x.status === "cancelled")?.order_count ?? 0;

  const bestRows = (best.data ?? []).map((x) => ({ ...x, quantity: num(x.quantity), sales: num(x.sales) }));
  const ids = bestRows.map((x) => x.product_id);
  const { data: imgs } = ids.length
    ? await supabase
        .from("product_images")
        .select("product_id, image_url")
        .in("product_id", ids)
        .eq("is_primary", true)
    : { data: [] as { product_id: string; image_url: string }[] };
  const imageOf = new Map((imgs ?? []).map((i) => [i.product_id, i.image_url]));

  const catRows = (categories.data ?? []).map((x) => ({
    ...x,
    quantity: num(x.quantity),
    sales: num(x.sales),
  }));
  const catTotal = catRows.reduce((a, x) => a + x.sales, 0);

  return {
    error,
    hasDemo: r.includeDemo && (demoOrders.count ?? 0) > 0,
    sales: {
      rows: fillPeriods(salesRows, r, (period) => ({ period, order_count: 0, sales: 0 })),
      totalSales,
      totalOrders,
      average: totalOrders ? totalSales / totalOrders : 0,
    },
    orders: {
      rows: statusRows,
      total: allOrders,
      cancelled,
      cancelRate: allOrders ? cancelled / allOrders : 0,
    },
    products: bestRows.map((x) => ({ ...x, image_url: imageOf.get(x.product_id) ?? null })),
    customers: {
      top: (customers.data ?? []).map((x) => ({
        ...x,
        order_count: num(x.order_count),
        total_spent: num(x.total_spent),
      })),
      newMembers: newMembers.count ?? 0,
    },
    categories: {
      rows: catRows.map((x) => ({ ...x, share: catTotal ? x.sales / catTotal : 0 })),
      total: catTotal,
    },
  };
}

export type DashboardStats = {
  total_sales: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  pending_payments: number;
  pending_bookings: number;
  new_messages: number;
  low_stock: number;
};

/** ADMIN §4.1 — numbers only from admin_dashboard_stats(); missing → 0, never invented. */
export async function getDashboard(r: ReportRange) {
  const supabase = await createClient();
  const base = { p_from: r.from, p_to: r.to };
  const [stats, sales, cats, status, recent, low, products, redemptions] = await Promise.all([
    supabase.rpc("admin_dashboard_stats", base),
    supabase.rpc("report_sales", { ...base, p_group: r.group }),
    supabase.rpc("report_category_sales", base),
    supabase.rpc("report_order_status", base),
    supabase
      .from("orders")
      .select(
        "id, order_number, status, total_amount, created_at, profiles(full_name), order_items(product_image_url, product_name)",
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("products")
      .select("id, name, sku, stock_quantity, low_stock_threshold")
      .eq("status", "active")
      .order("stock_quantity")
      .limit(50),
    supabase.from("products").select("status"),
    supabase
      .from("reward_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "requested"),
  ]);
  const s = (stats.data ?? {}) as Record<string, unknown>;
  const keys: (keyof DashboardStats)[] = [
    "total_sales",
    "total_orders",
    "total_customers",
    "total_products",
    "pending_payments",
    "pending_bookings",
    "new_messages",
    "low_stock",
  ];
  const statsOut = Object.fromEntries(keys.map((k) => [k, num(s[k])])) as DashboardStats;
  const salesRows = (sales.data ?? []).map((x) => ({
    period: x.period,
    order_count: num(x.order_count),
    sales: num(x.sales),
  }));
  const activeProducts = (products.data ?? []).filter((p) => p.status === "active").length;
  return {
    error: stats.error,
    stats: statsOut,
    products: { active: activeProducts, inactive: (products.data ?? []).length - activeProducts },
    statusRows: (status.data ?? []).map((x) => ({
      status: x.status as OrderStatus,
      order_count: num(x.order_count),
    })),
    sales: fillPeriods(salesRows, r, (period) => ({ period, order_count: 0, sales: 0 })),
    categories: (cats.data ?? []).map((x) => ({ category_name: x.category_name, sales: num(x.sales) })),
    recent: recent.data ?? [],
    lowStock: (low.data ?? []).filter((p) => p.stock_quantity <= p.low_stock_threshold).slice(0, 8),
    redemptions: redemptions.count ?? 0,
  };
}
