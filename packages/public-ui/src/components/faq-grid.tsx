import { Card, CardContent } from "@template/ui-core";
import type { FaqItem } from "../types";

/**
 * Questions and answers as a two-column card grid (reference pricing
 * "Questions"); every answer stays visible, so no disclosure state is needed.
 */
export function FaqGrid({ items }: Readonly<{ items: readonly FaqItem[] }>) {
  return (
    <dl className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
      {items.map((item) => (
        <Card key={item.question}>
          <CardContent>
            <dt className="text-h3 text-fg">{item.question}</dt>
            <dd className="text-fg-muted mt-1.5">{item.answer}</dd>
          </CardContent>
        </Card>
      ))}
    </dl>
  );
}
