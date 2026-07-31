export type ValidationErrors = Readonly<Record<string, ReadonlyArray<string>>>;

export type ApiErrorKind =
  | "cancelled"
  | "conflict"
  | "forbidden"
  | "locked"
  | "network"
  | "not-found"
  | "rate-limited"
  | "server"
  | "timeout"
  | "unauthorized"
  | "unexpected"
  | "validation";

export interface ApiErrorResponseMetadata {
  headers: Readonly<Record<string, string>>;
  status: number;
  statusText: string;
}

export interface ApiErrorOptions {
  cause?: unknown;
  code?: string;
  correlationId?: string;
  detail?: string;
  extensions?: Readonly<Record<string, unknown>>;
  instance?: string;
  kind: ApiErrorKind;
  method?: string;
  path?: string;
  problemType?: string;
  response?: ApiErrorResponseMetadata;
  retryAfter?: string;
  safeMessage: string;
  status?: number;
  title?: string;
  traceId?: string;
  validationErrors?: ValidationErrors;
}

export class ApiError extends Error {
  readonly code: string | undefined;
  readonly correlationId: string | undefined;
  readonly detail: string | undefined;
  readonly extensions: Readonly<Record<string, unknown>>;
  readonly instance: string | undefined;
  readonly kind: ApiErrorKind;
  readonly method: string | undefined;
  readonly path: string | undefined;
  readonly problemType: string | undefined;
  readonly response: ApiErrorResponseMetadata | undefined;
  readonly retryAfter: string | undefined;
  readonly safeMessage: string;
  readonly status: number | undefined;
  readonly title: string | undefined;
  readonly traceId: string | undefined;
  readonly validationErrors: ValidationErrors;

  constructor(options: ApiErrorOptions) {
    super(options.safeMessage, { cause: options.cause });
    this.name = "ApiError";
    this.code = options.code;
    this.correlationId = options.correlationId;
    this.detail = options.detail;
    this.extensions = options.extensions ?? {};
    this.instance = options.instance;
    this.kind = options.kind;
    this.method = options.method;
    this.path = options.path;
    this.problemType = options.problemType;
    this.response = options.response;
    this.retryAfter = options.retryAfter;
    this.safeMessage = options.safeMessage;
    this.status = options.status;
    this.title = options.title;
    this.traceId = options.traceId;
    this.validationErrors = options.validationErrors ?? {};
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
