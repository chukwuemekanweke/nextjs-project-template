import { cn } from "@template/ui-core";
import type { ReactNode } from "react";
import type { Action } from "../types";
import { ActionLink } from "./action-link";
import { MarketingContainer } from "./layout";

/**
 * Centred page hero (reference `.hero`): eyebrow, the page's `h1`, a lead
 * paragraph and optional actions. `size="page"` is the shorter inner-page
 * variant (48px title, less bottom padding); `children` render below, for
 * example a billing-interval switch.
 */
export function Hero({
  actions,
  children,
  description,
  eyebrow,
  size = "home",
  title,
}: Readonly<{
  actions?: readonly Action[];
  children?: ReactNode;
  description?: string;
  eyebrow?: string;
  size?: "home" | "page";
  title: string;
}>) {
  return (
    <MarketingContainer
      className={cn(
        "flex flex-col items-center gap-4.5 pt-12 text-center md:gap-6 md:pt-24",
        size === "home" ? "pb-10 md:pb-18" : "pb-8 md:pb-10",
      )}
    >
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h1
        className={cn(
          "text-fg max-w-4xl text-balance",
          size === "home"
            ? "text-display"
            : "text-4xl leading-tight font-semibold tracking-tight md:text-5xl",
        )}
      >
        {title}
      </h1>
      {description ? (
        <p className="text-lead text-fg-muted max-w-160">{description}</p>
      ) : null}
      {actions && actions.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-3">
          {actions.map((action) => (
            <ActionLink action={action} key={action.href} />
          ))}
        </div>
      ) : null}
      {children}
    </MarketingContainer>
  );
}
