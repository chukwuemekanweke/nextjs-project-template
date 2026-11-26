import { Button } from "@template/ui-core";
import Link from "next/link";
import { useId } from "react";
import type { Action } from "../types";

/**
 * Brand call-to-action panel (reference `.card.cta`): white title, lead
 * and a light button on the brand colour, in both themes.
 */
export function CtaBanner({
  action,
  description,
  title,
}: Readonly<{ action: Action; description?: string; title: string }>) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="bg-brand text-on-brand flex flex-col items-center gap-5 rounded-xl px-5 py-8 text-center md:p-14"
    >
      <h2 className="text-section" id={titleId}>
        {title}
      </h2>
      {description ? (
        <p className="text-on-brand/85 max-w-130 text-lg">{description}</p>
      ) : null}
      <Button
        asChild
        className="bg-on-brand text-brand-press hover:bg-on-brand/90 active:bg-on-brand/80"
      >
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </section>
  );
}
