import { cookies } from "next/headers";

export const IMPERSONATION_COOKIE = "remoterep.impersonation_original";
const MAX_AGE_SECONDS = 60 * 60; // 1 hour

export type ImpersonationMarker = {
  original_user_id: string;
  original_email: string;
  target_user_id: string;
  target_email: string;
  started_at: string; // ISO
};

export async function readImpersonationMarker(): Promise<ImpersonationMarker | null> {
  const c = await cookies();
  const raw = c.get(IMPERSONATION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ImpersonationMarker;
    // Basic validation
    if (
      typeof parsed.original_user_id === "string" &&
      typeof parsed.target_user_id === "string" &&
      typeof parsed.started_at === "string"
    ) {
      // Expire manually — cookie maxAge should handle this too, but belt +
      // suspenders for stale cookies.
      const started = new Date(parsed.started_at);
      if (Date.now() - started.getTime() > MAX_AGE_SECONDS * 1000) {
        return null;
      }
      return parsed;
    }
  } catch {
    // Malformed cookie — ignore
  }
  return null;
}

export async function writeImpersonationMarker(
  marker: ImpersonationMarker,
): Promise<void> {
  const c = await cookies();
  c.set(IMPERSONATION_COOKIE, JSON.stringify(marker), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearImpersonationMarker(): Promise<void> {
  const c = await cookies();
  c.delete(IMPERSONATION_COOKIE);
}
