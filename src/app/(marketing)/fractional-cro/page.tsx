import type { Metadata } from "next";
import {
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  PresentationChartLineIcon,
  BanknotesIcon,
} from "@heroicons/react/24/solid";
import { Reveal } from "../Reveal";
import { Eyebrow, GoldCta, MarketingFrame, SectionLabel } from "../MarketingFrame";
import { Spotlight, StickyBar } from "../fx";
import { EXAMPLE_ANNUAL, PortfolioOrbit } from "../PortfolioOrbit";
import { IntakeForm } from "./IntakeForm";

export const metadata: Metadata = {
  title: "Become a Fractional CRO | RemoteRep",
  description:
    "For sales leaders who have built and run teams: turn your experience into a portfolio of fractional Chief Revenue Officer clients — retainers plus equity.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-[2.2rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[3.4rem] ${className}`}>
      {children}
    </h2>
  );
}

function Serif({ children }: { children: React.ReactNode }) {
  return (
    <span className="lp-serif mkt-shine bg-gradient-to-r from-secondary via-amber-100 to-secondary bg-clip-text pr-1 font-normal text-transparent">
      {children}
    </span>
  );
}

export default async function FractionalCroPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const utm = {
    source: first(sp.utm_source),
    medium: first(sp.utm_medium),
    campaign: first(sp.utm_campaign),
  };

  return (
    <MarketingFrame
      nav={[
        { href: "#model", label: "The model" },
        { href: "#program", label: "The program" },
        { href: "#fit", label: "Who it's for" },
        { href: "#faq", label: "FAQ" },
      ]}
      cta={{ href: "#apply", label: "Apply" }}
    >
      {/* ── Hero + application ─────────────────────────────────── */}
      <section id="hero" className="relative overflow-hidden">
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <Reveal>
              <Eyebrow icon={SparklesIcon}>
                For sales managers, directors and VPs
              </Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-7 text-[2.5rem] font-extrabold leading-[0.98] tracking-[-0.045em] sm:text-[4.1rem]">
                Trade one salary for three retainers{" "}
                <span className="lp-serif mkt-shine bg-gradient-to-r from-secondary via-amber-100 to-secondary bg-clip-text pr-2 font-normal tracking-[-0.02em] text-transparent">
                  — plus equity.
                </span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/60 sm:text-xl">
                As a fractional Chief Revenue Officer, you lead revenue for
                several growing companies at once. We&apos;ll show you how to
                land the clients and structure deals worth multiple six figures
                a year — plus equity in what you build.
              </p>
            </Reveal>
            <Reveal delay={200} className="lg:hidden">
              <div className="mt-8">
                <GoldCta href="#apply" className="w-full">
                  Start my application — 60 sec
                </GoldCta>
              </div>
            </Reveal>
            <Reveal delay={240}>
              <ul className="mt-9 space-y-3.5">
                {[
                  "Built for people who have hired, coached and led sales teams",
                  "Monthly retainers from several clients, not one salary band",
                  "Equity in the companies whose revenue you grow",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-[15px] text-white/75">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/15">
                      <CheckIcon className="h-3.5 w-3.5 text-secondary" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={300}>
              <p className="mt-9 text-sm text-white/40">
                From the team behind 110+ remote sales teams for companies like
                BookProfits.com, FUELED and The Legion of Loan Officers.
              </p>
            </Reveal>
          </div>

          {/* Application */}
          <Reveal delay={180}>
            <div id="apply" className="relative scroll-mt-28">
              <div className="absolute -inset-8 rounded-[48px] bg-gradient-to-br from-secondary/20 via-primary-blue/10 to-[#7c5cff]/20 blur-3xl" />
              <div className="lp-border relative rounded-[30px] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
                <div className="rounded-[29px] bg-[#090d1c]/95 p-6 backdrop-blur-xl sm:p-8">
                  <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-5">
                    <div>
                      <p className="text-lg font-bold">Apply for a strategy call</p>
                      <p className="text-sm text-white/45">Free, one-on-one, no obligation</p>
                    </div>
                    <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success ring-1 ring-success/30">
                      Step 1 of 2
                    </span>
                  </div>
                  <IntakeForm utm={utm} />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
        <div aria-hidden className="lp-eclipse pointer-events-none absolute inset-x-[-20%] bottom-0 h-40" />
      </section>

      {/* ── The model ──────────────────────────────────────────── */}
      <section id="model" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-24">
        <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <div className="relative mx-auto w-full max-w-[32rem]">
              <PortfolioOrbit />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <SectionLabel n="01">The model</SectionLabel>
            <H2 className="mt-5">
              One expert. Several companies. <Serif>One practice you own.</Serif>
            </H2>
            <p className="mt-6 text-lg leading-relaxed text-white/60">
              A fractional CRO leads revenue for each client a few days a month
              — building the process, hiring the team, and owning the number.
              Each pays a monthly retainer. Many add equity, because you&apos;re
              building the thing that drives their valuation.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ["3", "clients"],
                [`$${Math.round(EXAMPLE_ANNUAL / 1000)}k`, "in yearly retainers"],
                ["+3%", "combined equity"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-2xl font-extrabold tracking-tight sm:text-3xl">{n}</div>
                  <div className="mt-1 text-xs text-white/45">{l}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-white/30">
              Hypothetical illustration. Not a typical result or a guarantee of
              earnings.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── The letter ─────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal>
            <SectionLabel n="02">A letter to sales leaders</SectionLabel>
            <p className="lp-serif mt-8 text-[2.1rem] leading-[1.18] text-white sm:text-[2.8rem]">
              You already know how to build a revenue engine. The only question
              is who gets to own what it produces.
            </p>
            <div className="mt-10 space-y-6 text-lg leading-[1.75] text-white/65">
              <p className="first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-[family-name:var(--font-display)] first-letter:text-[4.2rem] first-letter:leading-[0.8] first-letter:text-secondary">
                You&apos;ve hired the reps. You&apos;ve written the playbook,
                built the pipeline, fixed the forecast, and coached people who
                were about to quit into people who carried the team. You know
                what most founders will spend years and millions learning the
                hard way.
              </p>
              <p>
                For all of that, you&apos;re paid a salary set by a band, a bonus
                set by a committee, and — if you&apos;re lucky — a sliver of
                equity that vests long after you&apos;ve built the thing that
                made it valuable.
              </p>
              <p>
                Now look at the other side of the table. Thousands of companies
                doing a few million a year are stuck in the same place: the
                founder is still the best salesperson in the building, and the
                team has no process, no forecast and no coach. They desperately
                need a revenue leader — and can&apos;t justify a full-time
                executive salary to get one.
              </p>
            </div>
            <div className="my-12 rounded-[24px] border border-secondary/25 bg-secondary/[0.06] p-7 sm:p-9">
              <p className="text-xl leading-relaxed text-white sm:text-2xl">
                That gap — between what these companies need and what they can
                afford — is the opportunity.{" "}
                <span className="lp-serif text-secondary">
                  A fractional CRO fills it.
                </span>
              </p>
            </div>
            <div className="space-y-6 text-lg leading-[1.75] text-white/65">
              <p>
                It isn&apos;t a new idea. Fractional CFOs have worked this way for
                decades. What&apos;s new is that remote work made it normal for a
                company to have an executive who isn&apos;t in the building — and
                founders now look for revenue leaders the same way.
              </p>
              <p>
                But knowing the opportunity exists and landing your first three
                clients are two very different things.{" "}
                <span className="text-white">That&apos;s what our program is for.</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── What you'll do ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <SectionLabel n="03">The work</SectionLabel>
          <H2 className="mt-5 max-w-3xl">
            The work you&apos;re already great at. <Serif>For several companies.</Serif>
          </H2>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          {[
            {
              icon: WrenchScrewdriverIcon,
              t: "Build the sales process",
              b: "Turn a founder's instincts into a repeatable playbook any good rep can run.",
              span: "md:col-span-4",
            },
            {
              icon: UserGroupIcon,
              t: "Hire and coach the team",
              b: "Recruit the right reps, set comp plans, develop the people who carry the number.",
              span: "md:col-span-2",
            },
            {
              icon: PresentationChartLineIcon,
              t: "Install pipeline and forecasting",
              b: "Give the founder a forecast they can take to the board — and believe.",
              span: "md:col-span-2",
            },
            {
              icon: BanknotesIcon,
              t: "Own the revenue strategy",
              b: "Pricing, packaging, channels and targets — the decisions that move valuation. And when your clients need reps, RemoteRep's network of remote sales talent is behind you.",
              span: "md:col-span-4",
            },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 80} className={c.span}>
              <Spotlight className="h-full rounded-[24px]">
                <div className="h-full rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-7 sm:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary/25 to-secondary/5 text-secondary ring-1 ring-secondary/20">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold tracking-tight">{c.t}</h3>
                  <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-white/55">{c.b}</p>
                </div>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── The program (timeline) ─────────────────────────────── */}
      <section id="program" className="scroll-mt-28 py-24">
        <div className="mx-auto max-w-4xl px-5">
          <Reveal>
            <SectionLabel n="04">The program</SectionLabel>
            <H2 className="mt-5">
              From sales leader to fractional CRO, <Serif>step by step.</Serif>
            </H2>
          </Reveal>
          <ol className="relative mt-14 space-y-4 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-px before:bg-gradient-to-b before:from-secondary/70 before:via-primary-blue/40 before:to-transparent">
            {[
              {
                t: "Position your offer",
                b: "Turn years of experience into a clear, specific offer founders immediately understand — and want.",
              },
              {
                t: "Land your first clients",
                b: "Where companies who need a fractional CRO actually look, and how to start the conversation without cold-pitching strangers.",
              },
              {
                t: "Price retainers and negotiate equity",
                b: "Set a retainer that reflects your value, and structure equity so it's real — not a promise on a napkin.",
              },
              {
                t: "Deliver results in the first 90 days",
                b: "A framework for the first engagement, so your first client becomes your best reference.",
              },
              {
                t: "Grow to a full portfolio",
                b: "Manage several clients without burning out — and decide how many you actually want.",
              },
            ].map((m, i) => (
              <Reveal key={m.t} delay={i * 60}>
                <li className="relative flex gap-6">
                  <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-[#0a0f20] text-lg font-extrabold text-secondary shadow-[0_0_30px_-5px_rgba(251,220,59,0.35)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 rounded-[20px] border border-white/10 bg-white/[0.03] p-6">
                    <h3 className="text-lg font-bold">{m.t}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-white/55">{m.b}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Fit ────────────────────────────────────────────────── */}
      <section id="fit" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-24">
        <Reveal>
          <SectionLabel n="05">Who it&apos;s for</SectionLabel>
          <H2 className="mt-5 max-w-3xl">
            This is not for everyone. <Serif>Please read before you apply.</Serif>
          </H2>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          <Reveal>
            <div className="lp-border h-full rounded-[26px]">
              <div className="h-full rounded-[25px] bg-[#090d1c] p-8">
                <h3 className="text-lg font-bold">This is for you if…</h3>
                <ul className="mt-6 space-y-4">
                  {[
                    "You've hired, managed and coached a sales team — not just been on one",
                    "You've owned a number bigger than your personal quota",
                    "You want to be paid for outcomes and ownership, not hours",
                    "You'll put in focused work to land your first clients",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-[15px] text-white/80">
                      <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div className="h-full rounded-[26px] border border-white/10 bg-white/[0.02] p-8">
              <h3 className="text-lg font-bold text-white/55">This is not for you if…</h3>
              <ul className="mt-6 space-y-4">
                {[
                  "You've never managed people — start with our remote rep roles instead",
                  "You want a guaranteed paycheck with no ramp-up",
                  "You're looking for a get-rich-quick scheme. This is a real business.",
                  "You won't talk to founders about their numbers",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-[15px] text-white/45">
                    <XMarkIcon className="mt-0.5 h-5 w-5 shrink-0 text-danger/70" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-24">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <SectionLabel n="06">Questions</SectionLabel>
            <H2 className="mt-5">
              Fair <Serif>questions.</Serif>
            </H2>
          </Reveal>
          <div className="space-y-3">
            {[
              {
                q: "Do I have to quit my job to apply?",
                a: "No. Applying and taking the call commits you to nothing. On the call we'll talk honestly about timing and how people make the transition.",
              },
              {
                q: "What does the program cost?",
                a: "We cover the investment on the call — after we know whether your experience is a fit. We'd rather not quote a price to someone the program can't help.",
              },
              {
                q: "Is equity realistic, or just a nice idea?",
                a: "Equity is common in fractional executive work because you're building what drives the company's value. The program covers how to structure it properly so it's worth something.",
              },
              {
                q: "Do I need to have been a CRO or VP before?",
                a: "No. You need real experience leading a sales team and owning a number. Titles vary; results and leadership matter more.",
              },
            ].map((f) => (
              <Reveal key={f.q}>
                <details className="group rounded-[20px] border border-white/10 bg-white/[0.03] px-6 py-5 transition open:border-white/20 open:bg-white/[0.05]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold">
                    {f.q}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg leading-none text-secondary transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 pr-10 leading-relaxed text-white/60">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-5 pb-20 pt-24">
        <div aria-hidden className="lp-eclipse pointer-events-none absolute inset-x-[-20%] top-0 h-40 rotate-180" />
        <Reveal className="relative">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-[2.6rem] font-extrabold leading-[1] tracking-[-0.04em] sm:text-[4.4rem]">
              You built revenue for someone else.{" "}
              <Serif>Now build it for yourself.</Serif>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/55">
              Four quick questions, then pick a time for your strategy call.
            </p>
            <div className="mt-10 flex justify-center">
              <GoldCta href="#apply">Start my application</GoldCta>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Earnings disclaimer ────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 pb-10">
        <p className="text-center text-xs leading-relaxed text-white/25">
          Earnings disclaimer: any figures on this page are illustrations, not
          promises or typical results. Your results depend on your experience,
          effort, market conditions and many factors outside our control.
          RemoteRep does not guarantee any level of income, clients or equity.
        </p>
      </section>

      <StickyBar
        watchId="hero"
        actions={[{ href: "#apply", label: "Apply — takes 60 seconds", primary: true }]}
      />
    </MarketingFrame>
  );
}
