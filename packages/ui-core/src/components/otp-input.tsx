"use client";

import {
  Fragment,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "../lib/cn";

export type OtpInputProps = Readonly<{
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  autoFocus?: boolean;
  className?: string;
  disabled?: boolean;
  /** Visual separator before this box index (for example 5 for `XXXXX-XXXXX`). */
  groupAfter?: number;
  /** Id prefix; box `n` gets `${id}-${n}`, so a label can target `${id}-0`. */
  id: string;
  inputMode?: "numeric" | "text";
  length?: number;
  /** Filters typed or pasted text (for example digits only, upper case). */
  normalize?: (value: string) => string;
  onChange: (value: string) => void;
  value: string;
}>;

const identity = (value: string) => value;

/**
 * One-time-code boxes (reference `.otp`). Controlled: the parent owns the
 * value. Typing advances, Backspace on an empty box goes back, arrows move,
 * and pasting or autofilling a whole code fills every box. The first box
 * advertises `autocomplete="one-time-code"` for numeric codes.
 */
export function OtpInput({
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  autoFocus = false,
  className,
  disabled = false,
  groupAfter,
  id,
  inputMode = "numeric",
  length = 6,
  normalize = identity,
  onChange,
  value,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function focusBox(index: number) {
    inputRefs.current[Math.min(Math.max(index, 0), length - 1)]?.focus();
  }

  function updateCode(nextValue: string) {
    onChange(normalize(nextValue).slice(0, length));
  }

  function updateCharacter(index: number, nextCharacter: string) {
    const characters = Array.from(
      { length },
      (_, characterIndex) => value[characterIndex] ?? "",
    );
    const normalizedCharacter = normalize(nextCharacter).slice(-1);
    characters[index] = normalizedCharacter;
    updateCode(characters.join(""));
    if (normalizedCharacter && index < length - 1) {
      focusBox(index + 1);
    }
  }

  function pasteCode(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pastedCode = normalize(event.clipboardData.getData("text")).slice(
      0,
      length,
    );
    updateCode(pastedCode);
    focusBox(pastedCode.length);
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
      focusBox(index - 1);
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
      return;
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  const compact = length <= 6;

  return (
    <div
      className={cn(
        groupAfter ? "grid items-center gap-2" : "flex gap-2 md:gap-2.5",
        className,
      )}
      role="group"
      style={
        groupAfter
          ? {
              gridTemplateColumns: `repeat(${groupAfter}, minmax(0, 1fr)) auto repeat(${length - groupAfter}, minmax(0, 1fr))`,
            }
          : undefined
      }
    >
      {Array.from({ length }, (_, index) => (
        <Fragment key={index}>
          {groupAfter === index ? (
            <span aria-hidden="true" className="text-fg-subtle self-center">
              –
            </span>
          ) : null}
          <input
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-label={`Character ${index + 1} of ${length}`}
            autoCapitalize={inputMode === "text" ? "characters" : undefined}
            autoComplete={
              index === 0 && inputMode === "numeric" ? "one-time-code" : "off"
            }
            autoFocus={autoFocus && index === 0}
            className={cn(
              "border-control-border bg-surface text-fg min-w-0 rounded-lg border text-center font-semibold transition-[border-color,box-shadow]",
              "focus:border-brand focus:ring-brand-soft-2 focus:ring-4 focus:outline-none",
              "aria-invalid:border-danger disabled:bg-surface-3 disabled:opacity-60",
              compact
                ? "h-[54px] w-[46px] flex-none text-xl md:h-[60px] md:w-[52px] md:text-2xl"
                : "h-14 w-full text-lg",
            )}
            disabled={disabled}
            id={`${id}-${index}`}
            inputMode={inputMode}
            maxLength={length}
            onChange={(event) => {
              const nextValue = normalize(event.target.value);
              if (nextValue.length > 1) {
                // Autofill or a multi-character insertion.
                updateCode(nextValue);
                focusBox(nextValue.length);
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
  );
}
