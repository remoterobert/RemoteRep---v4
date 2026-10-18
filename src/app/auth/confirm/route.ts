import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Password-reset links (src/lib/password-reset.ts) land here. We verify the
// one-time token server-side, which signs the user in, then send them on to
// choose a new password. Works on any device — no PKCE cookie needed.
export async function GET(request: Request) {
  const { searchParams, origin: urlOrigin } = new URL(request.url);
  // Trust explicit NEXT_PUBLIC_SITE_URL over the internal URL Railway
  // exposes (which is localhost:8080 inside the container).
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? urlOrigin;

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";
  // Only ever redirect within this site.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/forgot-password?error=${encodeURIComponent(
      "That reset link has expired or was already used. Enter your email to get a new one.",
    )}`,
  );
}
