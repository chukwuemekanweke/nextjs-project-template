import { IconTile, Panel } from "@template/ui-core";
import type { FeatureItem } from "../types";

/**
 * Numbered capability list (reference `PublicFeatures`): each row pairs a
 * numbered title and lead text with a soft illustration panel holding the
 * item's icon. Stacks on phones.
 */
export function NumberedFeatureList({
  items,
}: Readonly<{ items: readonly FeatureItem[] }>) {
  return (
    <ol>
      {items.map((item, index) => (
        <li
          className="border-border grid grid-cols-1 items-center gap-6 border-b py-8 md:grid-cols-2 md:gap-10 md:py-10"
          key={item.title}
        >
          <div className="flex flex-col gap-2.5">
            <span aria-hidden="true" className="eyebrow">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="text-h1 text-fg">{item.title}</h2>
            <p className="text-lead text-fg-muted">{item.description}</p>
          </div>
          {item.icon ? (
            <Panel className="grid h-40 place-items-center md:h-50">
              <IconTile className="size-16 rounded-2xl [&_svg]:size-7">
                {item.icon}
              </IconTile>
            </Panel>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
