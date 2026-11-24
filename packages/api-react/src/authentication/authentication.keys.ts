import type { GetSecurityActivityQueryParams } from "@template/api-client/authentication";

export const authenticationKeys = {
  all: ["authentication"] as const,
  mutation: (operation: string) =>
    [...authenticationKeys.all, operation] as const,
  security: () => [...authenticationKeys.all, "security"] as const,
  twoFactorStatus: () =>
    [...authenticationKeys.security(), "two-factor"] as const,
  sessions: () => [...authenticationKeys.security(), "sessions"] as const,
  passkeys: () => [...authenticationKeys.security(), "passkeys"] as const,
  securityActivity: () =>
    [...authenticationKeys.security(), "security-activity"] as const,
  securityActivityList: (filters: GetSecurityActivityQueryParams = {}) =>
    [...authenticationKeys.securityActivity(), "list", filters] as const,
};
