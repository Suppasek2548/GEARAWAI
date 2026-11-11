// Main menu — SPEC §6 Frontend (6 items incl. Contact Us, SYSTEM_ANALYSIS C3)
export const MAIN_NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/deals", label: "Deals" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
] as const;

// PRODUCT_DATA §1 — used by the mega menu / drawer / footer before the DB-driven list exists (Phase 2)
export const CATEGORY_LINKS = [
  { slug: "gaming-mouse", label: "Gaming Mouse" },
  { slug: "gaming-keyboard", label: "Gaming Keyboard" },
  { slug: "gaming-headset", label: "Gaming Headset" },
  { slug: "mouse-pad", label: "Mouse Pad" },
  { slug: "gaming-chair", label: "Gaming Chair" },
  { slug: "racing-wheel", label: "Racing Wheel" },
  { slug: "streaming-equipment", label: "Streaming Equipment" },
  { slug: "computer-accessories", label: "Computer Accessories" },
] as const;

export type HeaderUser = {
  fullName: string;
  isAdmin: boolean;
  cartCount: number;
  wishlistCount: number;
} | null;
