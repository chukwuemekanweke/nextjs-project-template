"use client";

import { FormField, Input } from "@template/ui-core";
import {
  useId,
  useState,
  type ButtonHTMLAttributes,
  type FormHTMLAttributes,
  type InputHTMLAttributes,
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
      <div className="relative">
        <Input
          {...props}
          {...register(name)}
          aria-describedby={error || hint ? descriptionId : undefined}
          aria-invalid={error ? true : undefined}
          className="pr-16"
          id={id}
          required={required}
          type={visible ? "text" : "password"}
        />
        <button
          aria-controls={id}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-2 rounded px-2 text-sm text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-gray-300"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </FormField>
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
