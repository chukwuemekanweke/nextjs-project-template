import type { AuthenticationClient } from "@template/api-client/authentication";
import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { authenticationKeys } from "./authentication.keys";

export const changePasswordMutationOptions = (client: AuthenticationClient) =>
  mutationOptions({
    mutationKey: authenticationKeys.mutation("change-password"),
    mutationFn: (
      request: Parameters<AuthenticationClient["changePassword"]>[0],
    ) => client.changePassword(request),
  });

const invalidateTwoFactorStatus = (queryClient?: QueryClient) =>
  queryClient?.invalidateQueries({
    queryKey: authenticationKeys.twoFactorStatus(),
  });

export const setupTwoFactorMutationOptions = (client: AuthenticationClient) =>
  mutationOptions({
    gcTime: 0,
    mutationKey: authenticationKeys.mutation("setup-two-factor"),
    mutationFn: () => client.setupTwoFactor(),
  });

export const verifyTwoFactorEnrollmentMutationOptions = (
  client: AuthenticationClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    gcTime: 0,
    mutationKey: authenticationKeys.mutation("verify-two-factor-enrollment"),
    mutationFn: (
      request: Parameters<AuthenticationClient["verifyTwoFactorEnrollment"]>[0],
    ) => client.verifyTwoFactorEnrollment(request),
    onSuccess: () => invalidateTwoFactorStatus(queryClient),
  });

export const regenerateRecoveryCodesMutationOptions = (
  client: AuthenticationClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    gcTime: 0,
    mutationKey: authenticationKeys.mutation("regenerate-recovery-codes"),
    mutationFn: (
      request: Parameters<AuthenticationClient["regenerateRecoveryCodes"]>[0],
    ) => client.regenerateRecoveryCodes(request),
    onSuccess: (result) =>
      queryClient?.setQueryData(authenticationKeys.twoFactorStatus(), {
        enabled: true,
        recoveryCodesRemaining: result.recoveryCodes.length,
      }),
  });

export const disableTwoFactorMutationOptions = (
  client: AuthenticationClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    gcTime: 0,
    mutationKey: authenticationKeys.mutation("disable-two-factor"),
    mutationFn: (
      request: Parameters<AuthenticationClient["disableTwoFactor"]>[0],
    ) => client.disableTwoFactor(request),
    onSuccess: () =>
      queryClient?.setQueryData(authenticationKeys.twoFactorStatus(), {
        enabled: false,
        recoveryCodesRemaining: 0,
      }),
  });
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

const invalidateActiveSessions = (queryClient?: QueryClient) =>
  queryClient?.invalidateQueries({ queryKey: authenticationKeys.sessions() });

export const revokeSessionMutationOptions = (
  client: AuthenticationClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: authenticationKeys.mutation("revoke-session"),
    mutationFn: (
      pathParams: Parameters<AuthenticationClient["revokeSession"]>[0],
    ) => client.revokeSession(pathParams),
    onSuccess: () => invalidateActiveSessions(queryClient),
  });

export const revokeOtherSessionsMutationOptions = (
  client: AuthenticationClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: authenticationKeys.mutation("revoke-other-sessions"),
    mutationFn: () => client.revokeOtherSessions(),
    onSuccess: () => invalidateActiveSessions(queryClient),
  });

const invalidatePasskeys = (queryClient?: QueryClient) =>
  queryClient?.invalidateQueries({ queryKey: authenticationKeys.passkeys() });

/** Options carry a single-use flow token, so the result is not retained. */
export const createPasskeyRegistrationOptionsMutationOptions = (
  client: AuthenticationClient,
) =>
  mutationOptions({
    gcTime: 0,
    mutationKey: authenticationKeys.mutation(
      "create-passkey-registration-options",
    ),
    mutationFn: (
      request: Parameters<
        AuthenticationClient["createPasskeyRegistrationOptions"]
      >[0],
    ) => client.createPasskeyRegistrationOptions(request),
  });

export const completePasskeyRegistrationMutationOptions = (
  client: AuthenticationClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    gcTime: 0,
    mutationKey: authenticationKeys.mutation("complete-passkey-registration"),
    mutationFn: (
      request: Parameters<
        AuthenticationClient["completePasskeyRegistration"]
      >[0],
    ) => client.completePasskeyRegistration(request),
    onSuccess: () => invalidatePasskeys(queryClient),
  });

export const renamePasskeyMutationOptions = (
  client: AuthenticationClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: authenticationKeys.mutation("rename-passkey"),
    mutationFn: ({
      credentialId,
      name,
    }: Parameters<AuthenticationClient["renamePasskey"]>[0] &
      Parameters<AuthenticationClient["renamePasskey"]>[1]) =>
      client.renamePasskey({ credentialId }, { name }),
    onSuccess: () => invalidatePasskeys(queryClient),
  });

export const removePasskeyMutationOptions = (
  client: AuthenticationClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: authenticationKeys.mutation("remove-passkey"),
    mutationFn: (
      pathParams: Parameters<AuthenticationClient["removePasskey"]>[0],
    ) => client.removePasskey(pathParams),
    onSuccess: () => invalidatePasskeys(queryClient),
  });
