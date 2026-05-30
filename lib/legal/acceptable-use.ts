import { LEGAL_CONTACT_EMAIL, LEGAL_ENTITY_NAME, LEGAL_PRODUCT_NAME } from "@/lib/legal/constants";
import type { LegalDocument } from "@/lib/legal/types";

export const acceptableUsePolicy: LegalDocument = {
  title: "Acceptable Use Policy",
  description: `Rules for safe and lawful use of ${LEGAL_PRODUCT_NAME}.`,
  sections: [
    {
      id: "purpose",
      title: "1. Purpose",
      paragraphs: [
        `This Acceptable Use Policy ("AUP") supplements our Terms of Service. It applies to all users of ${LEGAL_PRODUCT_NAME} operated by ${LEGAL_ENTITY_NAME}.`,
      ],
    },
    {
      id: "prohibited",
      title: "2. Prohibited uses",
      paragraphs: ["You may not use the Service to:"],
      bullets: [
        "Violate any law, regulation, or third-party rights.",
        "Send unsolicited or deceptive messages (spam, phishing, illegal robocalls).",
        "Harass, threaten, or discriminate against individuals or groups.",
        "Distribute malware, attempt unauthorized access, or probe systems without permission.",
        "Infringe intellectual property or publish defamatory content.",
        "Collect personal data without proper notice and consent.",
        "Impersonate others or misrepresent affiliation with Diazites or any brand.",
        "Use the Service to promote illegal products or services.",
        "Circumvent rate limits, security controls, or billing mechanisms.",
      ],
    },
    {
      id: "advertising",
      title: "3. Advertising and messaging",
      paragraphs: [
        "When using ad platform integrations or outbound messaging, you must comply with applicable platform policies (e.g., Google Ads, Meta, CAN-SPAM, TCPA, GDPR marketing rules) and honor opt-outs.",
        "You are responsible for ad content, landing pages, and claims made in your campaigns.",
      ],
    },
    {
      id: "ai-content",
      title: "4. AI-generated content",
      paragraphs: [
        "Do not use AI features to generate illegal content, deepfakes intended to deceive, or automated decisions that violate law in regulated industries without appropriate human oversight.",
      ],
    },
    {
      id: "resource-use",
      title: "5. Fair use of resources",
      paragraphs: [
        "Do not overload the Service with unreasonable automated requests. We may throttle or suspend accounts that degrade performance for others.",
      ],
    },
    {
      id: "enforcement",
      title: "6. Enforcement",
      paragraphs: [
        "We may investigate suspected violations and remove content, disable features, or terminate accounts without prior notice where necessary to protect users, the public, or the Service.",
        `Report abuse to ${LEGAL_CONTACT_EMAIL}.`,
      ],
    },
  ],
};
