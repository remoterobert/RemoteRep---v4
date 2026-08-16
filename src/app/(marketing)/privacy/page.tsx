import { LegalPage } from "../LegalPage";

export const metadata = {
  title: "Privacy Policy — RemoteRep",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="August 2026"
      intro="RemoteRep connects companies with remote sales reps. This policy explains what information we collect, how we use it, and the choices you have. It's a plain-English summary of our practices — reach out any time with questions."
      sections={[
        {
          h: "Information we collect",
          p: "Account details you provide (such as your name and email), the profile and job-listing information you add, messages you send through the platform, and basic usage data (like device and log information) that helps us keep the service running and secure.",
        },
        {
          h: "How we use your information",
          p: "To operate the platform — including matching candidates with job listings, powering in-app messaging and notifications, providing support, keeping accounts secure, and improving our features over time.",
        },
        {
          h: "How information is shared",
          p: "Profiles and listings are shown to other users as needed for the service to work — for example, a candidate's public profile is visible to hiring companies. We use trusted service providers (such as hosting and email) under confidentiality obligations. We do not sell your personal information.",
        },
        {
          h: "AI features",
          p: "On paid plans, AI features may read listing and candidate information you provide in order to draft listings, rank matches, or assist with candidate outreach and scheduling. Every AI action is logged, and final hiring decisions always remain with your team.",
        },
        {
          h: "Data retention & security",
          p: "We keep your information while your account is active and as needed to provide the service or meet legal obligations, and we use reasonable safeguards to protect it. No system is perfectly secure, but we work to keep your data safe.",
        },
        {
          h: "Your choices",
          p: "You can review and update most of your information directly in your profile and account settings. To request access to, correction of, or deletion of your data, contact us and we'll help.",
        },
        {
          h: "Changes to this policy",
          p: "We may update this policy from time to time. When we make material changes, we'll update the date above and, where appropriate, notify you.",
        },
      ]}
    />
  );
}
