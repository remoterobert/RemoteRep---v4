import type { Metadata } from "next";
import Link from "next/link";
import {
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  LockClosedIcon,
  UserCircleIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";
import { Reveal } from "../Reveal";
import {
  APP,
  Eyebrow,
  GhostCta,
  GoldCta,
  MarketingFrame,
  SectionLabel,
} from "../MarketingFrame";
import { CountUp, LightLine, Spotlight, StickyBar } from "../fx";
import { PortfolioOrbit } from "../PortfolioOrbit";
import { RedactedRoles } from "./RedactedRoles";
import { formatComp, loadRoles } from "./roles-data";

// Reads live listings + the visitor's session, so render per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Remote Sales Jobs for Top Producers | RemoteRep",
  description:
    "Already earning well in sales? Keep the income, lose the commute — or turn your leadership experience into a fractional CRO practice. Two paths, one place.",
};

const SIGNUP = `${APP}/signup`;
const CRO_APPLY = "/fractional-cro#apply";

// Commute math: 30 minutes each way, 230 working days a year.
const COMMUTE_HOURS = Math.round((60 * 230) / 60);
const COMMUTE_WEEKS = Math.round(COMMUTE_HOURS / 40);

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

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`text-[2.2rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[3.4rem] ${className}`}
    >
      {children}
    </h2>
  );
}

function Serif({ children, gold = false }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <span
      className={`lp-serif ${gold ? "mkt-shine bg-gradient-to-r from-secondary via-amber-100 to-secondary bg-clip-text pr-1 text-transparent" : ""}`}
    >
      {children}
    </span>
  );
}

export default async function RepsLandingPage() {
  const roles = await loadRoles();

  return (
    <MarketingFrame
      nav={[
        { href: "#roles", label: "Open roles" },
        { href: "#leaders", label: "Leadership path" },
        { href: "#how", label: "How it works" },
        { href: "#faq", label: "FAQ" },
      ]}
      cta={{ href: SIGNUP, label: "Join free" }}
    >
      {/* ── Hero: choose your path ─────────────────────────────── */}
      <section id="hero" className="relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-10 sm:pt-12">
          <div className="mx-auto max-w-4xl text-center">
            <Reveal>
              <Eyebrow icon={SparklesIcon}>
                For sales professionals already earning six figures
              </Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-[4.6rem]">
                You&apos;ve earned the right{" "}
                <br className="hidden sm:block" />
                to work from{" "}
                <span className="lp-serif mkt-shine bg-gradient-to-r from-secondary via-amber-100 to-secondary bg-clip-text pr-2 font-normal tracking-[-0.02em] text-transparent">
                  anywhere.
                </span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl">
                Keep the income you&apos;ve built — or multiply it — without
                the commute, the capped territory, or the city you&apos;re stuck
                in. <span className="text-white">Choose your path.</span>
              </p>
            </Reveal>
            {/* Phones: both paths reachable without scrolling */}
            <Reveal delay={200} className="md:hidden">
              <div className="mt-7 grid grid-cols-2 gap-2">
                <a
                  href="#roles"
                  className="rounded-2xl border border-primary-blue/40 bg-primary/15 px-3 py-3.5 text-sm font-bold"
                >
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-primary-blue">
                    Path 01
                  </span>
                  Find a role →
                </a>
                <a
                  href="/fractional-cro"
                  className="rounded-2xl bg-secondary px-3 py-3.5 text-sm font-bold text-dark-background"
                >
                  <span className="block text-[10px] uppercase tracking-[0.2em] opacity-60">
                    Path 02
                  </span>
                  I lead teams →
                </a>
              </div>
            </Reveal>
          </div>

          {/* The two paths */}
          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
            <Reveal delay={220} className="h-full">
              <Spotlight className="h-full rounded-[28px]">
                <Link
                  href="#roles"
                  className="lp-border lp-border-blue group block h-full rounded-[28px] shadow-[0_30px_80px_-30px_rgba(0,121,254,0.55)] transition duration-300 hover:-translate-y-1"
                >
                  <div className="flex h-full flex-col rounded-[27px] bg-[#070c1d]/95 p-7">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-blue">
                        Path 01
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">
                        I want a better role
                      </span>
                    </div>
                    <h3 className="mt-5 text-[1.75rem] font-bold leading-[1.1] tracking-tight sm:text-[2rem]">
                      A remote role that pays{" "}
                      <span className="lp-serif font-normal text-primary-blue">
                        what you&apos;re worth.
                      </span>
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-white/55">
                      For closers, AEs and SDRs. See the money up front, get
                      matched on your track record, and talk only to companies
                      who hire remote.
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center gap-2 text-[11px] text-white/45">
                          <span className="relative flex h-2 w-2">
                            <span className="lp-ping absolute inline-flex h-full w-full rounded-full bg-success" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                          </span>
                          Open right now
                        </div>
                        <div className="mt-1.5 text-lg font-extrabold tracking-tight sm:text-2xl">
                          {roles.total > 0 ? `${roles.total} roles` : "New weekly"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[11px] text-white/45">Top minimum pay</div>
                        <div className="mt-1.5 text-lg font-extrabold tracking-tight sm:text-2xl text-secondary">
                          {roles.topComp ? formatComp(roles.topComp) : "Members only"}
                        </div>
                      </div>
                    </div>
                    <span className="mt-auto inline-flex items-center gap-2 pt-6 text-[15px] font-bold text-white">
                      See open roles
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Spotlight>
            </Reveal>

            <Reveal delay={300} className="h-full">
              <Spotlight className="h-full rounded-[28px]">
                <Link
                  href="/fractional-cro"
                  className="lp-border group block h-full rounded-[28px] shadow-[0_30px_80px_-30px_rgba(251,220,59,0.45)] transition duration-300 hover:-translate-y-1"
                >
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[27px] bg-[#0b0d18]/95 p-7">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-secondary/15 blur-3xl" />
                    <div className="relative flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-secondary">
                        Path 02
                      </span>
                      <span className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                        I lead sales teams
                      </span>
                    </div>
                    <h3 className="relative mt-5 text-[1.75rem] font-bold leading-[1.1] tracking-tight sm:text-[2rem]">
                      Become a Fractional CRO.{" "}
                      <span className="lp-serif font-normal text-secondary">
                        Retainers plus equity.
                      </span>
                    </h3>
                    <p className="relative mt-3 text-[15px] leading-relaxed text-white/55">
                      For managers, directors and VPs. Lead revenue for several
                      growing companies at once — and own a piece of what you
                      build.
                    </p>
                    <div className="relative mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex -space-x-2">
                        {["A", "B", "C"].map((l, i) => (
                          <span
                            key={l}
                            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0b0d18] text-xs font-bold ${
                              ["bg-primary-blue", "bg-[#7c5cff]", "bg-secondary text-dark-background"][i]
                            }`}
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                      <div className="text-sm leading-tight">
                        <div className="font-semibold">Several clients, one practice</div>
                        <div className="text-xs text-white/45">
                          Monthly retainers · equity · fully remote
                        </div>
                      </div>
                    </div>
                    <span className="relative mt-auto inline-flex items-center gap-2 pt-6 text-[15px] font-bold text-secondary">
                      Explore the leadership path
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Spotlight>
            </Reveal>
          </div>

          <Reveal delay={380}>
            <ul className="mx-auto mt-9 flex max-w-3xl flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm text-white/45">
              {[
                "Free for sales professionals",
                "Profile hidden until you choose",
                "110+ remote sales teams built",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-secondary" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <div aria-hidden className="lp-eclipse pointer-events-none absolute inset-x-[-20%] bottom-0 h-40" />
      </section>

      {/* ── Logos ──────────────────────────────────────────────── */}
      <section className="py-12">
        <p className="mb-7 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-white/30">
          Our team has built sales teams for
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="mkt-marquee flex w-max gap-14 whitespace-nowrap pr-14">
            {[...CLIENTS, ...CLIENTS].map((c, i) => (
              <span key={`${c}-${i}`} className="text-xl font-semibold tracking-tight text-white/35">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Path 01: redacted roles ────────────────────────────── */}
      <section id="roles" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-24">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <Reveal className="max-w-2xl">
            <SectionLabel n="01">Path one · Open roles</SectionLabel>
            <H2 className="mt-5">
              The money is on the card. <Serif gold>The name is for members.</Serif>
            </H2>
          </Reveal>
          <Reveal delay={100} className="max-w-sm">
            <p className="text-white/55">
              Companies hiring here trust us to send them proven producers, not
              curious browsers. So we show you the role and the pay — and keep
              the company private until you join.
            </p>
          </Reveal>
        </div>

        <div className="mt-12">
          <RedactedRoles data={roles} />
        </div>

        <Reveal>
          <div className="mt-10 flex flex-col items-center gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-center sm:flex-row sm:justify-between sm:p-7 sm:text-left">
            <div className="flex items-center gap-4">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 ring-1 ring-secondary/25 sm:flex">
                <LockClosedIcon className="h-5 w-5 text-secondary" />
              </span>
              <div>
                <p className="text-lg font-bold">
                  {roles.total > 0
                    ? `Unlock all ${roles.total} open roles — company names included.`
                    : "Unlock every open role — company names included."}
                </p>
                <p className="text-sm text-white/50">
                  Free account. About three minutes. No cover letters.
                </p>
              </div>
            </div>
            <GoldCta href={SIGNUP} className="shrink-0">
              Create free account
            </GoldCta>
          </div>
        </Reveal>
      </section>

      {/* ── Path 02: Fractional CRO ────────────────────────────── */}
      <section id="leaders" className="scroll-mt-28 px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="lp-border rounded-[36px] shadow-[0_40px_120px_-40px_rgba(251,220,59,0.35)]">
              <div className="relative overflow-hidden rounded-[35px] bg-[#080b17] px-6 py-14 sm:px-14">
                <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-primary-blue/15 blur-3xl" />
                <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-secondary/12 blur-3xl" />
                <div className="relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
                  <div>
                    <SectionLabel n="02">Path two · For sales leaders</SectionLabel>
                    <H2 className="mt-5">
                      If you&apos;ve led a team, your next job{" "}
                      <Serif gold>might not be a job.</Serif>
                    </H2>
                    <p className="mt-6 text-lg leading-relaxed text-white/60">
                      Thousands of growing companies need a revenue leader and
                      can&apos;t justify a full-time executive. So they hire a{" "}
                      <strong className="font-semibold text-white">
                        fractional Chief Revenue Officer
                      </strong>{" "}
                      — an experienced sales leader who builds the revenue engine
                      for several companies at once, for a monthly retainer and
                      often a share of the equity.
                    </p>
                    <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                      {[
                        "Several clients, not one boss",
                        "Retainers, not a salary band",
                        "Equity in what you grow",
                        "Remote by definition",
                      ].map((t) => (
                        <li key={t} className="flex items-center gap-3 text-[15px] text-white/80">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/15">
                            <CheckIcon className="h-3.5 w-3.5 text-secondary" />
                          </span>
                          {t}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                      <GoldCta href={CRO_APPLY}>Apply for the leadership path</GoldCta>
                      <GhostCta href="/fractional-cro">How it works</GhostCta>
                    </div>
                  </div>
                  <div className="relative mx-auto w-full max-w-[30rem]">
                    <PortfolioOrbit />
                    <p className="mt-2 text-center text-[11px] text-white/30">
                      Illustration of a fractional practice. Not a typical result.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Sound familiar? (statement lines) ──────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-28">
        <SectionLabel n="03">Sound familiar?</SectionLabel>
        <div className="mt-10 space-y-3 text-[2.1rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[3.6rem]">
          <LightLine>You hit your number.</LightLine>
          <LightLine>They raised the quota.</LightLine>
          <LightLine>They cut the territory.</LightLine>
          <LightLine>They changed the comp plan. Again.</LightLine>
          <LightLine>And you still drive in to sit on Zoom.</LightLine>
        </div>
        <Reveal>
          <p className="mt-14 max-w-3xl text-2xl leading-snug text-white/60 sm:text-[2rem]">
            You&apos;re not unhappy because you can&apos;t sell.{" "}
            <Serif gold>You&apos;re unhappy because you can.</Serif>
          </p>
        </Reveal>
      </section>

      {/* ── The commute number ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <p className="text-[6.5rem] font-extrabold leading-none tracking-[-0.06em] sm:text-[10rem]">
              <span className="bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent">
                <CountUp to={COMMUTE_HOURS} />
              </span>
            </p>
            <p className="mt-3 text-xl font-semibold">
              hours a year <Serif gold>in the car.</Serif>
            </p>
            <p className="mt-4 max-w-md text-white/55">
              That&apos;s what a modest 30-minute commute each way costs you —
              about {COMMUTE_WEEKS} full work weeks, every year, spent in
              traffic so you can join video calls from a desk.
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-[24px] border border-white/10 bg-white/[0.02] p-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">
                  Your role now
                </p>
                <ul className="mt-5 space-y-4">
                  {[
                    "Live near the office",
                    `${COMMUTE_HOURS} hours a year commuting`,
                    "One territory, one manager, one ceiling",
                    "Vacation is a request",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-sm text-white/45">
                      <XMarkIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger/70" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={90}>
              <div className="lp-border lp-border-blue h-full rounded-[24px]">
                <div className="h-full rounded-[23px] bg-[#070c1d] p-7">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-blue">
                    Remote, via RemoteRep
                  </p>
                  <ul className="mt-5 space-y-4">
                    {[
                      "Live anywhere you like",
                      `${COMMUTE_WEEKS} work weeks back each year`,
                      "Pick roles by pay, deal size and cycle",
                      "Your calendar, your life",
                    ].map((t) => (
                      <li key={t} className="flex gap-3 text-sm text-white/85">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Why roles never reach the job boards ───────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionLabel n="04">The reason why</SectionLabel>
            <H2 className="mt-5">
              The best remote roles <Serif gold>never reach the job boards.</Serif>
            </H2>
            <div className="mt-7 space-y-5 text-lg leading-relaxed text-white/60">
              <p>
                Post a remote sales job publicly and as many as 150 applications
                arrive — many from people who have never carried a quota. The
                good roles end up filled by referral, or not at all.
              </p>
              <p>
                So serious companies hire on a platform built only for sales,
                where they can see what actually predicts success: the deal sizes
                you&apos;ve closed, the cycles you&apos;ve worked, and the
                buyers you&apos;ve sold to.
              </p>
              <p className="text-white">
                Here you aren&apos;t one resume in a pile. You&apos;re a proven
                producer, matched on the record you&apos;ve already built.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative">
              <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-primary-blue/20 via-transparent to-secondary/15 blur-2xl" />
              <div className="relative rounded-[28px] border border-white/10 bg-[#0a0f20]/90 p-7 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-blue to-[#7c5cff] text-lg font-bold">
                    JR
                  </div>
                  <div>
                    <p className="font-bold">Account Executive</p>
                    <p className="text-sm text-white/45">B2B · Sells to C-suite</p>
                  </div>
                  <span className="ml-auto rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success ring-1 ring-success/30">
                    96% match
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Typical deal size", "$20k – $50k"],
                    ["Sales cycle", "1 month"],
                    ["Environment", "Zoom / video"],
                    ["Experience", "7 years"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                      <div className="text-[11px] text-white/40">{k}</div>
                      <div className="mt-1 font-semibold">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-3 rounded-xl bg-primary/15 p-3.5 text-sm text-white/80 ring-1 ring-primary-blue/25">
                  <ArrowTrendingUpIcon className="h-4 w-4 shrink-0 text-primary-blue" />
                  Invited to interview by 3 companies this week
                </div>
                <p className="mt-4 text-[11px] text-white/30">Example profile, for illustration.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-24">
        <Reveal>
          <SectionLabel n="05">How it works</SectionLabel>
          <H2 className="mt-5 max-w-3xl">
            Three steps. <Serif gold>No cover letters.</Serif>
          </H2>
        </Reveal>
        <div className="relative mt-14 grid gap-5 md:grid-cols-3">
          <div aria-hidden className="absolute left-[16%] right-[16%] top-[42px] hidden h-px bg-gradient-to-r from-primary-blue/0 via-secondary/50 to-primary-blue/0 md:block" />
          {[
            {
              icon: UserCircleIcon,
              t: "Build your profile once",
              b: "What you sell, who you sell to, your deal sizes and your cycle. Minutes, not hours — and only once.",
            },
            {
              icon: ChartBarIcon,
              t: "Get matched on your record",
              b: "Every open role is scored against your experience. You see the pay and the fit before any interview.",
            },
            {
              icon: ChatBubbleLeftRightIcon,
              t: "Talk only to serious buyers",
              b: "Apply in one click, or get invited by companies who already know what you've closed.",
            },
          ].map((s, i) => (
            <Reveal key={s.t} delay={i * 100}>
              <Spotlight className="h-full rounded-[24px]">
                <div className="h-full rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-7">
                  <div className="relative flex h-[56px] w-[56px] items-center justify-center rounded-2xl bg-[#0a0f20] ring-1 ring-white/15">
                    <s.icon className="h-6 w-6 text-secondary" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[11px] font-extrabold text-dark-background">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold tracking-tight">{s.t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/55">{s.b}</p>
                </div>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Founder pull-quote ─────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-28 text-center">
        <Reveal>
          <span className="lp-serif block text-8xl leading-none text-secondary/60">&ldquo;</span>
          <blockquote className="lp-serif -mt-6 text-[2rem] leading-[1.2] text-white sm:text-[3.1rem]">
            Great salespeople rarely leave because of money. They leave because
            the job stopped respecting the producer.
          </blockquote>
          <p className="mx-auto mt-8 max-w-2xl text-white/50">
            I started as a freelance closer for hire and went on to build more
            than 110 remote sales teams. RemoteRep exists to give producers the
            deal — and the freedom — their income was supposed to buy.
          </p>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
            Robert · Founder, RemoteRep.com
          </p>
        </Reveal>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-24">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <SectionLabel n="06">Questions</SectionLabel>
            <H2 className="mt-5">
              Asked by <Serif gold>top producers.</Serif>
            </H2>
          </Reveal>
          <div className="space-y-3">
            {[
              {
                q: "What does it cost?",
                a: "Nothing. RemoteRep is free for sales professionals. Companies pay to hire; you never pay to be hired.",
              },
              {
                q: "Will my current employer see that I'm looking?",
                a: "You control your visibility. Keep your profile hidden while you browse and apply on your terms, or make it public when you want companies to find and invite you.",
              },
              {
                q: "What kinds of roles are listed?",
                a: "Sales roles only — appointment setters, SDRs, BDRs, account executives, closers, sales managers and sales executives. Every listing shows the role, comp structure and minimum pay up front.",
              },
              {
                q: "I've never worked remotely. Can I still apply?",
                a: "Yes. Companies hire here for what you've sold, not where you sat while you sold it.",
              },
              {
                q: "What's the difference between the two paths?",
                a: "Path one is a remote sales role with one company. Path two is for people who have led sales teams: you become a fractional Chief Revenue Officer, serving several companies on retainer, often with equity. You can explore both.",
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

      {/* ── Final: both paths again ────────────────────────────── */}
      <section className="relative overflow-hidden px-5 pb-28 pt-24">
        <div aria-hidden className="lp-eclipse pointer-events-none absolute inset-x-[-20%] top-0 h-40 rotate-180" />
        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <h2 className="text-[2.6rem] font-extrabold leading-[1] tracking-[-0.04em] sm:text-[4.4rem]">
              Your income goes wherever you go.{" "}
              <Serif gold>Now your career can, too.</Serif>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <Link
                href={SIGNUP}
                className="group flex items-center justify-between rounded-[22px] border border-white/12 bg-white/[0.04] p-6 text-left transition hover:-translate-y-1 hover:border-primary-blue/50"
              >
                <span>
                  <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-primary-blue">
                    Path 01
                  </span>
                  <span className="mt-1 block text-lg font-bold">Find a remote role</span>
                </span>
                <ArrowRightIcon className="h-5 w-5 text-white/50 transition group-hover:translate-x-1 group-hover:text-white" />
              </Link>
              <Link
                href={CRO_APPLY}
                className="group flex items-center justify-between rounded-[22px] bg-secondary p-6 text-left text-dark-background shadow-[0_20px_60px_-20px_rgba(251,220,59,0.7)] transition hover:-translate-y-1"
              >
                <span>
                  <span className="block text-[11px] font-bold uppercase tracking-[0.2em] opacity-60">
                    Path 02
                  </span>
                  <span className="mt-1 block text-lg font-bold">Apply as a sales leader</span>
                </span>
                <ArrowRightIcon className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <StickyBar
        watchId="hero"
        actions={[
          { href: "#roles", label: "See open roles" },
          { href: CRO_APPLY, label: "Leadership path", primary: true },
        ]}
      />
    </MarketingFrame>
  );
}
