"use client";

import { useEffect, useState } from "react";

/** Time left until a promotion ends. Rendered only after mount to avoid server/client time mismatch. */
export function Countdown({ endAt }: { endAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return null;
  const ms = Date.parse(endAt) - now;
  if (ms <= 0) return <span className="text-danger">· หมดเวลาแล้ว</span>;
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return (
    <span className="font-semibold text-brand-lime">
      · เหลือ {days > 0 ? `${days} วัน ` : ""}
      {hours} ชม. {mins} นาที
    </span>
  );
}
