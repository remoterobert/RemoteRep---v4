import Link from "next/link";

const APP = "https://app.remoterep.com";

/**
 * Shared full-screen dark layout for the legal pages (Privacy, Terms) so they
 * match the marketing site. Renders a simple header, a prose body from the
 * given sections, and a slim footer.
 */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: { h: string; p: string }[];
}) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#05070f] text-white antialiased">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#070a16]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/v3-white-logo-with-text.svg"
              alt="RemoteRep.com"
              className="h-8 w-auto"
            />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-white/60 transition hover:text-white"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-white/40">Last updated {updated}</p>
        <p className="mt-8 text-lg leading-relaxed text-white/70">{intro}</p>

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-bold">{s.h}</h2>
              <p className="mt-2 leading-relaxed text-white/65">{s.p}</p>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
          Questions? Contact us at{" "}
          <a
            href="mailto:support@remoterep.com"
            className="font-semibold text-white/85 hover:underline"
          >
            support@remoterep.com
          </a>{" "}
          — RemoteRep, 1 Innovation Way, Woodstock, GA 30188.
        </div>

        <p className="mt-10 text-center text-sm text-white/40">
          <Link
            href={`${APP}/signup`}
            className="font-semibold text-secondary hover:underline"
          >
            Create your free account →
          </Link>
        </p>
      </main>
    </div>
  );
}
