import type { AuthenticationClient } from "@template/api-client/authentication";
import { mutationOptions, type QueryClient } from "@tanstack/react-query";

export const signInMutationOptions = (client: AuthenticationClient) =>
  mutationOptions({
    mutationKey: ["authentication", "sign-in"],
    mutationFn: (request: Parameters<AuthenticationClient["signIn"]>[0]) =>
      client.signIn(request),
  });
export const refreshSessionMutationOptions = (client: AuthenticationClient) =>
  mutationOptions({
    mutationKey: ["authentication", "refresh-session"],
    mutationFn: (
      request: Parameters<AuthenticationClient["refreshSession"]>[0],
    ) => client.refreshSession(request),
  });
export const signUpMutationOptions = (client: AuthenticationClient) =>
  mutationOptions({
    mutationKey: ["authentication", "sign-up"],
    mutationFn: (request: Parameters<AuthenticationClient["signUp"]>[0]) =>
      client.signUp(request),
  });
export const requestPasswordResetMutationOptions = (
  client: AuthenticationClient,
) =>
  mutationOptions({
    mutationKey: ["authentication", "request-password-reset"],
    mutationFn: (
      request: Parameters<AuthenticationClient["requestPasswordReset"]>[0],
    ) => client.requestPasswordReset(request),
  });
export const completePasswordResetMutationOptions = (
  client: AuthenticationClient,
) =>
  mutationOptions({
    mutationKey: ["authentication", "complete-password-reset"],
    mutationFn: (
      request: Parameters<AuthenticationClient["completePasswordReset"]>[0],
    ) => client.completePasswordReset(request),
  });
export const confirmEmailMutationOptions = (client: AuthenticationClient) =>
  mutationOptions({
    mutationKey: ["authentication", "confirm-email"],
    mutationFn: (
      request: Parameters<AuthenticationClient["confirmEmail"]>[0],
    ) => client.confirmEmail(request),
  });
export const logoutMutationOptions = (
  client: AuthenticationClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: ["authentication", "logout"],
    mutationFn: () => client.logout(),
    onSuccess: () => queryClient?.clear(),
  });
