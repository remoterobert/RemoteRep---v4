import { redirect } from "next/navigation";
import { isPlatformAdmin } from "@/lib/is-platform-admin";

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

      <div className="text-xs text-light-grey">
        If a variable shows as absent even though you added it in Railway,
        the running container hasn&apos;t picked up the new value yet.
        Trigger a manual redeploy in Railway&apos;s Deployments panel.
      </div>
    </div>
  );
}
