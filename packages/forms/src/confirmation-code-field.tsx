"use client";

import { FormField, Input } from "@template/ui-core";
import { useId, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import {
  get,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

export function ConfirmationCodeField<TValues extends FieldValues>({
  autoFocus = false,
  label,
  length = 6,
  name,
  onComplete,
  required,
}: Readonly<{
  autoFocus?: boolean;
  label: string;
  length?: number;
  name: FieldPath<TValues>;
  onComplete?: (code: string) => void;
  required?: boolean;
}>) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const {
    formState: { errors },
    register,
    setValue,
    watch,
  } = useFormContext<TValues>();
  const error = get(errors, name)?.message as string | undefined;
  const watchedValue = watch(name);
  const value = typeof watchedValue === "string" ? watchedValue : "";

  function updateCode(nextValue: string) {
    setValue(name, nextValue as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function updateCharacter(index: number, nextCharacter: string) {
    const characters = Array.from(
      { length },
      (_, characterIndex) => value[characterIndex] ?? "",
    );
    characters[index] = nextCharacter.slice(-1);
    updateCode(characters.join(""));
    if (nextCharacter && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function pasteCode(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const clipboardCode = event.clipboardData
      .getData("text")
      .replaceAll(/\s/g, "");
    const pastedCode = clipboardCode.slice(0, length);
    updateCode(pastedCode);
    inputRefs.current[Math.min(pastedCode.length, length - 1)]?.focus();
    if (clipboardCode.length === length) {
      onComplete?.(pastedCode);
    }
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      event.preventDefault();
      const characters = value.split("");
      characters[index - 1] = "";
      updateCode(characters.join(""));
      inputRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  return (
    <FormField
      descriptionId={descriptionId}
      error={error}
      inputId={`${id}-0`}
      label={label}
      required={required}
    >
      <input {...register(name)} type="hidden" />
      <div className="flex gap-2 sm:gap-3">
        {Array.from({ length }, (_, index) => (
          <Input
            aria-describedby={error ? descriptionId : undefined}
            aria-invalid={error ? true : undefined}
            aria-label={`Character ${index + 1} of ${length}`}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            autoFocus={autoFocus && index === 0}
            className="h-12 min-w-0 flex-1 px-0 text-center text-lg font-semibold"
            id={`${id}-${index}`}
            inputMode="numeric"
            key={index}
            maxLength={length}
            onChange={(event) => {
              const nextValue = event.target.value.replaceAll(/\s/g, "");
              if (nextValue.length > 1) {
                updateCode(nextValue.slice(0, length));
                inputRefs.current[
                  Math.min(nextValue.length, length - 1)
                ]?.focus();
                return;
              }
              updateCharacter(index, nextValue);
            }}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onPaste={pasteCode}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            value={value[index] ?? ""}
          />
        ))}
      </div>
    </FormField>
  );
}
