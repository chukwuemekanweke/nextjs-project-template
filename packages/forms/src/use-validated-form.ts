"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldValues, type UseFormProps } from "react-hook-form";
import type { ZodType } from "zod";

export function useValidatedForm<TValues extends FieldValues>(
  schema: ZodType<TValues, TValues>,
  options: Omit<UseFormProps<TValues>, "resolver"> = {},
) {
  return useForm<TValues>({
    mode: "onTouched",
    reValidateMode: "onChange",
    ...options,
    resolver: zodResolver(schema),
  });
}
