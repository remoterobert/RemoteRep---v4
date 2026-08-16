/**
 * A small fixed badge that marks non-production deploys (Railway PR preview
 * environments) so a preview is never mistaken for the live site. Hidden on
 * production and in local dev (where RAILWAY_ENVIRONMENT_NAME is unset).
 *
 * Railway injects RAILWAY_ENVIRONMENT_NAME into every deploy — "production" for
 * the live environment, and the PR environment's name for previews.
 */
export function PreviewBadge() {
  const env = process.env.RAILWAY_ENVIRONMENT_NAME;
  if (!env || env === "production") return null;

  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-[200] select-none rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg ring-1 ring-white/25">
      Preview · {env}
    </div>
  );
}
