"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

/** Description / Specifications tabs (UI §7.1) — keyboard: Left/Right arrows switch tabs. */
export function ProductTabs({
  description,
  specifications,
}: {
  description: string | null;
  specifications: Record<string, string>;
}) {
  const tabs = [
    { id: "description", label: "Description" },
    { id: "specifications", label: "Specifications" },
  ] as const;
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("description");
  const specs = Object.entries(specifications);

  return (
    <section className="rounded-card border border-line bg-surface">
      <div
        role="tablist"
        aria-label="รายละเอียดสินค้า"
        className="flex border-b border-line"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            setActive((a) => (a === "description" ? "specifications" : "description"));
          }
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            className={cn(
              "relative h-12 flex-1 cursor-pointer px-4 font-display font-semibold sm:flex-none",
              active === t.id ? "text-ink" : "text-ink-muted hover:text-ink",
              active === t.id &&
                "after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-brand-lime",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        id="panel-description"
        role="tabpanel"
        aria-labelledby="tab-description"
        hidden={active !== "description"}
        className="p-5 leading-relaxed text-ink-soft md:p-6"
      >
        {description || "ยังไม่มีรายละเอียดสินค้า"}
      </div>

      <div
        id="panel-specifications"
        role="tabpanel"
        aria-labelledby="tab-specifications"
        hidden={active !== "specifications"}
        className="p-5 md:p-6"
      >
        {specs.length ? (
          <table className="w-full text-sm">
            <tbody>
              {specs.map(([k, v]) => (
                <tr key={k} className="border-b border-line last:border-0">
                  <th scope="row" className="w-2/5 py-3 pr-4 text-left align-top font-medium text-ink-soft">
                    {k}
                  </th>
                  <td className="py-3 text-ink">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-ink-soft">ยังไม่มีข้อมูลคุณสมบัติ</p>
        )}
      </div>
    </section>
  );
}
