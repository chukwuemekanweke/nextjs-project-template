import type { AuthenticationClient } from "@template/api-client/authentication";
import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { authenticationKeys } from "./authentication.keys";

export const signInMutationOptions = (client: AuthenticationClient) =>
  mutationOptions({
    mutationKey: authenticationKeys.mutation("sign-in"),
    mutationFn: (request: Parameters<AuthenticationClient["signIn"]>[0]) =>
      client.signIn(request),
  });
export const checkEmailExistenceMutationOptions = (
  client: AuthenticationClient,
) =>
  mutationOptions({
    mutationKey: authenticationKeys.mutation("check-email-existence"),
    mutationFn: (
      request: Parameters<AuthenticationClient["checkEmailExistence"]>[0],
    ) => client.checkEmailExistence(request),
  });
export const refreshSessionMutationOptions = (client: AuthenticationClient) =>
  mutationOptions({
    mutationKey: authenticationKeys.mutation("refresh-session"),
    mutationFn: (
      request: Parameters<AuthenticationClient["refreshSession"]>[0],
    ) => client.refreshSession(request),
  });
export const signUpMutationOptions = (client: AuthenticationClient) =>
  mutationOptions({
    mutationKey: authenticationKeys.mutation("sign-up"),
    mutationFn: (request: Parameters<AuthenticationClient["signUp"]>[0]) =>
      client.signUp(request),
  });
export const requestPasswordResetMutationOptions = (
  client: AuthenticationClient,
) =>
  mutationOptions({
    mutationKey: authenticationKeys.mutation("request-password-reset"),
    mutationFn: (
      request: Parameters<AuthenticationClient["requestPasswordReset"]>[0],
    ) => client.requestPasswordReset(request),
  });
export const completePasswordResetMutationOptions = (
  client: AuthenticationClient,
) =>
  mutationOptions({
    mutationKey: authenticationKeys.mutation("complete-password-reset"),
    mutationFn: (
      request: Parameters<AuthenticationClient["completePasswordReset"]>[0],
    ) => client.completePasswordReset(request),
  });
export const requestEmailConfirmationCodeMutationOptions = (
  client: AuthenticationClient,
) =>
  mutationOptions({
    mutationKey: authenticationKeys.mutation("request-email-confirmation-code"),
    mutationFn: (
      request: Parameters<
        AuthenticationClient["requestEmailConfirmationCode"]
      >[0],
    ) => client.requestEmailConfirmationCode(request),
  });
export const logoutMutationOptions = (
  client: AuthenticationClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: authenticationKeys.mutation("logout"),
    mutationFn: () => client.logout(),
    onSettled: () => queryClient?.clear(),
  });
