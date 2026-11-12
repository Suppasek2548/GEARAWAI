import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

/* site_settings keys (DATABASE_DESIGN §4.24) — values come from the DB so Admin edits apply everywhere */

export type StoreInfo = { name: string; slogan: string; tagline: string };
export type HeroBanner = {
  desktop_url: string;
  tablet_url: string;
  mobile_url: string;
  /** Page heading band image (Deals/About/Contact/Categories/Booking) — SPEC 1920×300, D-20 */
  page_banner_url: string;
  cta_label: string;
  cta_href: string;
};
export type StoreContact = {
  phone: string | null;
  email: string | null;
  address: string | null;
  map_embed_url: string | null;
  is_sample: boolean;
};
export type SocialLinks = Partial<Record<"facebook" | "instagram" | "tiktok" | "youtube", string | null>>;
/** history_image_url — Store History image on /about (SPEC system 2: 1200×800), D-21 */
export type AboutContent = { history: string; highlights: string[]; history_image_url: string };
export type PointsRule = { baht_per_point: number };
export type ShippingRule = { flat_fee: number; free_shipping_min: number };
export type PaymentMode = {
  mode: "demo";
  qr_image_url: string;
  bank_sample: { bank: string; account_name: string; account_no: string };
};
export type BookingRule = { time_slots: string[]; max_days_ahead: number; closed_weekdays: number[] };

export type PublicSettings = {
  store_info: StoreInfo;
  hero_banner: HeroBanner;
  store_contact: StoreContact;
  social_links: SocialLinks;
  about_content: AboutContent;
  points_rule: PointsRule;
  shipping_rule: ShippingRule;
  payment_mode: PaymentMode;
  booking_rule: BookingRule;
};

// Safe fallbacks = the approved sample values (D-05) — used only if a row is missing
const DEFAULTS: PublicSettings = {
  store_info: {
    name: "GEARAWAI",
    slogan: "LEVEL UP YOUR GEAR",
    tagline: "Upgrade your setup with premium gaming gear and IT accessories.",
  },
  hero_banner: {
    desktop_url: "",
    tablet_url: "",
    mobile_url: "",
    page_banner_url: "",
    cta_label: "SHOP NOW",
    cta_href: "/shop",
  },
  store_contact: { phone: null, email: null, address: null, map_embed_url: null, is_sample: true },
  social_links: {},
  about_content: { history: "", highlights: [], history_image_url: "" },
  points_rule: { baht_per_point: 100 },
  shipping_rule: { flat_fee: 50, free_shipping_min: 1000 },
  payment_mode: {
    mode: "demo",
    qr_image_url: "",
    bank_sample: { bank: "ธนาคารตัวอย่าง", account_name: "GEARAWAI (DEMO)", account_no: "XXX-X-XXXXX-X" },
  },
  booking_rule: { time_slots: ["10:00", "13:00", "15:00"], max_days_ahead: 30, closed_weekdays: [] },
};

export async function getPublicSettings(): Promise<PublicSettings> {
  const supabase = await createPublicClient();
  const { data } = await supabase.from("site_settings").select("key, value").in("key", Object.keys(DEFAULTS));
  const out: PublicSettings = structuredClone(DEFAULTS);
  for (const row of data ?? []) {
    const key = row.key as keyof PublicSettings;
    if (key in out && row.value && typeof row.value === "object" && !Array.isArray(row.value)) {
      // merge so a partially edited value never drops a field
      (out as Record<string, unknown>)[key] = { ...out[key], ...(row.value as object) };
    }
  }
  return out;
}

export type TeamMember = {
  id: string;
  fullName: string;
  position: string;
  description: string | null;
  imageUrl: string | null;
  isDemo: boolean;
};

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createPublicClient();
  const { data } = await supabase
    .from("team_members")
    .select("id, full_name, position, description, image_url, is_demo")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []).map((t) => ({
    id: t.id,
    fullName: t.full_name,
    position: t.position,
    description: t.description,
    imageUrl: t.image_url,
    isDemo: t.is_demo,
  }));
}

/** Gallery via RPC (R-09) — media_files itself is admin-only. */
export async function getGallery() {
  const supabase = await createPublicClient();
  const { data } = await supabase.rpc("get_public_gallery");
  return data ?? [];
}

/** Only allow https links for social / map embeds coming from settings. */
export function safeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
