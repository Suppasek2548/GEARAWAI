/**
 * Translate fixed database error codes into Thai messages (UI_UX_DESIGN §15.1, DATABASE_DESIGN §5.6).
 * Never show raw database errors to users.
 */
const MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "กรุณาเข้าสู่ระบบ",
  ACCOUNT_SUSPENDED: "บัญชีของคุณถูกระงับชั่วคราว กรุณาติดต่อร้าน",
  CART_EMPTY: "ตะกร้าสินค้าว่าง",
  OUT_OF_STOCK: "สินค้ามีไม่พอหรือไม่พร้อมจำหน่าย",
  COUPON_INVALID_CODE: "รหัสคูปองไม่ถูกต้อง",
  INVALID_CODE: "รหัสคูปองไม่ถูกต้อง",
  COUPON_EXPIRED: "คูปองนี้ไม่อยู่ในช่วงใช้งาน",
  COUPON_NOT_STARTED: "คูปองนี้ไม่อยู่ในช่วงใช้งาน",
  COUPON_INACTIVE: "คูปองนี้ไม่อยู่ในช่วงใช้งาน",
  COUPON_BELOW_MIN_ORDER: "ยอดสั่งซื้อไม่ถึงขั้นต่ำของคูปอง",
  COUPON_PER_USER_LIMIT_REACHED: "คุณใช้คูปองนี้ครบสิทธิ์แล้ว",
  COUPON_ALREADY_USED: "คุณใช้คูปองนี้ครบสิทธิ์แล้ว",
  COUPON_USAGE_LIMIT_REACHED: "คูปองถูกใช้ครบจำนวนแล้ว",
  INSUFFICIENT_POINTS: "คะแนนสะสมไม่พอ",
  REWARD_OUT_OF_STOCK: "ของรางวัลหมดหรือปิดให้แลกชั่วคราว",
  REWARD_UNAVAILABLE: "ของรางวัลหมดหรือปิดให้แลกชั่วคราว",
  NOT_BIRTHDAY_MONTH: "ยังไม่ถึงเดือนเกิด",
  BIRTH_DATE_REQUIRED: "กรุณาเพิ่มวันเกิด",
  ALREADY_CLAIMED: "รับสิทธิ์ปีนี้แล้ว",
  BIRTH_DATE_LOCKED: "แก้ไขวันเกิดครบสิทธิ์แล้ว กรุณาติดต่อร้าน",
  INVALID_BIRTH_DATE: "วันเกิดไม่ถูกต้อง",
  SLOT_TAKEN: "ช่วงเวลานี้เพิ่งถูกจอง กรุณาเลือกเวลาอื่น",
  SLOT_IN_PAST: "ช่วงเวลานี้ผ่านไปแล้ว กรุณาเลือกใหม่",
  DATE_IN_PAST: "ไม่สามารถจองวันที่ผ่านมาแล้ว",
  DATE_TOO_FAR: "วันที่เลือกเกินช่วงที่เปิดให้จอง",
  CLOSED_DAY: "ร้านปิดในวันที่เลือก",
  INVALID_TIME_SLOT: "ช่วงเวลาไม่ถูกต้อง กรุณาเลือกใหม่",
  BOOKING_NOT_CANCELLABLE: "รายการนี้ยกเลิกไม่ได้ในสถานะปัจจุบัน",
  INVALID_ORDER_STATUS: "รายการนี้ยกเลิกไม่ได้ในสถานะปัจจุบัน",
  INVALID_TRANSITION: "เปลี่ยนสถานะนี้ไม่ได้",
  RATE_LIMITED: "ส่งข้อความบ่อยเกินไป กรุณารอสักครู่",
  FORBIDDEN: "คุณไม่มีสิทธิ์ทำรายการนี้",
  CANNOT_CHANGE_SELF: "ไม่สามารถเปลี่ยนสถานะบัญชีของตนเองได้",
  LAST_ADMIN: "ไม่สามารถระงับผู้ดูแลระบบคนสุดท้ายได้",
  COUPON_NO_CODE: "กรุณากรอกรหัสคูปอง",
  ORDER_NOT_FOUND: "ไม่พบคำสั่งซื้อ",
  INVALID_SLIP_PATH: "ไฟล์สลิปไม่ถูกต้อง กรุณาอัปโหลดใหม่",
  REASON_REQUIRED: "กรุณาระบุเหตุผล",
  SERVICE_UNAVAILABLE: "บริการนี้ปิดให้จองชั่วคราว",
  PAYMENT_NOT_FOUND: "ไม่พบรายการแจ้งชำระ",
  INVALID_PAYMENT_STATUS: "รายการแจ้งชำระนี้ถูกตรวจสอบไปแล้ว",
  BIRTHDAY_COUPON_UNAVAILABLE: "สิทธิพิเศษวันเกิดปิดให้บริการชั่วคราว",
};

export const GENERIC_ERROR = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

/** Extract the leading code from messages like "OUT_OF_STOCK:GA-MS-001". */
export function errorCode(message: string | null | undefined): string | null {
  if (!message) return null;
  const m = message.match(/^([A-Z_]+)(?::|$)/);
  return m ? m[1] : null;
}

export function toThaiError(error: { message?: string; code?: string } | string | null | undefined): string {
  if (!error) return GENERIC_ERROR;
  const message = typeof error === "string" ? error : (error.message ?? "");
  if (typeof error !== "string" && error.code === "42501") return MESSAGES.FORBIDDEN; // permission denied
  if (/permission denied/i.test(message)) return MESSAGES.FORBIDDEN;
  const code = errorCode(message);
  return (code && MESSAGES[code]) || GENERIC_ERROR;
}
