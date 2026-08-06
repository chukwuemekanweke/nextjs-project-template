import type { QueryPrimitive, QueryValue } from "./types";

function serializePrimitive(
  value: Exclude<QueryPrimitive, null | undefined>,
): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

export function interpolatePath(
  path: string,
  parameters: Readonly<Record<string, QueryPrimitive>> = {},
): string {
  const interpolated = path.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const value = parameters[name];
    if (value === undefined || value === null) {
      throw new TypeError(`Missing path parameter '${name}'.`);
    }
    return encodeURIComponent(serializePrimitive(value));
  });

  if (/\{[^}]+\}/.test(interpolated)) {
    throw new TypeError(`Unresolved path parameter in '${path}'.`);
  }
  return interpolated;
}

export function appendQuery(
  url: URL,
  query: Readonly<Record<string, QueryValue>> | object | undefined,
): void {
  if (!query) {
    return;
  }
  for (const [name, rawValue] of Object.entries(query)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      if (value === undefined || value === null) {
        continue;
      }
      if (typeof value === "object" && !(value instanceof Date)) {
        throw new TypeError(`Unsupported query value for '${name}'.`);
      }
      url.searchParams.append(name, serializePrimitive(value));
    }
  }
}

export function requestBody(body: unknown): {
  body: BodyInit | undefined;
  contentType?: string;
} {
  if (body === undefined || body === null) {
    return { body: undefined };
  }
  if (typeof body === "string") {
    return { body };
  }
  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer
  ) {
    return { body };
  }
  return { body: JSON.stringify(body), contentType: "application/json" };
}
