import { notFound } from "next/navigation";

import { GrapesJsWebsiteEditor } from "@/components/website-builder/grapesjs-website-editor";
import { loadWebsiteBuilderEditorData } from "@/lib/dashboard/load-website-builder";

type WebsiteEditorPageProps = {
  params: Promise<{ pageId: string }>;
};

export default async function WebsiteEditorPage({ params }: WebsiteEditorPageProps) {
  const { pageId } = await params;
  const data = await loadWebsiteBuilderEditorData(pageId);

  if (!data.page) notFound();

  return <GrapesJsWebsiteEditor page={data.page} versions={data.versions} />;
}
