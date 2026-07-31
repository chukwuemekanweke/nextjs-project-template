import {
  ApiError,
  type ApiErrorKind,
  type ValidationErrors,
} from "./api-error";
import { appendQuery, interpolatePath, requestBody } from "./serialization";
import type { ApiClient, ApiClientConfiguration, ApiRequest } from "./types";

interface ProblemDetailsLike extends Record<string, unknown> {
  code?: unknown;
  detail?: unknown;
  errors?: unknown;
  extensions?: unknown;
  instance?: unknown;
  status?: unknown;
  title?: unknown;
  traceId?: unknown;
  type?: unknown;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function normalizeValidationErrors(value: unknown): ValidationErrors {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([field, messages]) => {
      if (!Array.isArray(messages)) return [];
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
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 423) return "locked";
  if (status === 404) return "not-found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate-limited";
  if (
    status === 400 ||
    status === 422 ||
    Object.keys(validationErrors).length > 0
  )
    return "validation";
  if (status >= 500) return "server";
  return "unexpected";
}

function safeMessage(status: number): string {
  if (status === 401) return "Authentication is required.";
  if (status === 403)
    return "You do not have permission to perform this action.";
  if (status === 423) return "The account is currently locked.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 409) return "The request conflicts with the current state.";
  if (status === 429) return "Too many requests. Please try again later.";
  if (status === 400 || status === 422)
    return "Some submitted values are invalid.";
  if (status >= 500) return "The service is temporarily unavailable.";
  return "The request could not be completed.";
}

async function parsePayload(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) return undefined;
  const text = await response.text();
  if (text.trim().length === 0) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) return JSON.parse(text) as unknown;
  return text;
}

function headersRecord(headers: Headers): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(headers.entries()));
}

function httpError(
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
    response: {
      headers: headersRecord(response.headers),
      status: response.status,
      statusText: response.statusText,
    },
    retryAfter: response.headers.get("retry-after") ?? undefined,
    safeMessage: safeMessage(response.status),
    status: response.status,
    title: stringValue(problem?.title),
    traceId,
    validationErrors,
  });
}

function randomCorrelationId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `request-${Date.now().toString(36)}`
  );
}

export function createApiClient(
  configuration: ApiClientConfiguration,
): ApiClient {
  const baseUrl = configuration.baseUrl.replace(/\/$/, "");
  if (!/^https?:\/\//.test(baseUrl))
    throw new TypeError("API base URL must be an absolute HTTP(S) URL.");

  return {
    async request<TResponse, TBody = unknown>(
      request: ApiRequest<TBody>,
    ): Promise<TResponse> {
      const url = new URL(
        `${baseUrl}${interpolatePath(request.path, request.pathParams)}`,
      );
      appendQuery(url, request.query);

      const defaultHeaders =
        typeof configuration.defaultHeaders === "function"
          ? await configuration.defaultHeaders()
          : configuration.defaultHeaders;
      const headers = new Headers(defaultHeaders);
      new Headers(request.headers).forEach((value, name) =>
        headers.set(name, value),
      );
      headers.set("Accept", "application/json");

      const accessToken = await configuration.getAccessToken?.();
      if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
      if (!headers.has("X-Correlation-ID")) {
        headers.set(
          "X-Correlation-ID",
          (await configuration.getCorrelationId?.()) ?? randomCorrelationId(),
        );
      }

      const serializedBody = requestBody(request.body);
      if (serializedBody.contentType && !headers.has("Content-Type"))
        headers.set("Content-Type", serializedBody.contentType);

      const controller = new AbortController();
      let timedOut = false;
      const timeoutMs = request.timeoutMs ?? configuration.timeoutMs;
      const timeout =
        timeoutMs === undefined
          ? undefined
          : setTimeout(() => {
              timedOut = true;
              controller.abort(
                new DOMException("Request timed out", "TimeoutError"),
              );
            }, timeoutMs);
      const abort = () => controller.abort(request.signal?.reason);
      if (request.signal?.aborted) abort();
      else request.signal?.addEventListener("abort", abort, { once: true });

      try {
        const response = await (configuration.fetch ?? globalThis.fetch)(url, {
          body: serializedBody.body,
          cache: request.cache ?? configuration.defaultCache,
          credentials: request.credentials ?? configuration.credentials,
          headers,
          method: request.method,
          next: request.next,
          signal: controller.signal,
        } as RequestInit);
        let payload: unknown;
        try {
          payload = await parsePayload(response);
        } catch (cause) {
          throw new ApiError({
            cause,
            kind: "unexpected",
            method: request.method,
            path: request.path,
            response: {
              headers: headersRecord(response.headers),
              status: response.status,
              statusText: response.statusText,
            },
            safeMessage: "The service returned an unreadable response.",
            status: response.status,
          });
        }
        if (!response.ok) throw httpError(response, payload, request);
        return payload as TResponse;
      } catch (cause) {
        if (isApiErrorCause(cause)) throw cause;
        if (timedOut) {
          throw new ApiError({
            cause,
            kind: "timeout",
            method: request.method,
            path: request.path,
            safeMessage: "The request timed out.",
          });
        }
        if (request.signal?.aborted || controller.signal.aborted) {
          throw new ApiError({
            cause,
            kind: "cancelled",
            method: request.method,
            path: request.path,
            safeMessage: "The request was cancelled.",
          });
        }
        throw new ApiError({
          cause,
          kind: "network",
          method: request.method,
          path: request.path,
          safeMessage: "The service could not be reached.",
        });
      } finally {
        if (timeout !== undefined) clearTimeout(timeout);
        request.signal?.removeEventListener("abort", abort);
      }
    },
  };
}

function isApiErrorCause(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
