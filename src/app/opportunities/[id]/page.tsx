import { redirect } from "next/navigation";

/**
 * Legacy route — redirect to the new canonical public listing URL.
 * Internal /opportunities cards now link directly to /listings/[id].
 */
export default async function LegacyOpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/listings/${id}`);
}
