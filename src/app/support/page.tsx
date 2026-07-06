import Link from "next/link";
import { LifebuoyIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { submitSupportTicket } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function SupportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  // Pre-fill from the signed-in user if we have them. Anonymous visitors
  // just fill in fresh.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let defaultName = "";
  let defaultEmail = user?.email ?? "";
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();
    if (data?.first_name || data?.last_name) {
      defaultName = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
    }
  }

  return (
    <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
      <div className="flex items-start gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <LifebuoyIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Support</h1>
          <p className="text-sm text-light-grey">
            Something broken, confusing, or missing? Send it here and our team
            will pick it up.
          </p>
        </div>
      </div>

      {params.error && (
        <div
          role="alert"
          className="mb-4 rounded border border-danger/40 bg-danger/5 p-3 text-sm text-danger"
        >
          {params.error}
        </div>
      )}

      <form action={submitSupportTicket} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Your name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={200}
              defaultValue={defaultName}
              placeholder="Alex Rivera"
              className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={200}
              defaultValue={defaultEmail}
              placeholder="you@example.com"
              className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium mb-2">
            What&apos;s this about?
          </legend>
          <div className="space-y-2">
            <label className="flex items-start gap-2 cursor-pointer rounded border border-border bg-surface-2 px-3 py-2 hover:bg-surface-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="kind"
                value="platform_help"
                required
                defaultChecked
                className="mt-0.5"
              />
              <div className="text-sm">
                <div className="font-medium">
                  I need help with the platform
                </div>
                <div className="text-xs text-light-grey">
                  Something isn&apos;t working, isn&apos;t clear, or you&apos;re
                  stuck on a step.
                </div>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer rounded border border-border bg-surface-2 px-3 py-2 hover:bg-surface-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="kind"
                value="feature_request"
                className="mt-0.5"
              />
              <div className="text-sm">
                <div className="font-medium">I have a feature request</div>
                <div className="text-xs text-light-grey">
                  Something you wish the platform did — small tweak or a whole
                  new area.
                </div>
              </div>
            </label>
          </div>
        </fieldset>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            required
            minLength={5}
            maxLength={5000}
            placeholder="What's going on? A screenshot beats a thousand words — feel free to include a link to one."
            className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-light-grey mt-1">
            Include steps to reproduce, or where in the app you got stuck.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <button
            type="submit"
            className="rounded bg-primary text-white px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Send to support
          </button>
          <Link
            href="/dashboard"
            className="text-sm text-light-grey hover:text-primary transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
