"use client";

import { FormField, Input } from "@template/ui-core";
import { useId, useState, type InputHTMLAttributes } from "react";
import {
  get,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

type PasswordFieldProps<TValues extends FieldValues> = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "type"
> & {
  hint?: string;
  label: string;
  name: FieldPath<TValues>;
};

export function PasswordField<TValues extends FieldValues>({
  hint,
  id: suppliedId,
  label,
  name,
  required,
  ...props
}: PasswordFieldProps<TValues>) {
  const [visible, setVisible] = useState(false);
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
      <div className="relative" style={{ position: "relative" }}>
        <Input
          {...props}
          {...register(name)}
          aria-describedby={error || hint ? descriptionId : undefined}
          aria-invalid={error ? true : undefined}
          className="pr-12"
          id={id}
          required={required}
          style={{ ...props.style, paddingRight: "3rem" }}
          type={visible ? "text" : "password"}
        />
        <button
          aria-controls={id}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-1 flex w-10 items-center justify-center rounded text-gray-500 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => setVisible((current) => !current)}
          style={{
            alignItems: "center",
            bottom: 0,
            display: "flex",
            justifyContent: "center",
            position: "absolute",
            right: "0.25rem",
            top: 0,
            width: "2.5rem",
          }}
          type="button"
        >
          <PasswordVisibilityIcon hidden={visible} />
        </button>
      </div>
    </FormField>
  );
}

function PasswordVisibilityIcon({ hidden }: Readonly<{ hidden: boolean }>) {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      {hidden ? (
        <path
          d="m4 4 16 16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.75"
        />
      ) : null}
    </svg>
  );
}
