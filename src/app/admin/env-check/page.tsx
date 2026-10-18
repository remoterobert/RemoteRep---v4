import { redirect } from "next/navigation";
import { isPlatformAdmin } from "@/lib/is-platform-admin";
import { listPipelines, type GhlAccount } from "@/lib/ghl";

export const dynamic = "force-dynamic";

/**
 * Admin-only diagnostic: shows which env vars the running server sees.
 * Only names + presence + length (never the value itself).
 */
export default async function EnvCheckPage() {
  const ok = await isPlatformAdmin();
  if (!ok) redirect("/dashboard");

  const checks = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", required: true },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true },
    { name: "SUPABASE_SERVICE_ROLE_KEY", required: true },
    { name: "ANTHROPIC_API_KEY", required: false },
    { name: "GHL_TALENT_API_TOKEN", required: false },
    { name: "GHL_TALENT_LOCATION_ID", required: false },
    { name: "GHL_CLIENT_API_TOKEN", required: false },
    { name: "GHL_CLIENT_LOCATION_ID", required: false },
    { name: "GHL_REP_PIPELINE_ID", required: false },
    { name: "GHL_REP_STAGE_ID", required: false },
    { name: "GHL_CRO_PIPELINE_ID", required: false },
    { name: "GHL_CRO_STAGE_ID", required: false },
    { name: "GHL_CLIENT_PIPELINE_ID", required: false },
    { name: "GHL_CLIENT_STAGE_ID", required: false },
    { name: "CRO_BOOKING_URL", required: false },
    { name: "PORT", required: false },
    { name: "NODE_ENV", required: false },
  ];

  const results = checks.map((c) => {
    const v = process.env[c.name];
    return {
      name: c.name,
      present: !!v && v.length > 0,
      length: v?.length ?? 0,
      preview: v ? `${v.slice(0, 6)}…${v.slice(-4)}` : "—",
      required: c.required,
    };
  });

  // Live pipeline + stage IDs from each GHL sub-account, so the owner can
  // copy them into Railway without digging through GHL.
  const accounts: { account: GhlAccount; label: string; envPrefixes: string }[] = [
    { account: "talent", label: "Talent sub-account", envPrefixes: "GHL_REP_* and GHL_CRO_*" },
    { account: "client", label: "Client sub-account", envPrefixes: "GHL_CLIENT_*" },
  ];
  const pipelines = await Promise.all(
    accounts.map(async (a) => ({ ...a, result: await listPipelines(a.account) })),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Env variable diagnostic</h1>
        <p className="text-sm text-light-grey">
          What the running server sees. Values redacted — this page only
          tells you whether a variable is present and its rough shape.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-3 text-left text-xs uppercase text-light-grey">
            <tr>
              <th className="p-3">Variable</th>
              <th className="p-3">Present</th>
              <th className="p-3">Length</th>
              <th className="p-3">Preview</th>
              <th className="p-3">Required</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {results.map((r) => {
              const bad = r.required && !r.present;
              return (
                <tr key={r.name} className={bad ? "bg-danger/5" : ""}>
                  <td className="p-3 font-mono text-xs">{r.name}</td>
                  <td className="p-3">
                    {r.present ? (
                      <span className="text-success font-semibold">✓ yes</span>
                    ) : (
                      <span className="text-danger font-semibold">✗ no</span>
                    )}
                  </td>
                  <td className="p-3 tabular-nums text-xs">{r.length}</td>
                  <td className="p-3 font-mono text-xs">{r.preview}</td>
                  <td className="p-3 text-xs text-light-grey">
                    {r.required ? "required" : "optional"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">GoHighLevel pipelines</h2>
        <p className="text-sm text-light-grey">
          Copy the pipeline ID and the ID of the stage new leads should land in
          into Railway. Rep signups use GHL_REP_PIPELINE_ID / GHL_REP_STAGE_ID,
          CRO applications use GHL_CRO_*, company signups use GHL_CLIENT_*.
        </p>
        {pipelines.map(({ account, label, envPrefixes, result }) => (
          <div
            key={account}
            className="rounded-2xl border border-border bg-surface-2 p-4"
          >
            <p className="text-sm font-semibold">
              {label}{" "}
              <span className="font-normal text-light-grey">
                — for {envPrefixes}
              </span>
            </p>
            {!result.ok ? (
              <p className="mt-2 text-sm text-danger">
                {result.error === "not configured"
                  ? "Token or location ID not set."
                  : `Couldn't reach GHL: ${result.error}`}
              </p>
            ) : result.pipelines.length === 0 ? (
              <p className="mt-2 text-sm text-light-grey">No pipelines in this sub-account yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {result.pipelines.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border bg-surface p-3">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="font-mono text-xs text-light-grey select-all">{p.id}</p>
                    <table className="mt-2 w-full text-xs">
                      <tbody className="divide-y divide-border">
                        {p.stages.map((st) => (
                          <tr key={st.id}>
                            <td className="py-1.5 pr-3">{st.name}</td>
                            <td className="py-1.5 font-mono text-light-grey select-all">{st.id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-light-grey">
        If a variable shows as absent even though you added it in Railway,
        the running container hasn&apos;t picked up the new value yet.
        Trigger a manual redeploy in Railway&apos;s Deployments panel.
      </div>
    </div>
  );
}
