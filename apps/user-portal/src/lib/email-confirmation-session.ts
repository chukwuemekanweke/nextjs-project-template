"use client";

import type { ConfirmEmailMutationRequest } from "@template/api-client/authentication";
import { createFetchApiTransport } from "@template/api-client/transport";

const EMAIL_CONFIRMATION_SESSION_PATH = "/api/auth/email-confirmations";

interface ConfirmationSessionResponse {
  expiresAtUtc: string;
  tokenType: string;
}

export async function confirmEmailSession(
  request: ConfirmEmailMutationRequest,
  options: Readonly<{
    baseUrl?: string;
    fetch?: typeof globalThis.fetch;
  }> = {},
): Promise<void> {
  const transport = createFetchApiTransport({
    baseUrl: options.baseUrl ?? window.location.origin,
    credentials: "same-origin",
    fetch: options.fetch,
  });
  await transport.post<
    ConfirmationSessionResponse,
    ConfirmEmailMutationRequest
  >(EMAIL_CONFIRMATION_SESSION_PATH, request);
}
