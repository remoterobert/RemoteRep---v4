import Link from "next/link";
import {
  BoltIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  SparklesIcon,
  StarIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import GlobeConnections from "../(auth)/GlobeConnections";
import { Reveal } from "./Reveal";

// The app lives at app.remoterep.com; marketing CTAs send visitors there.
const APP = "https://app.remoterep.com";

const PLAN_FEATURES = [
  "Create job listings",
  "Automatically match candidates to job listings",
  "Filter reps to find your best fit",
  "Browse all remote sales reps",
  "Build custom or templated applications for each listing",
  "View candidates intro video",
  "Bookmark top candidates",
  "Rate and rank top candidates",
  "Easily compare top candidates side by side",
  "Keep notes on bookmarked candidates",
  "Get instant notifications of new candidates matching your job listings",
  "Easily invite candidates to apply",
  "Track candidate progress through hiring pipeline",
  "In-app messaging with candidates",
  "View hiring pipeline analytics",
  "Add team members to your account",
  "Priority customer support",
  "Full Service Hiring Concierge",
];

const PLANS = [
  { name: "Unlimited", price: "$0", featured: false },
  { name: "Featured", price: "$69", featured: true },
  { name: "Concierge", price: "$299", featured: false },
];

const CLIENTS = [
  "BookProfits.com",
  "The Legion of Loan Officers",
  "FUELED",
  "Acadium",
  "Raider T Recruiting",
  "Locus Digital",
  "Valued Merchants",
  "Exit Advisor",
];

function GoldCta({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={`${APP}/signup`}
      className={`group relative inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3.5 text-sm font-bold text-dark-background shadow-[0_8px_30px_-8px_rgba(251,220,59,0.6)] transition hover:shadow-[0_12px_40px_-8px_rgba(251,220,59,0.75)] hover:brightness-105 ${className}`}
    >
      {children}
      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function GhostCta({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={`${APP}/signup`}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10 ${className}`}
    >
      {children}
    </Link>
  );
}

export function MarketingHome() {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overflow-x-hidden bg-[#05070f] text-white antialiased [scrollbar-width:thin]">
      {/* One continuous ambient field behind everything — pinned to the
          viewport while content scrolls over it, so the page reads as a single
          luminous surface instead of stacked, seamed sections. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,#101a3a_0%,#080d1e_45%,#05070f_100%)]" />
        <div className="mkt-aurora-a absolute -left-48 top-[-12%] h-[48rem] w-[48rem] rounded-full bg-primary-blue/16 blur-[160px]" />
        <div className="mkt-aurora-b absolute right-[-18%] top-[22%] h-[52rem] w-[52rem] rounded-full bg-[#7c5cff]/14 blur-[170px]" />
        <div className="mkt-aurora-c absolute left-[6%] top-[58%] h-[44rem] w-[44rem] rounded-full bg-secondary/9 blur-[160px]" />
        <div className="mkt-aurora-a absolute right-[4%] bottom-[-8%] h-[42rem] w-[42rem] rounded-full bg-primary/12 blur-[160px]" />
        <div className="mkt-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_65%)] opacity-35" />
      </div>

      <div className="relative z-10">
      {/* ── Sticky glass nav ───────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#070a16]/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/v3-white-logo-with-text.svg"
              alt="RemoteRep.com"
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-white/60 md:flex">
            <a href="#why" className="transition hover:text-white">
              Why RemoteRep
            </a>
            <a href="#how" className="transition hover:text-white">
              How it works
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2.5 text-sm">
            <Link
              href={`${APP}/login`}
              className="rounded-lg px-3 py-2 font-medium text-white/70 transition hover:text-white"
            >
              Login
            </Link>
            <Link
              href={`${APP}/signup`}
              className="rounded-lg bg-white px-4 py-2 font-semibold text-dark-background transition hover:bg-white/90"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative">
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-24">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
                <SparklesIcon className="h-3.5 w-3.5 text-secondary" />
                The sales-specific hiring platform
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-[2.75rem] font-extrabold leading-[1.03] tracking-tight sm:text-6xl">
                Save{" "}
                <span className="mkt-shine bg-gradient-to-r from-secondary via-amber-200 to-secondary bg-clip-text text-transparent">
                  20 to 30 hours
                </span>{" "}
                hiring your next remote sales rep.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
                List your job in minutes. Automatically match your job listing
                with perfect fit candidates.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <GoldCta>Add Your Listing Now</GoldCta>
                <GhostCta>Sales Rep? Get hired</GhostCta>
              </div>
              <p className="mt-4 text-sm text-white/45">
                Already have an account?{" "}
                <Link
                  href={`${APP}/login`}
                  className="font-semibold text-white/80 underline-offset-4 hover:underline"
                >
                  Login
                </Link>
              </p>
            </Reveal>

            {/* stat strip */}
            <Reveal delay={320}>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-8">
                {[
                  ["110+", "Sales teams built"],
                  ["50%", "Less time to hire"],
                  ["3 min", "To your first listing"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <dt className="text-2xl font-extrabold text-white sm:text-3xl">
                      {n}
                    </dt>
                    <dd className="mt-1 text-xs text-white/50">{l}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* globe */}
          <Reveal delay={200} className="hidden lg:block">
            <div className="mkt-float relative mx-auto aspect-square w-full max-w-[34rem]">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl" />
              <GlobeConnections className="absolute inset-0 h-full w-full" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Client marquee ─────────────────────────────────────── */}
      <section className="py-10">
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/35">
          Companies We&apos;ve Worked With
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="mkt-marquee flex w-max gap-12 whitespace-nowrap pr-12">
            {[...CLIENTS, ...CLIENTS].map((c, i) => (
              <span
                key={`${c}-${i}`}
                className="text-lg font-semibold text-white/40"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value proposition ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
            Find and Hire Your Next Remote Sales Rep in One Convenient Location
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            {
              t: "Remote Sales Reps",
              b: "Browse reps that match your specific needs, skip over the ones that don't.",
              icon: UsersIcon,
            },
            {
              t: "RemoteRep.com",
              b: "We connect the perfect sales candidates with your job listing in one easy to use location.",
              icon: BoltIcon,
            },
            {
              t: "Company",
              b: "Create your job listing with specific criteria to find the perfect fit.",
              icon: ClipboardDocumentCheckIcon,
            },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 90}>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur transition hover:border-secondary/40 hover:bg-white/[0.05]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/25 to-secondary/5 text-secondary ring-1 ring-secondary/20">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {c.b}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section id="how" className="relative py-24">
        <div className="relative mx-auto max-w-6xl px-5">
          <Reveal>
            <h2 className="mx-auto max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
              The New Way to Affordably Hire Qualified Remote Sales Reps.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-center text-white/60">
              Traditional hiring and recruiting can take up to 150 candidate
              applications and 30 to 60 hours of interviews just to find one
              sales rep. We cut that time in half. Here&apos;s how.
            </p>
          </Reveal>
          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Create Your First Job Post",
                b: "Set up your hiring account with just your name and email address.",
              },
              {
                n: "02",
                t: "Browse, Bookmark and Rank Top Candidates",
                b: "Using our browse, bookmark, and rank feature, review as many candidate profiles as you'd like and shortlist only the very best. When you're ready, invite your top candidates to interview with just one click.",
              },
              {
                n: "03",
                t: "Hire the Perfect Remote Sales Rep In Half the Time",
                b: "Save 40 hours off the hiring process by only interviewing the best candidates matched to your job listings using our candidate matching system.",
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur">
                  <div className="bg-gradient-to-br from-white to-white/40 bg-clip-text text-5xl font-black tracking-tighter text-transparent">
                    {s.n}
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    {s.b}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why RemoteRep (bento) ──────────────────────────────── */}
      <section id="why" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-[2.6rem]">
            Why RemoteRep?
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: BoltIcon,
              t: "Hire your next rep in days, not weeks.",
              items: [
                "Set up your profile in just 3 minutes",
                "Create unlimited job listings and specify the skills required for candidates to qualify",
                "Save 20 to 30 hours in the recruitment process",
              ],
            },
            {
              icon: UsersIcon,
              t: "Unrestricted access to a large pool of talented remote sales reps.",
              items: [
                "Sales specific job board makes it easier for you to find the best candidates in less time",
                "Browse thousands of candidates and we'll match the best ones automatically",
                "Invite your top candidates to interview with just one click",
              ],
            },
            {
              icon: ClipboardDocumentCheckIcon,
              t: "Easily manage the hiring process from start to finish.",
              items: [
                "Compare reps quickly to match them to your listing(s)",
                "Bookmark and take notes on your top candidates for each job listing",
                "Communicate with candidates and receive instant notifications when reps are interested",
              ],
            },
          ].map((b, i) => (
            <Reveal key={b.t} delay={i * 90}>
              <div className="h-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-primary-blue ring-1 ring-primary/30">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold leading-snug">{b.t}</h3>
                <ul className="mt-5 space-y-3">
                  {b.items.map((it) => (
                    <li key={it} className="flex gap-3 text-sm text-white/60">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Differentiation ────────────────────────────────────── */}
      <section className="relative py-24">
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
              The Faster Way To Hire Remote Sales Reps{" "}
              <span className="bg-gradient-to-r from-primary-blue to-[#7c5cff] bg-clip-text text-transparent">
                Accurately.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-7 text-lg leading-relaxed text-white/65">
              Let&apos;s face it; the traditional recruiting process usually
              takes way too long. Most of the time it&apos;s because recruiters
              don&apos;t even know what they&apos;re looking for when hiring for
              remote sales roles. At RemoteRep, we&apos;re sales pros first. We
              ask candidates all the hard questions recruiters don&apos;t even
              know to ask, saving you hundreds of hours sifting through
              candidates, reading resumes, and first round interviews. Then our
              algorithm uses the information to help you make accurate hiring
              decisions faster.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              q: "Almost six figures in one month…",
              b: "We've been considering hiring someone to do phone sales in order to increase our revenue. I was impressed with Robert's approach and the results he and his team at RemoteRep.com have produced. In our first month, we'll most likely cross six figures in sales, despite starting from zero. They've done an amazing job.",
              a: "John S., Owner, BookProfits.com",
            },
            {
              q: "Tripled our business revenue over the last 90 – 100 days.",
              b: "Since bringing on the RemoteRep team of professionals and implementing other changes, we have tripled our business revenue over the last 90-100 days. He works with true professionals who are skilled at converting leads, allowing me to focus on the creative side.",
              a: "Nick C., Founder, The Legion of Loan Officers",
            },
            {
              q: "We now deliver higher perceived value…",
              b: "Robert and his team at RemoteRep.com have worked directly with me and my sales team to help craft our sales system. Our sales process is now much smoother and we deliver higher perceived value when pitching to prospects thanks to implementing Robert's recommendations. His system is amazing.",
              a: "Ammon M., Director of Growth at FUELED",
            },
          ].map((t, i) => (
            <Reveal key={t.a} delay={i * 90}>
              <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur transition hover:border-white/20">
                <div className="flex gap-0.5 text-secondary">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <StarIcon key={s} className="h-4 w-4" />
                  ))}
                </div>
                <blockquote className="mt-4 text-lg font-bold leading-snug">
                  {t.q}
                </blockquote>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/55">
                  {t.b}
                </p>
                <figcaption className="mt-5 border-t border-white/10 pt-4 text-sm font-semibold text-white/45">
                  {t.a}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Founder letter ─────────────────────────────────────── */}
      <section className="relative py-24">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-secondary">
              Letter From Founder
            </p>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-white/65">
              <p>
                At 12 years old I knew I wanted to do something big. I wanted to
                change the world. At 18 years old I found my way into sales. A
                few years later, I was boots on the ground, selling, as a
                freelance closer for hire. My client, at the time, asked me to
                find more people like me, so I obliged. That was the first sales
                team I had the opportunity to build. This experience taught me
                that my hours were numbered and if I wanted to expand my impact
                it would have to be through other, amazing sales professionals.
                One became many, and we&apos;ve since gone on to build 110 remote
                sales teams. We developed three rules that allowed us to thrive:
              </p>
              <ol className="space-y-3">
                {[
                  "You must provide a significant, measurable return on investment.",
                  "We must have a complete, 100% belief in the people, product, and process.",
                  "We have to be able to laugh together.",
                ].map((rule, i) => (
                  <li key={rule} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-sm font-bold text-secondary">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-base text-white/75">
                      {rule}
                    </span>
                  </li>
                ))}
              </ol>
              <p>
                As long as our clients checked these boxes, we were successful.
                So we stopped taking clients that didn&apos;t match. The result
                was that we were able to place phenomenal salespeople in
                phenomenal roles. Both the rep and the company were able to
                thrive in this way. We were able to change the world through the
                teams we built and the products they sold. The problem was we
                wanted to expand that same result to scale our impact even
                further. RemoteRep is the product of that story. A platform built
                to give companies like yours access to a powerful network of
                sales professionals, and increase the speed and accuracy at which
                you&apos;re able to hire amazing people. Our hope is that this
                tool will allow you to achieve more impact and revenue through
                these same phenomenal people.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-[2.6rem]">
            Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-white/55">
            Every plan includes the full platform. Set up your account in just 3
            minutes and start browsing remote sales reps.
          </p>
        </Reveal>
        <div className="mt-14 grid items-start gap-5 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 90}>
              <div
                className={`relative rounded-2xl p-[1px] ${p.featured ? "mkt-ring shadow-[0_20px_60px_-20px_rgba(0,121,254,0.5)]" : ""}`}
              >
                <div
                  className={`relative flex h-full flex-col rounded-2xl border p-7 ${
                    p.featured
                      ? "border-transparent bg-[#0a0f1f]"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  {p.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-secondary to-amber-300 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-dark-background">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-5xl font-extrabold tracking-tight">
                      {p.price}
                    </span>
                    <span className="pb-1.5 text-sm font-medium text-white/40">
                      /month
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-white/50">
                    Great for teams who need to hire multiple people for multiple
                    roles!
                  </p>
                  <Link
                    href={`${APP}/signup`}
                    className={`mt-6 rounded-xl px-4 py-3 text-center text-sm font-bold transition ${
                      p.featured
                        ? "bg-secondary text-dark-background hover:brightness-105"
                        : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    Get Started Now
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.02] p-7">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              Every plan includes
            </p>
            <ul className="mt-6 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-white/65">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="relative px-5 py-24">
        <Reveal className="relative">
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-14 text-center shadow-[0_30px_80px_-30px_rgba(0,121,254,0.4)] backdrop-blur-xl sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
              Set up your account in just 3 minutes and start browsing remote
              sales reps.
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Hire as many reps as you want, for each listing.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <GoldCta>Add Your Listing Now</GoldCta>
              <GhostCta>Sales Rep? Get hired</GhostCta>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center text-sm text-white/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/v3-white-logo-with-text.svg"
            alt="RemoteRep.com"
            className="h-8 w-auto opacity-90"
          />
          <p>1 Innovation Way Woodstock, GA 30188</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms of Services
            </Link>
          </div>
          <p className="text-white/30">©2023. All rights reserved.</p>
        </div>
      </footer>
      </div>
    </div>
  );
}
