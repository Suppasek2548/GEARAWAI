"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { AlertCircle, Ticket, X } from "lucide-react";
import { placeOrderAction, validateCouponAction, type PlaceOrderState } from "@/lib/actions/checkout";
import type { CartLine } from "@/lib/data/member";
import { formatTHB } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ProductImage } from "@/components/products/product-image";

type Props = {
  lines: CartLine[];
  subtotal: number;
  shipping: { flatFee: number; freeMin: number };
  profile: { fullName: string; phone: string | null; address: string | null };
};

/**
 * S09-F01–F05 Checkout: recipient + address, coupon (validate_coupon), summary, PLACE ORDER.
 * Totals shown here are a preview; place_order() recalculates everything in the database.
 */
export function CheckoutForm({ lines, subtotal, shipping, profile }: Props) {
  const [state, action, placing] = useActionState<PlaceOrderState, FormData>(placeOrderAction, {});
  const [couponInput, setCouponInput] = useState(state.values?.couponCode ?? "");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [checking, startCheck] = useTransition();
  const [address, setAddress] = useState(state.values?.shippingAddress ?? "");
  const fe = state.fieldErrors ?? {};
  const v = state.values;

  const shippingFee = subtotal >= shipping.freeMin ? 0 : shipping.flatFee; // D-04: before coupon
  const discount = coupon?.discount ?? 0;
  const total = subtotal - discount + shippingFee;

  const applyCoupon = () =>
    startCheck(async () => {
      setCouponMsg(null);
      const res = await validateCouponAction(couponInput);
      if (res.valid) {
        setCoupon({ code: res.code, discount: res.discount });
        setCouponInput(res.code);
      } else {
        setCoupon(null);
        setCouponMsg(res.message);
      }
    });

  return (
    <form action={action} noValidate className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
      <section
        aria-labelledby="ship-heading"
        className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6"
      >
        <h2 id="ship-heading" className="font-display text-xl font-semibold">
          ข้อมูลจัดส่ง
        </h2>

        {state.error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-btn border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {state.error}{" "}
              {state.outOfStockSku && (
                <Link href="/cart" className="font-semibold underline">
                  กลับไปที่ตะกร้า
                </Link>
              )}
            </span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="recipientName" label="ชื่อผู้รับ" error={fe.recipientName} required>
            <Input
              id="recipientName"
              name="recipientName"
              autoComplete="name"
              maxLength={100}
              defaultValue={v?.recipientName ?? profile.fullName}
              invalid={Boolean(fe.recipientName)}
              required
            />
          </Field>
          <Field id="recipientPhone" label="เบอร์โทร" error={fe.recipientPhone} required>
            <Input
              id="recipientPhone"
              name="recipientPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={15}
              defaultValue={v?.recipientPhone ?? profile.phone ?? ""}
              invalid={Boolean(fe.recipientPhone)}
              required
            />
          </Field>
        </div>
        <Field id="shippingAddress" label="ที่อยู่จัดส่ง" error={fe.shippingAddress} required>
          <Textarea
            id="shippingAddress"
            name="shippingAddress"
            autoComplete="street-address"
            maxLength={500}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="min-h-28"
            invalid={Boolean(fe.shippingAddress)}
            required
          />
        </Field>
        {profile.address && (
          <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              className="size-[18px] accent-brand-lime"
              checked={address === profile.address}
              onChange={(e) => setAddress(e.target.checked ? profile.address! : "")}
            />
            ใช้ที่อยู่จากโปรไฟล์
          </label>
        )}
        <Field id="note" label="หมายเหตุ (ไม่บังคับ)" error={fe.note}>
          <Input id="note" name="note" maxLength={500} defaultValue={v?.note} invalid={Boolean(fe.note)} />
        </Field>
      </section>

      <aside
        aria-labelledby="sum-heading"
        className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 lg:sticky lg:top-28"
      >
        <h2 id="sum-heading" className="font-display text-xl font-semibold">
          Order Summary
        </h2>
        <ul className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
          {lines.map((l) => (
            <li key={l.cartItemId} className="flex items-center gap-3 text-sm">
              <ProductImage
                src={l.imageUrl}
                alt={l.name}
                sizes="48px"
                className="size-12 shrink-0 rounded-btn bg-canvas"
              />
              <span className="line-clamp-2 flex-1">
                {l.name} <span className="text-ink-muted">×{l.quantity}</span>
              </span>
              <span className="shrink-0 font-semibold">{formatTHB(l.lineTotal)}</span>
            </li>
          ))}
        </ul>

        {/* Coupon — 1 per order (D-03) */}
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <label
            htmlFor="couponCode"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft"
          >
            <Ticket className="size-4" aria-hidden /> คูปองส่วนลด
          </label>
          <div className="flex gap-2">
            <input
              id="couponCode"
              name="couponCode"
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value.toUpperCase());
                setCoupon(null);
                setCouponMsg(null);
              }}
              placeholder="เช่น WELCOME10"
              maxLength={40}
              autoComplete="off"
              aria-invalid={Boolean(couponMsg || fe.couponCode) || undefined}
              className="h-10 min-w-0 flex-1 rounded-btn border border-line bg-canvas px-3 text-sm text-ink uppercase placeholder:text-ink-muted placeholder:normal-case aria-invalid:border-danger"
            />
            {coupon ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setCoupon(null);
                  setCouponInput("");
                }}
                aria-label="นำคูปองออก"
              >
                <X className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={applyCoupon}
                loading={checking}
                disabled={!couponInput.trim()}
              >
                Apply
              </Button>
            )}
          </div>
          {(couponMsg || fe.couponCode) && (
            <p role="alert" className="text-sm text-danger">
              {couponMsg ?? fe.couponCode}
            </p>
          )}
          {coupon && <p className="text-sm text-success">ใช้คูปอง {coupon.code} แล้ว</p>}
        </div>

        <dl className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd>{formatTHB(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Discount</dt>
            <dd className={discount ? "text-success" : ""}>−{formatTHB(discount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Shipping</dt>
            <dd>{shippingFee === 0 ? "ฟรี" : formatTHB(shippingFee)}</dd>
          </div>
          <div className="mt-1 flex justify-between border-t border-line pt-3 text-base font-bold">
            <dt>Total</dt>
            <dd className="font-display text-xl text-brand-lime">{formatTHB(total)}</dd>
          </div>
        </dl>
        <p className="text-xs text-ink-muted">
          ส่งฟรีเมื่อซื้อครบ {formatTHB(shipping.freeMin)} (คิดจากยอดก่อนหักคูปอง) · ราคารวม VAT แล้ว
        </p>

        <Button type="submit" size="lg" loading={placing} className="w-full">
          PLACE ORDER
        </Button>
      </aside>
    </form>
  );
}
