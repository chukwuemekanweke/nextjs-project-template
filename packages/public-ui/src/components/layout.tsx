import { cn } from "@template/ui-core";
import type { HTMLAttributes } from "react";

/**
 * Marketing content width (reference `.wrap`): 1200px including 48px side
 * padding, 20px on phones.
 */
export function MarketingContainer({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("max-w-marketing mx-auto w-full px-5 md:px-12", className)}
      {...props}
    />
  );
}

/**
 * Vertical page section (reference `.section`, 80px / 48px on phones).
 * `tone="alt"` is the surface band with top and bottom borders
 * (`.section.alt`).
 */
export function MarketingSection({
  children,
  className,
  containerClassName,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLElement> &
  Readonly<{ containerClassName?: string; tone?: "default" | "alt" }>) {
  return (
    <section
      className={cn(
        "md:py-section py-12",
        tone === "alt" && "border-border bg-surface border-y",
        className,
      )}
      {...props}
    >
      <MarketingContainer className={containerClassName}>
        {children}
      </MarketingContainer>
    </section>
  );
}
