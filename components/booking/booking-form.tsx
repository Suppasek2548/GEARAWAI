"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Clock, Wrench } from "lucide-react";
import { toast } from "sonner";
import { createBookingAction, getBookedSlotsAction } from "@/lib/actions/booking";
import { formatTHB, TH_TIME_ZONE } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export type ServiceOption = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
};

type Props = {
  services: ServiceOption[];
  today: string; // YYYY-MM-DD in Thai time (server)
  maxDate: string;
  timeSlots: string[];
  closedWeekdays: number[]; // ISO 1=Mon … 7=Sun
  contact: { name: string; phone: string; email: string } | null; // null = guest
};

function isoWeekday(date: string) {
  const d = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0=Sun
  return d === 0 ? 7 : d;
}

/** Current HH:MM in Thai time — computed on the client after mount only. */
function thNowHHMM() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TH_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** S08 Booking box (700×600): ① service ② date ③ time ④ contact → confirm (UI §14.4). */
export function BookingForm({ services, today, maxDate, timeSlots, closedWeekdays, contact }: Props) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [booked, setBooked] = useState<string[]>([]);
  const [loadingSlots, startSlots] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [nowHHMM, setNowHHMM] = useState<string | null>(null);
  const [fe, setFe] = useState<Record<string, string>>({});
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [note, setNote] = useState("");

  const dateError =
    date && (date < today || date > maxDate)
      ? "เลือกได้ตั้งแต่วันนี้ ถึงล่วงหน้า 30 วัน"
      : date && closedWeekdays.includes(isoWeekday(date))
        ? "ร้านปิดในวันที่เลือก"
        : "";

  const loadSlots = (svc: string, d: string) =>
    startSlots(async () => {
      setBooked(await getBookedSlotsAction(svc, d));
      setNowHHMM(thNowHHMM());
    });

  useEffect(() => {
    if (serviceId && date && !dateError) loadSlots(serviceId, date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, date]);

  const slotDisabled = (s: string) =>
    booked.includes(s) || (date === today && nowHHMM !== null && s <= nowHHMM) || Boolean(dateError) || !date;

  const service = services.find((s) => s.id === serviceId);

  const confirm = () =>
    startSubmit(async () => {
      setFe({});
      const res = await createBookingAction({
        serviceId,
        date,
        timeSlot: slot,
        contactName: name,
        contactPhone: phone,
        contactEmail: email,
        note,
      });
      if (res.ok) {
        toast.success(`จองสำเร็จ เลขที่ ${res.bookingNumber} — รอร้านยืนยัน`);
        router.push("/dashboard/bookings");
        return;
      }
      if (res.reason === "NEED_LOGIN") {
        router.push("/login?redirect=/booking");
        return;
      }
      if (res.reason === "INVALID") {
        setFe(res.fieldErrors);
        return;
      }
      toast.error(res.message);
      if (res.code && res.code.startsWith("SLOT")) {
        setSlot("");
        loadSlots(serviceId, date); // someone just took it — refresh availability
      }
    });

  return (
    <div className="flex flex-col gap-8 rounded-card border border-line bg-surface p-5 md:p-8">
      {/* ① Service */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-display text-lg font-semibold">① เลือกบริการ</legend>
        <div className="grid gap-3 md:grid-cols-3">
          {services.map((s) => (
            <label
              key={s.id}
              className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-card border p-4 transition-colors",
                serviceId === s.id
                  ? "border-brand-lime bg-brand-lime/5"
                  : "border-line hover:border-brand-accent",
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="service"
                  value={s.id}
                  checked={serviceId === s.id}
                  onChange={() => {
                    setServiceId(s.id);
                    setSlot("");
                  }}
                  className="size-[18px] accent-brand-lime"
                />
                <Wrench className="size-5 text-brand-accent" aria-hidden />
                <span className="font-semibold">{s.name}</span>
              </span>
              {s.description && <span className="text-sm text-ink-soft">{s.description}</span>}
              <span className="mt-auto flex items-center justify-between text-sm">
                <span className="font-display font-bold text-brand-lime">{formatTHB(s.price)}</span>
                <span className="inline-flex items-center gap-1 text-ink-muted">
                  <Clock className="size-4" aria-hidden />
                  {s.durationMinutes} นาที
                </span>
              </span>
            </label>
          ))}
        </div>
        {fe.serviceId && <p className="text-sm text-danger">{fe.serviceId}</p>}
        <p className="text-xs text-ink-muted">ชำระค่าบริการที่ร้าน (ไม่ผ่านระบบชำระเงินออนไลน์)</p>
      </fieldset>

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        {/* ② Date */}
        <Field id="booking-date" label="② เลือกวัน" error={dateError || fe.date} required>
          <Input
            id="booking-date"
            type="date"
            min={today}
            max={maxDate}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSlot("");
            }}
            invalid={Boolean(dateError || fe.date)}
          />
        </Field>

        {/* ③ Time */}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium text-ink-soft">
            ③ เลือกเวลา {loadingSlots && <span className="text-ink-muted">(กำลังโหลด…)</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((s) => {
              const disabled = slotDisabled(s);
              const taken = booked.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={disabled || loadingSlots}
                  aria-pressed={slot === s}
                  onClick={() => setSlot(s)}
                  className={cn(
                    "h-11 w-40 cursor-pointer rounded-btn border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    slot === s
                      ? "border-brand-lime bg-brand-lime text-canvas"
                      : "border-line hover:border-brand-accent",
                  )}
                >
                  {s}
                  {taken && " · เต็ม"}
                </button>
              );
            })}
          </div>
          {!date && <p className="text-xs text-ink-muted">เลือกวันก่อนเพื่อดูช่วงเวลาที่ว่าง</p>}
          {fe.timeSlot && <p className="text-sm text-danger">{fe.timeSlot}</p>}
        </fieldset>
      </div>

      {/* ④ Contact */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 font-display text-lg font-semibold">④ ข้อมูลผู้จอง</legend>
        <div className="grid gap-4 md:grid-cols-3">
          <Field id="bk-name" label="ชื่อ" error={fe.contactName} required>
            <Input
              id="bk-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              invalid={Boolean(fe.contactName)}
            />
          </Field>
          <Field id="bk-phone" label="เบอร์โทร" error={fe.contactPhone} required>
            <Input
              id="bk-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={15}
              invalid={Boolean(fe.contactPhone)}
            />
          </Field>
          <Field id="bk-email" label="อีเมล" error={fe.contactEmail} required>
            <Input
              id="bk-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              invalid={Boolean(fe.contactEmail)}
            />
          </Field>
        </div>
        <Field id="bk-note" label="หมายเหตุ (ไม่บังคับ)" error={fe.note}>
          <Input id="bk-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </Field>
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2 text-sm text-ink-soft">
          <CalendarClock className="size-5 text-brand-accent" aria-hidden />
          {service && date && slot ? `${service.name} · ${date} · ${slot} น.` : "เลือกบริการ วัน และเวลาให้ครบ"}
        </p>
        <Button
          size="lg"
          className="sm:w-[180px]"
          loading={submitting}
          disabled={!serviceId || !date || !slot || Boolean(dateError)}
          onClick={confirm}
        >
          {contact ? "ยืนยันการจอง" : "เข้าสู่ระบบเพื่อจอง"}
        </Button>
      </div>
    </div>
  );
}
