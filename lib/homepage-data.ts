export const SITE_URL = "https://diazites.com";

export const HERO_VIDEO_EMBED =
  "https://www.youtube.com/embed/dQw4w9WgXcQ";

export const howItWorksSteps = [
  {
    title: "Generate demand",
    description:
      "Spin up high-intent campaigns across search, social, and retargeting—tuned to your offer, geography, and niche.",
    icon: "magnet" as const,
  },
  {
    title: "AI responds first",
    description:
      "Every inquiry triggers instant SMS, email, or chat sequences so prospects never wait while your team is heads-down.",
    icon: "zap" as const,
  },
  {
    title: "Book qualified calls",
    description:
      "Qualify budget, timeline, and fit—then route hot leads straight to your calendar or queue.",
    icon: "calendar" as const,
  },
  {
    title: "Prove what scales",
    description:
      "Dashboards tie spend to pipeline so you double down on winners and cut waste fast.",
    icon: "trending" as const,
  },
];

export const problemPainPoints = [
  "Slow lead response",
  "Wasted ad spend",
  "Missed inbound volume",
  "No repeatable follow-up",
  "Leaky conversion tracking",
];

export const marketingAgents = [
  {
    title: "Social Media Ads Agent",
    description:
      "Creative angles, audience experiments, and pacing across Meta and similar channels.",
    badge: "Automated",
  },
  {
    title: "Search Ads Agent",
    description:
      "Keyword sets, match types, negatives, and geo strategy optimized for your niche.",
    badge: "Automated",
  },
  {
    title: "Landing Page Agent",
    description:
      "Conversion-focused pages with proof, offers, and frictionless capture—mobile-first.",
    badge: "Automated",
  },
  {
    title: "AI Follow-Up Agent",
    description:
      "Omnichannel nurture that sounds human and advances leads toward a booked conversation.",
    badge: "Automated",
  },
  {
    title: "Retargeting Agent",
    description:
      "Win back visitors who didn’t convert with measured frequency and fresh hooks.",
    badge: "Automated",
  },
  {
    title: "Lead Qualification Agent",
    description:
      "Scores fit and urgency so reps spend time on buyers—not browsers.",
    badge: "Automated",
  },
];

export type PricingTier = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

export const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    price: "$497",
    period: "/mo",
    description: "Core automation for one brand or location finding product–market fit.",
    features: [
      "2 AI marketing agents",
      "Lead capture + CRM sync",
      "Email & SMS follow-up",
      "Weekly performance digest",
      "Email support",
    ],
    cta: "Start free trial",
  },
  {
    name: "Growth",
    price: "$997",
    period: "/mo",
    description: "Full-funnel automation for teams ready to scale pipeline predictably.",
    features: [
      "4 AI marketing agents",
      "Multi-channel ad automation",
      "Advanced routing & territories",
      "A/B testing & landing variants",
      "Priority chat support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Domination",
    price: "$1,997",
    period: "/mo",
    description: "Enterprise rollout: regions, brands, or high lead volume under one roof.",
    features: [
      "All 6 AI agents unlocked",
      "Custom integrations & API hooks",
      "Dedicated growth strategist",
      "SLA & quarterly roadmap reviews",
      "White-glove onboarding",
    ],
    cta: "Talk to sales",
  },
];

export const faqItems = [
  {
    q: "How fast do leads come in?",
    a: "Most teams see qualified conversations within days of launch. Volume depends on your market, offer, and budget—we optimize for efficiency and pipeline quality, not vanity clicks.",
  },
  {
    q: "Do you run ads for me?",
    a: "Yes. Diazites manages creative, targeting, and budget pacing. You approve positioning and guardrails; automation handles execution and continuous tuning.",
  },
  {
    q: "What industries do you support?",
    a: "Any niche that runs paid acquisition and cares about speed-to-lead—services, local businesses, B2B, and more. Configure tone, offer, and compliance to match your brand.",
  },
  {
    q: "Is this fully automated?",
    a: "Top-of-funnel marketing and first-touch follow-up run autonomously. Your team steps in for consultation and closing—where relationships matter most.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Plans are month-to-month after any minimum in your agreement. We earn retention with outcomes, not lock-in.",
  },
];
