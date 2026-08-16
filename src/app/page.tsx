import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarketingHome } from "./(marketing)/MarketingHome";

export const dynamic = "force-dynamic";

// The marketing site (remoterep.com) and the app (app.remoterep.com) share this
// one Next app. On the app host, the root sends people to their destination
// (dashboard if signed in, otherwise the login screen). On every other host —
// the marketing domain, preview URLs, localhost — we show the marketing
// landing page.
export default async function Home() {
  const h = await headers();
  const host = (h.get("host") ?? "").toLowerCase();

  if (host.startsWith("app.")) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    redirect(user ? "/dashboard" : "/login");
  }

  return <MarketingHome />;
}
