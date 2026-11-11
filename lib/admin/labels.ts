/** Shared admin status labels (kept out of page files — Next only allows route exports there). */
export const MESSAGE_STATUS = {
  new: { label: "ใหม่", tone: "warning" },
  read: { label: "อ่านแล้ว", tone: "info" },
  replied: { label: "ตอบแล้ว", tone: "success" },
  archived: { label: "เก็บถาวร", tone: "neutral" },
} as const;
