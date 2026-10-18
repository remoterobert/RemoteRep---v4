// Animated illustration of a fractional CRO practice: "you" at the centre
// with client companies orbiting, each tagged with a retainer and equity.
// Pure CSS animation (see .lp-orbit in globals.css). Always labelled as an
// illustration where it's used — these are not real clients.

export const EXAMPLE_CLIENTS = [
  { name: "B2B SaaS", stage: "Series A", retainer: 12_000, equity: "1.0%" },
  { name: "Home services", stage: "$8M revenue", retainer: 10_000, equity: "0.5%" },
  { name: "Fintech", stage: "Seed stage", retainer: 9_000, equity: "1.5%" },
];

export const EXAMPLE_ANNUAL =
  EXAMPLE_CLIENTS.reduce((s, c) => s + c.retainer, 0) * 12;

const ANGLES = [-90, 30, 150];

export function PortfolioOrbit({ className = "" }: { className?: string }) {
  return (
    <div className={`relative aspect-square w-full ${className}`}>
      {/* rings */}
      <div className="absolute inset-0 rounded-full border border-white/[0.07]" />
      <div className="absolute inset-[16%] rounded-full border border-dashed border-white/[0.09]" />
      <div className="absolute inset-[33%] rounded-full border border-white/[0.06]" />
      <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(0,121,254,0.14),transparent_65%)]" />

      {/* centre: you */}
      <div className="absolute left-1/2 top-1/2 flex h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-gradient-to-br from-secondary to-amber-500 text-dark-background shadow-[0_0_60px_10px_rgba(251,220,59,0.35),inset_0_2px_0_rgba(255,255,255,0.5)]">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
          Fractional
        </span>
        <span className="text-lg font-extrabold leading-tight sm:text-xl">CRO</span>
        <span className="lp-serif text-sm leading-none sm:text-base">(you)</span>
      </div>

      {/* orbiting clients */}
      <div className="lp-orbit absolute inset-[11%]">
        {EXAMPLE_CLIENTS.map((c, i) => {
          const a = (ANGLES[i] * Math.PI) / 180;
          const left = 50 + 50 * Math.cos(a);
          const top = 50 + 50 * Math.sin(a);
          return (
            <div
              key={c.name}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <div className="lp-orbit-rev">
                <div className="w-[9.5rem] rounded-2xl border border-white/12 bg-[#0b1124]/90 p-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:w-[11rem]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary-blue shadow-[0_0_10px_2px_rgba(0,121,254,0.7)]" />
                    <span className="truncate text-xs font-bold">{c.name}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-white/40">{c.stage}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white/85">
                      ${c.retainer / 1000}k/mo
                    </span>
                    <span className="rounded-full bg-secondary/15 px-1.5 py-0.5 text-[10px] font-bold text-secondary">
                      +{c.equity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
