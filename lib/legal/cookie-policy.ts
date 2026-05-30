import { LEGAL_CONTACT_EMAIL, LEGAL_ENTITY_NAME, LEGAL_PRODUCT_NAME } from "@/lib/legal/constants";
import type { LegalDocument } from "@/lib/legal/types";

export const cookiePolicy: LegalDocument = {
  title: "Cookie Policy",
  description: `How ${LEGAL_ENTITY_NAME} uses cookies and similar technologies on ${LEGAL_PRODUCT_NAME}.`,
  sections: [
    {
      id: "what-are-cookies",
      title: "1. What are cookies?",
      paragraphs: [
        "Cookies are small text files stored on your device when you visit a website. We also use similar technologies such as local storage and pixels where described below.",
      ],
    },
    {
      id: "how-we-use",
      title: "2. How we use cookies",
      paragraphs: ["We use cookies and similar technologies to:"],
      bullets: [
        "Keep you signed in and maintain session security.",
        "Remember preferences (e.g., theme).",
        "Understand usage and improve performance.",
        "Measure marketing effectiveness when you consent.",
        "Support fraud prevention and abuse detection.",
      ],
    },
    {
      id: "types",
      title: "3. Types of cookies",
      paragraphs: ["Cookies we use generally fall into these categories:"],
      bullets: [
        "Strictly necessary: required for authentication, security, and core functionality. These cannot be disabled without breaking the Service.",
        "Functional: remember settings and choices.",
        "Analytics: help us understand how the Service is used (may be provided by third parties).",
        "Marketing: used to measure ad performance or deliver relevant messaging, where permitted by law and your choices.",
      ],
    },
    {
      id: "third-party",
      title: "4. Third-party cookies",
      paragraphs: [
        "Third parties such as analytics, payment, and embedded content providers may set cookies when you interact with their features. Their use is governed by their own policies.",
      ],
    },
    {
      id: "choices",
      title: "5. Your choices",
      paragraphs: [
        "You can control cookies through your browser settings (block, delete, or notify). Blocking strictly necessary cookies may prevent login or core features.",
        "Where required by law, we will present a consent mechanism for non-essential cookies. You may withdraw consent at any time through in-product settings or by contacting us.",
      ],
    },
    {
      id: "do-not-track",
      title: "6. Do Not Track",
      paragraphs: [
        "Some browsers send “Do Not Track” signals. There is no uniform industry standard for responding; we currently do not alter practices solely based on DNT signals.",
      ],
    },
    {
      id: "updates",
      title: "7. Updates",
      paragraphs: [
        "We may update this Cookie Policy. Check this page for the latest version and “Last updated” date.",
      ],
    },
    {
      id: "contact",
      title: "8. Contact",
      paragraphs: [`Cookie questions: ${LEGAL_CONTACT_EMAIL}. See also our Privacy Policy.`],
    },
  ],
};
