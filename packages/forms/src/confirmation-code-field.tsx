"use client";

import { FormField, OtpInput } from "@template/ui-core";
import { useEffect, useId, useRef } from "react";
import {
  get,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  normalizeConfirmationCode,
  type ConfirmationCodeCharacterSet,
} from "./confirmation-code";

export function ConfirmationCodeField<TValues extends FieldValues>({
  autoFocus = false,
  characterSet = "numeric",
  disabled = false,
  groupAfter,
  label,
  length = 6,
  name,
  onComplete,
  required,
}: Readonly<{
  autoFocus?: boolean;
  characterSet?: ConfirmationCodeCharacterSet;
  disabled?: boolean;
  groupAfter?: number;
  label: string;
  length?: number;
  name: FieldPath<TValues>;
  onComplete?: (code: string) => void;
  required?: boolean;
}>) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const lastCompletedValue = useRef<string | undefined>(undefined);
  const {
    formState: { errors },
    register,
    setValue,
    watch,
  } = useFormContext<TValues>();
  const error = get(errors, name)?.message as string | undefined;
  const watchedValue = watch(name);
  const value = typeof watchedValue === "string" ? watchedValue : "";

  useEffect(() => {
    if (value.length !== length) {
      lastCompletedValue.current = undefined;
      return;
    }
    if (lastCompletedValue.current === value) {
      return;
    }
    lastCompletedValue.current = value;
    onComplete?.(value);
  }, [length, onComplete, value]);

  return (
    <FormField
      descriptionId={descriptionId}
      error={error}
      inputId={`${id}-0`}
      label={label}
      required={required}
    >
      <input {...register(name)} type="hidden" />
      <OtpInput
        aria-describedby={error ? descriptionId : undefined}
        aria-invalid={error ? true : undefined}
        autoFocus={autoFocus}
        disabled={disabled}
        groupAfter={groupAfter}
        id={id}
        inputMode={characterSet === "numeric" ? "numeric" : "text"}
        length={length}
        normalize={(code) => normalizeConfirmationCode(code, characterSet)}
        onChange={(nextValue) =>
          setValue(name, nextValue as never, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        value={value}
      />
    </FormField>
  );
}
