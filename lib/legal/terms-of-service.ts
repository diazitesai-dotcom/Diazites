import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY_NAME,
  LEGAL_PRODUCT_NAME,
  LEGAL_WEBSITE,
} from "@/lib/legal/constants";
import type { LegalDocument } from "@/lib/legal/types";

export const termsOfService: LegalDocument = {
  title: "Terms of Service",
  description: `Terms governing access to and use of ${LEGAL_PRODUCT_NAME}.`,
  sections: [
    {
      id: "agreement",
      title: "1. Agreement",
      paragraphs: [
        `These Terms of Service ("Terms") are a binding agreement between you and ${LEGAL_ENTITY_NAME} regarding use of ${LEGAL_PRODUCT_NAME} at ${LEGAL_WEBSITE} (the "Service").`,
        "If you use the Service on behalf of an organization, you represent that you have authority to bind that organization, and “you” includes the organization.",
      ],
    },
    {
      id: "eligibility",
      title: "2. Eligibility",
      paragraphs: [
        "You must be at least 18 years old and able to form a binding contract. You may not use the Service if you are barred under applicable law or prior suspension.",
      ],
    },
    {
      id: "account",
      title: "3. Accounts and security",
      paragraphs: [
        "You are responsible for safeguarding login credentials and for activity under your account. Notify us promptly of unauthorized access.",
        "We may suspend or terminate accounts that violate these Terms or pose risk to the Service or others.",
      ],
    },
    {
      id: "subscriptions",
      title: "4. Subscriptions and billing",
      paragraphs: [
        "Paid plans are billed in advance according to the pricing shown at checkout or in your order form. Fees are non-refundable except where required by law or expressly stated.",
        "We may change prices with notice before renewal. Taxes may apply. Failure to pay may result in suspension.",
      ],
    },
    {
      id: "acceptable-use",
      title: "5. Acceptable use",
      paragraphs: [
        "You agree not to misuse the Service. Prohibited conduct includes illegal activity, spam, malware, infringement, harassment, circumvention of security, scraping without permission, and use that violates third-party platform policies (including ad network and messaging rules).",
        "See our Acceptable Use Policy for additional detail.",
      ],
    },
    {
      id: "customer-data",
      title: "6. Your data",
      paragraphs: [
        "You retain ownership of content and data you submit (“Customer Data”). You grant us a limited license to host, process, and display Customer Data solely to provide and improve the Service.",
        "You are responsible for the accuracy, legality, and rights necessary to use Customer Data, including obtaining consents for marketing and AI processing.",
      ],
    },
    {
      id: "ai-disclaimer",
      title: "7. AI features",
      paragraphs: [
        "AI-generated outputs may be inaccurate or incomplete. You must review outputs before relying on them for business, legal, or compliance decisions. We do not guarantee results from campaigns, automations, or recommendations.",
      ],
    },
    {
      id: "integrations",
      title: "8. Third-party services",
      paragraphs: [
        "Integrations (advertising platforms, CRM, email, SMS, payments, etc.) are subject to those providers’ terms. We are not responsible for third-party outages, policy changes, or account actions taken by those providers.",
      ],
    },
    {
      id: "ip",
      title: "9. Intellectual property",
      paragraphs: [
        "We and our licensors own the Service, software, branding, and documentation. Except for rights expressly granted, no license is implied. Feedback may be used without restriction or compensation.",
      ],
    },
    {
      id: "confidentiality",
      title: "10. Confidentiality",
      paragraphs: [
        "Each party may receive confidential information from the other. The receiving party will protect it with reasonable care and use it only for the permitted purpose, except as required by law.",
      ],
    },
    {
      id: "disclaimers",
      title: "11. Disclaimers",
      paragraphs: [
        'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
      ],
    },
    {
      id: "liability",
      title: "12. Limitation of liability",
      paragraphs: [
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PARTY WILL BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOST PROFITS OR REVENUE.",
        "OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS OR THE SERVICE WILL NOT EXCEED THE AMOUNTS YOU PAID US IN THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM, OR ONE HUNDRED U.S. DOLLARS ($100) IF YOU HAVE NOT PAID FEES.",
      ],
    },
    {
      id: "indemnity",
      title: "13. Indemnification",
      paragraphs: [
        "You will defend and indemnify us against claims arising from your Customer Data, your use of the Service, or violation of these Terms or applicable law, except to the extent caused by our gross negligence or willful misconduct.",
      ],
    },
    {
      id: "termination",
      title: "14. Termination",
      paragraphs: [
        "Either party may terminate for material breach not cured within thirty (30) days of notice. We may suspend access immediately for risk, non-payment, or legal requirements.",
        "Upon termination, your right to use the Service ends. Provisions that by nature should survive (fees owed, disclaimers, liability limits, indemnity) will survive.",
      ],
    },
    {
      id: "governing-law",
      title: "15. Governing law",
      paragraphs: [
        "These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-law rules, except where mandatory consumer protections apply in your jurisdiction.",
        "Disputes will be resolved in the state or federal courts located in Delaware, unless otherwise required by law.",
      ],
    },
    {
      id: "changes",
      title: "16. Changes",
      paragraphs: [
        "We may modify these Terms by posting an updated version. Continued use after the effective date constitutes acceptance. Material changes may require additional notice for paid accounts.",
      ],
    },
    {
      id: "contact",
      title: "17. Contact",
      paragraphs: [`Questions about these Terms: ${LEGAL_CONTACT_EMAIL}.`],
    },
  ],
};
