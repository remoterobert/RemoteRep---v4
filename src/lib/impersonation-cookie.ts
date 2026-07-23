// Cookie name + options for the admin-impersonation marker, split out with NO
// `next/headers` dependency so the middleware/proxy (edge-safe) can import them
// alongside the server-only helpers in ./impersonation.ts.

export const IMPERSONATION_COOKIE = "remoterep.impersonation_original";
export const IMPERSONATION_MAX_AGE_SECONDS = 60 * 60; // 1 hour

export function impersonationCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: IMPERSONATION_MAX_AGE_SECONDS,
    path: "/",
  };
}
