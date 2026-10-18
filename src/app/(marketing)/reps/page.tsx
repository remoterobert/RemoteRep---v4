import type { Metadata } from "next";
import {
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
  ChartBarIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import { Reveal } from "../Reveal";
import {
  APP,
  Eyebrow,
  GhostCta,
  GoldCta,
  MarketingFrame,
} from "../MarketingFrame";
import { RedactedRoles } from "./RedactedRoles";

// Reads live listings + the visitor's session, so render per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Remote Sales Jobs for Top Producers | RemoteRep",
  description:
    "Already earning well in sales? Keep the income, lose the commute. RemoteRep matches proven sales professionals with remote roles that pay what you're worth.",
};

const SIGNUP = `${APP}/signup`;

// Commute math used in the "what the office costs you" section.
const COMMUTE_MIN_PER_DAY = 60;
const WORKDAYS = 230;
const COMMUTE_HOURS = Math.round((COMMUTE_MIN_PER_DAY * WORKDAYS) / 60);

export default function RepsLandingPage() {
  return (
    <MarketingFrame
      nav={[
        { href: "#roles", label: "Open roles" },
        { href: "#how", label: "How it works" },
        { href: "#leaders", label: "For sales leaders" },
        { href: "#faq", label: "FAQ" },
      ]}
      cta={{ href: SIGNUP, label: "Join Free" }}
    >
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative">
        <div className="mx-auto max-w-4xl px-5 pb-20 pt-16 text-center lg:pb-24 lg:pt-24">
          <Reveal>
            <Eyebrow icon={SparklesIcon}>
              For closers, AEs and sales leaders already earning six figures
            </Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-7 text-[2.6rem] font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
              You already earn like a top producer.{" "}
              <span className="mkt-shine bg-gradient-to-r from-secondary via-amber-200 to-secondary bg-clip-text text-transparent">
                Why are you still working where they tell you to?
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/65">
              RemoteRep is where companies that pay real commission come to hire
              proven remote sales talent. Keep the income you&apos;ve earned —
              or raise it — and choose where you live, where you work, and how
              you spend the hours you used to lose in traffic.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <GoldCta href="#roles">See Who&apos;s Hiring Now</GoldCta>
              <GhostCta href="/fractional-cro">
                I lead sales teams →
              </GhostCta>
            </div>
            <p className="mt-4 text-sm text-white/45">
              Free for sales professionals. Your profile stays hidden until you
              say otherwise.
            </p>
          </Reveal>

          <Reveal delay={320}>
            <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/10 pt-8">
              {[
                ["110+", "Remote sales teams built"],
                ["$0", "Cost to reps. Ever."],
                ["100%", "Sales roles. Nothing else."],
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
      </section>

      {/* ── Is this you? ───────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-20">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-secondary">
            A quiet question for top producers
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-[2.4rem] sm:leading-[1.12]">
            You&apos;re not unhappy because you can&apos;t sell. You&apos;re
            unhappy because you can.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/65">
            You&apos;ve proven yourself. You carry a number and you hit it. And
            yet, somewhere along the way, the job stopped feeling like yours. See
            if any of this sounds familiar:
          </p>
        </Reveal>
        <ul className="mt-8 space-y-3">
          {[
            "You hit your number — and next year's quota went up while your territory shrank.",
            "Your comp plan has been \"restructured\" more than once, and never in your favor.",
            "You drive to an office to sit on video calls with people in other cities.",
            "You could live anywhere. Your job is the only reason you don't.",
            "You'd leave tomorrow — if you knew the next role would pay as well as this one.",
          ].map((line, i) => (
            <Reveal key={line} delay={i * 60}>
              <li className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-white/80">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/15">
                  <CheckIcon className="h-3.5 w-3.5 text-secondary" />
                </span>
                <span>{line}</span>
              </li>
            </Reveal>
          ))}
        </ul>
        <Reveal>
          <p className="mt-8 text-lg leading-relaxed text-white/65">
            If you nodded at two or more, keep reading. This page was written for
            you — not for someone looking for their first sales job.
          </p>
        </Reveal>
      </section>

      {/* ── Reason why ─────────────────────────────────────────── */}
      <section className="relative py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-[2.4rem] sm:leading-[1.12]">
              Why the best remote sales roles{" "}
              <span className="bg-gradient-to-r from-primary-blue to-[#7c5cff] bg-clip-text text-transparent">
                never reach the job boards.
              </span>
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-white/65">
              <p>
                Post a remote sales job on a general job board and as many as 150
                applications arrive. Many come from people who have never
                carried a quota. The hiring manager can&apos;t tell the closer
                from the tourist, so the good roles get filled by referral — or
                not at all.
              </p>
              <p>
                So the companies serious about hiring remote sales talent stopped
                posting there. They came to RemoteRep, a platform built only for
                sales, where they can see the things that actually predict
                success: the deal sizes you&apos;ve closed, the sales cycles
                you&apos;ve worked, and the decision-makers you&apos;ve sold to.
              </p>
              <p className="font-semibold text-white">
                Here, you aren&apos;t one resume in a pile of 150. You&apos;re a
                proven producer, matched on the record you&apos;ve already built.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                What a hiring company sees
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Typical deal size", "$20,000 – $50,000"],
                  ["Sales cycle", "1 month"],
                  ["Sells to", "C-suite"],
                  ["Environment", "Zoom / video"],
                  ["Sales type", "B2B"],
                  ["Role", "Account executive"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="text-xs text-white/40">{k}</div>
                    <div className="mt-1 font-semibold">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-success/10 p-3 text-sm text-success ring-1 ring-success/20">
                <ArrowTrendingUpIcon className="h-4 w-4 shrink-0" />
                Matched to roles that fit your track record — automatically.
              </div>
              <p className="mt-4 text-xs text-white/35">Example profile.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Redacted open roles ────────────────────────────────── */}
      <section id="roles" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20">
        <Reveal>
          <div className="text-center">
            <Eyebrow icon={LockClosedIcon}>Members-only preview</Eyebrow>
            <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
              Here&apos;s what&apos;s open right now.{" "}
              <span className="text-white/50">The names are for members.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-white/60">
              We show you the role and the money. We hide the company — because
              the companies hiring here are trusting us to send them serious
              sales professionals, not curious browsers.
            </p>
          </div>
        </Reveal>
        <div className="mt-12">
          <RedactedRoles />
        </div>
        <Reveal>
          <div className="mt-10 flex justify-center">
            <GoldCta href={SIGNUP}>Unlock Every Role — Free</GoldCta>
          </div>
        </Reveal>
      </section>

      {/* ── What the office costs you ──────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
            Same quota. Same commission.{" "}
            <span className="mkt-shine bg-gradient-to-r from-secondary via-amber-200 to-secondary bg-clip-text text-transparent">
              A completely different life.
            </span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <h3 className="text-lg font-bold text-white/60">
                The role you have now
              </h3>
              <ul className="mt-5 space-y-3">
                {[
                  "Live within driving distance of an office",
                  `Roughly ${COMMUTE_HOURS} hours a year in the car — on a modest 30-minute commute each way`,
                  "Your earnings ceiling is set by one territory, one manager, one comp plan",
                  "Vacation is a request, not a decision",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-white/55">
                    <XMarkIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger/80" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div className="mkt-ring h-full rounded-2xl p-[1px] shadow-[0_20px_60px_-20px_rgba(0,121,254,0.5)]">
              <div className="h-full rounded-2xl bg-[#0a0f1f] p-7">
                <h3 className="text-lg font-bold">
                  A remote role found on RemoteRep
                </h3>
                <ul className="mt-5 space-y-3">
                  {[
                    "Live where your family, your budget, or your surfboard wants you",
                    `Get those ${COMMUTE_HOURS} hours back — that's ${Math.round(COMMUTE_HOURS / 40)} full work weeks a year`,
                    "Choose roles by comp structure, deal size and sales cycle — before you ever apply",
                    "Work your calendar around your life, not the other way around",
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
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section id="how" className="relative scroll-mt-24 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <h2 className="mx-auto max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
              Three steps. No cover letters. No cold applications.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: UserCircleIcon,
                t: "Build your profile once",
                b: "Tell us what you sell, who you sell to, your deal sizes and your sales cycle. It takes minutes, and you only do it once.",
              },
              {
                n: "02",
                icon: ChartBarIcon,
                t: "Get matched on your record",
                b: "Every open role is scored against your experience. You see the pay and the fit before you spend a minute on an interview.",
              },
              {
                n: "03",
                icon: ChatBubbleLeftRightIcon,
                t: "Talk only to serious buyers",
                b: "Apply with one click, or get invited by companies who already know what you've closed. Chat with them right in the app.",
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.03] p-7">
                  <div className="flex items-center justify-between">
                    <div className="bg-gradient-to-br from-white to-white/40 bg-clip-text text-5xl font-black tracking-tighter text-transparent">
                      {s.n}
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/25 to-secondary/5 text-secondary ring-1 ring-secondary/20">
                      <s.icon className="h-5 w-5" />
                    </div>
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

      {/* ── Founder note ───────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-secondary">
              Why we built this for reps
            </p>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-white/65">
              <p>
                I started as a freelance closer for hire. When my client asked me
                to find more people like me, I built my first remote sales team.
                Since then we&apos;ve built more than 110 of them.
              </p>
              <p>
                In all that time, I learned one thing about great salespeople:
                they rarely leave because of money. They leave because the job
                stopped respecting the producer. The best reps I ever placed
                weren&apos;t looking for a job. They were looking for a better
                deal — and the freedom to live the life their income was supposed
                to buy.
              </p>
              <p className="text-white">
                RemoteRep exists to give you that deal.
              </p>
              <p className="text-base font-semibold text-white/50">
                — Robert, Founder, RemoteRep.com
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Fractional CRO bridge ──────────────────────────────── */}
      <section id="leaders" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20">
        <Reveal>
          <div className="mkt-ring rounded-3xl p-[1px] shadow-[0_30px_80px_-30px_rgba(251,220,59,0.35)]">
            <div className="relative overflow-hidden rounded-3xl bg-[#0a0f1f] px-6 py-12 sm:px-12">
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
              <div className="relative grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-secondary">
                    For managers, directors and VPs of sales
                  </p>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-[2.4rem] sm:leading-[1.12]">
                    If you&apos;ve built and led a sales team, your next job
                    might not be a job at all.
                  </h2>
                  <p className="mt-5 text-lg leading-relaxed text-white/65">
                    Thousands of growing companies need a revenue leader and
                    can&apos;t yet justify a full-time executive. They hire{" "}
                    <strong className="text-white">
                      fractional Chief Revenue Officers
                    </strong>{" "}
                    instead — experienced sales leaders who build the revenue
                    engine for several companies at once, for a monthly retainer
                    and often a share of the equity they help create.
                  </p>
                  <div className="mt-8">
                    <GoldCta href="/fractional-cro">
                      See If You Qualify
                    </GoldCta>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    "Several clients instead of one employer",
                    "Retainers instead of a salary band",
                    "Equity in the companies you grow",
                    "Work from anywhere — by definition",
                  ].map((t) => (
                    <li
                      key={t}
                      className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/80"
                    >
                      <CheckIcon className="h-4 w-4 shrink-0 text-secondary" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-20">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-[2.4rem]">
            Questions top producers ask us
          </h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {[
            {
              q: "What does it cost?",
              a: "Nothing. RemoteRep is free for sales professionals. Companies pay to hire; you never pay to be hired.",
            },
            {
              q: "Will my current employer see that I'm looking?",
              a: "You control your visibility. Keep your profile hidden while you browse and apply on your terms, or switch it to public when you want companies to find and invite you.",
            },
            {
              q: "What kinds of roles are listed?",
              a: "Sales roles only — appointment setters, SDRs, BDRs, account executives, closers, sales managers and sales executives. Every listing shows the role, the compensation structure and the minimum pay up front.",
            },
            {
              q: "I've never worked remotely. Can I still apply?",
              a: "Yes. Companies hire here for what you've sold, not where you sat while you sold it. Your deal sizes, sales cycles and the buyers you've closed matter far more than your office history.",
            },
            {
              q: "Why can't I see the company names?",
              a: "Because the companies hiring here trust us to protect their search. Creating a free account takes a few minutes, and every role unlocks the moment you do.",
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
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="px-5 py-24">
        <Reveal>
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-14 text-center shadow-[0_30px_80px_-30px_rgba(0,121,254,0.4)] backdrop-blur-xl sm:px-12">
            <MapPinIcon className="mx-auto h-8 w-8 text-secondary" />
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
              Your income goes wherever you go. It&apos;s time your job did,
              too.
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Create your free profile and see every open role — company names
              included.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <GoldCta href={SIGNUP}>Create My Free Profile</GoldCta>
              <GhostCta href="#roles">Back to open roles</GhostCta>
            </div>
          </div>
        </Reveal>
      </section>
    </MarketingFrame>
  );
}
