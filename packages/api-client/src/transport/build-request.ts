import {
  appendQuery,
  interpolatePath,
  requestBody,
} from "../client/serialization";
import type { ApiClientConfiguration, ApiRequest } from "../client/types";

function randomCorrelationId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `request-${Date.now().toString(36)}`
  );
}

export function normalizeBaseUrl(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/$/, "");
  if (!/^https?:\/\//.test(normalized)) {
    throw new TypeError("API base URL must be an absolute HTTP(S) URL.");
  }
  return normalized;
}

async function buildHeaders(
  configuration: ApiClientConfiguration,
  request: ApiRequest,
): Promise<Headers> {
  const defaultHeaders =
    typeof configuration.defaultHeaders === "function"
      ? await configuration.defaultHeaders()
      : configuration.defaultHeaders;
  const headers = new Headers(defaultHeaders);
  new Headers(request.headers).forEach((value, name) => {
    headers.set(name, value);
  });
  headers.set("Accept", "application/json");

  const accessToken = await configuration.getAccessToken?.();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!headers.has("X-Correlation-ID")) {
    headers.set(
      "X-Correlation-ID",
      request.correlationId ??
        configuration.createCorrelationId?.() ??
        (await configuration.getCorrelationId?.()) ??
        randomCorrelationId(),
    );
  }
  return headers;
}

export async function buildFetchRequest(
  baseUrl: string,
  configuration: ApiClientConfiguration,
  request: ApiRequest,
  signal: AbortSignal,
): Promise<{ init: RequestInit; url: URL }> {
  const url = new URL(
    `${baseUrl}${interpolatePath(request.path, request.pathParams)}`,
  );
  appendQuery(url, request.query);

  const headers = await buildHeaders(configuration, request);
  const serializedBody = requestBody(request.body);
  if (serializedBody.contentType && !headers.has("Content-Type")) {
    headers.set("Content-Type", serializedBody.contentType);
  }

  return {
    init: {
      body: serializedBody.body,
      cache: request.cache ?? configuration.defaultCache,
      credentials: request.credentials ?? configuration.credentials,
      headers,
      method: request.method,
      next: request.next,
      signal,
    } as RequestInit,
    url,
  };
}
