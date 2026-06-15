import type {
  AiLandingPageOutput,
  GrapesJsProjectData,
  WebsiteFormField,
  WebsiteTemplateDefinition,
  WebsiteTemplateSlug,
} from "@/lib/website-builder/types";

export const WEBSITE_TEMPLATE_DEFINITIONS: WebsiteTemplateDefinition[] = [
  {
    slug: "local-business",
    name: "Local Business",
    category: "Local Services",
    description: "A trust-first site for local services, calls, and quote requests.",
    bestFor: "General local businesses",
    primaryCta: "Request a Quote",
  },
  {
    slug: "contractor",
    name: "Contractor",
    category: "Home Services",
    description: "Estimate-driven funnel for contractors and project inquiries.",
    bestFor: "Contractors and remodelers",
    primaryCta: "Get an Estimate",
  },
  {
    slug: "roofing",
    name: "Roofing",
    category: "Home Services",
    description: "Storm damage, inspection, replacement, and emergency roof leads.",
    bestFor: "Roofing companies",
    primaryCta: "Schedule Inspection",
  },
  {
    slug: "plumbing",
    name: "Plumbing",
    category: "Home Services",
    description: "Emergency and scheduled service booking for plumbers.",
    bestFor: "Plumbing teams",
    primaryCta: "Call Now",
  },
  {
    slug: "hvac",
    name: "HVAC",
    category: "Home Services",
    description: "Repair, tune-up, and replacement funnel for HVAC companies.",
    bestFor: "HVAC providers",
    primaryCta: "Book Service",
  },
  {
    slug: "restaurant",
    name: "Restaurant",
    category: "Hospitality",
    description: "Reservation, catering, menu, and event inquiry website.",
    bestFor: "Restaurants and caterers",
    primaryCta: "Reserve a Table",
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    category: "Professional Services",
    description: "Buyer, seller, and property inquiry funnel.",
    bestFor: "Agents and brokerages",
    primaryCta: "View Listings",
  },
  {
    slug: "attorney",
    name: "Attorney",
    category: "Professional Services",
    description: "Consultation funnel with trust-building sections.",
    bestFor: "Law firms",
    primaryCta: "Request Consultation",
  },
  {
    slug: "medical-practice",
    name: "Medical Practice",
    category: "Healthcare",
    description: "Patient appointment and service overview website.",
    bestFor: "Clinics and practices",
    primaryCta: "Book Appointment",
  },
  {
    slug: "nonprofit",
    name: "Nonprofit",
    category: "Community",
    description: "Mission, programs, donations, volunteers, and participant intake.",
    bestFor: "Nonprofits and community programs",
    primaryCta: "Support the Mission",
  },
  {
    slug: "e-commerce",
    name: "E-commerce",
    category: "Commerce",
    description: "Offer, product, and checkout-focused landing page.",
    bestFor: "Online stores",
    primaryCta: "Shop Now",
  },
  {
    slug: "marketing-agency",
    name: "Marketing Agency",
    category: "B2B",
    description: "Growth audit, case study, and consultation funnel.",
    bestFor: "Agencies and consultants",
    primaryCta: "Book Audit",
  },
];

export const DEFAULT_WEBSITE_FORM_FIELDS: WebsiteFormField[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "phone", label: "Phone", type: "tel", required: false },
  { name: "message", label: "How can we help?", type: "textarea", required: false },
];

export function slugifyPageTitle(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || `page-${Date.now().toString(36)}`;
}

export function getTemplateDefinition(slug?: string | null): WebsiteTemplateDefinition {
  return (
    WEBSITE_TEMPLATE_DEFINITIONS.find((template) => template.slug === slug) ??
    WEBSITE_TEMPLATE_DEFINITIONS[0]
  );
}

export function buildDefaultGrapesProjectData(html: string, css = ""): GrapesJsProjectData {
  return {
    assets: [],
    styles: [],
    pages: [
      {
        id: "home",
        name: "Home",
        frames: [
          {
            component: html,
            styles: css,
          },
        ],
      },
    ],
  };
}

export function buildTemplateHtml(input: {
  templateSlug?: WebsiteTemplateSlug | string | null;
  businessName: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  services?: string;
  location?: string;
}): string {
  const template = getTemplateDefinition(input.templateSlug);
  const headline = input.headline || `${input.businessName} helps customers get results faster`;
  const subheadline =
    input.subheadline ||
    `A Diazites-built ${template.name.toLowerCase()} funnel designed to convert visitors into leads, bookings, and follow-up conversations.`;
  const cta = input.ctaText || template.primaryCta;
  const services = input.services || "Services tailored to your audience";

  return `
    <main class="dz-page">
      <section class="dz-hero">
        <div class="dz-pill">${template.category}${input.location ? ` · ${input.location}` : ""}</div>
        <h1>${escapeHtml(headline)}</h1>
        <p>${escapeHtml(subheadline)}</p>
        <a href="#contact" class="dz-button">${escapeHtml(cta)}</a>
      </section>
      <section class="dz-section dz-grid">
        <article><h2>Built for ${escapeHtml(template.bestFor)}</h2><p>${escapeHtml(services)}</p></article>
        <article><h2>AI follow-up ready</h2><p>Every form can create CRM contacts, opportunities, workflows, and AI follow-up.</p></article>
        <article><h2>Mobile first</h2><p>Preview and publish responsive pages for desktop, tablet, and mobile visitors.</p></article>
      </section>
      <section class="dz-section">
        <h2>Why customers choose us</h2>
        <div class="dz-grid">
          <p>Clear offer, direct call to action, and fast response automation.</p>
          <p>SEO-ready structure with schema, meta tags, sitemap support, and analytics.</p>
          <p>Diazites-native CRM and workflow handoff after every conversion.</p>
        </div>
      </section>
      <section class="dz-section dz-faq">
        <h2>Frequently asked questions</h2>
        <details open><summary>What happens after someone submits the form?</summary><p>Diazites creates the contact, starts the pipeline, and triggers the workflow or AI follow-up you choose.</p></details>
        <details><summary>Can I edit this page?</summary><p>Yes. Use the drag-and-drop builder to change layout, copy, images, forms, and custom CSS.</p></details>
      </section>
      <section id="contact" class="dz-section dz-contact">
        <h2>Ready to get started?</h2>
        <form data-dz-form="lead-capture">
          <input placeholder="Name" name="name" />
          <input placeholder="Email" name="email" type="email" />
          <input placeholder="Phone" name="phone" type="tel" />
          <textarea placeholder="How can we help?" name="message"></textarea>
          <button type="submit">${escapeHtml(cta)}</button>
        </form>
      </section>
    </main>
  `;
}

export function buildTemplateCss(): string {
  return `
    .dz-page{font-family:Inter,system-ui,sans-serif;color:#f8fafc;background:#070b14;line-height:1.6}
    .dz-hero{min-height:72vh;padding:96px 7vw;display:flex;flex-direction:column;justify-content:center;background:radial-gradient(circle at top left,rgba(124,58,237,.45),transparent 34%),linear-gradient(135deg,#070b14,#111827)}
    .dz-pill{width:max-content;border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:8px 14px;color:#c4b5fd;background:rgba(255,255,255,.06);font-size:13px;margin-bottom:22px}
    h1{font-size:clamp(42px,7vw,76px);line-height:.95;margin:0 0 22px;max-width:980px}
    h2{font-size:clamp(28px,4vw,44px);line-height:1.05;margin:0 0 16px}
    p{color:#cbd5e1;max-width:760px}
    .dz-button,button{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:16px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:14px 22px;font-weight:700;text-decoration:none;box-shadow:0 18px 45px rgba(79,70,229,.28)}
    .dz-section{padding:72px 7vw;border-top:1px solid rgba(255,255,255,.08)}
    .dz-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
    .dz-grid>*{border:1px solid rgba(255,255,255,.1);border-radius:24px;background:rgba(255,255,255,.04);padding:24px}
    .dz-faq details{border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:18px 20px;margin:12px 0;background:rgba(255,255,255,.04)}
    .dz-contact form{display:grid;gap:12px;max-width:560px}
    input,textarea{width:100%;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(15,23,42,.86);color:white;padding:14px 16px}
    textarea{min-height:120px}
    @media(max-width:800px){.dz-grid{grid-template-columns:1fr}.dz-hero,.dz-section{padding:56px 22px}}
  `;
}

export function buildHtmlFromAiOutput(output: AiLandingPageOutput): string {
  const benefits = output.benefits
    .map((benefit) => `<article><h3>${escapeHtml(benefit)}</h3><p>Built into your Diazites funnel and follow-up system.</p></article>`)
    .join("");
  const services = output.services
    .map((service) => `<article><h3>${escapeHtml(service.title)}</h3><p>${escapeHtml(service.description)}</p></article>`)
    .join("");
  const testimonials = output.testimonials
    .map((testimonial) => `<blockquote><p>“${escapeHtml(testimonial.quote)}”</p><cite>${escapeHtml(testimonial.name)}</cite></blockquote>`)
    .join("");
  const faqs = output.faqs
    .map((faq) => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`)
    .join("");

  return `
    <main class="dz-page">
      <section class="dz-hero">
        <div class="dz-pill">AI-generated Diazites funnel</div>
        <h1>${escapeHtml(output.headline)}</h1>
        <p>${escapeHtml(output.subheadline)}</p>
        <a href="#contact" class="dz-button">${escapeHtml(output.ctaText)}</a>
      </section>
      <section class="dz-section"><h2>Benefits</h2><div class="dz-grid">${benefits}</div></section>
      <section class="dz-section"><h2>Services</h2><div class="dz-grid">${services}</div></section>
      <section class="dz-section"><h2>Proof</h2><div class="dz-grid">${testimonials}</div></section>
      <section class="dz-section dz-faq"><h2>FAQ</h2>${faqs}</section>
      <section id="contact" class="dz-section dz-contact">
        <h2>Start here</h2>
        <form data-dz-form="lead-capture">
          <input placeholder="Name" name="name" />
          <input placeholder="Email" name="email" type="email" />
          <input placeholder="Phone" name="phone" type="tel" />
          <textarea placeholder="Tell us what you need" name="message"></textarea>
          <button type="submit">${escapeHtml(output.ctaText)}</button>
        </form>
      </section>
    </main>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
