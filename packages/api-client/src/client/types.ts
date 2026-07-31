export type QueryPrimitive =
  string | number | boolean | bigint | Date | null | undefined;
export type QueryValue = QueryPrimitive | ReadonlyArray<QueryPrimitive>;

export interface NextFetchOptions {
  revalidate?: false | 0 | number;
  tags?: ReadonlyArray<string>;
}

export interface ApiRequest<TBody = unknown> {
  body?: TBody;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  headers?: HeadersInit;
  method: string;
  next?: NextFetchOptions;
  path: string;
  pathParams?: Readonly<Record<string, QueryPrimitive>>;
  query?: Readonly<Record<string, QueryValue>> | object;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export type ApiOperationOptions = Pick<
  ApiRequest,
  "cache" | "credentials" | "headers" | "next" | "signal" | "timeoutMs"
>;

export interface ApiClient {
  request<TResponse, TBody = unknown>(
    request: ApiRequest<TBody>,
  ): Promise<TResponse>;
}

export interface ApiClientConfiguration {
  baseUrl: string;
  credentials?: RequestCredentials;
  defaultCache?: RequestCache;
  defaultHeaders?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  fetch?: typeof globalThis.fetch;
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
  getCorrelationId?: () => string | undefined | Promise<string | undefined>;
  timeoutMs?: number;
}
