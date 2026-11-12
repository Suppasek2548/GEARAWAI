/**
 * D-25 — the one place that decides the site's base URL for Supabase Auth e-mail links (password reset).
 *
 * Pure: the caller passes the environment (normally `process.env`); nothing here reads request headers,
 * so a Host / X-Forwarded-Host value can never end up in an e-mail. No imports, so `node --test` can load
 * this file directly (tests/site-url.test.mjs).
 *
 * Rules
 * - `VERCEL_ENV=production`: only https://gearawai.vercel.app. Source is `SITE_URL`, or — only when
 *   `SITE_URL` is unset/blank — `https://` + `VERCEL_PROJECT_PRODUCTION_URL`. `VERCEL_URL` is never used.
 *   A set-but-invalid `SITE_URL` fails; it does not fall back.
 * - `VERCEL_ENV=preview`: always refused (the PKCE cookie would sit on the preview host while the link
 *   points elsewhere, so the code exchange cannot succeed).
 * - no `VERCEL_ENV` (or Vercel's own `development`): local only — `SITE_URL` or http://localhost:3000,
 *   and the host must be localhost / 127.0.0.1.
 * - any other `VERCEL_ENV`: refused.
 * Every accepted URL is an origin only: no credentials, path, query, hash; production also has no port.
 */

export const PRODUCTION_HOST = "gearawai.vercel.app";
export const LOCAL_DEFAULT_URL = "http://localhost:3000";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

export type SiteUrlFailure =
  | "PREVIEW_DISABLED"
  | "UNKNOWN_ENV"
  | "SITE_URL_MISSING"
  | "INVALID_URL"
  | "PROTOCOL_NOT_ALLOWED"
  | "CREDENTIALS_NOT_ALLOWED"
  | "QUERY_OR_HASH_NOT_ALLOWED"
  | "PATH_NOT_ALLOWED"
  | "PORT_NOT_ALLOWED"
  | "HOST_NOT_ALLOWED";

export type SiteUrlResult =
  { ok: true; url: string; env: "production" | "local" } | { ok: false; reason: SiteUrlFailure };

type Env = Readonly<Record<string, string | undefined>>;

const fail = (reason: SiteUrlFailure): SiteUrlResult => ({ ok: false, reason });

/** Blank or whitespace-only counts as "not set". */
function read(env: Env, name: string): string | undefined {
  const v = env[name]?.trim();
  return v ? v : undefined;
}

/** Checks one candidate and returns its origin (no trailing slash). */
function check(raw: string, mode: "production" | "local"): SiteUrlResult {
  // Reject characters a plain origin never needs before parsing, so URL normalisation cannot hide them
  // (e.g. "https://gearawai.vercel.app/?" parses with an empty search, "user@" with an empty username).
  if (/[\s@?#\\]/.test(raw)) {
    if (raw.includes("@")) return fail("CREDENTIALS_NOT_ALLOWED");
    if (raw.includes("?") || raw.includes("#")) return fail("QUERY_OR_HASH_NOT_ALLOWED");
    return fail("INVALID_URL");
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return fail("INVALID_URL");
  }

  const protocolOk = mode === "production" ? url.protocol === "https:" : /^https?:$/.test(url.protocol);
  if (!protocolOk) return fail("PROTOCOL_NOT_ALLOWED");
  if (url.username || url.password) return fail("CREDENTIALS_NOT_ALLOWED");
  if (url.search || url.hash) return fail("QUERY_OR_HASH_NOT_ALLOWED");
  if (url.pathname !== "/") return fail("PATH_NOT_ALLOWED");

  if (mode === "production") {
    if (url.port) return fail("PORT_NOT_ALLOWED");
    if (url.hostname !== PRODUCTION_HOST) return fail("HOST_NOT_ALLOWED");
  } else if (!LOCAL_HOSTS.has(url.hostname)) {
    return fail("HOST_NOT_ALLOWED");
  }

  return { ok: true, url: url.origin, env: mode };
}

export function resolveSiteUrl(env: Env): SiteUrlResult {
  const vercelEnv = read(env, "VERCEL_ENV");

  if (vercelEnv === "preview") return fail("PREVIEW_DISABLED");

  if (vercelEnv === "production") {
    const siteUrl = read(env, "SITE_URL");
    if (siteUrl) return check(siteUrl, "production"); // set → must be valid itself, no fallback
    const productionHost = read(env, "VERCEL_PROJECT_PRODUCTION_URL");
    if (!productionHost) return fail("SITE_URL_MISSING");
    return check(`https://${productionHost}`, "production");
  }

  if (vercelEnv === undefined || vercelEnv === "development") {
    return check(read(env, "SITE_URL") ?? LOCAL_DEFAULT_URL, "local");
  }

  return fail("UNKNOWN_ENV");
}
