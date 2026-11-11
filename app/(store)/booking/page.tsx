import type { Metadata } from "next";
import { Suspense } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { getPublicSettings } from "@/lib/data/site";
import { getMyProfileForForms } from "@/lib/data/member";
import { getCurrentUser } from "@/lib/auth/dal";
import { thTodayISO } from "@/lib/utils/format";
import { BookingForm } from "@/components/booking/booking-form";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Booking",
  description: "จองบริการประกอบคอมพิวเตอร์ ตรวจเช็กอุปกรณ์ และติดตั้งซอฟต์แวร์",
};

/** S08 Booking — guests can browse services/slots; confirming requires login (UI §14.4). */
export default function BookingPage() {
  return (
    <>
      <PageHeader title="จองบริการ">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Booking" }]} />
      </PageHeader>
      <div className="container-page py-8 md:py-10">
        <Suspense fallback={<Skeleton className="h-[600px]" />}>
          <BookingContent />
        </Suspense>
      </div>
    </>
  );
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function BookingContent() {
  const supabase = await createPublicClient(); // marks the render as request-time before reading the clock
  const [{ data: services }, settings, user] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, description, price, duration_minutes")
      .eq("is_active", true)
      .order("sort_order"),
    getPublicSettings(),
    getCurrentUser(),
  ]);
  const profile = user ? await getMyProfileForForms() : null;
  const today = thTodayISO(); // Thai date, same as th_today() (R-06)
  const rule = settings.booking_rule;

  if (!services?.length) {
    return <p className="text-ink-soft">ยังไม่มีบริการที่เปิดให้จองในขณะนี้</p>;
  }

  return (
    <BookingForm
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: Number(s.price),
        durationMinutes: s.duration_minutes,
      }))}
      today={today}
      maxDate={addDaysISO(today, Number(rule.max_days_ahead) || 30)}
      timeSlots={rule.time_slots}
      closedWeekdays={rule.closed_weekdays ?? []}
      contact={
        user
          ? { name: profile?.full_name ?? user.fullName, phone: profile?.phone ?? "", email: user.email }
          : null
      }
    />
  );
}
