import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE, RECOVERY_COOKIE_MAX_AGE } from "@/lib/auth/recovery";
import { safeRedirectPath } from "@/lib/utils/redirect";

/**
 * Supabase Auth e-mail link landing (PKCE). Used by the password-reset e-mail:
 *   resetPasswordForEmail(…, { redirectTo: "<origin>/auth/callback?next=/reset-password" })
 * Supabase verifies the link, then redirects here with ?code=… (or ?error=… when the link is
 * expired/invalid). We exchange the code for a session and mark it as a recovery session.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeRedirectPath(searchParams.get("next"), "/login");
  const isRecovery = next === "/reset-password";
  const fail = (reason: "expired" | "invalid") =>
    NextResponse.redirect(new URL(isRecovery ? `/reset-password?error=${reason}` : "/login", origin));

  // Supabase reports a bad link as ?error=access_denied&error_code=otp_expired …
  const errorCode = searchParams.get("error_code") ?? searchParams.get("error");
  if (errorCode) return fail(/expired/i.test(errorCode) ? "expired" : "invalid");

  const code = searchParams.get("code");
  if (!code) return fail("invalid");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  // e.g. code already used, expired, or the PKCE verifier cookie is missing (link opened in another browser)
  if (error || !data.user) return fail(/expired/i.test(error?.message ?? "") ? "expired" : "invalid");

  const response = NextResponse.redirect(new URL(next, origin));
  if (isRecovery) {
    response.cookies.set(RECOVERY_COOKIE, data.user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: RECOVERY_COOKIE_MAX_AGE,
    });
  }
  return response;
}
