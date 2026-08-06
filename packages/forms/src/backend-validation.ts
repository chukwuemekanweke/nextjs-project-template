import { isApiError } from "@template/api-client";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";

function normalizedFieldName(value: string) {
  return value.replaceAll(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

export function applyBackendValidation<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  fieldNames: readonly FieldPath<TValues>[],
  aliases: Readonly<Record<string, FieldPath<TValues>>> = {},
): string[] {
  if (!isApiError(error)) {
    return ["The request could not be completed."];
  }

  const knownFields = new Map<string, FieldPath<TValues>>();
  for (const fieldName of fieldNames) {
    knownFields.set(normalizedFieldName(fieldName), fieldName);
  }
  for (const [alias, fieldName] of Object.entries(aliases)) {
    knownFields.set(normalizedFieldName(alias), fieldName);
  }

  const generalErrors: string[] = [];
  for (const [backendField, messages] of Object.entries(
    error.validationErrors,
  )) {
    const fieldName = knownFields.get(normalizedFieldName(backendField));

    if (fieldName) {
      setError(fieldName, { message: messages.join(" "), type: "server" });
    } else {
      generalErrors.push(...messages);
    }
  }

  if (
    generalErrors.length === 0 &&
    Object.keys(error.validationErrors).length === 0
  ) {
    generalErrors.push(error.safeMessage);
  }

  return generalErrors;
}
