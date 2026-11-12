import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Info, ShoppingCart } from "lucide-react";
import { getMyCart } from "@/lib/data/member";
import { getPublicSettings } from "@/lib/data/site";
import { formatTHB } from "@/lib/utils/format";
import { CartRow } from "@/components/cart/cart-row";
import { StickyCheckoutBar } from "@/components/cart/sticky-checkout-bar";
import { PendingPaymentReminder } from "@/components/orders/pending-payment-reminder";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Shopping Cart" };

/** S07 Shopping Cart — member only (proxy redirects guests to /login?redirect=/cart). */
export default function CartPage() {
  return (
    <div className="container-page flex flex-col gap-6 py-8 pb-28 md:py-10 lg:pb-10">
      {/* the cart is emptied when an order is placed — point back to orders still waiting for payment */}
      <PendingPaymentReminder />
      <Suspense fallback={<CartSkeleton />}>
        <CartContent />
      </Suspense>
    </div>
  );
}

async function CartContent() {
  const [lines, settings] = await Promise.all([getMyCart(), getPublicSettings()]);
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);

  if (!lines.length) {
    return (
      <>
        <h1 className="font-display text-3xl font-bold">Shopping Cart</h1>
        <EmptyState
          icon={ShoppingCart}
          title="ยังไม่มีสินค้าในตะกร้า"
          description="เลือกดู Gaming Gear และอุปกรณ์ IT ได้ที่หน้าร้าน"
          action={<ButtonLink href="/shop">เลือกซื้อสินค้า</ButtonLink>}
        />
      </>
    );
  }

  // Display only — the real totals are calculated in place_order() (S09-F04, D-04)
  const purchasable = lines.filter((l) => l.isPurchasable);
  const subtotal = purchasable.reduce((s, l) => s + l.lineTotal, 0);
  const { flat_fee, free_shipping_min } = settings.shipping_rule;
  const shipping = subtotal >= Number(free_shipping_min) ? 0 : Number(flat_fee);
  const blocked = purchasable.length !== lines.length;
  const toFree = Number(free_shipping_min) - subtotal;

  return (
    <>
      <h1 className="font-display text-3xl font-bold">
        Shopping Cart <span className="text-lg text-ink-soft">({itemCount} ชิ้น)</span>
      </h1>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section
          aria-label="รายการสินค้าในตะกร้า"
          className="min-w-0 rounded-card border border-line bg-surface px-4 md:px-6"
        >
          <ul>
            {lines.map((l) => (
              <CartRow key={l.cartItemId} line={l} />
            ))}
          </ul>
          <div className="border-t border-line py-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm text-brand-accent hover:underline"
            >
              <ArrowLeft className="size-4" aria-hidden /> Continue Shopping
            </Link>
          </div>
        </section>

        <aside
          aria-label="สรุปยอด"
          className="flex flex-col gap-3 rounded-card border border-line bg-surface p-6 lg:sticky lg:top-28"
        >
          <h2 className="font-display text-xl font-semibold">Order Summary</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd>{formatTHB(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping*</dt>
              <dd>{shipping === 0 ? "ฟรี" : formatTHB(shipping)}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="font-display text-brand-lime">{formatTHB(subtotal + shipping)}</dd>
            </div>
          </dl>
          {toFree > 0 && <p className="text-xs text-ink-soft">ซื้อเพิ่มอีก {formatTHB(toFree)} เพื่อรับสิทธิ์ส่งฟรี</p>}
          <p className="text-xs text-ink-muted">*คำนวณจริงที่ Checkout · มีคูปอง? ใส่ได้ที่หน้า Checkout</p>
          {blocked && (
            <p role="alert" className="flex gap-2 text-sm text-warning">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              มีสินค้าที่ไม่พร้อมจำหน่ายหรือสต็อกไม่พอ กรุณาแก้ไขรายการที่ไฮไลต์ก่อน Checkout
            </p>
          )}
          <div id="cart-summary-checkout">
            <CheckoutButton disabled={blocked} />
          </div>
        </aside>
      </div>

      {/* Mobile sticky bar (UI §8.3) — hides while the summary's CHECKOUT above is on screen */}
      <StickyCheckoutBar targetId="cart-summary-checkout">
        <div>
          <p className="text-xs text-ink-soft">Total</p>
          <p className="font-display text-lg font-bold text-brand-lime">{formatTHB(subtotal + shipping)}</p>
        </div>
        <CheckoutButton disabled={blocked} compact />
      </StickyCheckoutBar>
    </>
  );
}

function CheckoutButton({ disabled, compact = false }: { disabled: boolean; compact?: boolean }) {
  return (
    <ButtonLink
      href="/checkout"
      size="lg"
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={compact ? "px-8" : "w-full"}
    >
      CHECKOUT
    </ButtonLink>
  );
}

function CartSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-80" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
