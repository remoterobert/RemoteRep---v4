import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPinIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
  UsersIcon,
  BriefcaseIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { ShareButton } from "@/components/ShareButton";
import { AuthPromptButton } from "@/components/AuthPromptModal";

export const dynamic = "force-dynamic";

const PROMPT_SIGNUP_TITLE = "See who's hiring";
const PROMPT_SIGNUP_BODY =
  "Create your free account to apply to this company's roles and browse thousands of remote sales opportunities.";

export default async function PublicCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tenantId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: tenant }, { data: profile }, { data: listings }] =
    await Promise.all([
      supabase
        .from("tenants")
        .select("id, name, type")
        .eq("id", tenantId)
        .maybeSingle(),
      supabase
        .from("client_profiles")
        .select(
          "about, hiring_pitch, logo_url, website_url, industry_slug, headcount, founded_year, city, state_region, country, visibility",
        )
        .eq("tenant_id", tenantId)
        .maybeSingle(),
      supabase
        .from("listings")
        .select(
          "id, title, published_at, listing_details(sales_role, commitment, compensation_type, minimum_compensation), listing_requirements(years_of_experience_min, industries)",
        )
        .eq("tenant_id", tenantId)
        .eq("status", "published")
        .eq("visibility", "public")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(50),
    ]);

  if (!tenant) notFound();
  if (
    tenant.type !== "client_company" &&
    tenant.type !== "agency"
  ) {
    notFound();
  }

  const isOwner = user
    ? await isTenantMember(supabase, user.id, tenantId)
    : false;

  const isVisible = profile?.visibility === "public" || isOwner;
  const hasLiveListings = (listings?.length ?? 0) > 0;
  if (!isVisible && !hasLiveListings) notFound();

  // Count all-time hires for this tenant (for the "trusted hirer" signal).
  const { count: hireCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "hired");

  const signedIn = !!user;
  const publicPath = `/companies/${tenantId}`;
  const locationLine = [profile?.city, profile?.state_region, profile?.country]
    .filter(Boolean)
    .join(", ");
  const inits = tenant.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("");

  type ListingRow = {
    id: string;
    title: string;
    published_at: string | null;
    listing_details:
      | {
          sales_role: string | null;
          commitment: string[] | null;
          compensation_type: string[] | null;
          minimum_compensation: number | null;
        }
      | Array<{
          sales_role: string | null;
          commitment: string[] | null;
          compensation_type: string[] | null;
          minimum_compensation: number | null;
        }>
      | null;
    listing_requirements:
      | { years_of_experience_min: number | null; industries: string[] | null }
      | Array<{
          years_of_experience_min: number | null;
          industries: string[] | null;
        }>
      | null;
  };
  const liveListings = (listings ?? []) as unknown as ListingRow[];

  return (
    <main className="flex-1 w-full">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          {signedIn ? (
            <Link
              href="/opportunities"
              className="text-xs text-light-grey hover:text-primary transition-colors"
            >
              ← Back
            </Link>
          ) : (
            <Link
              href="/"
              className="text-xs text-light-grey hover:text-primary transition-colors"
            >
              ← RemoteRep home
            </Link>
          )}
          <ShareButton />
        </div>

        {/* Owner banner if profile is hidden */}
        {isOwner && profile?.visibility === "hidden" && (
          <div className="mb-4 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
            Your company profile is currently <b>hidden</b> — reps can&apos;t
            find you from the browse page. Update in{" "}
            <Link href="/company/edit" className="underline text-primary">
              your company profile
            </Link>
            .
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          {/* -------------------------------------------------------------
              LEFT: Company identity card
             ------------------------------------------------------------- */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5">
              <div className="h-24 w-24 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mx-auto mb-3 overflow-hidden">
                {profile?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.logo_url}
                    alt={tenant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  inits || <BuildingOffice2Icon className="h-12 w-12" />
                )}
              </div>
              <h1 className="text-lg font-bold text-center mb-1 leading-tight uppercase">
                {tenant.name}
              </h1>
              {locationLine && (
                <p className="text-xs text-light-grey text-center flex items-center justify-center gap-1 mb-3">
                  <MapPinIcon className="h-3 w-3" />
                  {locationLine}
                </p>
              )}

              {/* Quick facts */}
              <dl className="space-y-1.5 text-sm border-t border-zinc-100 dark:border-white/[0.04] pt-3 mt-3">
                {profile?.industry_slug && (
                  <Fact
                    icon={<BriefcaseIcon className="h-3.5 w-3.5" />}
                    label="Industry"
                    value={profile.industry_slug}
                  />
                )}
                {profile?.headcount != null && (
                  <Fact
                    icon={<UsersIcon className="h-3.5 w-3.5" />}
                    label="Team size"
                    value={`${profile.headcount.toLocaleString()}`}
                  />
                )}
                {profile?.founded_year != null && (
                  <Fact
                    icon={<BuildingOffice2Icon className="h-3.5 w-3.5" />}
                    label="Founded"
                    value={`${profile.founded_year}`}
                  />
                )}
                {profile?.website_url && (
                  <Fact
                    icon={<GlobeAltIcon className="h-3.5 w-3.5" />}
                    label="Website"
                    value={
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:opacity-80 break-all"
                      >
                        {profile.website_url.replace(/^https?:\/\//, "")}
                      </a>
                    }
                  />
                )}
                {hireCount != null && hireCount > 0 && (
                  <Fact
                    icon={
                      <CheckBadgeIcon className="h-3.5 w-3.5 text-success" />
                    }
                    label="Hires on RemoteRep"
                    value={`${hireCount}`}
                  />
                )}
              </dl>

              {!signedIn && (
                <AuthPromptButton
                  title={PROMPT_SIGNUP_TITLE}
                  body={PROMPT_SIGNUP_BODY}
                  loginRedirect={publicPath}
                  className="mt-4 w-full rounded-full bg-primary text-white py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Create free account
                </AuthPromptButton>
              )}
            </div>
          </aside>

          {/* -------------------------------------------------------------
              RIGHT: About + live listings
             ------------------------------------------------------------- */}
          <section className="space-y-6">
            {profile?.hiring_pitch && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
                  Why work here
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {profile.hiring_pitch}
                </p>
              </section>
            )}

            {profile?.about && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
                  About {tenant.name}
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {profile.about}
                </p>
              </section>
            )}

            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey">
                  Open roles
                </h2>
                <span className="text-xs text-light-grey">
                  {liveListings.length}
                </span>
              </div>
              {liveListings.length === 0 ? (
                <p className="text-sm text-light-grey italic">
                  No live roles right now. Check back soon.
                </p>
              ) : (
                <ul className="space-y-3">
                  {liveListings.map((l) => {
                    const details = Array.isArray(l.listing_details)
                      ? l.listing_details[0]
                      : l.listing_details;
                    const reqs = Array.isArray(l.listing_requirements)
                      ? l.listing_requirements[0]
                      : l.listing_requirements;
                    const chips: string[] = [];
                    if (details?.sales_role) chips.push(details.sales_role);
                    if (details?.commitment)
                      chips.push(...details.commitment.slice(0, 2));
                    if (details?.compensation_type)
                      chips.push(...details.compensation_type.slice(0, 2));
                    if (reqs?.years_of_experience_min) {
                      chips.push(`${reqs.years_of_experience_min}+ yrs`);
                    }
                    return (
                      <li
                        key={l.id}
                        className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-4 hover:border-primary/40 transition-colors"
                      >
                        <Link
                          href={`/listings/${l.id}`}
                          className="block"
                        >
                          <div className="flex items-baseline justify-between gap-3 mb-1.5">
                            <h3 className="text-base font-semibold hover:text-primary transition-colors">
                              {l.title}
                            </h3>
                            {details?.minimum_compensation != null && (
                              <span className="text-xs text-light-grey shrink-0 whitespace-nowrap">
                                ${details.minimum_compensation.toLocaleString()}+
                              </span>
                            )}
                          </div>
                          {chips.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {chips.slice(0, 5).map((c) => (
                                <span
                                  key={c}
                                  className="text-[11px] rounded-full bg-zinc-100 dark:bg-white/[0.06] px-2 py-0.5"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

async function isTenantMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tenantId: string,
) {
  const { data } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .maybeSingle();
  return !!data;
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="flex items-center gap-1.5 text-light-grey whitespace-nowrap">
        {icon}
        {label}
      </span>
      <span className="font-medium text-right min-w-0">{value}</span>
    </div>
  );
}
