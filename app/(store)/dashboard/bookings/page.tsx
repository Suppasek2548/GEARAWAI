import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarClock } from "lucide-react";
import { getMyBookings } from "@/lib/data/member";
import { formatTHB, formatThaiDate } from "@/lib/utils/format";
import { CancelBookingButton } from "@/components/booking/cancel-booking-button";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "My Bookings" };

const STATUS = {
  pending: { label: "รอร้านยืนยัน", tone: "warning" },
  confirmed: { label: "ยืนยันแล้ว", tone: "info" },
  completed: { label: "เสร็จสิ้น", tone: "success" },
  cancelled: { label: "ยกเลิก", tone: "danger" },
} as const;

/** S08-F07 / S14-F07 — own bookings; cancel while pending. */
export default function MyBookingsPage() {
  return (
    <div className="container-page flex flex-col gap-6 py-8 md:py-10">
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Bookings" }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">My Bookings</h1>
        <ButtonLink href="/booking">จองบริการใหม่</ButtonLink>
      </div>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <BookingList />
      </Suspense>
    </div>
  );
}

async function BookingList() {
  const bookings = await getMyBookings();
  if (!bookings.length) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="ยังไม่มีการจองบริการ"
        action={<ButtonLink href="/booking">จองบริการ</ButtonLink>}
      />
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {bookings.map((b) => {
        const s = STATUS[b.status as keyof typeof STATUS];
        return (
          <li
            key={b.id}
            className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="font-mono font-semibold">{b.booking_number}</p>
              <p className="text-sm">{b.services?.name}</p>
              <p className="text-sm text-ink-soft">
                {formatThaiDate(`${b.booking_date}T00:00:00+07:00`, { dateStyle: "full" })} ·{" "}
                {String(b.time_slot).slice(0, 5)} น.
              </p>
              {b.admin_note && <p className="text-xs text-ink-muted">หมายเหตุจากร้าน: {b.admin_note}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink-soft">{formatTHB(b.price_snapshot)} (ชำระที่ร้าน)</span>
              <Badge tone={s.tone}>{s.label}</Badge>
              {b.status === "pending" && (
                <CancelBookingButton bookingId={b.id} bookingNumber={b.booking_number} />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
