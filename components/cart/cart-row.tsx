"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { AlertTriangle, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CartLine } from "@/lib/data/member";
import { removeCartItemAction, updateCartQuantityAction } from "@/lib/actions/cart";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { ProductImage } from "@/components/products/product-image";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** Cart row (UI §8): image 120×120, qty 32×32 with optimistic update + rollback, remove with confirmation. */
export function CartRow({ line }: { line: CartLine }) {
  const [pending, start] = useTransition();
  const [qty, setOptimisticQty] = useOptimistic(line.quantity);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const unavailable = line.productStatus !== "active";
  const short = !unavailable && line.stock < line.quantity;
  const maxQty = Math.min(line.stock, 99);

  const change = (next: number) =>
    start(async () => {
      setOptimisticQty(next);
      const res = await updateCartQuantityAction(line.cartItemId, next);
      if (!res.ok && res.reason === "ERROR") toast.error(res.message); // optimistic value rolls back automatically
    });

  const remove = () =>
    start(async () => {
      const res = await removeCartItemAction(line.cartItemId);
      if (res.ok) toast.success(res.message);
      else if (res.reason === "ERROR") toast.error(res.message);
      setConfirmOpen(false);
    });

  return (
    <li
      className={cn(
        "relative flex gap-4 border-b border-line py-4 last:border-0",
        (unavailable || short) && "rounded-btn border border-warning/50 bg-warning/5 px-3",
        unavailable && "opacity-70",
      )}
    >
      <Link href={`/shop/${line.slug}`} className="shrink-0" tabIndex={-1} aria-hidden>
        <ProductImage
          src={line.imageUrl}
          alt={line.name}
          sizes="120px"
          className="size-20 rounded-btn bg-surface md:size-[120px]"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <div className="min-w-0 flex-1">
          <Link
            href={`/shop/${line.slug}`}
            className="line-clamp-2 pr-10 font-semibold hover:text-brand-accent md:pr-0"
          >
            {line.name}
          </Link>
          <p className="text-sm text-ink-soft">
            {formatTHB(line.effectivePrice)}
            {line.effectivePrice < line.price && (
              <span className="ml-2 text-ink-muted line-through">{formatTHB(line.price)}</span>
            )}
          </p>
          {unavailable && (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-warning">
              <AlertTriangle className="size-4" aria-hidden /> ไม่พร้อมจำหน่าย — กรุณาลบก่อนสั่งซื้อ
            </p>
          )}
          {short && (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-warning">
              <AlertTriangle className="size-4" aria-hidden />
              {line.stock > 0
                ? `สต็อกไม่พอ เหลือ ${line.stock} ชิ้น — กรุณาลดจำนวน`
                : "สินค้าหมด — กรุณาลบออกจากตะกร้า"}
            </p>
          )}
          {!unavailable && !short && line.stock <= 5 && (
            <p className="mt-1 text-xs text-warning">เหลือ {line.stock} ชิ้น</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 md:justify-end">
          <div className="inline-flex items-center rounded-btn border border-line" aria-busy={pending}>
            <button
              type="button"
              aria-label={`ลดจำนวน ${line.name}`}
              disabled={pending || unavailable || qty <= 1}
              onClick={() => change(qty - 1)}
              className="inline-flex size-11 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40 md:size-8"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <output aria-live="polite" className="w-10 text-center font-semibold">
              {qty}
            </output>
            <button
              type="button"
              aria-label={`เพิ่มจำนวน ${line.name}`}
              disabled={pending || unavailable || qty >= maxQty}
              onClick={() => change(qty + 1)}
              className="inline-flex size-11 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40 md:size-8"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
          <p className="text-right font-display font-bold md:w-28">{formatTHB(line.effectivePrice * qty)}</p>
        </div>
      </div>

      <button
        type="button"
        aria-label={`ลบ ${line.name} ออกจากตะกร้า`}
        onClick={() => setConfirmOpen(true)}
        className="absolute top-3 right-0 inline-flex size-10 cursor-pointer items-center justify-center rounded-btn text-ink-muted hover:bg-elevated hover:text-danger md:static md:self-center"
      >
        <Trash2 className="size-5" aria-hidden />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="ลบสินค้านี้ออกจากตะกร้า?"
        description={line.name}
        confirmLabel="ลบสินค้า"
        danger
        loading={pending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={remove}
      />
    </li>
  );
}
