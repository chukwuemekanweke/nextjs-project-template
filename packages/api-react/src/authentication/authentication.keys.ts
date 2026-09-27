import type { GetLoginActivityQueryParams } from "@template/api-client/authentication";

export const authenticationKeys = {
  all: ["authentication"] as const,
  mutation: (operation: string) =>
    [...authenticationKeys.all, operation] as const,
  security: () => [...authenticationKeys.all, "security"] as const,
  twoFactorStatus: () =>
    [...authenticationKeys.security(), "two-factor"] as const,
  sessions: () => [...authenticationKeys.security(), "sessions"] as const,
  loginActivity: () =>
    [...authenticationKeys.security(), "login-activity"] as const,
  loginActivityList: (filters: GetLoginActivityQueryParams = {}) =>
    [...authenticationKeys.loginActivity(), "list", filters] as const,
};
