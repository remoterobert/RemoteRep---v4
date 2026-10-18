import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  UTM_COOKIE,
  UTM_COOKIE_MAX_AGE,
  hasUtm,
  pickUtm,
} from "@/lib/utm";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  // Remember the UTMs of the latest tagged visit so signups that finish later
  // in the app can still be attributed in GHL (see src/lib/utm.ts). Shared
  // across remoterep.com and app.remoterep.com.
  const utm = pickUtm((k) => request.nextUrl.searchParams.get(k));
  if (hasUtm(utm)) {
    const host = request.nextUrl.hostname;
    response.cookies.set(UTM_COOKIE, JSON.stringify(utm), {
      maxAge: UTM_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      httpOnly: true,
      ...(host.endsWith("remoterep.com") ? { domain: ".remoterep.com" } : {}),
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all paths EXCEPT Next.js internals and static asset extensions.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
