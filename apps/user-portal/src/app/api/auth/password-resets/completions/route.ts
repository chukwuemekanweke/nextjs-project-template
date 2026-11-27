import { completePasswordReset } from "@template/api-client/authentication";
import { createAppServerApiClient } from "@/lib/server-api";
import {
  passwordResetCompletionBody,
  passwordResetCompletionError,
  passwordResetJson,
  readJson,
} from "@/lib/password-reset-bff";

/**
 * Anonymous: submits the emailed code with the new password. The backend
 * returns only a message, so no session is created and no cookie is set.
 */
export async function POST(request: Request) {
  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const result = await completePasswordReset(
      client,
      passwordResetCompletionBody(await readJson(request)),
    );
    return passwordResetJson(result);
  } catch (error) {
    return passwordResetCompletionError(error);
  }
}
