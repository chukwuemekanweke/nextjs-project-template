import { ApiError, type ApiErrorResponseMetadata } from "../client/api-error";
import type { ApiRequest } from "../client/types";

export function responseMetadata(response: Response): ApiErrorResponseMetadata {
  return {
    headers: Object.freeze(Object.fromEntries(response.headers.entries())),
    status: response.status,
    statusText: response.statusText,
  };
}

export async function parseResponsePayload(
  response: Response,
): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }
  const text = await response.text();
  if (text.trim().length === 0) {
    return undefined;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) {
    return JSON.parse(text) as unknown;
  }
  return text;
}

export async function parseResponse(
  response: Response,
  request: ApiRequest,
): Promise<unknown> {
  try {
    return await parseResponsePayload(response);
  } catch (cause) {
    throw new ApiError({
      cause,
      kind: "unexpected",
      method: request.method,
      path: request.path,
      response: responseMetadata(response),
      safeMessage: "The service returned an unreadable response.",
      status: response.status,
    });
  }
}
