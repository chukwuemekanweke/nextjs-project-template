import { cn } from "../lib/cn";
import { CheckIcon } from "./icons";

export type StepItem = Readonly<{
  /** Stable key; also used to mark the current step. */
  id: string;
  label: string;
}>;

/**
 * Linear progress through a short flow (reference `.steps`): numbered dots
 * joined by bars, a check on completed steps and the brand colour on the
 * current one. Below `md` only the current step keeps its visible label;
 * every label stays available to assistive technology, and the current
 * step carries `aria-current="step"`. Presentational only: the app decides
 * which step is current.
 */
export function Steps({
  className,
  current,
  label = "Progress",
  steps,
}: Readonly<{
  className?: string;
  /** `id` of the current step. Earlier steps render as complete. */
  current: string;
  /** Accessible name of the list. */
  label?: string;
  steps: readonly StepItem[];
}>) {
  const currentIndex = steps.findIndex((step) => step.id === current);

  return (
    <ol
      aria-label={label}
      className={cn(
        "text-small text-fg-subtle flex items-center gap-2",
        className,
      )}
    >
      {steps.map((step, index) => {
        const state =
          index < currentIndex
            ? "complete"
            : index === currentIndex
              ? "current"
              : "upcoming";

        return (
          <li
            aria-current={state === "current" ? "step" : undefined}
            className={cn(
              "flex items-center gap-2",
              index > 0 && "min-w-0 flex-1",
            )}
            key={step.id}
          >
            {index > 0 ? (
              <span
                aria-hidden="true"
                className="bg-border-strong h-px min-w-6 flex-1"
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full border font-semibold",
                state === "current" && "border-brand bg-brand text-on-brand",
                state === "complete" &&
                  "bg-brand-soft-2 text-brand-ink border-transparent",
                state === "upcoming" && "border-border-strong",
              )}
            >
              {state === "complete" ? (
                <CheckIcon className="size-3.5" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                "whitespace-nowrap",
                state === "current" ? "text-fg font-medium" : "max-md:sr-only",
              )}
            >
              {step.label}
              {state === "complete" ? (
                <span className="sr-only"> (completed)</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
