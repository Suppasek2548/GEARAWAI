import Link from "next/link";
import { Suspense } from "react";
import { Mail, Phone } from "lucide-react";
import { getPublicSettings } from "@/lib/data/site";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { SocialIcons } from "@/components/shared/social-icons";
import { Skeleton } from "@/components/ui/misc";
import { Logo } from "./logo";
import { CATEGORY_LINKS } from "./nav-items";

/** Global footer (UI §2.3). Contact column reads site_settings.store_contact / social_links (S13). */
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
          <Suspense fallback={<Skeleton className="h-16 w-48" />}>
            <FooterContact />
          </Suspense>
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

async function FooterContact() {
  if (!hasSupabaseEnv()) return null;
  const { store_contact: c, social_links } = await getPublicSettings();
  const link = "inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink";
  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-2">
        {c.phone && (
          <li>
            <a href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`} className={link}>
              <Phone className="size-4" aria-hidden /> {c.phone}
            </a>
          </li>
        )}
        {c.email && (
          <li>
            <a href={`mailto:${c.email}`} className={`${link} break-all`}>
              <Mail className="size-4 shrink-0" aria-hidden /> {c.email}
            </a>
          </li>
        )}
        {c.is_sample && <li className="text-xs text-ink-muted">ⓘ ข้อมูลติดต่อเป็นข้อมูลตัวอย่าง</li>}
      </ul>
      <SocialIcons links={social_links} />
    </div>
  );
}
