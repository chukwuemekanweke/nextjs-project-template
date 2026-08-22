"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormContext } from "react-hook-form";

export function SubmitButton({
  children,
  disabled,
  pending = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean }) {
  const {
    formState: { isSubmitting },
  } = useFormContext();
  const isPending = pending || isSubmitting;

  return (
    <button
      {...props}
      aria-busy={isPending}
      disabled={disabled || isPending}
      type="submit"
    >
      {children}
    </button>
  );
}
