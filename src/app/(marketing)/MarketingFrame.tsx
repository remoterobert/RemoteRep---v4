import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

// Shared chrome for the secondary marketing pages (/reps, /fractional-cro):
// ambient background, floating glass nav, and footer. The homepage keeps its
// own inline copy of the original chrome.

// The app lives at app.remoterep.com; marketing CTAs send visitors there.
export const APP = "https://app.remoterep.com";

// Editorial serif used (italic) for accent words in headlines.
const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export function GoldCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-secondary px-7 py-4 text-[15px] font-bold text-dark-background shadow-[0_10px_40px_-10px_rgba(251,220,59,0.7),inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_50px_-10px_rgba(251,220,59,0.85),inset_0_1px_0_rgba(255,255,255,0.5)] ${className}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-700 group-hover:translate-x-full"
      />
      <span className="relative">{children}</span>
      <ArrowRightIcon className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export function GhostCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 text-[15px] font-semibold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/[0.08] ${className}`}
    >
      {children}
    </Link>
  );
}

export function Eyebrow({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] py-1.5 pl-2 pr-3.5 text-xs font-semibold text-white/80 backdrop-blur">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary/15">
        <Icon className="h-3 w-3 text-secondary" />
      </span>
      {children}
    </span>
  );
}

/** Numbered section label, e.g. "01 — Open roles". */
export function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-white/45">
      <span className="text-secondary">{n}</span>
      <span className="h-px w-8 bg-white/20" />
      {children}
    </p>
  );
}

export function MarketingFrame({
  nav,
  cta,
  children,
}: {
  nav: { href: string; label: string }[];
  cta: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${display.variable} fixed inset-0 z-40 overflow-y-auto overflow-x-hidden scroll-smooth bg-[#04060d] text-white antialiased selection:bg-secondary selection:text-dark-background [scrollbar-width:thin]`}
    >
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,#0f1a3d_0%,#070c1c_45%,#04060d_100%)]" />
        <div className="absolute -left-48 top-[-12%] h-[48rem] w-[48rem] rounded-full bg-primary-blue/14 blur-[100px]" />
        <div className="absolute right-[-18%] top-[22%] h-[52rem] w-[52rem] rounded-full bg-[#7c5cff]/12 blur-[100px]" />
        <div className="absolute left-[6%] top-[60%] h-[44rem] w-[44rem] rounded-full bg-secondary/7 blur-[100px]" />
        <div className="mkt-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_60%)] opacity-30" />
        <div className="lp-grain absolute inset-0" />
      </div>

      <div className="relative z-10">
        {/* Floating glass nav */}
        <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between rounded-full border border-white/10 bg-[#0a0f20]/60 py-2 pl-5 pr-2 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
            <Link href="/" className="flex shrink-0 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/v3-white-logo-with-text.svg"
                alt="RemoteRep.com"
                className="h-7 w-auto"
              />
            </Link>
            <nav className="hidden items-center gap-1 text-sm font-medium text-white/60 md:flex">
              {nav.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  className="rounded-full px-3.5 py-2 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {n.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-1 text-sm">
              <Link
                href={`${APP}/login`}
                className="hidden rounded-full px-3.5 py-2 font-medium text-white/70 transition hover:text-white sm:block"
              >
                Login
              </Link>
              <Link
                href={cta.href}
                className="whitespace-nowrap rounded-full bg-white px-4 py-2 font-semibold text-dark-background transition hover:bg-white/90"
              >
                {cta.label}
              </Link>
            </div>
          </div>
        </header>

        {children}

        <footer className="relative mt-10 border-t border-white/[0.06] pb-28 pt-16 md:pb-14">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 text-sm sm:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/v3-white-logo-with-text.svg"
                alt="RemoteRep.com"
                className="h-8 w-auto opacity-90"
              />
              <p className="mt-4 max-w-xs text-white/45">
                The sales-specific hiring platform. Built by people who have
                built more than 110 remote sales teams.
              </p>
              <p className="mt-4 text-white/35">
                1 Innovation Way Woodstock, GA 30188
              </p>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">
                Paths
              </p>
              <Link href="/reps" className="block text-white/60 transition hover:text-white">
                For sales reps
              </Link>
              <Link href="/fractional-cro" className="block text-white/60 transition hover:text-white">
                Fractional CRO
              </Link>
              <Link href="/" className="block text-white/60 transition hover:text-white">
                For companies hiring
              </Link>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">
                Legal
              </p>
              <Link href="/privacy" className="block text-white/60 transition hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-white/60 transition hover:text-white">
                Terms of Services
              </Link>
            </div>
          </div>
          <p className="mx-auto mt-12 max-w-6xl px-5 text-xs text-white/30">
            ©2023. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
