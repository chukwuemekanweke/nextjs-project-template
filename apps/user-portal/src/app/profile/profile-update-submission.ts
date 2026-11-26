import { applyBackendValidation } from "@template/forms";
import type { UpdateProfileRequest } from "@template/api-client/profiles";
import type { z } from "zod";
import {
  normalizeProfileUpdate,
  profileUpdateFallbackMessages,
  type profileUpdateSchema,
} from "@/lib/profile-editing";

export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;

type ProfileSetError = Parameters<
  typeof applyBackendValidation<ProfileUpdateValues>
>[1];

export type ProfileUpdateResult =
  | Readonly<{ status: "saved"; values: UpdateProfileRequest }>
  /** Field errors were set on the form; `message` is any unmapped error. */
  | Readonly<{ message?: string; status: "rejected" }>;

/**
 * Name-update submission, kept out of the component so it can be tested
 * without a DOM. Values are trimmed before sending; backend validation is
 * authoritative and mapped onto the fields. Success is reported only after
 * the mutation resolves.
 */
export async function submitProfileUpdate(
  values: ProfileUpdateValues,
  {
    setError,
    update,
  }: Readonly<{
    setError: ProfileSetError;
    update: (request: UpdateProfileRequest) => Promise<unknown>;
  }>,
): Promise<ProfileUpdateResult> {
  const normalizedValues = normalizeProfileUpdate(values);

  try {
    await update(normalizedValues);
    return { status: "saved", values: normalizedValues };
  } catch (caughtError) {
    const generalErrors = applyBackendValidation(caughtError, setError, [
      "firstName",
      "lastName",
    ]);

    const fallbackMessages = profileUpdateFallbackMessages(caughtError);
    if (fallbackMessages) {
      setError("firstName", {
        message: fallbackMessages.firstName,
        type: "server",
      });
      setError("lastName", {
        message: fallbackMessages.lastName,
        type: "server",
      });
      return { status: "rejected" };
    }

    return generalErrors[0]
      ? { message: generalErrors[0], status: "rejected" }
      : { status: "rejected" };
  }
}
