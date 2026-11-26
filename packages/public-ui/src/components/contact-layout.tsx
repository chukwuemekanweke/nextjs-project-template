import { Card, CardContent, IconTile } from "@template/ui-core";
import type { ReactNode } from "react";
import type { ContactDetail } from "../types";
import { MarketingContainer } from "./layout";

/**
 * Contact page body (reference `PublicContact`): the app's form (or other
 * primary content) in a card beside a column of contact detail cards.
 * Stacks on phones and tablets.
 */
export function ContactLayout({
  children,
  details,
}: Readonly<{ children: ReactNode; details: readonly ContactDetail[] }>) {
  return (
    <MarketingContainer className="grid grid-cols-1 items-start gap-5 pb-12 md:pb-20 lg:grid-cols-2">
      <Card>
        <CardContent>{children}</CardContent>
      </Card>
      <ul className="flex flex-col gap-4">
        {details.map((detail) => (
          <li key={detail.label}>
            <Card>
              <CardContent className="flex items-center gap-3">
                {detail.icon ? <IconTile>{detail.icon}</IconTile> : null}
                <div className="min-w-0">
                  <p className="text-fg font-semibold">{detail.label}</p>
                  <p className="text-small text-fg-muted break-words">
                    {detail.href ? (
                      <a
                        className="text-brand-ink hover:underline"
                        href={detail.href}
                      >
                        {detail.value}
                      </a>
                    ) : (
                      detail.value
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </MarketingContainer>
  );
}
