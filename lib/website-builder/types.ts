export type WebsiteStatus = "draft" | "published" | "unpublished" | "archived";

export type WebsiteMemberRole = "agency_owner" | "admin" | "staff" | "client";

export type WebsiteTemplateSlug =
  | "local-business"
  | "contractor"
  | "roofing"
  | "plumbing"
  | "hvac"
  | "restaurant"
  | "real-estate"
  | "attorney"
  | "medical-practice"
  | "nonprofit"
  | "e-commerce"
  | "marketing-agency";

export type WebsiteTemplateDefinition = {
  slug: WebsiteTemplateSlug;
  name: string;
  category: string;
  description: string;
  bestFor: string;
  primaryCta: string;
};

export type WebsiteFormField = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "date";
  required?: boolean;
  options?: string[];
};

export type GrapesJsProjectData = Record<string, unknown>;

export type WebsiteBuilderPageRecord = {
  id: string;
  business_id: string;
  website_id: string;
  template_id?: string | null;
  title: string;
  slug: string;
  page_type: string;
  status: WebsiteStatus;
  grapesjs_data: GrapesJsProjectData;
  html: string;
  css: string;
  custom_html?: string | null;
  custom_css?: string | null;
  published_html?: string | null;
  published_css?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
};

export type WebsiteBuilderSiteRecord = {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  default_domain?: string | null;
  subdomain?: string | null;
  status: WebsiteStatus;
  brand_config: Record<string, unknown>;
  settings: Record<string, unknown>;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type WebsiteBuilderTemplateRecord = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  preview_image_url?: string | null;
  grapesjs_data: GrapesJsProjectData;
  html: string;
  css: string;
  seo_defaults: Record<string, unknown>;
  form_schema: WebsiteFormField[];
};

export type WebsiteBuilderDomainRecord = {
  id: string;
  hostname: string;
  domain_type: "custom" | "subdomain";
  status: "pending" | "verified" | "active" | "failed";
  verification_token: string;
  dns_instructions: Record<string, unknown>;
  ssl_status: string;
};

export type WebsiteBuilderAssetRecord = {
  id: string;
  asset_type: "image" | "video" | "pdf" | "logo" | "font" | "other";
  public_url?: string | null;
  file_name: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at: string;
};

export type WebsiteBuilderAnalyticsSummary = {
  visitors: number;
  leads: number;
  formSubmissions: number;
  conversionRate: number;
  topPages: Array<{ title: string; visitors: number; leads: number }>;
  trafficSources: Array<{ source: string; visitors: number }>;
};

export type WebsiteBuilderDashboardData = {
  businessId: string | null;
  businessProfile: {
    name: string;
    niche: string;
    location: string;
    services: string;
    keywords: string;
    targetAudience: string;
  };
  websites: WebsiteBuilderSiteRecord[];
  pages: WebsiteBuilderPageRecord[];
  templates: WebsiteBuilderTemplateRecord[];
  domains: WebsiteBuilderDomainRecord[];
  assets: WebsiteBuilderAssetRecord[];
  analytics: WebsiteBuilderAnalyticsSummary;
};

export type AiLandingPageOutput = {
  title: string;
  slug: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  benefits: string[];
  services: Array<{ title: string; description: string }>;
  testimonials: Array<{ quote: string; name: string }>;
  faqs: Array<{ question: string; answer: string }>;
  seoTitle: string;
  seoDescription: string;
};

export type AiWebsiteSection =
  | {
      type: "hero";
      headline: string;
      subheadline: string;
      buttonText: string;
      buttonLink: string;
    }
  | {
      type: "services";
      title: string;
      intro?: string;
      items: Array<{ title: string; description: string }>;
    }
  | {
      type: "benefits";
      title: string;
      items: string[];
    }
  | {
      type: "testimonials";
      title: string;
      items: Array<{ quote: string; name: string }>;
    }
  | {
      type: "faq";
      title: string;
      items: Array<{ question: string; answer: string }>;
    }
  | {
      type: "pricing";
      title: string;
      plans: Array<{ name: string; price: string; features: string[]; cta: string }>;
    }
  | {
      type: "contact";
      title: string;
      body: string;
    }
  | {
      type: "contactForm";
      title?: string;
      buttonText?: string;
    };

export type AiWebsitePagePlan = {
  pageName: string;
  industry: string;
  pageType: "home" | "about" | "services" | "contact" | "blog" | "landing";
  slug: string;
  seoTitle: string;
  seoDescription: string;
  sections: AiWebsiteSection[];
};
