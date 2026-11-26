import {
  useId,
  type ComponentPropsWithRef,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";
import { cn, joinIds } from "../lib/cn";
import { CircleAlertIcon, SearchIcon } from "./icons";

/*
 * Native form controls styled to the reference (`.field`, `.input`, `.hint`,
 * `.err-t`, `.check`, `.search`). They are presentational and
 * server-compatible: no React Hook Form, validation or API knowledge here —
 * `@template/forms` connects them. Every control forwards `ref` (React 19
 * ref-as-prop), so `register()` works directly.
 *
 * Invalid state: set `aria-invalid` on the control (the border turns red) and
 * link the message with `aria-describedby`; `FormField` renders the message
 * with an icon so errors never rely on colour alone.
 */

/** Shared text-control classes; exported for custom controls. */
export const controlClassName = cn(
  "border-control-border bg-surface text-body text-fg min-h-control w-full rounded-md border px-3.5 py-2 transition-[border-color,box-shadow]",
  "placeholder:text-fg-subtle hover:border-fg-subtle",
  "focus:border-brand focus:ring-brand-soft-2 focus:ring-4 focus:outline-none",
  "aria-invalid:border-danger aria-invalid:focus:ring-danger-bg",
  // `[readonly]`, not `:read-only` — selects and checkboxes match the latter.
  "[&[readonly]]:bg-surface-3 [&[readonly]]:text-fg-muted [&[readonly]]:hover:border-control-border",
  "disabled:bg-surface-3 disabled:opacity-60 disabled:hover:border-control-border",
);

/* ------------------------------------------------------------------------ */
/* Field wrapper and messages                                                */
/* ------------------------------------------------------------------------ */

export function FormLabel({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-label text-fg", className)} {...props} />;
}

/** Supporting text under a control. */
export function FieldHint({
  children,
  className,
  id,
}: Readonly<{ children: ReactNode; className?: string; id?: string }>) {
  return (
    <span className={cn("text-small text-fg-subtle", className)} id={id}>
      {children}
    </span>
  );
}

/** Validation message, announced when it appears. */
export function FieldError({
  children,
  className,
  id,
}: Readonly<{ children: ReactNode; className?: string; id?: string }>) {
  return (
    <span
      className={cn(
        "text-small text-danger flex items-start gap-1.5",
        className,
      )}
      id={id}
      role="alert"
    >
      <CircleAlertIcon className="mt-0.5" size="xs" />
      <span>{children}</span>
    </span>
  );
}

/**
 * Label, control and one supporting message (the error replaces the hint).
 * The caller passes `inputId` (the control's id) and `descriptionId`, and
 * sets `aria-describedby={descriptionId}` / `aria-invalid` on the control.
 */
export function FormField({
  label,
  hint,
  error,
  inputId,
  descriptionId,
  required = false,
  labelAction,
  children,
  className,
}: Readonly<{
  label: string;
  hint?: ReactNode;
  error?: string;
  inputId?: string;
  descriptionId?: string;
  required?: boolean;
  /**
   * Small action on the label row, outside the label (reference
   * `.field .between`, for example "Forgot password?").
   */
  labelAction?: ReactNode;
  children: ReactNode;
  className?: string;
}>) {
  const formLabel = (
    <FormLabel htmlFor={inputId}>
      {label}
      {required ? (
        <span aria-hidden="true" className="text-danger">
          {" "}
          *
        </span>
      ) : null}
    </FormLabel>
  );

  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      {labelAction ? (
        <div className="flex items-center justify-between gap-3">
          {formLabel}
          <div className="text-small shrink-0">{labelAction}</div>
        </div>
      ) : (
        formLabel
      )}
      {children}
      {error ? (
        <FieldError id={descriptionId}>{error}</FieldError>
      ) : hint ? (
        <FieldHint id={descriptionId}>{hint}</FieldHint>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Text controls                                                             */
/* ------------------------------------------------------------------------ */

export function Input({ className, ...props }: ComponentPropsWithRef<"input">) {
  return <input className={cn(controlClassName, className)} {...props} />;
}

/** Native select with the reference chevron (drawn with token colours). */
export function Select({
  className,
  children,
  ...props
}: ComponentPropsWithRef<"select">) {
  return (
    <select
      className={cn(
        controlClassName,
        "appearance-none bg-[linear-gradient(45deg,transparent_50%,var(--color-fg-subtle)_50%),linear-gradient(135deg,var(--color-fg-subtle)_50%,transparent_50%)] bg-size-[5px_5px] bg-position-[calc(100%-18px)_calc(50%+1px),calc(100%-13px)_calc(50%+1px)] bg-no-repeat pr-10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  rows = 5,
  ...props
}: ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      className={cn(controlClassName, "resize-y", className)}
      rows={rows}
      {...props}
    />
  );
}

/**
 * Search field (reference `.search`). Give it an accessible name with
 * `aria-label` or a `<label htmlFor>`. `className` sizes the wrapper.
 */
export function SearchInput({
  className,
  inputClassName,
  ...props
}: Omit<ComponentPropsWithRef<"input">, "type"> &
  Readonly<{ inputClassName?: string }>) {
  return (
    <div className={cn("relative w-full md:max-w-[420px]", className)}>
      <SearchIcon
        className="text-fg-subtle pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
        size="sm"
      />
      <input
        className={cn(controlClassName, "pl-[42px]", inputClassName)}
        type="search"
        {...props}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Choice controls                                                           */
/* ------------------------------------------------------------------------ */

const choiceInputClassName =
  "accent-brand mt-0.5 size-[18px] shrink-0 disabled:opacity-50";

type ChoiceProps = Omit<ComponentPropsWithRef<"input">, "type"> &
  Readonly<{
    /** Optional secondary line, linked with `aria-describedby`. */
    description?: ReactNode;
    /** Visible label; omit when labelling the control yourself. */
    label?: ReactNode;
  }>;

function Choice({
  className,
  description,
  id: suppliedId,
  label,
  type,
  ...props
}: ChoiceProps & Readonly<{ type: "checkbox" | "radio" }>) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const descriptionId = description ? `${id}-description` : undefined;
  const input = (
    <input
      {...props}
      aria-describedby={joinIds(props["aria-describedby"], descriptionId)}
      className={cn(choiceInputClassName, !label && className)}
      id={id}
      type={type}
    />
  );

  if (!label) {
    return input;
  }

  return (
    <div
      className={cn(
        "text-label text-fg-muted flex items-start gap-2.5 font-normal",
        className,
      )}
    >
      {input}
      <div className="grid gap-0.5">
        <label className="text-fg" htmlFor={id}>
          {label}
        </label>
        {description ? (
          <span className="text-small text-fg-subtle" id={descriptionId}>
            {description}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Native checkbox (reference `.check`), optionally with label and description. */
export function Checkbox(props: ChoiceProps) {
  return <Choice {...props} type="checkbox" />;
}

/** Native radio button; group radios with the same `name` in a `RadioGroup`. */
export function Radio(props: ChoiceProps) {
  return <Choice {...props} type="radio" />;
}

/**
 * Fieldset for radios or radio cards. Arrow keys move between native radios
 * sharing a `name`. `error` is shown under the options and linked to the
 * group.
 */
export function RadioGroup({
  children,
  className,
  description,
  error,
  legend,
  orientation = "vertical",
}: Readonly<{
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  error?: string;
  legend: ReactNode;
  orientation?: "horizontal" | "vertical";
}>) {
  const id = useId();
  const describedBy = joinIds(
    description ? `${id}-description` : undefined,
    error ? `${id}-error` : undefined,
  );

  return (
    <fieldset
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
      className={cn("grid min-w-0 gap-2", className)}
    >
      <legend className="text-label text-fg mb-1.5">{legend}</legend>
      {description ? (
        <FieldHint className="-mt-1.5" id={`${id}-description`}>
          {description}
        </FieldHint>
      ) : null}
      <div
        className={cn(
          "grid gap-3",
          orientation === "horizontal" &&
            "md:grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))]",
        )}
      >
        {children}
      </div>
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </fieldset>
  );
}

/**
 * Selectable card containing a native radio (checkout payment methods,
 * plan intervals). The whole card is the label; the checked card gets the
 * brand border.
 */
export function RadioCard({
  className,
  description,
  id: suppliedId,
  label,
  leading,
  ...props
}: Omit<ComponentPropsWithRef<"input">, "type"> &
  Readonly<{
    description?: ReactNode;
    label: ReactNode;
    /** Decorative visual, for example an `IconTile`. */
    leading?: ReactNode;
  }>) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <label
      className={cn(
        "border-border-strong bg-surface hover:bg-hover flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
        "has-checked:border-brand has-checked:bg-brand-soft has-checked:ring-brand has-checked:ring-1",
        "has-focus-visible:outline-focus has-focus-visible:outline-2 has-focus-visible:outline-offset-2",
        "has-disabled:cursor-not-allowed has-disabled:opacity-50",
        className,
      )}
      htmlFor={id}
    >
      {leading}
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-fg font-medium">{label}</span>
        {description ? (
          <span className="text-small text-fg-muted" id={descriptionId}>
            {description}
          </span>
        ) : null}
      </span>
      <input
        {...props}
        aria-describedby={joinIds(props["aria-describedby"], descriptionId)}
        className={cn(choiceInputClassName, "focus-visible:outline-none")}
        id={id}
        type="radio"
      />
    </label>
  );
}
