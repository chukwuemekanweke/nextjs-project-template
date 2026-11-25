import type { ReactNode } from "react";

/** Titled group of component states inside a gallery story. */
export function Specimen({
  children,
  title,
}: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="eyebrow">{title}</h2>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
}

/** Gallery wrapper: a stack of specimens, screenshot by visual tests. */
export function Gallery({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="max-w-content flex flex-col gap-8" data-gallery>
      {children}
    </div>
  );
}
