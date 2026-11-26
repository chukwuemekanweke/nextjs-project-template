import { Card, CardContent, cn, IconTile } from "@template/ui-core";
import type { FeatureItem } from "../types";

/**
 * Responsive grid of feature cards (reference `.grid.g3` of `.card`): an
 * optional icon tile, an `h3` title and a muted description. One column on
 * phones, two on tablets, three from `lg`.
 */
export function FeatureGrid({
  className,
  items,
}: Readonly<{ className?: string; items: readonly FeatureItem[] }>) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item) => (
        <li className="flex" key={item.title}>
          <Card className="w-full">
            <CardContent className="flex flex-col gap-2.5 md:gap-3">
              {item.icon ? <IconTile>{item.icon}</IconTile> : null}
              <h3 className="text-h3 text-fg">{item.title}</h3>
              <p className="text-fg-muted">{item.description}</p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
