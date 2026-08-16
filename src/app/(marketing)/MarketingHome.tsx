import Link from "next/link";
import GlobeConnections from "../(auth)/GlobeConnections";

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

function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.4 7.4a1 1 0 0 1-1.42 0l-3.6-3.6a1 1 0 0 1 1.42-1.42l2.89 2.9 6.69-6.68a1 1 0 0 1 1.42 0Z" />
    </svg>
  );
}

// Reusable pair of primary CTAs used throughout the page.
function CtaRow({ center = false }: { center?: boolean }) {
  return (
    <div
      className={`flex flex-col sm:flex-row gap-3 ${center ? "justify-center" : ""}`}
    >
      <Link
        href={`${APP}/signup`}
        className="rounded-lg bg-secondary px-6 py-3 text-center text-sm font-bold text-dark-background shadow-sm transition hover:opacity-90"
      >
        Looking For Talent? Add Your Listing Now!
      </Link>
      <Link
        href={`${APP}/signup`}
        className="rounded-lg border border-white/25 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
      >
        Sales Rep? Click here to get hired.
      </Link>
    </div>
  );
}

export function MarketingHome() {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-white text-zinc-900">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/v3-logo-with-text.svg"
              alt="RemoteRep.com"
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex">
            <a href="#why" className="hover:text-primary">
              Why RemoteRep.com
            </a>
            <a href="#pricing" className="hover:text-primary">
              Pricing
            </a>
            <Link href={`${APP}/signup`} className="hover:text-primary">
              Sales Rep
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href={`${APP}/login`}
              className="font-medium text-zinc-600 hover:text-primary"
            >
              Login
            </Link>
            <Link
              href={`${APP}/signup`}
              className="rounded-lg bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary-blue"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-dark-background text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-primary-blue/25 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              Save <span className="text-secondary">20 to 30 hours</span> hiring
              your next remote sales rep.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/75">
              List your job in minutes. Automatically match your job listing
              with perfect fit candidates.
            </p>
            <div className="mt-8">
              <CtaRow />
            </div>
            <p className="mt-4 text-sm text-white/60">
              Already have an account?{" "}
              <Link
                href={`${APP}/login`}
                className="font-semibold text-secondary hover:underline"
              >
                Login.
              </Link>
            </p>
          </div>
          <div className="relative hidden aspect-square w-full lg:block">
            <GlobeConnections className="absolute inset-0 h-full w-full" />
          </div>
        </div>
      </section>

      {/* ── Social proof ───────────────────────────────────────── */}
      <section className="border-b border-black/5 bg-zinc-50 py-10">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-400">
          Companies We&apos;ve Worked With
        </p>
      </section>

      {/* ── Value proposition ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="mx-auto max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Find and Hire Your Next Remote Sales Rep in One Convenient Location
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              t: "Remote Sales Reps",
              b: "Browse reps that match your specific needs, skip over the ones that don't.",
            },
            {
              t: "RemoteRep.com",
              b: "We connect the perfect sales candidates with your job listing in one easy to use location.",
            },
            {
              t: "Company",
              b: "Create your job listing with specific criteria to find the perfect fit.",
            },
          ].map((c) => (
            <div
              key={c.t}
              className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-primary">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {c.b}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-4xl">
            The New Way to Affordably Hire Qualified Remote Sales Reps.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-600">
            Traditional hiring and recruiting can take up to 150 candidate
            applications and 30 to 60 hours of interviews just to find one sales
            rep. We cut that time in half. Here&apos;s how.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
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
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
              >
                <div className="text-sm font-black text-secondary">
                  STEP {s.n}
                </div>
                <h3 className="mt-2 text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {s.b}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why RemoteRep ──────────────────────────────────────── */}
      <section id="why" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Why RemoteRep?
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            {
              t: "Hire your next rep in days, not weeks.",
              items: [
                "Set up your profile in just 3 minutes",
                "Create unlimited job listings and specify the skills required for candidates to qualify",
                "Save 20 to 30 hours in the recruitment process",
              ],
            },
            {
              t: "Unrestricted access to a large pool of talented remote sales reps.",
              items: [
                "Sales specific job board makes it easier for you to find the best candidates in less time",
                "Browse thousands of candidates and we'll match the best ones automatically",
                "Invite your top candidates to interview with just one click",
              ],
            },
            {
              t: "Easily manage the hiring process from start to finish.",
              items: [
                "Compare reps quickly to match them to your listing(s)",
                "Bookmark and take notes on your top candidates for each job listing",
                "Communicate with candidates and receive instant notifications when reps are interested",
              ],
            },
          ].map((b) => (
            <div key={b.t}>
              <h3 className="text-lg font-bold">{b.t}</h3>
              <ul className="mt-4 space-y-3">
                {b.items.map((it) => (
                  <li key={it} className="flex gap-3 text-sm text-zinc-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Differentiation ────────────────────────────────────── */}
      <section className="bg-dark-background py-20 text-white">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            The Faster Way To Hire Remote Sales Reps Accurately.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/75">
            Let&apos;s face it; the traditional recruiting process usually takes
            way too long. Most of the time it&apos;s because recruiters
            don&apos;t even know what they&apos;re looking for when hiring for
            remote sales roles. At RemoteRep, we&apos;re sales pros first. We ask
            candidates all the hard questions recruiters don&apos;t even know to
            ask, saving you hundreds of hours sifting through candidates, reading
            resumes, and first round interviews. Then our algorithm uses the
            information to help you make accurate hiring decisions faster.
          </p>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-6 md:grid-cols-3">
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
          ].map((t) => (
            <figure
              key={t.a}
              className="flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
            >
              <div className="text-secondary">★★★★★</div>
              <blockquote className="mt-3 text-base font-bold">
                {t.q}
              </blockquote>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600">
                {t.b}
              </p>
              <figcaption className="mt-4 text-sm font-semibold text-zinc-500">
                {t.a}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── Sign-up CTA band ───────────────────────────────────── */}
      <section className="bg-primary py-16 text-white">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Set up your account in just 3 minutes and start browsing remote
            sales reps.
          </h2>
          <p className="mt-3 text-lg text-white/85">
            Hire as many reps as you want, for each listing.
          </p>
          <div className="mt-8">
            <CtaRow center />
          </div>
        </div>
      </section>

      {/* ── Founder letter ─────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-20">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Letter From Founder
        </h2>
        <div className="mt-6 space-y-4 text-zinc-600 leading-relaxed">
          <p>
            At 12 years old I knew I wanted to do something big. I wanted to
            change the world. At 18 years old I found my way into sales. A few
            years later, I was boots on the ground, selling, as a freelance
            closer for hire. My client, at the time, asked me to find more
            people like me, so I obliged. That was the first sales team I had the
            opportunity to build. This experience taught me that my hours were
            numbered and if I wanted to expand my impact it would have to be
            through other, amazing sales professionals. One became many, and
            we&apos;ve since gone on to build 110 remote sales teams. We
            developed three rules that allowed us to thrive:
          </p>
          <ol className="ml-5 list-decimal space-y-1">
            <li>
              You must provide a significant, measurable return on investment.
            </li>
            <li>
              We must have a complete, 100% belief in the people, product, and
              process.
            </li>
            <li>We have to be able to laugh together.</li>
          </ol>
          <p>
            As long as our clients checked these boxes, we were successful. So
            we stopped taking clients that didn&apos;t match. The result was that
            we were able to place phenomenal salespeople in phenomenal roles.
            Both the rep and the company were able to thrive in this way. We were
            able to change the world through the teams we built and the products
            they sold. The problem was we wanted to expand that same result to
            scale our impact even further. RemoteRep is the product of that
            story. A platform built to give companies like yours access to a
            powerful network of sales professionals, and increase the speed and
            accuracy at which you&apos;re able to hire amazing people. Our hope
            is that this tool will allow you to achieve more impact and revenue
            through these same phenomenal people.
          </p>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────── */}
      <section id="pricing" className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Pricing
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                  p.featured
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-black/5"
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold">{p.name}</h3>
                <div className="mt-2 text-4xl font-extrabold">
                  {p.price}
                  <span className="text-base font-medium text-zinc-400">
                    /month
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  Great for teams who need to hire multiple people for multiple
                  roles!
                </p>
                <Link
                  href={`${APP}/signup`}
                  className={`mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                    p.featured
                      ? "bg-primary text-white hover:bg-primary-blue"
                      : "border border-primary text-primary hover:bg-primary/5"
                  }`}
                >
                  Get Started Now
                </Link>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-center text-sm font-bold uppercase tracking-wide text-zinc-500">
              Every plan includes
            </p>
            <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-zinc-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-dark-background py-12 text-white/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center text-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/v3-white-logo-with-text.svg"
            alt="RemoteRep.com"
            className="h-8 w-auto"
          />
          <p>1 Innovation Way Woodstock, GA 30188</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms of Services
            </Link>
          </div>
          <p className="text-white/40">©2023. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
