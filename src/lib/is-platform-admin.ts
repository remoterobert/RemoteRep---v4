import { createClient } from "@/lib/supabase/server";

/**
 * Server-side check: does the authenticated user have platform_admin
 * role in any tenant? Returns false when not authenticated.
 *
 * Cheap query but avoid calling in loops; usually called once per
 * request in a layout or page.
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("tenant_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "platform_admin")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) return false;
  return !!data;
}
