import type { Metadata } from "next";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { Eyebrow, GhostCta, MarketingFrame } from "../../MarketingFrame";

export const metadata: Metadata = {
  title: "Book Your Strategy Call | RemoteRep",
  robots: { index: false },
};

// Reads CRO_BOOKING_URL at request time so the link can change without a rebuild.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ name?: string }>;

export default async function BookCallPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { name } = await searchParams;
  const firstName = name?.slice(0, 50);
  const bookingUrl = process.env.CRO_BOOKING_URL;

  return (
    <MarketingFrame
      nav={[]}
      cta={{ href: "/fractional-cro", label: "Back" }}
    >
      <section className="mx-auto max-w-4xl px-5 pb-24 pt-16 text-center">
        <Eyebrow icon={CheckCircleIcon}>Step 2 of 2 — application received</Eyebrow>
        <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
          {firstName ? `Thanks, ${firstName}. ` : "Thank you. "}
          <span className="mkt-shine bg-gradient-to-r from-secondary via-amber-200 to-secondary bg-clip-text text-transparent">
            Now pick your call time.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
          Your application is in. Choose a time below for your one-on-one
          Fractional CRO strategy call. Come ready to talk about the teams
          you&apos;ve built and what you want the next five years to look like.
        </p>

        {bookingUrl ? (
          <div className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-white shadow-[0_30px_80px_-30px_rgba(0,121,254,0.4)]">
            <iframe
              src={bookingUrl}
              title="Book your strategy call"
              className="h-[720px] w-full"
            />
          </div>
        ) : (
          <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <CalendarDaysIcon className="mx-auto h-10 w-10 text-secondary" />
            <p className="mt-4 text-lg font-semibold">
              Our team will reach out within one business day to schedule your
              call.
            </p>
            <p className="mt-2 text-sm text-white/50">
              Keep an eye on your inbox and phone.
            </p>
          </div>
        )}

        {bookingUrl && (
          <p className="mt-6 text-sm text-white/45">
            Calendar not loading?{" "}
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/80 underline-offset-4 hover:underline"
            >
              Open it in a new tab
            </a>
            .
          </p>
        )}

        <div className="mt-12">
          <GhostCta href="/reps">Meanwhile, browse remote sales roles</GhostCta>
        </div>
      </section>
    </MarketingFrame>
  );
}
