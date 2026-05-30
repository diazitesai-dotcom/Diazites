import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY_NAME,
  LEGAL_PRIVACY_EMAIL,
  LEGAL_PRODUCT_NAME,
  LEGAL_WEBSITE,
} from "@/lib/legal/constants";
import type { LegalDocument } from "@/lib/legal/types";

export const privacyPolicy: LegalDocument = {
  title: "Privacy Policy",
  description: `How ${LEGAL_ENTITY_NAME} collects, uses, and protects information when you use ${LEGAL_PRODUCT_NAME}.`,
  sections: [
    {
      id: "introduction",
      title: "1. Introduction",
      paragraphs: [
        `${LEGAL_ENTITY_NAME} ("we," "us," or "our") operates ${LEGAL_PRODUCT_NAME} at ${LEGAL_WEBSITE} (the "Service"). This Privacy Policy explains what personal information we collect, how we use it, and the choices you have.`,
        "By using the Service, you agree to the practices described here. If you do not agree, please do not use the Service.",
      ],
    },
    {
      id: "information-we-collect",
      title: "2. Information we collect",
      paragraphs: ["We may collect the following categories of information:"],
      bullets: [
        "Account data: name, email address, password hash, organization and business profile details you provide during signup or onboarding.",
        "Customer and lead data: contact details, messages, campaign data, funnel submissions, and CRM records you or your agents store in the Service.",
        "Usage data: pages viewed, features used, device type, browser, IP address, and approximate location derived from IP.",
        "Integration data: tokens and metadata from connected platforms (e.g., ad accounts, email, SMS, billing) that you authorize.",
        "Communications: support requests and emails you send to us.",
        "Payment data: billing status and subscription identifiers processed by our payment provider (we do not store full card numbers).",
      ],
    },
    {
      id: "how-we-use",
      title: "3. How we use information",
      paragraphs: ["We use information to:"],
      bullets: [
        "Provide, secure, and improve the Service.",
        "Authenticate users and enforce access controls.",
        "Run AI-assisted workflows you enable (e.g., lead follow-up, campaign recommendations).",
        "Send transactional emails and optional product communications.",
        "Process payments and manage subscriptions.",
        "Comply with law and respond to lawful requests.",
        "Detect abuse, fraud, and security incidents.",
      ],
    },
    {
      id: "ai-processing",
      title: "4. AI and automated processing",
      paragraphs: [
        "When you use AI features, we may send relevant business context and lead content to third-party model providers under our agreements with them. We configure providers to use data only to deliver the Service unless you opt into separate training programs.",
        "You are responsible for ensuring you have a lawful basis to process personal data sent through AI features, including obtaining consents where required.",
      ],
    },
    {
      id: "sharing",
      title: "5. How we share information",
      paragraphs: [
        "We do not sell your personal information. We may share information with:",
      ],
      bullets: [
        "Service providers (hosting, database, email, SMS, analytics, payments, AI infrastructure) who process data on our instructions.",
        "Integration partners you connect (e.g., Google Ads, Meta, Stripe) according to your authorization.",
        "Professional advisers and authorities when required by law or to protect rights and safety.",
        "Successors in connection with a merger, acquisition, or asset sale, subject to this Policy.",
      ],
    },
    {
      id: "retention",
      title: "6. Data retention",
      paragraphs: [
        "We retain information for as long as your account is active or as needed to provide the Service, comply with legal obligations, resolve disputes, and enforce agreements. You may request deletion of your account data subject to applicable law and legitimate business needs (e.g., backups, billing records).",
      ],
    },
    {
      id: "security",
      title: "7. Security",
      paragraphs: [
        "We use administrative, technical, and organizational measures designed to protect information, including encryption in transit, access controls, and encrypted credential storage for integrations. No method of transmission or storage is completely secure; we cannot guarantee absolute security.",
      ],
    },
    {
      id: "rights",
      title: "8. Your rights and choices",
      paragraphs: [
        "Depending on your location, you may have rights to access, correct, delete, restrict, or port personal information, and to object to certain processing. You may update account details in the dashboard or contact us to exercise rights.",
        `Submit privacy requests to ${LEGAL_PRIVACY_EMAIL}. We may verify your identity before responding.`,
      ],
    },
    {
      id: "international",
      title: "9. International transfers",
      paragraphs: [
        "We may process information in the United States and other countries where we or our providers operate. Where required, we use appropriate safeguards for cross-border transfers.",
      ],
    },
    {
      id: "children",
      title: "10. Children",
      paragraphs: [
        "The Service is not directed to children under 16. We do not knowingly collect personal information from children. Contact us if you believe we have collected such information.",
      ],
    },
    {
      id: "changes",
      title: "11. Changes to this Policy",
      paragraphs: [
        "We may update this Privacy Policy from time to time. We will post the revised version on this page and update the “Last updated” date. Material changes may be notified by email or in-product notice where appropriate.",
      ],
    },
    {
      id: "contact",
      title: "12. Contact us",
      paragraphs: [
        `Questions about this Privacy Policy: ${LEGAL_PRIVACY_EMAIL} or ${LEGAL_CONTACT_EMAIL}.`,
        `Mailing address: available upon request by emailing ${LEGAL_CONTACT_EMAIL}.`,
      ],
    },
  ],
};
