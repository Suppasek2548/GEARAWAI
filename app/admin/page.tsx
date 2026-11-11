import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Admin Dashboard" };

/** S15 placeholder — Dashboard Overview (admin_dashboard_stats) and the 18 menus are built in Phase 5. */
export default function AdminHomePage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="font-display text-2xl font-bold">Dashboard Overview</h1>
      <EmptyState
        icon={LayoutDashboard}
        title="Admin Dashboard"
        description="เข้าสู่ระบบในฐานะผู้ดูแลแล้ว — ภาพรวมยอดขาย คำสั่งซื้อ และเมนูจัดการทั้ง 18 รายการ จะพัฒนาใน Phase 5"
      />
    </div>
  );
}
