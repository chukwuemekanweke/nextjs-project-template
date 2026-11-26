import { cn } from "@template/ui-core";

/** Centred section heading (reference `.sec-head`): eyebrow, `h2`, lead. */
export function SectionHeading({
  className,
  description,
  eyebrow,
  id,
  title,
}: Readonly<{
  className?: string;
  description?: string;
  eyebrow?: string;
  /** Id of the `h2`, for `aria-labelledby` on the enclosing section. */
  id?: string;
  title: string;
}>) {
  return (
    <div
      className={cn(
        "mb-7 flex flex-col items-center gap-3 text-center md:mb-12",
        className,
      )}
    >
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2 className="text-section text-fg" id={id}>
        {title}
      </h2>
      {description ? (
        <p className="text-lead text-fg-muted max-w-160">{description}</p>
      ) : null}
    </div>
  );
}
