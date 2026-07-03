import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminTenantsPage() {
  const supabase = await createClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug, type, status, created_at")
    .order("created_at", { ascending: false });

  // Fetch member counts separately for simplicity
  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id");

  const countByTenant = new Map<string, number>();
  memberships?.forEach((m) => {
    countByTenant.set(m.tenant_id, (countByTenant.get(m.tenant_id) ?? 0) + 1);
  });

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold">Tenants</h2>
        <span className="text-xs text-light-grey">
          {tenants?.length ?? 0} total
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded">
          <thead className="bg-zinc-50 dark:bg-zinc-900 text-left text-xs uppercase text-light-grey">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Members</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {tenants?.map((t) => (
              <tr key={t.id}>
                <td className="p-3 font-semibold">{t.name}</td>
                <td className="p-3">
                  <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
                    {t.type}
                  </span>
                </td>
                <td className="p-3">
                  <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
                    {t.status}
                  </span>
                </td>
                <td className="p-3">{countByTenant.get(t.id) ?? 0}</td>
                <td className="p-3 font-mono text-xs text-light-grey">
                  {t.slug}
                </td>
                <td className="p-3 text-xs text-light-grey">
                  {new Date(t.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(!tenants || tenants.length === 0) && (
        <p className="text-sm text-light-grey mt-4">No tenants yet.</p>
      )}
    </div>
  );
}
