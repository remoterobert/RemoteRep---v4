import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The app lives at app.remoterep.com; the public marketing site is separate
// (remoterep.com). So the app root has no landing page of its own — send
// visitors straight to their destination: the dashboard if signed in, the
// (polished, full-screen) login screen if not.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
