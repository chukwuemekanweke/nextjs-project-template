"use client";

import { FormField, Input } from "@template/ui-core";
import { useId, useState, type KeyboardEvent } from "react";
import {
  get,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

export function SearchableSelectField<TValues extends FieldValues>({
  disabled,
  hint,
  label,
  loading = false,
  name,
  options,
  placeholder = "Start typing to search",
  required,
}: Readonly<{
  disabled?: boolean;
  hint?: string;
  label: string;
  loading?: boolean;
  name: FieldPath<TValues>;
  options: ReadonlyArray<{
    label: string;
    secondaryLabel?: string;
    value: string;
  }>;
  placeholder?: string;
  required?: boolean;
}>) {
  const id = useId();
  const listId = `${id}-options`;
  const descriptionId = `${id}-description`;
  const [displayValue, setDisplayValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const {
    formState: { errors },
    register,
    setValue,
  } = useFormContext<TValues>();
  const error = get(errors, name)?.message as string | undefined;
  const searchTerm = displayValue.trim().toLocaleLowerCase();
  const filteredOptions = options.filter((option) =>
    option.label.toLocaleLowerCase().includes(searchTerm),
  );

  function updateSearch(nextDisplayValue: string) {
    setDisplayValue(nextDisplayValue);
    setValue(name, "" as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setActiveIndex(0);
    setOpen(true);
  }

  function selectOption(option: (typeof options)[number]) {
    setDisplayValue(option.label);
    setValue(name, option.value as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (filteredOptions.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        Math.min(current + 1, filteredOptions.length - 1),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter" && open) {
      event.preventDefault();
      const selected = filteredOptions[activeIndex];
      if (selected) {
        selectOption(selected);
      }
    }
  }

  return (
    <FormField
      descriptionId={descriptionId}
      error={error}
      hint={hint}
      inputId={id}
      label={label}
      required={required}
    >
      <input {...register(name)} type="hidden" />
      <div
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setOpen(false);
          }
        }}
      >
        <Input
          aria-activedescendant={
            open && filteredOptions[activeIndex]
              ? `${listId}-${activeIndex}`
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={listId}
          aria-describedby={error || hint ? descriptionId : undefined}
          aria-expanded={open}
          aria-invalid={error ? true : undefined}
          className="pr-10"
          disabled={disabled || loading}
          id={id}
          onChange={(event) => updateSearch(event.target.value)}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? "Loading options…" : placeholder}
          role="combobox"
          value={displayValue}
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-500"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            d="m6 8 4 4 4-4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
        {open && !disabled && !loading ? (
          <div
            className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
            id={listId}
            role="listbox"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  aria-selected={index === activeIndex}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700 ${
                    index === activeIndex
                      ? "bg-brand-50 text-brand-700 dark:bg-gray-700 dark:text-white"
                      : ""
                  }`}
                  id={`${listId}-${index}`}
                  key={option.value}
                  onClick={() => selectOption(option)}
                  onMouseDown={(event) => event.preventDefault()}
                  role="option"
                  tabIndex={-1}
                  type="button"
                >
                  <span>{option.label}</span>
                  {option.secondaryLabel ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {option.secondaryLabel}
                    </span>
                  ) : null}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No matching options.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </FormField>
  );
}
