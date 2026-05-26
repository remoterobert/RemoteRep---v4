import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase redirects users here after they click the email verification link.
// We exchange the auth code for a session, then send them on.
export async function GET(request: Request) {
  const { searchParams, origin: urlOrigin } = new URL(request.url);
  // Trust explicit NEXT_PUBLIC_SITE_URL over the internal URL Railway
  // exposes (which is localhost:8080 inside the container).
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? urlOrigin;

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Missing auth code in callback URL.")}`,
  );
}
