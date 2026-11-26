import {
  ArrowLeftIcon,
  Badge,
  buttonVariants,
  cn,
  KeyValueList,
} from "@template/ui-core";
import Link from "next/link";
import type { ReactNode } from "react";
import type { StatusTone } from "@/lib/billing-display";

/**
 * Status pill for billing states (reference `.badge`). The text label always
 * carries the meaning; `data-tone` lets tests assert the mapped tone.
 */
export function StatusBadge({
  children,
  tone,
}: Readonly<{ children: ReactNode; tone: StatusTone }>) {
  return (
    <Badge data-tone={tone} tone={tone}>
      {children}
    </Badge>
  );
}

/** Backend-provided billing facts as a reference `.kv` list. */
export function DetailList({
  items,
}: Readonly<{
  items: ReadonlyArray<Readonly<{ label: string; value: ReactNode }>>;
}>) {
  return <KeyValueList items={items} />;
}

/** Small "back" link above a page heading (reference `a.small` + arrow). */
export function BackLink({
  children,
  href,
}: Readonly<{ children: ReactNode; href: string }>) {
  return (
    <Link
      className="text-small text-brand-ink focus-visible:outline-focus inline-flex items-center gap-1.5 rounded-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
      href={href}
    >
      <ArrowLeftIcon size="xs" />
      {children}
    </Link>
  );
}

export const primaryButtonClass = buttonVariants({ variant: "primary" });

export const secondaryButtonClass = buttonVariants({ variant: "secondary" });

/** Primary result action; full width on phones (reference `.btn-p`). */
export const largePrimaryButtonClass = cn(
  buttonVariants({ variant: "primary" }),
  "max-sm:w-full",
);

/** Inline text action (reference link styling). */
export const textLinkClass = cn(
  "text-brand-ink focus-visible:outline-focus inline-flex items-center justify-center gap-1.5 rounded-sm px-2 py-1 font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2",
);
