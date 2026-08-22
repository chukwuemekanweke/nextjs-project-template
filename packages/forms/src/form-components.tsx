"use client";

import { FormField, Input } from "@template/ui-core";
import {
  useId,
  useState,
  type ButtonHTMLAttributes,
  type FormHTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  FormProvider,
  get,
  useFormContext,
  type FieldPath,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";

export function ValidatedForm<TValues extends FieldValues>({
  children,
  form,
  onSubmit,
  ...props
}: Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  children: ReactNode;
  form: UseFormReturn<TValues>;
  onSubmit: SubmitHandler<TValues>;
}) {
  return (
    <FormProvider {...form}>
      <form {...props} noValidate onSubmit={form.handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}

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

export function PasswordField<TValues extends FieldValues>({
  hint,
  id: suppliedId,
  label,
  name,
  required,
  ...props
}: Omit<TextFieldProps<TValues>, "type">) {
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
