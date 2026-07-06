/**
 * AI hiring disclosure shown to candidates before the concierge assistant
 * interacts with them on behalf of a hiring tenant.
 *
 * Version-tagged so a candidate's stored consent is anchored to the exact
 * text they saw. If we ever amend the disclosure, bump the version and
 * users will re-consent on their next interaction.
 *
 * Regulatory framing:
 *   - NYC Local Law 144 (2023): notice + right to alternative process +
 *     right to bias audit summary
 *   - Colorado AI Act (effective 2026-02-01): notice + right to
 *     explanation + right to correction + opt-out
 *   - Illinois AI Video Interview Act (2020): affirmative consent for AI
 *     analysis of any video interview
 *   - EU AI Act (Reg. 2024/1689): high-risk designation for AI in hiring;
 *     transparency + human oversight required
 *   - EEOC Title VII guidance: employers must audit AI for disparate impact
 *     and remain accountable for outcomes
 *   - GDPR/CPRA: profiling + automated decision-making disclosure
 */

export const AI_DISCLOSURE_VERSION = "2026-07-06.v1";

export const AI_DISCLOSURE_TITLE =
  "This company is using an AI assistant to help with hiring";

export const AI_DISCLOSURE_LEAD =
  "Before we go further, here's what you should know.";

export const AI_DISCLOSURE_BULLETS: Array<{ title: string; body: string }> = [
  {
    title: "You'll be talking with a mix of AI and humans",
    body: "An AI assistant may source you as a candidate, send the first messages, answer questions, and offer to book an interview. A real hiring manager reads every conversation and makes every final decision. AI-authored messages will be labeled with an AI icon.",
  },
  {
    title: "The AI will not use protected characteristics",
    body: "The assistant is instructed never to make decisions based on age, race, gender, disability, national origin, religion, family status, or any other protected class. If it ever does, that would be an error — please report it and we'll investigate.",
  },
  {
    title: "You can opt out at any time",
    body: "You can request that only humans interact with you going forward. Doing so will not disadvantage you and you'll be handed off to a person at the company. To opt out, reply 'human only' in the chat or use the toggle on this screen.",
  },
  {
    title: "You have the right to an explanation and a human review",
    body: "If you feel a decision has been made about your application by AI, you can request a written explanation and a review by a human. Contact us at legal@remoterep.com to exercise these rights.",
  },
  {
    title: "What's stored",
    body: "The full chat history, including AI-authored messages, is stored so we can audit for compliance and so the hiring team can pick up context. You can delete your account and all associated messages at any time from Settings → Password & security.",
  },
];

export const AI_DISCLOSURE_FOOTER =
  "By clicking \"I consent and continue\", you agree that an AI-driven concierge may participate in the conversation, in accordance with NYC Local Law 144, the Colorado AI Act, and applicable regulations. You can revoke consent at any time.";

/**
 * Flat text version used for stored consent records — auditors need to see
 * what the candidate actually saw.
 */
export function disclosureFlatText(): string {
  const bullets = AI_DISCLOSURE_BULLETS.map(
    (b, i) => `${i + 1}. ${b.title}\n   ${b.body}`,
  ).join("\n\n");
  return [
    AI_DISCLOSURE_TITLE,
    AI_DISCLOSURE_LEAD,
    bullets,
    AI_DISCLOSURE_FOOTER,
  ].join("\n\n");
}
