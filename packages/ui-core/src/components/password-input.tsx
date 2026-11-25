"use client";

import { useState, type ComponentPropsWithRef } from "react";
import { cn } from "../lib/cn";
import { controlClassName } from "./form";
import { EyeIcon, EyeOffIcon } from "./icons";

/**
 * Password input with a show/hide toggle. The toggle is a labelled
 * `aria-pressed` button that controls the input. `className` applies to the
 * input; `wrapperClassName` to the positioning wrapper.
 */
export function PasswordInput({
  className,
  disabled,
  hideLabel = "Hide password",
  id,
  showLabel = "Show password",
  wrapperClassName,
  ...props
}: Omit<ComponentPropsWithRef<"input">, "type"> &
  Readonly<{
    hideLabel?: string;
    showLabel?: string;
    wrapperClassName?: string;
  }>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("relative", wrapperClassName)}>
      <input
        {...props}
        className={cn(controlClassName, "pr-12", className)}
        disabled={disabled}
        id={id}
        type={visible ? "text" : "password"}
      />
      <button
        aria-controls={id}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        className="text-fg-subtle hover:text-fg focus-visible:outline-focus absolute inset-y-0 right-1 my-auto grid size-10 place-items-center rounded-sm focus-visible:outline-2 disabled:opacity-50"
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
