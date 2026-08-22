"use client";

import { FormField, Input } from "@template/ui-core";
import { useId, type InputHTMLAttributes } from "react";
import {
  get,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

type TextFieldProps<TValues extends FieldValues> = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name"
> & {
  hint?: string;
  label: string;
  name: FieldPath<TValues>;
};

export function TextField<TValues extends FieldValues>({
  hint,
  id: suppliedId,
  label,
  name,
  required,
  ...props
}: TextFieldProps<TValues>) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const descriptionId = `${id}-description`;
  const {
    formState: { errors },
    register,
  } = useFormContext<TValues>();
  const error = get(errors, name)?.message as string | undefined;

  return (
    <FormField
      descriptionId={descriptionId}
      error={error}
      hint={hint}
      inputId={id}
      label={label}
      required={required}
    >
      <Input
        {...props}
        {...register(name)}
        aria-describedby={error || hint ? descriptionId : undefined}
        aria-invalid={error ? true : undefined}
        id={id}
        required={required}
      />
    </FormField>
  );
}
