import Link from "next/link";
import type { ReactNode } from "react";
import type { FooterLinkGroup } from "../types";
import { MarketingContainer } from "./layout";

/**
 * Site footer (reference `.footer`): brand and description, labelled link
 * groups, and the copyright line.
 */
export function MarketingFooter({
  brand,
  copyright,
  description,
  groups,
}: Readonly<{
  brand: ReactNode;
  /** Text after "© {year}", for example "Acme Inc. All rights reserved." */
  copyright: string;
  description: string;
  groups: readonly FooterLinkGroup[];
}>) {
  return (
    <footer className="border-border bg-surface mt-auto border-t py-8 md:py-12">
      <MarketingContainer className="flex flex-wrap items-start justify-between gap-10">
        <div className="flex max-w-80 flex-col gap-3">
          {brand}
          <p className="text-small text-fg-muted">{description}</p>
        </div>
        <div className="flex flex-wrap items-start gap-8 md:gap-16">
          {groups.map((group) => (
            <nav
              aria-label={group.title}
              className="flex flex-col gap-2.5"
              key={group.title}
            >
              <span className="eyebrow">{group.title}</span>
              {group.links.map((link) => (
                <Link
                  className="text-brand-ink hover:underline"
                  href={link.href}
                  key={`${link.href}-${link.label}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
      </MarketingContainer>
      <MarketingContainer className="mt-10">
        <hr className="border-border" />
        <p className="text-small text-fg-subtle mt-5">
          © {new Date().getFullYear()} {copyright}
        </p>
      </MarketingContainer>
    </footer>
  );
}
