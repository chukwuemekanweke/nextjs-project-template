import { cn } from "@template/ui-core";
import Link from "next/link";
import type { LegalSection, LinkItem } from "../types";
import { MarketingContainer } from "./layout";

/**
 * Legal document layout (reference `PublicLegal`): an "On this page" table
 * of contents beside the article, which starts with a switch between the
 * legal documents, the title and the last-updated line, followed by numbered
 * sections. The switch is a set of links (each document keeps its own
 * indexable route); the current one carries `aria-current="page"`.
 */
export function LegalDocument({
  currentHref,
  documents,
  sections,
  title,
  updated,
}: Readonly<{
  currentHref: string;
  documents: readonly LinkItem[];
  sections: readonly LegalSection[];
  title: string;
  /** Display text after "Last updated". */
  updated: string;
}>) {
  return (
    <MarketingContainer className="flex flex-col gap-8 pt-10 pb-12 md:pt-16 md:pb-20 lg:flex-row lg:items-start lg:gap-14">
      <nav
        aria-label="On this page"
        className="flex flex-col gap-0.5 lg:sticky lg:top-28 lg:w-55 lg:shrink-0"
      >
        <span className="eyebrow mb-2">On this page</span>
        {sections.map((section) => (
          <a
            className="text-small text-brand-ink py-1.5 hover:underline"
            href={`#${section.id}`}
            key={section.id}
          >
            {section.title}
          </a>
        ))}
      </nav>
      <article className="flex max-w-190 min-w-0 flex-1 flex-col gap-7">
        <nav aria-label="Legal documents">
          <ul className="border-border bg-surface-3 inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border p-1">
            {documents.map((document) => (
              <li className="shrink-0" key={document.href}>
                <Link
                  aria-current={
                    document.href === currentHref ? "page" : undefined
                  }
                  className={cn(
                    "min-h-control-sm text-fg-muted hover:text-fg inline-flex items-center rounded-sm px-4 font-medium whitespace-nowrap transition-colors",
                    "aria-[current=page]:bg-surface-selected aria-[current=page]:text-fg aria-[current=page]:shadow-sm",
                  )}
                  href={document.href}
                >
                  {document.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <header className="flex flex-col gap-3">
          <h1 className="text-fg text-3xl leading-tight font-semibold tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="text-small text-fg-subtle">Last updated {updated}</p>
        </header>
        {sections.map((section, index) => (
          <section
            aria-labelledby={section.id}
            className="flex flex-col gap-2"
            key={section.id}
          >
            <h2 className="text-h2 text-fg scroll-mt-28" id={section.id}>
              {index + 1}. {section.title}
            </h2>
            <div className="text-fg-muted flex flex-col gap-3">
              {section.content}
            </div>
          </section>
        ))}
      </article>
    </MarketingContainer>
  );
}
