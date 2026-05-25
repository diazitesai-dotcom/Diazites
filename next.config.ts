import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard/ads", destination: "/dashboard/campaign-ops", permanent: true },
      { source: "/dashboard/campaigns", destination: "/dashboard/campaign-ops", permanent: true },
      { source: "/dashboard/team", destination: "/dashboard/organization?tab=team", permanent: true },
      { source: "/dashboard/billing", destination: "/dashboard/organization?tab=billing", permanent: true },
      { source: "/dashboard/settings", destination: "/dashboard/organization?tab=settings", permanent: true },
      { source: "/dashboard/growth-engine", destination: "/dashboard/engine", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "btscjmokrgxwohqguplm.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
