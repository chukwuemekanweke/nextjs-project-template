import { ApiError, isApiError } from "../client/api-error";
import type {
  ApiClientConfiguration,
  ApiOperationOptions,
  ApiRequest,
  ApiTransport,
} from "../client/types";
import { buildFetchRequest, normalizeBaseUrl } from "./build-request";
import { normalizeHttpError } from "./normalize-api-error";
import { parseResponse } from "./parse-response";
import { createRequestCancellation } from "./request-cancellation";

function transportFailure(
  cause: unknown,
  request: ApiRequest,
  timedOut: boolean,
  cancelled: boolean,
): ApiError {
  if (timedOut) {
    return new ApiError({
      cause,
      kind: "timeout",
      method: request.method,
      path: request.path,
      safeMessage: "The request timed out.",
    });
  }
  if (cancelled) {
    return new ApiError({
      cause,
      kind: "cancelled",
      method: request.method,
      path: request.path,
      safeMessage: "The request was cancelled.",
    });
  }
  return new ApiError({
    cause,
    kind: "network",
    method: request.method,
    path: request.path,
    safeMessage: "The service could not be reached.",
  });
}

function attachConvenienceMethods(
  transport: Pick<ApiTransport, "request">,
): ApiTransport {
  return Object.assign(transport, {
    get: <TResponse>(path: string, options?: ApiOperationOptions) =>
      transport.request<TResponse>({ method: "GET", path, ...options }),
    post: <TResponse, TBody = unknown>(
      path: string,
      body?: TBody,
      options?: ApiOperationOptions,
    ) =>
      transport.request<TResponse, TBody>({
        method: "POST",
        path,
        body,
        ...options,
      }),
    put: <TResponse, TBody = unknown>(
      path: string,
      body?: TBody,
      options?: ApiOperationOptions,
    ) =>
      transport.request<TResponse, TBody>({
        method: "PUT",
        path,
        body,
        ...options,
      }),
    patch: <TResponse, TBody = unknown>(
      path: string,
      body?: TBody,
      options?: ApiOperationOptions,
    ) =>
      transport.request<TResponse, TBody>({
        method: "PATCH",
        path,
        body,
        ...options,
      }),
    delete: <TResponse>(path: string, options?: ApiOperationOptions) =>
      transport.request<TResponse>({ method: "DELETE", path, ...options }),
  });
}

export function createFetchApiTransport(
  configuration: ApiClientConfiguration,
): ApiTransport {
  const baseUrl = normalizeBaseUrl(configuration.baseUrl);
  const fetchImplementation = configuration.fetch ?? globalThis.fetch;

  return attachConvenienceMethods({
    async request<TResponse, TBody = unknown>(
      request: ApiRequest<TBody>,
    ): Promise<TResponse> {
      const cancellation = createRequestCancellation(
        request.signal,
        request.timeoutMs ?? configuration.timeoutMs,
      );
      try {
        const { init, url } = await buildFetchRequest(
          baseUrl,
          configuration,
          request,
          cancellation.signal,
        );
        const response = await fetchImplementation(url, init);
        const payload = await parseResponse(response, request);
        if (!response.ok) {
          throw normalizeHttpError(response, payload, request);
        }
        return payload as TResponse;
      } catch (cause) {
        if (isApiError(cause)) {
          throw cause;
        }
        throw transportFailure(
          cause,
          request,
          cancellation.didTimeOut(),
          request.signal?.aborted === true || cancellation.signal.aborted,
        );
      } finally {
        cancellation.dispose();
      }
    },
  });
}
