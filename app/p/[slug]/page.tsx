import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";

import {
  LandingPageRenderer,
  type LandingAssetPayload,
} from "@/components/public/landing-page-renderer";
import { loadLandingPageDisplay } from "@/lib/landing/load-landing-display";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadLandingPageDisplay(slug, { publishedOnly: true });
  if (!loaded) return { title: "Page not found" };

  const headline = loaded.asset.headline ?? "Get a free estimate";
  const subheadline =
    loaded.asset.subheadline ??
    "Professional, local, and fully insured — get help in minutes.";

  return {
    title: headline,
    description: subheadline,
    openGraph: {
      title: headline,
      description: subheadline,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const loaded = await loadLandingPageDisplay(slug, { publishedOnly: true });
  if (!loaded) notFound();

  const config = (loaded.config ?? {}) as Record<string, unknown>;
  const pixels = (config.pixels ?? {}) as {
    metaPixelId?: string;
    googleConversionId?: string;
  };

  const metaPixelId = isLiveId(pixels.metaPixelId) ? pixels.metaPixelId : null;
  const googleId = isLiveId(pixels.googleConversionId) ? pixels.googleConversionId : null;

  return (
    <>
      {metaPixelId ? (
        <>
          <Script id="fb-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}

      {googleId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleId}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${googleId}');`}
          </Script>
        </>
      ) : null}

      <LandingPageRenderer
        slug={slug}
        asset={loaded.asset as LandingAssetPayload}
        sections={(loaded.config.sections as import("@/types/marketing-os").LandingSection[]) ?? []}
        businessName={loaded.business?.name ?? null}
        location={
          loaded.landing.location
            ? String(loaded.landing.location)
            : loaded.business?.city_state ?? null
        }
      />
    </>
  );
}

function isLiveId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("__") &&
    !value.endsWith("__")
  );
}
