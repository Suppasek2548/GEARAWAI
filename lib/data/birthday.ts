import "server-only";
import type { CurrentUser } from "@/lib/auth/dal";
import type { BirthdayCardState } from "@/components/dashboard/birthday-card";
import { formatTHB } from "@/lib/utils/format";
import { birthdayState, getMyCoupons, type MyCoupon } from "./loyalty";

export function couponDiscountLabel(
  c: Pick<MyCoupon, "discountType" | "discountValue" | "maxDiscount" | "minOrder">,
) {
  const main =
    c.discountType === "percentage" ? `ส่วนลด ${c.discountValue}%` : `ส่วนลด ${formatTHB(c.discountValue)}`;
  const cap = c.discountType === "percentage" && c.maxDiscount ? ` สูงสุด ${formatTHB(c.maxDiscount)}` : "";
  const min = c.minOrder > 0 ? ` · ขั้นต่ำ ${formatTHB(c.minOrder)}` : "";
  return `${main}${cap}${min}`;
}

/**
 * Which birthday card to show right now (Thai time). Members can only read the coupon template after
 * claiming it (coupons_member_read, R-05), so the discount is shown from the template once claimed.
 */
export async function getBirthdayCard(
  user: CurrentUser,
): Promise<{ state: BirthdayCardState; label: string }> {
  const coupons = await getMyCoupons(); // request-time read before using the clock
  const s = birthdayState(user.birthDate);
  const generic = "รับคูปองส่วนลดพิเศษในเดือนเกิด ปีละ 1 ครั้ง";
  if (!s.hasBirthDate) return { state: { kind: "no-birth-date" }, label: generic };
  // member_coupons only holds birthday coupons (codes BDAYyy-…)
  const mine = coupons.find((c) => c.cycleYear === s.thisYear && c.code.startsWith("BDAY"));
  if (mine) {
    return {
      state: { kind: "claimed", code: mine.code, expiresAt: mine.expiresAt, used: mine.status === "used" },
      label: couponDiscountLabel(mine),
    };
  }
  return { state: s.inBirthMonth ? { kind: "can-claim" } : { kind: "not-birth-month" }, label: generic };
}
