import { LegalDocument, type LegalSection } from "@template/public-ui";
import { legalDocuments } from "@/config/site";

/** A legal document route with the Privacy / Terms switch. */
export function LegalPage({
  href,
  sections,
  title,
  updated,
}: Readonly<{
  href: string;
  sections: readonly LegalSection[];
  title: string;
  updated: string;
}>) {
  return (
    <main>
      <LegalDocument
        currentHref={href}
        documents={legalDocuments}
        sections={sections}
        title={title}
        updated={updated}
      />
    </main>
  );
}
