import type { z } from "zod";

/** Result shape shared by every admin form Server Action (used by EntityForm). */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string | number | boolean | null | Record<string, string> | undefined>;
  redirect?: string;
};

/** FormData → plain object; "on"/"off" checkboxes become booleans; the last value wins for duplicated names. */
export function formToObject(fd: FormData): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("$ACTION")) continue;
    const s = String(v);
    out[k] = s === "on" ? true : s === "off" ? false : s;
  }
  return out;
}

export function zodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) {
    const k = String(i.path[0] ?? "form");
    out[k] ??= i.message;
  }
  return out;
}

/** Empty string → null for optional DB columns. */
export const nullIfEmpty = (s: string | undefined | null) => (s && s.trim() ? s.trim() : null);

/** <input type="datetime-local"> (Thai time) ↔ ISO timestamptz */
export function localToIso(v: string): string | null {
  if (!v) return null;
  return new Date(`${v.length === 16 ? `${v}:00` : v}+07:00`).toISOString();
}
/** Start of a Thai calendar day (YYYY-MM-DD, +addDays) as ISO — for created_at range filters. */
export function localDayToIso(day: string, addDays = 0): string {
  const d = new Date(`${day}T00:00:00+07:00`);
  d.setUTCDate(d.getUTCDate() + addDays);
  return d.toISOString();
}
export function isoToLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 7 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

/** Computed promotion state (ADMIN §4.12) — evaluated at request time on the server. */
export function promotionState(
  p: { is_active: boolean; start_at: string; end_at: string },
  now: number = Date.now(),
) {
  if (!p.is_active) return { label: "ปิดอยู่", tone: "neutral" as const };
  if (now < Date.parse(p.start_at)) return { label: "ตั้งเวลาไว้", tone: "info" as const };
  if (now >= Date.parse(p.end_at)) return { label: "หมดอายุ", tone: "danger" as const };
  return { label: "กำลังใช้งาน", tone: "success" as const };
}
