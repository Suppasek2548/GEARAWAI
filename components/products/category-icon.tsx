import {
  Armchair,
  Cable,
  Gauge,
  Headphones,
  Keyboard,
  MousePointer2,
  Package,
  Square,
  Video,
  type LucideIcon,
} from "lucide-react";

// UI §1.7 category icons (used until category images 600×600 are uploaded in Phase 5)
const ICONS: Record<string, LucideIcon> = {
  "gaming-mouse": MousePointer2,
  "gaming-keyboard": Keyboard,
  "gaming-headset": Headphones,
  "mouse-pad": Square,
  "gaming-chair": Armchair,
  "racing-wheel": Gauge,
  "streaming-equipment": Video,
  "computer-accessories": Cable,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Package;
  return <Icon className={className} aria-hidden strokeWidth={1.5} />;
}
