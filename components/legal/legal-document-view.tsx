import type { LegalDocument } from "@/lib/legal/types";

export function LegalDocumentView({ document }: { document: LegalDocument }) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline">
      {document.sections.map((section) => (
        <section key={section.id} id={section.id} className="mb-10 scroll-mt-24">
          <h2 className="text-xl">{section.title}</h2>
          {section.paragraphs.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">
              {p}
            </p>
          ))}
          {section.bullets?.length ? (
            <ul className="text-muted-foreground">
              {section.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}
