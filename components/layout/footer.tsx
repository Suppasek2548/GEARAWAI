import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Logo } from "./logo";
import { CATEGORY_LINKS } from "./nav-items";

/**
 * Global footer (UI §2.3). Contact values are the approved SAMPLE values from site_settings.store_contact
 * (M07) — Phase 2 will read them from the database so Admin edits show up here.
 */
export function Footer() {
  const heading = "mb-3 font-display text-sm font-semibold tracking-wider text-ink uppercase";
  const link = "text-sm text-ink-soft hover:text-ink";
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="container-page grid gap-8 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-ink-soft">
            ร้านค้าออนไลน์อุปกรณ์ Gaming Gear และอุปกรณ์ IT — ค้นหา เปรียบเทียบ และเลือกซื้อได้สะดวก
          </p>
        </div>

        <div>
          <h2 className={heading}>Shop</h2>
          <ul className="grid gap-2">
            {CATEGORY_LINKS.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className={link}>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={heading}>Customer</h2>
          <ul className="grid gap-2">
            <li>
              <Link href="/dashboard" className={link}>
                Account
              </Link>
            </li>
            <li>
              <Link href="/dashboard/orders" className={link}>
                Orders
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className={link}>
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/booking" className={link}>
                Booking
              </Link>
            </li>
            <li>
              <Link href="/dashboard/rewards" className={link}>
                Rewards
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className={heading}>Contact</h2>
          <ul className="grid gap-2">
            <li>
              <a href="tel:0000000000" className={`${link} inline-flex items-center gap-2`}>
                <Phone className="size-4" aria-hidden /> 000-000-0000
              </a>
            </li>
            <li>
              <a href="mailto:contact@example.com" className={`${link} inline-flex items-center gap-2`}>
                <Mail className="size-4" aria-hidden /> contact@example.com
              </a>
            </li>
            <li className="text-xs text-ink-muted">ⓘ ข้อมูลติดต่อเป็นข้อมูลตัวอย่าง</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-1 py-4 text-xs text-ink-muted md:flex-row md:justify-between">
          <p>© GEARAWAI — โครงงานเพื่อการศึกษา · ระบบชำระเงินเป็นระบบจำลอง</p>
          <p>ราคาและข้อมูลสินค้าเป็นข้อมูลตัวอย่างสำหรับโครงงานการศึกษา</p>
        </div>
      </div>
    </footer>
  );
}
