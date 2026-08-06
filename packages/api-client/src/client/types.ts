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
  correlationId?: string;
}

export type ApiOperationOptions = Pick<
  ApiRequest,
  | "cache"
  | "correlationId"
  | "credentials"
  | "headers"
  | "next"
  | "signal"
  | "timeoutMs"
>;

export interface ApiTransport {
  request<TResponse, TBody = unknown>(
    request: ApiRequest<TBody>,
  ): Promise<TResponse>;
  get<TResponse>(
    path: string,
    options?: ApiOperationOptions,
  ): Promise<TResponse>;
  post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiOperationOptions,
  ): Promise<TResponse>;
  put<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiOperationOptions,
  ): Promise<TResponse>;
  patch<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiOperationOptions,
  ): Promise<TResponse>;
  delete<TResponse>(
    path: string,
    options?: ApiOperationOptions,
  ): Promise<TResponse>;
}

export interface ApiClientConfiguration {
  baseUrl: string;
  credentials?: RequestCredentials;
  defaultCache?: RequestCache;
  defaultHeaders?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  fetch?: typeof globalThis.fetch;
  getAccessToken?: () =>
    string | null | undefined | Promise<string | null | undefined>;
  createCorrelationId?: () => string;
  getCorrelationId?: () => string | undefined | Promise<string | undefined>;
  timeoutMs?: number;
}
