import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

// Shared chrome for the secondary marketing pages (/reps, /fractional-cro):
// the same ambient background, glass nav, and footer as the homepage, so the
// pages read as one site. The homepage keeps its own inline copy of this.

// The app lives at app.remoterep.com; marketing CTAs send visitors there.
export const APP = "https://app.remoterep.com";

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
      className={`group relative inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3.5 text-sm font-bold text-dark-background shadow-[0_8px_30px_-8px_rgba(251,220,59,0.6)] transition hover:shadow-[0_12px_40px_-8px_rgba(251,220,59,0.75)] hover:brightness-105 ${className}`}
    >
      {children}
      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 ${className}`}
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
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80">
      <Icon className="h-3.5 w-3.5 text-secondary" />
      {children}
    </span>
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
    <div className="fixed inset-0 z-40 overflow-y-auto overflow-x-hidden scroll-smooth bg-[#05070f] text-white antialiased [scrollbar-width:thin]">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,#101a3a_0%,#080d1e_45%,#05070f_100%)]" />
        <div className="mkt-aurora-a absolute -left-48 top-[-12%] h-[48rem] w-[48rem] rounded-full bg-primary-blue/16 blur-[90px]" />
        <div className="mkt-aurora-b absolute right-[-18%] top-[22%] h-[52rem] w-[52rem] rounded-full bg-[#7c5cff]/14 blur-[90px]" />
        <div className="mkt-aurora-c absolute left-[6%] top-[58%] h-[44rem] w-[44rem] rounded-full bg-secondary/9 blur-[90px]" />
        <div className="mkt-aurora-a absolute right-[4%] bottom-[-8%] h-[42rem] w-[42rem] rounded-full bg-primary/12 blur-[90px]" />
        <div className="mkt-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_65%)] opacity-35" />
      </div>

      <div className="relative z-10">
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
              {nav.map((n) => (
                <a key={n.href} href={n.href} className="transition hover:text-white">
                  {n.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-2.5 text-sm">
              <Link
                href={`${APP}/login`}
                className="rounded-lg px-3 py-2 font-medium text-white/70 transition hover:text-white"
              >
                Login
              </Link>
              <Link
                href={cta.href}
                className="whitespace-nowrap rounded-lg bg-white px-4 py-2 font-semibold text-dark-background transition hover:bg-white/90"
              >
                {cta.label}
              </Link>
            </div>
          </div>
        </header>

        {children}

        <footer className="border-t border-white/[0.06] py-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center text-sm text-white/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/v3-white-logo-with-text.svg"
              alt="RemoteRep.com"
              className="h-8 w-auto opacity-90"
            />
            <p>1 Innovation Way Woodstock, GA 30188</p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/" className="transition hover:text-white">
                For Companies
              </Link>
              <Link href="/reps" className="transition hover:text-white">
                For Sales Reps
              </Link>
              <Link href="/fractional-cro" className="transition hover:text-white">
                Fractional CRO
              </Link>
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
