import { headers } from "next/headers";

/** Canonical site origin for links in emails and auth redirects. */
export async function getSiteOrigin(): Promise<string> {
  // Prefer explicit env var — most reliable, especially on Railway where
  // x-forwarded-host isn't consistently set.
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Fallback: try headers.
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
