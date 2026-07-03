/**
 * Deterministic UUID-shaped hash from a short string. Used to bridge
 * hardcoded sample IDs (opp-1, opp-2, etc.) into the uuid columns of
 * tables like `bookmarks.target_id` while real listings don't exist yet.
 *
 * When real listings ship, this helper can go away and target_id
 * becomes the actual listings.id.
 */
export function pseudoUuidFromString(input: string): string {
  let h1 = 5381,
    h2 = 5381,
    h3 = 5381,
    h4 = 5381;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = ((h1 << 5) + h1 + c) >>> 0;
    h2 = ((h2 << 5) + h2 + c * 3) >>> 0;
    h3 = ((h3 << 5) + h3 + c * 7) >>> 0;
    h4 = ((h4 << 5) + h4 + c * 13) >>> 0;
  }
  const hex = (n: number, len: number) =>
    n.toString(16).padStart(len, "0").slice(0, len);
  return `${hex(h1, 8)}-${hex(h2, 4)}-4${hex(h2, 3)}-a${hex(h3, 3)}-${hex(h3, 4)}${hex(h4, 8)}`;
}
