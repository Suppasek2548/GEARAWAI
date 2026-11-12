// D-25 — resolveSiteUrl() unit tests. Run: npm test  (Node's built-in runner, no extra packages;
// Node ≥ 23.6 loads the .ts module directly by stripping its types).
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSiteUrl } from "../lib/auth/site-url.ts";

const PROD = "https://gearawai.vercel.app";
const prod = (extra) => ({ VERCEL_ENV: "production", ...extra });
const local = (extra) => ({ NODE_ENV: "development", ...extra });

const ok = (env, url) =>
  assert.deepEqual(resolveSiteUrl(env), {
    ok: true,
    url,
    env: env.VERCEL_ENV === "production" ? "production" : "local",
  });
const no = (env, reason) => assert.deepEqual(resolveSiteUrl(env), { ok: false, reason });

/* ---------------- Production ---------------- */
test("P1 production SITE_URL exact", () => ok(prod({ SITE_URL: PROD }), PROD));
test("P2 production trailing slash is trimmed", () => ok(prod({ SITE_URL: `${PROD}/` }), PROD));
test("P3 production upper case is normalised", () =>
  ok(prod({ SITE_URL: "HTTPS://GEARAWAI.VERCEL.APP" }), PROD));
test("P4 production falls back to VERCEL_PROJECT_PRODUCTION_URL when SITE_URL is unset", () =>
  ok(prod({ VERCEL_PROJECT_PRODUCTION_URL: "gearawai.vercel.app" }), PROD));
test("P5 production blank SITE_URL counts as unset", () =>
  ok(prod({ SITE_URL: "   ", VERCEL_PROJECT_PRODUCTION_URL: "gearawai.vercel.app" }), PROD));
test("P6 production with neither variable", () => no(prod({}), "SITE_URL_MISSING"));
test("P6b production with blank fallback", () =>
  no(prod({ VERCEL_PROJECT_PRODUCTION_URL: " " }), "SITE_URL_MISSING"));
test("P7 production fallback with another host", () =>
  no(prod({ VERCEL_PROJECT_PRODUCTION_URL: "gearawai-gearawai.vercel.app" }), "HOST_NOT_ALLOWED"));
test("P8 production never uses VERCEL_URL", () =>
  no(prod({ VERCEL_URL: "gearawai.vercel.app" }), "SITE_URL_MISSING"));
test("P9 production invalid SITE_URL does not fall back", () =>
  no(
    prod({ SITE_URL: "https://evil.com", VERCEL_PROJECT_PRODUCTION_URL: "gearawai.vercel.app" }),
    "HOST_NOT_ALLOWED",
  ));
test("P10 production http", () =>
  no(prod({ SITE_URL: "http://gearawai.vercel.app" }), "PROTOCOL_NOT_ALLOWED"));
test("P11 production localhost", () => no(prod({ SITE_URL: "https://localhost:3000" }), "PORT_NOT_ALLOWED"));
test("P11b production localhost without port", () =>
  no(prod({ SITE_URL: "https://localhost" }), "HOST_NOT_ALLOWED"));
test("P12 production deployment URL", () =>
  no(prod({ SITE_URL: "https://gearawai-kvp671g8q-gearawai.vercel.app" }), "HOST_NOT_ALLOWED"));
test("P13 production foreign host", () => no(prod({ SITE_URL: "https://evil.com" }), "HOST_NOT_ALLOWED"));
test("P14 production look-alike suffix", () =>
  no(prod({ SITE_URL: "https://gearawai.vercel.app.evil.com" }), "HOST_NOT_ALLOWED"));
test("P14b production trailing-dot host", () =>
  no(prod({ SITE_URL: "https://gearawai.vercel.app." }), "HOST_NOT_ALLOWED"));
test("P14c production subdomain", () =>
  no(prod({ SITE_URL: "https://x.gearawai.vercel.app" }), "HOST_NOT_ALLOWED"));
test("P15 production userinfo trick", () =>
  no(prod({ SITE_URL: "https://evil.com@gearawai.vercel.app" }), "CREDENTIALS_NOT_ALLOWED"));
test("P16 production user:pass", () =>
  no(prod({ SITE_URL: "https://user:pass@gearawai.vercel.app" }), "CREDENTIALS_NOT_ALLOWED"));
test("P17 production query string", () =>
  no(prod({ SITE_URL: `${PROD}/?next=x` }), "QUERY_OR_HASH_NOT_ALLOWED"));
test("P17b production empty query", () => no(prod({ SITE_URL: `${PROD}/?` }), "QUERY_OR_HASH_NOT_ALLOWED"));
test("P18 production hash", () => no(prod({ SITE_URL: `${PROD}/#x` }), "QUERY_OR_HASH_NOT_ALLOWED"));
test("P19 production path", () => no(prod({ SITE_URL: `${PROD}/auth/callback` }), "PATH_NOT_ALLOWED"));
test("P20 production port", () => no(prod({ SITE_URL: `${PROD}:8443` }), "PORT_NOT_ALLOWED"));
test("P21 production not a URL", () => no(prod({ SITE_URL: "not a url" }), "INVALID_URL"));
test("P21b production bare host", () => no(prod({ SITE_URL: "gearawai.vercel.app" }), "INVALID_URL"));
test("P22 production javascript:", () =>
  no(prod({ SITE_URL: "javascript:alert(1)" }), "PROTOCOL_NOT_ALLOWED"));
test("P23 production backslash trick", () => no(prod({ SITE_URL: "https:\\\\evil.com" }), "INVALID_URL"));
test("P24 fallback cannot smuggle a path or credentials", () => {
  no(prod({ VERCEL_PROJECT_PRODUCTION_URL: "gearawai.vercel.app/x" }), "PATH_NOT_ALLOWED");
  no(prod({ VERCEL_PROJECT_PRODUCTION_URL: "evil.com@gearawai.vercel.app" }), "CREDENTIALS_NOT_ALLOWED");
});

/* ---------------- Preview ---------------- */
test("V1 preview is disabled even with a valid SITE_URL", () =>
  no(
    { VERCEL_ENV: "preview", SITE_URL: PROD, VERCEL_PROJECT_PRODUCTION_URL: "gearawai.vercel.app" },
    "PREVIEW_DISABLED",
  ));
test("V2 preview with no variables", () => no({ VERCEL_ENV: "preview" }, "PREVIEW_DISABLED"));

/* ---------------- Local / development ---------------- */
test("D1 local default", () => ok(local({}), "http://localhost:3000"));
test("D2 local trailing slash", () =>
  ok(local({ SITE_URL: "http://localhost:3000/" }), "http://localhost:3000"));
test("D3 local 127.0.0.1 other port", () =>
  ok(local({ SITE_URL: "http://127.0.0.1:3001" }), "http://127.0.0.1:3001"));
test("D3b `next start` on the machine (NODE_ENV=production, no VERCEL_ENV)", () =>
  ok({ NODE_ENV: "production" }, "http://localhost:3000"));
test("D3c Vercel CLI `vercel dev`", () => ok({ VERCEL_ENV: "development" }, "http://localhost:3000"));
test("D4 local refuses the production URL", () => no(local({ SITE_URL: PROD }), "HOST_NOT_ALLOWED"));
test("D5 local foreign host", () => no(local({ SITE_URL: "http://evil.com" }), "HOST_NOT_ALLOWED"));
test("D6 local path", () => no(local({ SITE_URL: "http://localhost:3000/path" }), "PATH_NOT_ALLOWED"));
test("D7 local query", () =>
  no(local({ SITE_URL: "http://localhost:3000?x=1" }), "QUERY_OR_HASH_NOT_ALLOWED"));
test("D8 local credentials", () =>
  no(local({ SITE_URL: "http://a:b@localhost:3000" }), "CREDENTIALS_NOT_ALLOWED"));
test("D9 local look-alike host", () =>
  no(local({ SITE_URL: "http://localhost.evil.com" }), "HOST_NOT_ALLOWED"));
test("D10 local VERCEL_URL is ignored", () => ok(local({ VERCEL_URL: "evil.com" }), "http://localhost:3000"));

/* ---------------- Unknown ---------------- */
test("U1 unknown VERCEL_ENV", () => no({ VERCEL_ENV: "staging", SITE_URL: PROD }, "UNKNOWN_ENV"));

/* ---------------- Invariant ---------------- */
test("no accepted result ever points outside the allow list", () => {
  const sites = [
    PROD,
    `${PROD}/`,
    "https://evil.com",
    "http://localhost:3000",
    "https://gearawai-gearawai.vercel.app",
    "",
    undefined,
  ];
  const envs = ["production", "preview", "development", "staging", undefined];
  for (const VERCEL_ENV of envs)
    for (const SITE_URL of sites)
      for (const VERCEL_PROJECT_PRODUCTION_URL of ["gearawai.vercel.app", "evil.com", undefined]) {
        const r = resolveSiteUrl({
          VERCEL_ENV,
          SITE_URL,
          VERCEL_PROJECT_PRODUCTION_URL,
          VERCEL_URL: "evil.com",
        });
        if (!r.ok) continue;
        const host = new URL(r.url).hostname;
        if (VERCEL_ENV === "production") assert.equal(r.url, PROD);
        else assert.ok(host === "localhost" || host === "127.0.0.1", `${VERCEL_ENV}: ${r.url}`);
      }
});
