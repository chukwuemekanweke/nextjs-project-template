import { requestPasswordReset } from "@template/api-client/authentication";
import { createAppServerApiClient } from "@/lib/server-api";
import {
  passwordResetJson,
  passwordResetRequestBody,
  passwordResetRequestError,
  readJson,
} from "@/lib/password-reset-bff";

/** Anonymous: requests an emailed reset code. Never sets session cookies. */
export async function POST(request: Request) {
  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const result = await requestPasswordReset(
      client,
      passwordResetRequestBody(await readJson(request)),
    );
    return passwordResetJson(result, 202);
  } catch (error) {
    return passwordResetRequestError(error);
  }
}
