import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles email verification callback from Supabase.
 *
 * Supabase can redirect here in two ways:
 * 1. PKCE flow (default): with a `code` parameter that needs to be exchanged
 * 2. Legacy flow: with `token_hash` and `type` parameters
 *
 * After successful verification, redirects to login with a success message.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/login";

  const redirectTo = request.nextUrl.clone();
  redirectTo.searchParams.delete("code");
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("next");

  const supabase = await createClient();

  // PKCE flow: exchange code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Code exchange gelukt - user is nu ingelogd
      // Redirect naar onboarding (voor nieuwe users) of dashboard
      redirectTo.pathname = "/onboarding";
      redirectTo.searchParams.set("verified", "true");
      return NextResponse.redirect(redirectTo);
    }

    console.error("Code exchange error:", error);
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("error", "verification_failed");
    return NextResponse.redirect(redirectTo);
  }

  // Legacy flow: verify OTP token
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Verificatie gelukt!
      if (type === "signup" || type === "email") {
        redirectTo.pathname = "/login";
        redirectTo.searchParams.set("verified", "true");
        return NextResponse.redirect(redirectTo);
      }

      // Voor andere types (bijv. password recovery)
      redirectTo.pathname = next;
      return NextResponse.redirect(redirectTo);
    }

    console.error("Email verification error:", error);
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("error", "verification_failed");
    return NextResponse.redirect(redirectTo);
  }

  // Geen code of token_hash - redirect naar login
  redirectTo.pathname = "/login";
  return NextResponse.redirect(redirectTo);
}
