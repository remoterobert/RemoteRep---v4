import type { Metadata } from "next";
import {
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  PresentationChartLineIcon,
  BanknotesIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import { Reveal } from "../Reveal";
import { Eyebrow, GoldCta, GhostCta, MarketingFrame } from "../MarketingFrame";
import { IntakeForm } from "./IntakeForm";

export const metadata: Metadata = {
  title: "Become a Fractional CRO | RemoteRep",
  description:
    "For sales leaders who have built and run teams: learn how to turn your experience into a portfolio of fractional Chief Revenue Officer clients — retainers plus equity.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// Illustrative portfolio for the hero card. Clearly labelled as an example on
// the page — not a promise of earnings.
const EXAMPLE_CLIENTS = [
  { name: "B2B SaaS, Series A", retainer: 12_000, equity: "1.0%" },
  { name: "Home services, $8M revenue", retainer: 10_000, equity: "0.5%" },
  { name: "Fintech, seed stage", retainer: 9_000, equity: "1.5%" },
];
const EXAMPLE_ANNUAL =
  EXAMPLE_CLIENTS.reduce((s, c) => s + c.retainer, 0) * 12;

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
        { href: "#letter", label: "The opportunity" },
        { href: "#program", label: "The program" },
        { href: "#fit", label: "Who it's for" },
        { href: "#faq", label: "FAQ" },
      ]}
      cta={{ href: "#apply", label: "Apply" }}
    >
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-24">
          <div>
            <Reveal>
              <Eyebrow icon={SparklesIcon}>
                For sales managers, directors and VPs who have built teams
              </Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-[2.5rem] font-extrabold leading-[1.05] tracking-tight sm:text-[3.4rem]">
                Why experienced sales leaders are trading one salary for{" "}
                <span className="mkt-shine bg-gradient-to-r from-secondary via-amber-200 to-secondary bg-clip-text text-transparent">
                  three retainers — plus equity.
                </span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
                As a fractional Chief Revenue Officer, you sell your expertise —
                not your hours — to growing companies that need a revenue leader
                but can&apos;t yet justify a full-time one. Our program shows you
                how to land your first clients and structure engagements worth
                multiple six figures a year, plus equity in the companies you
                grow.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <GoldCta href="#apply">Apply for a Strategy Call</GoldCta>
                <GhostCta href="#letter">Read the full story</GhostCta>
              </div>
              <p className="mt-4 text-sm text-white/45">
                Takes about 2 minutes. Applications reviewed by our team.
              </p>
            </Reveal>
          </div>

          {/* Illustrative portfolio */}
          <Reveal delay={200}>
            <div className="mkt-ring rounded-3xl p-[1px] shadow-[0_30px_80px_-30px_rgba(251,220,59,0.35)]">
              <div className="rounded-3xl bg-[#0a0f1f] p-7">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                    A fractional CRO portfolio
                  </p>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/50">
                    Illustration
                  </span>
                </div>
                <ul className="mt-5 space-y-3">
                  {EXAMPLE_CLIENTS.map((c) => (
                    <li
                      key={c.name}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div>
                        <div className="text-sm font-semibold">{c.name}</div>
                        <div className="mt-0.5 text-xs text-white/45">
                          ${c.retainer.toLocaleString()}/mo retainer
                        </div>
                      </div>
                      <span className="rounded-lg bg-secondary/15 px-2.5 py-1 text-xs font-bold text-secondary">
                        +{c.equity} equity
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-5">
                  <span className="text-sm text-white/50">
                    Annual retainers
                  </span>
                  <span className="text-3xl font-extrabold tracking-tight">
                    ${EXAMPLE_ANNUAL.toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-white/35">
                  Hypothetical example for illustration only. Not a typical
                  result or a guarantee of earnings.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── The letter ─────────────────────────────────────────── */}
      <section id="letter" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-secondary">
              Dear sales leader,
            </p>
            <div className="mt-6 space-y-6 text-lg leading-relaxed text-white/70">
              <p className="text-2xl font-bold leading-snug text-white">
                You already know how to build a revenue engine. The only
                question is who gets to own what it produces.
              </p>
              <p>
                You&apos;ve hired the reps. You&apos;ve written the playbook,
                built the pipeline, fixed the forecast and coached people who
                were about to quit into people who carried the team. You know
                what most founders will spend years and millions learning the
                hard way.
              </p>
              <p>
                And for all of that, you&apos;re paid a salary set by a band, a
                bonus set by a committee, and — if you&apos;re lucky — a sliver
                of equity that vests long after you&apos;ve built the thing that
                made it valuable.
              </p>
              <p>
                Now consider the other side of the table.
              </p>
              <p>
                Right now, thousands of companies doing a few million dollars a
                year are stuck in the same place. The founder is still the best
                salesperson in the building. The team is a handful of reps with
                no process, no forecast and no one to coach them. These companies
                desperately need a revenue leader — and they cannot justify
                paying a full-time executive salary to get one.
              </p>
              <p className="border-l-2 border-secondary pl-5 text-white">
                That gap — between what these companies need and what they can
                afford — is the opportunity. A fractional CRO fills it. You lead
                revenue for several companies at once, a few days a month each,
                for a monthly retainer. And because you&apos;re building the
                thing that drives their valuation, equity is very often part of
                the deal.
              </p>
              <p>
                It isn&apos;t a new idea. Fractional CFOs have worked this way for
                decades. What&apos;s new is that remote work made it normal for a
                company to have an executive who isn&apos;t in the building — and
                founders have started looking for revenue leaders the same way.
              </p>
              <p>
                But knowing the opportunity exists and actually landing your
                first three clients are two very different things. That&apos;s
                what our program is for.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── What a fractional CRO does ─────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
            You&apos;ll do the work you&apos;re already great at.{" "}
            <span className="bg-gradient-to-r from-primary-blue to-[#7c5cff] bg-clip-text text-transparent">
              For several companies at once.
            </span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: WrenchScrewdriverIcon,
              t: "Build the sales process",
              b: "Turn a founder's instincts into a repeatable playbook any good rep can run.",
            },
            {
              icon: UserGroupIcon,
              t: "Hire and coach the team",
              b: "Recruit the right reps, set the comp plans, and develop the people who'll carry the number.",
            },
            {
              icon: PresentationChartLineIcon,
              t: "Install pipeline and forecasting",
              b: "Give the founder a forecast they can take to the board — and believe.",
            },
            {
              icon: BanknotesIcon,
              t: "Own the revenue strategy",
              b: "Pricing, packaging, channels and targets: the decisions that move valuation.",
            },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 80}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:border-secondary/40 hover:bg-white/[0.05]">
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
        <Reveal>
          <p className="mx-auto mt-10 max-w-2xl text-center text-white/60">
            And when your clients need reps, you&apos;ll have RemoteRep&apos;s
            network of remote sales talent behind you — the same platform
            companies already use to hire.
          </p>
        </Reveal>
      </section>

      {/* ── The program ────────────────────────────────────────── */}
      <section id="program" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-4xl px-5">
          <Reveal>
            <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-secondary">
              The program
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
              From sales leader to fractional CRO, step by step.
            </h2>
          </Reveal>
          <ol className="mt-14 space-y-4">
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
                b: "How to set a retainer that reflects your value, and how to structure equity so it's real — not a promise on a napkin.",
              },
              {
                t: "Deliver results in the first 90 days",
                b: "A proven framework for the first engagement, so your first client becomes your best reference.",
              },
              {
                t: "Grow to a full portfolio",
                b: "Manage several clients without burning out — and decide how many you actually want.",
              },
            ].map((m, i) => (
              <Reveal key={m.t} delay={i * 60}>
                <li className="flex gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <span className="bg-gradient-to-br from-white to-white/40 bg-clip-text text-4xl font-black leading-none tracking-tighter text-transparent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{m.t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                      {m.b}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Who it's for / not for ─────────────────────────────── */}
      <section id="fit" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
            This program is not for everyone. Please read this before you apply.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="mkt-ring h-full rounded-2xl p-[1px]">
              <div className="h-full rounded-2xl bg-[#0a0f1f] p-7">
                <h3 className="text-lg font-bold">This is for you if…</h3>
                <ul className="mt-5 space-y-3">
                  {[
                    "You've hired, managed and coached a sales team — not just been on one",
                    "You've owned a number bigger than your personal quota",
                    "You want to be paid for outcomes and ownership, not for hours",
                    "You're willing to put in focused work to land your first clients",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-sm text-white/75">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <h3 className="text-lg font-bold text-white/60">
                This is not for you if…
              </h3>
              <ul className="mt-5 space-y-3">
                {[
                  "You've never managed people — start with our remote rep roles instead",
                  "You're looking for a guaranteed paycheck with no ramp-up",
                  "You want a get-rich-quick scheme. This is a real business.",
                  "You aren't willing to talk to founders about their numbers",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-white/55">
                    <XMarkIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger/80" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Founder authority ──────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-secondary">
                Who&apos;s behind this
              </p>
              <p className="mt-5 text-lg leading-relaxed text-white/70">
                RemoteRep&apos;s founder started as a freelance closer and went on
                to build more than 110 remote sales teams for companies like
                BookProfits.com, FUELED and The Legion of Loan Officers. This
                program teaches the business behind that work: how to be the
                revenue leader growing companies can&apos;t find — and how to be
                paid like an owner for it.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Application ────────────────────────────────────────── */}
      <section id="apply" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <Eyebrow icon={ShieldCheckIcon}>Step 1 of 2</Eyebrow>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
              Apply for your Fractional CRO strategy call.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/65">
              Tell us about your leadership experience. On the next screen
              you&apos;ll pick a time for a one-on-one call, where we&apos;ll
              look at your background and map out what a fractional CRO practice
              could look like for you.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "A clear read on whether your experience is a fit",
                "What clients, retainers and equity could look like for you",
                "Exactly how the program works — and what it costs",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-white/75">
                  <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-secondary" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-white/40">
              No pressure, no obligation. If it isn&apos;t a fit, we&apos;ll tell
              you.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_-30px_rgba(0,121,254,0.4)] backdrop-blur-xl sm:p-8">
              <IntakeForm utm={utm} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-20">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-[2.4rem]">
            Fair questions
          </h2>
        </Reveal>
        <div className="mt-10 space-y-3">
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
              a: "Equity is common in fractional executive work because you're building the thing that drives the company's value. The program covers how to structure it properly so it's worth something.",
            },
            {
              q: "Do I need to have been a CRO or VP before?",
              a: "No. You need real experience leading a sales team and owning a number. Titles vary; results and leadership matter more.",
            },
          ].map((f) => (
            <Reveal key={f.q}>
              <details className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 open:bg-white/[0.05]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <span className="text-xl leading-none text-secondary transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {f.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-12 flex justify-center">
            <GoldCta href="#apply">Apply for a Strategy Call</GoldCta>
          </div>
        </Reveal>
      </section>

      {/* ── Earnings disclaimer ────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 pb-16">
        <p className="text-center text-xs leading-relaxed text-white/30">
          Earnings disclaimer: any figures on this page are illustrations, not
          promises or typical results. Your results depend on your experience,
          effort, market conditions and many factors outside our control.
          RemoteRep does not guarantee any level of income, clients or equity.
        </p>
      </section>
    </MarketingFrame>
  );
}
