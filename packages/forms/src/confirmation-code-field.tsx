"use client";

import { FormField, Input } from "@template/ui-core";
import {
  Fragment,
  useEffect,
  useId,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
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

  function normalizeCode(code: string) {
    return normalizeConfirmationCode(code, characterSet);
  }

  function updateCode(nextValue: string) {
    const normalizedValue = normalizeCode(nextValue).slice(0, length);
    setValue(name, normalizedValue as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function updateCharacter(index: number, nextCharacter: string) {
    const characters = Array.from(
      { length },
      (_, characterIndex) => value[characterIndex] ?? "",
    );
    const normalizedCharacter = normalizeCode(nextCharacter).slice(-1);
    characters[index] = normalizedCharacter;
    updateCode(characters.join(""));
    if (normalizedCharacter && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function pasteCode(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pastedCode = normalizeCode(event.clipboardData.getData("text")).slice(
      0,
      length,
    );
    updateCode(pastedCode);
    inputRefs.current[Math.min(pastedCode.length, length - 1)]?.focus();
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
      <div
        className={
          groupAfter
            ? "grid grid-cols-[repeat(5,minmax(0,1fr))_auto_repeat(5,minmax(0,1fr))] items-center gap-2"
            : "flex gap-2 sm:gap-3"
        }
      >
        {Array.from({ length }, (_, index) => (
          <Fragment key={index}>
            {groupAfter === index ? (
              <span
                aria-hidden="true"
                className="self-center text-gray-400 dark:text-gray-500"
              >
                –
              </span>
            ) : null}
            <Input
              aria-describedby={error ? descriptionId : undefined}
              aria-invalid={error ? true : undefined}
              aria-label={`Character ${index + 1} of ${length}`}
              autoCapitalize={
                characterSet === "alphanumeric" ? "characters" : undefined
              }
              autoComplete={
                index === 0 && characterSet === "numeric"
                  ? "one-time-code"
                  : "off"
              }
              autoFocus={autoFocus && index === 0}
              className={[
                "h-14 min-w-0 px-0 text-center text-lg font-semibold",
                length <= 6 ? "w-11 flex-none sm:w-12" : "w-full",
              ].join(" ")}
              disabled={disabled}
              id={`${id}-${index}`}
              inputMode={characterSet === "numeric" ? "numeric" : "text"}
              maxLength={length}
              onChange={(event) => {
                const nextValue = normalizeCode(event.target.value);
                if (nextValue.length > 1) {
                  updateCode(nextValue);
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
          </Fragment>
        ))}
      </div>
    </FormField>
  );
}
