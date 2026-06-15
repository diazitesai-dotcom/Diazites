import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";

import { createServiceRoleClient } from "@/lib/supabase/server";

type PublishedWebsitePageProps = {
  params: Promise<{ websiteId: string; slug: string }>;
};

export async function generateMetadata({ params }: PublishedWebsitePageProps): Promise<Metadata> {
  const { websiteId, slug } = await params;
  const { page, seo } = await loadPublishedPage(websiteId, slug);

  if (!page) return {};

  const title = String(seo?.meta_title ?? page.title ?? "Diazites website");
  const description = String(seo?.meta_description ?? "");
  const ogImage = typeof seo?.og_image_url === "string" ? seo.og_image_url : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: seo?.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function PublishedWebsitePage({ params }: PublishedWebsitePageProps) {
  const { websiteId, slug } = await params;
  const { page, seo } = await loadPublishedPage(websiteId, slug);

  if (!page) notFound();

  const html = String(page.published_html || page.html || "");
  const css = String(page.published_css || page.css || "");
  const schemaMarkup = seo?.schema_markup && typeof seo.schema_markup === "object" ? seo.schema_markup : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {schemaMarkup ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
        />
      ) : null}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <Script id="diazites-website-forms" strategy="afterInteractive">
        {`
          document.addEventListener('submit', async function(event) {
            const form = event.target;
            if (!form || !form.matches('[data-dz-form]')) return;
            event.preventDefault();
            const formData = new FormData(form);
            const payload = {};
            formData.forEach((value, key) => { payload[key] = value; });
            const response = await fetch('/api/website-builder/forms/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                websiteId: '${websiteId}',
                pageId: '${page.id}',
                formSlug: form.getAttribute('data-dz-form') || 'lead-capture',
                payload,
                source: document.referrer || 'direct'
              })
            });
            if (response.ok) {
              form.reset();
              form.dispatchEvent(new CustomEvent('diazites:submitted'));
              alert('Thanks! Your information was submitted.');
            } else {
              alert('Submission failed. Please try again.');
            }
          });
        `}
      </Script>
    </>
  );
}

async function loadPublishedPage(websiteId: string, slug: string) {
  const supabase = createServiceRoleClient();
  const { data: page } = await supabase
    .from("website_pages")
    .select("*")
    .eq("website_id", websiteId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!page) return { page: null, seo: null };

  const { data: seo } = await supabase
    .from("website_seo")
    .select("*")
    .eq("page_id", page.id)
    .maybeSingle();

  return {
    page: page as Record<string, unknown>,
    seo: seo as Record<string, unknown> | null,
  };
}
