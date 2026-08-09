export * from "./api-client";
export const TENANT_ID_HEADER = "X-Tenant-Id";
export { ApiError, isApiError } from "./client/api-error";
export type {
  ApiErrorKind,
  ApiErrorOptions,
  ValidationErrors,
} from "./client/api-error";
export type {
  ApiOperationOptions,
  ApiRequest,
  ApiTransport,
} from "./client/types";
export type * from "./contracts";
