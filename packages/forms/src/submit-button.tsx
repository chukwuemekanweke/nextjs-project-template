"use client";

import { Button, type ButtonProps } from "@template/ui-core";
import { useFormContext } from "react-hook-form";

/**
 * Form submit button on the shared `Button`. While the form is submitting
 * (or `pending` is set by the caller) it shows a spinner, sets `aria-busy`
 * and ignores further activation, so a submission cannot be sent twice.
 */
export function SubmitButton({
  pending = false,
  ...props
}: Omit<ButtonProps, "asChild" | "loading" | "type"> & { pending?: boolean }) {
  const {
    formState: { isSubmitting },
  } = useFormContext();

  return <Button {...props} loading={pending || isSubmitting} type="submit" />;
}
