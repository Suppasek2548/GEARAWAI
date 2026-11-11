"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setPromotionProductsAction } from "@/lib/actions/admin-marketing";
import { formatTHB } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";

type P = {
  id: string;
  name: string;
  sku: string;
  price: number;
  sale_price: number | null;
  category: string;
};

/** S19-F07 — choose participating products; shows price before/after and warns when sale_price is lower (rule 6.2). */
export function PromotionProducts({
  promotionId,
  products,
  selected,
  discountType,
  discountValue,
}: {
  promotionId: string;
  products: P[];
  selected: string[];
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
}) {
  const router = useRouter();
  const [chosen, setChosen] = useState(new Set(selected));
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();

  // Preview only — the real price is always calc_effective_price() in the database (R-12)
  const promoPrice = (p: P) =>
    discountType === "percentage"
      ? Math.round(p.price * (1 - discountValue / 100) * 100) / 100
      : Math.max(p.price - discountValue, 0);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        !t ||
        p.name.toLowerCase().includes(t) ||
        p.sku.toLowerCase().includes(t) ||
        p.category.toLowerCase().includes(t),
    );
  }, [products, q]);

  const toggle = (id: string) => {
    const n = new Set(chosen);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setChosen(n);
  };

  return (
    <section
      id="products"
      aria-labelledby="pp-heading"
      className="flex scroll-mt-24 flex-col gap-3 rounded-card border border-line bg-surface p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="pp-heading" className="font-display text-lg font-semibold">
          สินค้าที่เข้าร่วม ({chosen.size})
        </h2>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาชื่อ / SKU / หมวด"
            aria-label="ค้นหาสินค้า"
            className="h-10 w-56 rounded-btn border border-line bg-canvas px-3 text-sm"
          />
          <Button
            size="md"
            variant="outline"
            onClick={() => setChosen(new Set([...chosen, ...list.map((p) => p.id)]))}
          >
            เลือกทั้งหมดที่แสดง
          </Button>
        </div>
      </div>
      <ul className="grid max-h-[420px] gap-1 overflow-y-auto">
        {list.map((p) => {
          const after = promoPrice(p);
          const saleLower = p.sale_price !== null && p.sale_price <= after;
          const fixedTooBig = discountType === "fixed_amount" && discountValue >= p.price;
          return (
            <li key={p.id}>
              <label className="flex cursor-pointer flex-wrap items-center gap-3 rounded-btn px-2 py-2 text-sm hover:bg-elevated">
                <input
                  type="checkbox"
                  checked={chosen.has(p.id)}
                  onChange={() => toggle(p.id)}
                  className="size-[18px] accent-brand-lime"
                />
                <span className="font-mono text-xs text-ink-muted">{p.sku}</span>
                <span className="flex-1">{p.name}</span>
                <span className="text-ink-soft">
                  {formatTHB(p.price)} → <strong className="text-brand-lime">{formatTHB(after)}</strong>
                </span>
                {saleLower && (
                  <span className="text-xs text-warning">
                    มี sale_price {formatTHB(p.sale_price)} ต่ำกว่าอยู่แล้ว (ระบบใช้ราคาต่ำสุด)
                  </span>
                )}
                {fixedTooBig && <span className="text-xs text-danger">ส่วนลดมากกว่าราคาสินค้า</span>}
              </label>
            </li>
          );
        })}
      </ul>
      <Button
        className="self-start"
        loading={pending}
        onClick={() =>
          start(async () => {
            const res = await setPromotionProductsAction(promotionId, [...chosen]);
            if (res.ok) {
              toast.success(res.message);
              router.refresh();
            } else toast.error(res.message);
          })
        }
      >
        บันทึกสินค้าที่เข้าร่วม
      </Button>
    </section>
  );
}
