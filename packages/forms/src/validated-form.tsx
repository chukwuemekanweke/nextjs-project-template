"use client";

import type { FormHTMLAttributes, ReactNode } from "react";
import {
  FormProvider,
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
