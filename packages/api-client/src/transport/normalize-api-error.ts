import {
  ApiError,
  type ApiErrorKind,
  type ValidationErrors,
} from "../client/api-error";
import type { ApiRequest } from "../client/types";
import { responseMetadata } from "./parse-response";

interface ProblemDetailsLike extends Record<string, unknown> {
  code?: unknown;
  detail?: unknown;
  errors?: unknown;
  extensions?: unknown;
  instance?: unknown;
  title?: unknown;
  traceId?: unknown;
  type?: unknown;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function normalizeValidationErrors(value: unknown): ValidationErrors {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).flatMap(([field, messages]) => {
      if (!Array.isArray(messages)) {
        return [];
      }
      const normalized = messages.filter(
        (message): message is string => typeof message === "string",
      );
      return normalized.length > 0 ? [[field, normalized]] : [];
    }),
  );
}

function errorKind(
  status: number,
  validationErrors: ValidationErrors,
): ApiErrorKind {
  const knownKinds: Partial<Record<number, ApiErrorKind>> = {
    401: "unauthorized",
    403: "forbidden",
    404: "not-found",
    409: "conflict",
    423: "locked",
    429: "rate-limited",
  };
  const knownKind = knownKinds[status];
  if (knownKind) {
    return knownKind;
  }
  if (
    status === 400 ||
    status === 422 ||
    Object.keys(validationErrors).length > 0
  ) {
    return "validation";
  }
  if (status >= 500) {
    return "server";
  }
  return "unexpected";
}

function safeMessage(status: number): string {
  const knownMessages: Partial<Record<number, string>> = {
    400: "Some submitted values are invalid.",
    401: "Authentication is required.",
    403: "You do not have permission to perform this action.",
    404: "The requested resource was not found.",
    409: "The request conflicts with the current state.",
    422: "Some submitted values are invalid.",
    423: "The account is currently locked.",
    429: "Too many requests. Please try again later.",
  };
  if (knownMessages[status]) {
    return knownMessages[status];
  }
  if (status >= 500) {
    return "The service is temporarily unavailable.";
  }
  return "The request could not be completed.";
}

export function normalizeHttpError(
  response: Response,
  payload: unknown,
  request: ApiRequest,
): ApiError {
  const problem =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as ProblemDetailsLike)
      : undefined;
  const extensions =
    problem?.extensions &&
    typeof problem.extensions === "object" &&
    !Array.isArray(problem.extensions)
      ? (problem.extensions as Record<string, unknown>)
      : {};
  const validationErrors = normalizeValidationErrors(
    problem?.errors ?? extensions.errors,
  );
  const traceId =
    stringValue(problem?.traceId) ??
    stringValue(extensions.traceId) ??
    response.headers.get("trace-id") ??
    undefined;
  const correlationId =
    response.headers.get("x-correlation-id") ??
    response.headers.get("x-request-id") ??
    undefined;

  return new ApiError({
    code:
      stringValue(problem?.code) ??
      stringValue(extensions.code) ??
      stringValue(extensions.errorCode),
    correlationId,
    detail:
      stringValue(problem?.detail) ??
      (typeof payload === "string" ? payload : undefined),
    extensions,
    instance: stringValue(problem?.instance),
    kind: errorKind(response.status, validationErrors),
    method: request.method,
    path: request.path,
    problemType: stringValue(problem?.type),
    response: responseMetadata(response),
    retryAfter: response.headers.get("retry-after") ?? undefined,
    safeMessage: safeMessage(response.status),
    status: response.status,
    title: stringValue(problem?.title),
    traceId,
    validationErrors,
  });
}
