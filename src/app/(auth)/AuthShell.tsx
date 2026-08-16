import Link from "next/link";

/**
 * Split-screen shell for the login / signup pages: a bold navy marketing
 * panel on the left (hidden on small screens) and the auth form on the right.
 * Brings back the "flare" of the v3 sign-in while matching the v4 brand tokens.
 */
export default function AuthShell({
  active,
  title,
  subtitle,
  error,
  children,
}: {
  active: "login" | "signup";
  title: string;
  subtitle?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const tab = (isActive: boolean) =>
    `rounded-full px-5 py-1.5 transition-colors ${
      isActive
        ? "bg-primary text-white shadow-sm"
        : "text-foreground/55 hover:text-foreground"
    }`;

  return (
    // Full-screen overlay so the login/signup screens stand on their own —
    // they sit above the global guest top-nav (rendered by AppShell) rather
    // than beneath it, which would double up the logo and chrome.
    <main className="fixed inset-0 z-50 overflow-y-auto bg-surface lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ── Left: marketing panel ─────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-dark-background px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        {/* ambient color + grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-primary-blue/30 blur-3xl" />
          <div className="absolute right-[-6rem] top-1/3 h-80 w-80 rounded-full bg-primary/40 blur-3xl" />
          <div className="absolute bottom-[-6rem] left-1/4 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:44px_44px]" />
        </div>

        {/* logo */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/v3-white-logo-with-text.svg"
            alt="RemoteRep"
            className="h-9 w-auto"
          />
        </div>

        {/* headline */}
        <div className="relative max-w-xl">
          <h2 className="text-4xl font-extrabold leading-[1.08] tracking-tight xl:text-5xl">
            The first <span className="text-secondary">NO COST</span> job board
            to instantly match sales reps with incredible remote opportunities.
          </h2>
          <p className="mt-6 text-lg text-white/70">
            Connecting top sales reps with high-quality remote jobs — fast,
            free, and hassle-free.
          </p>

          <ul className="mt-9 space-y-4">
            {[
              "Post a job in minutes",
              "Auto-matched to perfect-fit candidates",
              "Always free to get started",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-secondary/20 text-secondary">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.4 7.4a1 1 0 0 1-1.42 0l-3.6-3.6a1 1 0 0 1 1.42-1.42l2.89 2.9 6.69-6.68a1 1 0 0 1 1.42 0Z" />
                  </svg>
                </span>
                <span className="text-base text-white/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* trust line */}
        <p className="relative text-sm text-white/45">
          Trusted by remote sales teams hiring worldwide.
        </p>
      </aside>

      {/* ── Right: form ───────────────────────────────────────────── */}
      <section className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          {/* logo (mobile only — the left panel carries it on desktop) */}
          <div className="mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/v3-logo-with-text.svg"
              alt="RemoteRep"
              className="h-8 w-auto dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/v3-white-logo-with-text.svg"
              alt="RemoteRep"
              className="hidden h-8 w-auto dark:block"
            />
          </div>

          {/* Login / Sign up toggle */}
          <div className="mb-7 inline-flex rounded-full bg-surface-3 p-1 text-sm font-medium">
            <Link href="/login" className={tab(active === "login")}>
              Login
            </Link>
            <Link href="/signup" className={tab(active === "signup")}>
              Sign up
            </Link>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-foreground/60">{subtitle}</p>
          )}

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            >
              {error}
            </div>
          )}

          <div className="mt-6">{children}</div>
        </div>
      </section>
    </main>
  );
}
