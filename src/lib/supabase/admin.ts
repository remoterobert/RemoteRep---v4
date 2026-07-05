import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for privileged server-side operations
 * (impersonation, password resets, admin queries that bypass RLS).
 *
 * NEVER import this into a Client Component. NEVER log the returned
 * client. NEVER expose its results directly to the browser.
 *
 * The key is only present in server-side runtime via Railway's
 * SUPABASE_SERVICE_ROLE_KEY env var; local `npm run build` will
 * succeed even if the env var is missing (calls just throw at
 * runtime).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — admin actions unavailable. Add it in Railway.",
    );
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
