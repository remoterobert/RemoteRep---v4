import { LegalPage } from "../LegalPage";

export const metadata = {
  title: "Terms of Service — RemoteRep",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="August 2026"
      intro="These terms govern your use of RemoteRep. By creating an account or using the platform, you agree to them. Here's the plain-English version — contact us if anything's unclear."
      sections={[
        {
          h: "The service",
          p: "RemoteRep is a platform where companies post job listings and connect with remote sales representatives. We provide the tools and matching; we are not the employer, and we don't guarantee any particular hire, placement, or business result.",
        },
        {
          h: "Your account",
          p: "You're responsible for the information you provide and for activity under your account. Keep your login secure and make sure the details you share are accurate and your own to share.",
        },
        {
          h: "Acceptable use",
          p: "Use RemoteRep lawfully and respectfully. Don't post misleading listings or profiles, harass other users, scrape or misuse the platform or its data, or attempt to disrupt the service.",
        },
        {
          h: "Plans & billing",
          p: "The Free plan is available at no cost. Paid plans (Premium and Concierge) are billed monthly at the prices shown at sign-up and renew until you cancel. You can cancel any time; fees already paid are non-refundable except where required by law.",
        },
        {
          h: "Your content",
          p: "You keep ownership of the content you post. You grant RemoteRep the permission needed to host and display that content so the platform can operate — for example, showing your listing to matched candidates.",
        },
        {
          h: "Disclaimers & liability",
          p: "The service is provided “as is” without warranties. To the fullest extent permitted by law, RemoteRep isn't liable for indirect or consequential damages, and our total liability is limited to the amounts you paid us in the prior twelve months.",
        },
        {
          // DRAFT — A2P 10DLC program terms, pending review by counsel.
          h: "Text messaging",
          id: "text-messaging",
          p: [
            "RemoteRep's text messages cover your account, job opportunities and RemoteRep programs. You receive them only if you opt in by checking the text-message consent box on one of our forms; consent is not a condition of signing up or purchase.",
            "Message frequency varies. Message and data rates may apply. Reply STOP to cancel at any time; you'll receive one confirmation and no further messages. Reply HELP for help, or email support@remoterep.com. Carriers are not liable for delayed or undelivered messages. See our Privacy Policy for how we handle your mobile number and consent.",
          ],
        },
        {
          h: "Changes & contact",
          p: "We may update these terms from time to time; continued use after an update means you accept the revised terms. Questions? Reach us any time using the contact details below.",
        },
      ]}
    />
  );
}
