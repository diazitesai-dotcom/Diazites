const AI_SLUG = /-(trust|urgency|value)-[123]$/;

export function isAiGeneratedSlug(slug: string): boolean {
  return AI_SLUG.test(slug);
}

export function extractBatchPrefix(slug: string): string | null {
  const match = slug.match(/^(.+)-(trust|urgency|value)-[123]$/);
  return match?.[1] ?? null;
}

const ANGLE_ORDER: Record<string, number> = { trust: 0, urgency: 1, value: 2 };

export function pickLatestBatch<T extends { slug: string; created_at?: string }>(
  pages: T[],
): T[] {
  const aiPages = pages.filter((p) => isAiGeneratedSlug(p.slug));
  if (aiPages.length === 0) return [];

  const sorted = [...aiPages].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
  );

  const prefix = extractBatchPrefix(sorted[0]!.slug);
  if (!prefix) return [];

  return aiPages
    .filter((p) => extractBatchPrefix(p.slug) === prefix)
    .sort((a, b) => {
      const angleA = a.slug.match(/-(trust|urgency|value)-/)?.[1] ?? "";
      const angleB = b.slug.match(/-(trust|urgency|value)-/)?.[1] ?? "";
      return (ANGLE_ORDER[angleA] ?? 99) - (ANGLE_ORDER[angleB] ?? 99);
    });
}
