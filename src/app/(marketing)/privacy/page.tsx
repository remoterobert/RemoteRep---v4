import { LegalPage } from "../LegalPage";

export const metadata = {
  title: "Privacy Policy — RemoteRep",
};

// DRAFT — written for review by counsel. Section ids (#text-messaging etc.)
// are linked from the SMS consent checkbox; keep them stable.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 19, 2026"
      intro="RemoteRep connects companies with remote sales professionals, and helps experienced sales leaders build fractional Chief Revenue Officer practices. This policy explains what personal information we collect, how we use and share it, how text messaging works, and the choices you have. It applies to remoterep.com, app.remoterep.com and the services we offer through them."
      sections={[
        {
          h: "Who we are",
          id: "who-we-are",
          p: "RemoteRep (\"RemoteRep\", \"we\", \"us\") is located at 1 Innovation Way, Woodstock, GA 30188. You can reach us about privacy at support@remoterep.com.",
        },
        {
          h: "Information we collect",
          id: "information-we-collect",
          p: "We collect information you give us, information collected automatically when you use our sites, and limited information from others.",
          list: [
            "Account information: your name, email address, mobile phone number and password (stored in encrypted form).",
            "Profile information for sales professionals: sales roles, experience, deal sizes, sales cycles, industries, education, skills, location, compensation preferences, résumé, photo, video and any other details you add.",
            "Company information for hiring teams: company name, website, industry, size, logo, contact details, and the job listings you post.",
            "Fractional CRO applications: your current title, years leading sales teams, team size, income range, timeline, LinkedIn profile and anything you tell us about your goals.",
            "Communications: messages sent through the platform, support requests, and your communications with our team, including call bookings.",
            "Usage and device information: IP address, browser and device type, pages viewed, and dates and times of visits, collected through server logs and cookies.",
            "Marketing attribution: the campaign details in the link that brought you to us (UTM parameters such as source, medium and campaign).",
          ],
        },
        {
          h: "How we use your information",
          id: "how-we-use",
          list: [
            "To create and run your account and provide the platform, including matching sales professionals with job listings.",
            "To power in-app messaging, notifications and account emails, such as email verification and password resets.",
            "To contact you about your account, job opportunities and RemoteRep programs by email and phone, and by text message if you have agreed to receive texts.",
            "To review Fractional CRO applications and schedule and hold strategy calls.",
            "To understand which campaigns and pages bring people to RemoteRep, and to improve our sites and services.",
            "To keep RemoteRep secure, prevent fraud and abuse, and enforce our Terms.",
            "To comply with legal obligations.",
          ],
        },
        {
          h: "Text messaging (SMS)",
          id: "text-messaging",
          p: [
            "If you check the text-message consent box on one of our forms, you agree to receive text messages from RemoteRep at the mobile number you provided, about your account, job opportunities and RemoteRep programs. Some messages may be sent using automated technology. Consent is optional and is not a condition of signing up, applying or making any purchase.",
            "Message frequency varies. Message and data rates may apply. You can opt out at any time by replying STOP to any message, and get help by replying HELP or emailing support@remoterep.com. After you reply STOP we will send one message confirming your opt-out and no further texts unless you opt in again. Carriers are not liable for delayed or undelivered messages.",
            "We keep a record of when and where you gave consent and the wording you agreed to.",
          ],
          after:
            "We do not sell, rent or share your mobile phone number or your text-messaging opt-in data or consent with third parties or affiliates for their own marketing or promotional purposes. This information is shared only with service providers that help us send messages and manage our communications on our behalf, such as our CRM and messaging platform, and they may not use it for any other purpose. All the sharing described elsewhere in this policy excludes text-messaging opt-in data and consent.",
        },
        {
          h: "How we share information",
          id: "how-we-share",
          p: "We do not sell your personal information. We share it only as described here.",
          list: [
            "With other RemoteRep users, as the service requires. A sales professional's profile is visible to hiring companies when the profile is set to public, and published job listings are visible to sales professionals. On our public pages we show open roles with the company details hidden.",
            "With service providers who run parts of our service on our behalf, under contracts that limit their use of your information. These include cloud hosting (Railway), database and authentication (Supabase), email delivery (Resend), our CRM and messaging platform (GoHighLevel), AI providers that power features such as listing drafts and match ranking (for example Anthropic), scheduling tools, and payment processors.",
            "When required by law, or to protect the rights, safety and security of RemoteRep, our users or others.",
            "In connection with a merger, acquisition, financing or sale of all or part of our business, subject to this policy.",
            "With your consent, or at your direction.",
          ],
        },
        {
          h: "AI features",
          id: "ai-features",
          p: "Some features use AI to draft listings, rank matches, or help companies reach out to candidates and schedule interviews. These features process the listing and profile information you provide. AI actions are logged, and hiring decisions always remain with the hiring company.",
        },
        {
          h: "Cookies and similar technologies",
          id: "cookies",
          p: "We use cookies that are needed to keep you signed in and secure. We also use a first-party cookie that remembers the campaign details (UTM parameters) from the link that brought you to us for up to 90 days, so we can tell which campaigns lead to signups. It contains only those campaign details. You can block or delete cookies in your browser settings, but parts of the site may not work without the essential ones.",
        },
        {
          h: "How long we keep information",
          id: "retention",
          p: "We keep your information while your account is active and as long as needed to provide our services, keep records of consent, resolve disputes and meet legal obligations. Fractional CRO application information is kept while we are in contact with you about the program and for a reasonable period afterwards. When information is no longer needed, we delete or de-identify it.",
        },
        {
          h: "Security",
          id: "security",
          p: "We use reasonable administrative, technical and physical safeguards to protect your information, including encrypted connections and access controls. No system is completely secure, so we cannot guarantee absolute security.",
        },
        {
          h: "Your choices and rights",
          id: "your-choices",
          list: [
            "Profile and account: review and update most information in your profile and account settings, and choose whether your profile is public or hidden.",
            "Email: manage notification emails in your account settings. We will still send essential account emails, such as password resets.",
            "Text messages: reply STOP to any message to stop texts.",
            "Delete your account: from your account security settings, or by contacting us.",
            "Access, correction and deletion: email support@remoterep.com. Depending on where you live (for example California and other US states), you may have additional rights, including to know what we collect, request deletion or correction, and not be discriminated against for using these rights. We will verify your request before acting on it.",
          ],
        },
        {
          h: "Children",
          id: "children",
          p: "RemoteRep is for professionals and is not directed to anyone under 18. We do not knowingly collect information from children. If you believe a child has given us information, contact us and we will delete it.",
        },
        {
          h: "International users",
          id: "international",
          p: "RemoteRep is based in the United States, and your information is processed and stored in the United States, where data protection laws may differ from those where you live.",
        },
        {
          h: "Changes to this policy",
          id: "changes",
          p: "We may update this policy from time to time. When we make material changes, we will update the date at the top of this page and, where appropriate, notify you by email or in the app.",
        },
        {
          h: "Contact us",
          id: "contact",
          p: "Questions or requests about this policy or your information: support@remoterep.com, or RemoteRep, 1 Innovation Way, Woodstock, GA 30188.",
        },
      ]}
    />
  );
}
