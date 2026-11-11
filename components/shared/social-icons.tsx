import type { SocialLinks } from "@/lib/data/site";
import { safeHttpsUrl } from "@/lib/data/site";

// Lucide 1.x removed brand logos, so these are minimal inline marks (32×32 slot, SPEC system 13).
const PATHS: Record<keyof SocialLinks, { label: string; d: string }> = {
  facebook: {
    label: "Facebook",
    d: "M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H7v4h2v9h4v-9h3l1-4h-4V9c0-.6.4-1 1-1z",
  },
  instagram: {
    label: "Instagram",
    d: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.5-1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  },
  tiktok: {
    label: "TikTok",
    d: "M16 3c.4 2.3 1.9 3.8 4 4v3.2c-1.5 0-2.9-.4-4-1.2V15a6 6 0 1 1-6-6v3.3a2.7 2.7 0 1 0 2.7 2.7V3H16z",
  },
  youtube: {
    label: "YouTube",
    d: "M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8zM10 15V9l5.2 3L10 15z",
  },
};

/** Renders only the networks that have a valid https link (icons without a link are hidden — UI §13.2). */
export function SocialIcons({ links }: { links: SocialLinks }) {
  const items = (Object.keys(PATHS) as (keyof SocialLinks)[])
    .map((k) => ({ key: k, url: safeHttpsUrl(links[k]), ...PATHS[k] }))
    .filter((i) => i.url);
  if (!items.length) return null;
  return (
    <ul className="flex gap-2">
      {items.map((i) => (
        <li key={i.key}>
          <a
            href={i.url!}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={i.label}
            className="inline-flex size-11 items-center justify-center rounded-btn border border-line text-ink-soft hover:border-brand-accent hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
              <path d={i.d} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
