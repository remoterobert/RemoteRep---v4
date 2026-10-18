import Link from "next/link";
import {
  LockClosedIcon,
  BanknotesIcon,
  ClockIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/solid";
import { APP } from "../MarketingFrame";
import { Spotlight } from "../fx";
import { formatComp, type RoleCard, type RolesData } from "./roles-data";

// Presentation for the members-only role preview. Data (already redacted on
// the server) comes from loadRoles() in roles-data.ts.

function Facet({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/70">
      <Icon className="h-3 w-3 text-white/40" />
      {children}
    </span>
  );
}

function Bar({ width, className = "" }: { width: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`lp-redact block h-3 rounded-sm ${className}`}
      style={{ width: `${width}%` }}
    />
  );
}

function Card({ c, signedIn, i }: { c: RoleCard; signedIn: boolean; i: number }) {
  return (
    <Spotlight className="h-full rounded-[22px]">
      <Link
        href={c.href}
        className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition duration-300 hover:-translate-y-1 hover:border-white/20"
      >
        {/* file tab */}
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
          <span>File #{String(i + 1).padStart(3, "0")}</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Hiring
          </span>
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-white/45">{c.role}</p>
            <p className="mt-1 text-[2.1rem] font-extrabold leading-none tracking-tight">
              {c.minComp != null ? formatComp(c.minComp) : "Comp in listing"}
            </p>
            {c.minComp != null && (
              <p className="mt-1.5 text-[11px] text-white/40">minimum compensation</p>
            )}
          </div>
        </div>

        {/* redacted company + title */}
        <div className="mt-6 space-y-2.5 rounded-xl border border-dashed border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2">
            <LockClosedIcon className="h-3.5 w-3.5 shrink-0 text-secondary/80" />
            <Bar width={45} />
          </div>
          {c.titleBars.map((w, j) => (
            <Bar key={j} width={w} className="h-2.5 opacity-70" />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {c.compTypes.slice(0, 2).map((t) => (
            <Facet key={t} icon={BanknotesIcon}>
              {t}
            </Facet>
          ))}
          {c.commitments.slice(0, 1).map((t) => (
            <Facet key={t} icon={ClockIcon}>
              {t}
            </Facet>
          ))}
          {c.industry && <Facet icon={BuildingOffice2Icon}>{c.industry}</Facet>}
        </div>

        <div className="mt-auto flex items-center justify-between pt-6 text-xs">
          <span className="text-white/35">{c.posted ?? "Remote"}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1.5 font-bold text-secondary ring-1 ring-secondary/25 transition group-hover:bg-secondary group-hover:text-dark-background">
            {signedIn ? "View role →" : "Unlock →"}
          </span>
        </div>
      </Link>
    </Spotlight>
  );
}

function PlaceholderCard({ i }: { i: number }) {
  return (
    <Link
      href={`${APP}/signup`}
      className="group flex h-full min-h-[300px] flex-col rounded-[22px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 transition hover:-translate-y-1 hover:border-white/20"
    >
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
        <span>File #{String(i + 1).padStart(3, "0")}</span>
        <LockClosedIcon className="h-3.5 w-3.5 text-secondary/70" />
      </div>
      <div className="mt-6 space-y-3">
        <Bar width={35} />
        <Bar width={60} className="h-7 rounded-md" />
      </div>
      <div className="mt-6 space-y-2.5 rounded-xl border border-dashed border-white/10 bg-black/20 p-4">
        <Bar width={70} />
        <Bar width={50} className="h-2.5 opacity-70" />
      </div>
      <p className="mt-auto pt-6 text-xs font-bold text-secondary">
        Members see every open role →
      </p>
    </Link>
  );
}

export function RedactedRoles({ data }: { data: RolesData }) {
  const { cards, signedIn } = data;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.length > 0
        ? cards.map((c, i) => <Card key={c.key} c={c} signedIn={signedIn} i={i} />)
        : Array.from({ length: 3 }).map((_, i) => <PlaceholderCard key={i} i={i} />)}
    </div>
  );
}
