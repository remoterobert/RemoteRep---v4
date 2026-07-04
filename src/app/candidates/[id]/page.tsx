import { redirect } from "next/navigation";

/**
 * Legacy route — redirect to the new canonical public profile URL.
 * Internal /candidates cards now link directly to /profiles/[id].
 */
export default async function LegacyCandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ listing?: string }>;
}) {
  const { id } = await params;
  const { listing } = await searchParams;
  const qs = listing ? `?listing=${listing}` : "";
  redirect(`/profiles/${id}${qs}`);
}
