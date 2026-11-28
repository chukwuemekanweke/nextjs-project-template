import { isApiError } from "@template/api-client";
import type {
  CompletePasswordResetRequest,
  PasswordResetRequest,
} from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { apiRouteError } from "./api-route-error";

/**
 * Password-reset BFF helpers. Responses carry `no-store` because the
 * requests contain an email, a one-time code or new passwords.
 *
 * The backend answers an unknown email with 404 on both operations. That
 * would let anyone test which addresses have accounts, so the BFF folds it
 * into the outcomes a real account can also produce: an accepted request,
 * or an invalid code on completion.
 */
const NO_STORE = "no-store";

export const PASSWORD_RESET_ACCEPTED_MESSAGE =
  "If the account is eligible, a password reset code will be sent shortly.";

export function passwordResetJson(body: unknown, status = 200): NextResponse {
  const response = NextResponse.json(body, { status });
  response.headers.set("cache-control", NO_STORE);
  return response;
}

export function passwordResetRequestError(error: unknown): NextResponse {
  if (isApiError(error) && error.status === 404) {
    return passwordResetJson({ message: PASSWORD_RESET_ACCEPTED_MESSAGE }, 202);
  }
  return withNoStore(apiRouteError(error));
}

export function passwordResetCompletionError(error: unknown): NextResponse {
  if (isApiError(error) && error.status === 404) {
    return passwordResetJson(
      {
        detail: "The code is invalid, expired, or has already been used.",
        status: 400,
        title: "Invalid code",
      },
      400,
    );
  }
  return withNoStore(apiRouteError(error));
}

/** Forwards only the contract fields; anything else is dropped. */
export function passwordResetRequestBody(
  payload: unknown,
): PasswordResetRequest {
  const body = objectOrEmpty(payload);
  return { email: stringField(body.email) };
}

export function passwordResetCompletionBody(
  payload: unknown,
): CompletePasswordResetRequest {
  const body = objectOrEmpty(payload);
  return {
    confirmPassword: stringField(body.confirmPassword),
    email: stringField(body.email),
    otp: stringField(body.otp),
    password: stringField(body.password),
  };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

function withNoStore(response: NextResponse): NextResponse {
  response.headers.set("cache-control", NO_STORE);
  return response;
}

function objectOrEmpty(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value : "";
}
