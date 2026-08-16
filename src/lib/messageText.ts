/**
 * Convert a chat message body to clean, readable plain text.
 *
 * Many messages migrated from v3 are stored as HTML (invitation emails with
 * "View Job Details" / "Apply Now" buttons), sometimes with un-rendered
 * template bits like `{{isCtaButtonDisabled ? "disabled" : ""}}`. v4 shows the
 * body as text, so all that markup leaks through. This strips the tags/template
 * junk and decodes entities, WITHOUT rendering raw HTML (so no XSS risk).
 *
 * Plain-text messages (the normal case) are detected and returned untouched.
 */
export function htmlToText(input: string): string {
  if (!input) return "";

  // Leave normal typed messages alone — only clean things that look like HTML
  // or carry leftover template expressions.
  const looksLikeHtml = /<\/?[a-z][^>]*>/i.test(input) || input.includes("{{");
  if (!looksLikeHtml) return input;

  let s = input;

  // Drop un-rendered template expressions, e.g. {{isCtaButtonDisabled ? ...}}
  s = s.replace(/\{\{[^}]*\}\}/g, "");

  // Turn block / line boundaries into newlines so structure survives as text.
  s = s.replace(/<\s*br\s*\/?\s*>/gi, "\n");
  s = s.replace(/<\/\s*(p|div|li|h[1-6]|tr|ul|ol)\s*>/gi, "\n");
  // Space out inline links so their text doesn't mash into neighbors.
  s = s.replace(/<\/\s*a\s*>/gi, " ");

  // Strip all remaining tags.
  s = s.replace(/<[^>]+>/g, "");

  // Decode the handful of entities that actually show up.
  const named: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  };
  s = s.replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => named[m] ?? m);
  s = s.replace(/&#(\d+);/g, (_, n) => {
    const code = Number(n);
    return Number.isFinite(code) ? String.fromCodePoint(code) : _;
  });

  // Tidy whitespace: collapse runs of spaces, trim each line, cap blank lines.
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/ *\n */g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");

  return s.trim();
}
