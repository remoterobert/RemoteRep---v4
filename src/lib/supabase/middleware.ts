import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  IMPERSONATION_COOKIE,
  impersonationCookieOptions,
} from "@/lib/impersonation-cookie";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // No Supabase config — skip session refresh rather than crash every
    // request. The /supabase-check page surfaces the missing env vars.
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the user's auth session if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route protection: redirect unauthenticated users away from protected paths.
  // Public shareable routes (/listings/*, /profiles/*) are deliberately
  // NOT protected — anyone can view a published listing or public profile.
  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/candidates") ||
    pathname.startsWith("/admin") ||
    // NB: "/profile/..." (the owner's own edit page) is protected, but
    // "/profiles/..." (public shareable profiles) deliberately is NOT — so
    // match with a trailing slash, not a bare prefix.
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname.startsWith("/opportunities") ||
    pathname.startsWith("/company") ||
    pathname.startsWith("/chats") ||
    pathname.startsWith("/settings");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "Please sign in to continue.");
    url.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Re-affirm the admin-impersonation marker on every response. Supabase's
  // setAll recreates `supabaseResponse` when it refreshes the session, which
  // drops any cookie not explicitly re-set on the new response — that's why the
  // "Return to admin" banner vanished on refresh while the session survived
  // (the session cookies get re-set every request; this one didn't). Carrying
  // it forward here (with a sliding 1h expiry) keeps impersonation intact.
  const marker = request.cookies.get(IMPERSONATION_COOKIE);
  if (marker) {
    supabaseResponse.cookies.set(
      IMPERSONATION_COOKIE,
      marker.value,
      impersonationCookieOptions(),
    );
  }

  return supabaseResponse;
}
