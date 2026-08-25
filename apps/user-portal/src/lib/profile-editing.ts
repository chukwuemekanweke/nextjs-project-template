import { isApiError } from "@template/api-client";
import { z } from "zod";

export const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Enter your first name.")
    .max(100, "First name must be 100 characters or fewer."),
  lastName: z
    .string()
    .trim()
    .min(1, "Enter your last name.")
    .max(100, "Last name must be 100 characters or fewer."),
});

export function normalizeProfileUpdate(values: {
  firstName: string;
  lastName: string;
}) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
  };
}

export function profileUpdateFallbackMessages(error: unknown) {
  if (
    !isApiError(error) ||
    error.kind !== "validation" ||
    Object.keys(error.validationErrors).length > 0
  ) {
    return undefined;
  }

  return {
    firstName: "Enter your first name.",
    lastName: "Enter your last name.",
  } as const;
}
