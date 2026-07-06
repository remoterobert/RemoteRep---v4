import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SearchSelect } from "@/components/forms/SearchSelect";
import { COUNTRIES, STATES } from "@/lib/locations";
import { saveCompanyProfile } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function EditCompanyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants!inner(id, name, type)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["client_admin", "agency_admin"]);

  type M = {
    tenant_id: string;
    role: string;
    tenants: { id: string; name: string; type: string };
  };
  const m = (memberships as unknown as M[])?.[0];
  if (!m) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("client_profiles")
    .select(
      "about, hiring_pitch, website_url, industry_slug, city, state_region, country, headcount, founded_year, visibility, logo_url",
    )
    .eq("tenant_id", m.tenant_id)
    .maybeSingle();

  const params = await searchParams;
  const error = params.error;

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl font-semibold mb-2">Your company</h1>
      <p className="text-sm text-light-grey mb-6">
        This is what candidates see when they browse companies.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-900 p-3 text-sm text-red-800 dark:text-red-200"
        >
          {error}
        </div>
      )}

      <form action={saveCompanyProfile} className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider">
            Public profile
          </h2>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Company name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              maxLength={140}
              required
              defaultValue={m.tenants.name}
              className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="about" className="block text-sm font-medium mb-1">
              About
            </label>
            <textarea
              id="about"
              name="about"
              rows={3}
              maxLength={2000}
              defaultValue={profile?.about ?? ""}
              placeholder="What does the company do? Who do you sell to?"
              className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="hiring_pitch"
              className="block text-sm font-medium mb-1"
            >
              Hiring pitch
            </label>
            <textarea
              id="hiring_pitch"
              name="hiring_pitch"
              rows={3}
              maxLength={2000}
              defaultValue={profile?.hiring_pitch ?? ""}
              placeholder="Why should a top rep join YOUR team? Comp, culture, growth path, product."
              className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
            <p className="text-xs text-light-grey mt-1">
              Shown at the top when reps view your company. Sell the role, not
              just describe it.
            </p>
          </div>

          <div>
            <label
              htmlFor="website_url"
              className="block text-sm font-medium mb-1"
            >
              Website URL
            </label>
            <input
              id="website_url"
              name="website_url"
              type="url"
              maxLength={500}
              defaultValue={profile?.website_url ?? ""}
              placeholder="https://your-company.com"
              className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="logo_url"
              className="block text-sm font-medium mb-1"
            >
              Logo URL
            </label>
            <input
              id="logo_url"
              name="logo_url"
              type="url"
              maxLength={500}
              defaultValue={profile?.logo_url ?? ""}
              placeholder="https://your-company.com/logo.png"
              className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
            <p className="text-xs text-light-grey mt-1">
              Paste a hosted logo URL (PNG or SVG). Direct upload built into a
              future release.
            </p>
            {profile?.logo_url && (
              <div className="mt-2 h-16 w-16 rounded-lg bg-primary/10 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.logo_url}
                  alt="Company logo preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <fieldset>
            <legend className="block text-sm font-medium mb-2">
              Visibility
            </legend>
            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  defaultChecked={
                    !profile || profile.visibility === "public"
                  }
                />
                Public — candidates can find us
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="hidden"
                  defaultChecked={profile?.visibility === "hidden"}
                />
                Hidden — not accepting reps right now
              </label>
            </div>
          </fieldset>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider">
            Company details
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="headcount"
                className="block text-sm font-medium mb-1"
              >
                Headcount
              </label>
              <input
                id="headcount"
                name="headcount"
                type="number"
                min={1}
                max={1000000}
                defaultValue={profile?.headcount ?? ""}
                className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="founded_year"
                className="block text-sm font-medium mb-1"
              >
                Founded
              </label>
              <input
                id="founded_year"
                name="founded_year"
                type="number"
                min={1800}
                max={2100}
                defaultValue={profile?.founded_year ?? ""}
                className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="industry_slug"
                className="block text-sm font-medium mb-1"
              >
                Industry
              </label>
              <input
                id="industry_slug"
                name="industry_slug"
                type="text"
                maxLength={80}
                defaultValue={profile?.industry_slug ?? ""}
                placeholder="e.g. saas-companies"
                className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-light-grey">
            Industry is a slug for now — a proper picker (from all 68 v3
            industries) comes when candidates start filtering by it.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium mb-1"
              >
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                maxLength={100}
                defaultValue={profile?.city ?? ""}
                placeholder="e.g. Austin"
                className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </div>
            <SearchSelect
              name="state_region"
              label="State / Region"
              options={STATES}
              defaultValue={profile?.state_region ?? ""}
              placeholder="Select…"
            />
            <SearchSelect
              name="country"
              label="Country"
              options={COUNTRIES}
              defaultValue={profile?.country ?? ""}
              placeholder="Select…"
            />
          </div>
        </section>

        <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="submit"
            className="rounded bg-primary text-white px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Save company profile
          </button>
          <a
            href="/dashboard"
            className="text-sm text-light-grey hover:text-primary transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
