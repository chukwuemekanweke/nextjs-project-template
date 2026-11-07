"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useApiClient } from "../query-client/api-provider";
import {
  changePasswordMutationOptions,
  checkEmailExistenceMutationOptions,
  completePasskeyRegistrationMutationOptions,
  createPasskeyRegistrationOptionsMutationOptions,
  removePasskeyMutationOptions,
  renamePasskeyMutationOptions,
  logoutMutationOptions,
  disableTwoFactorMutationOptions,
  regenerateRecoveryCodesMutationOptions,
  requestEmailConfirmationCodeMutationOptions,
  revokeOtherSessionsMutationOptions,
  revokeSessionMutationOptions,
  signInMutationOptions,
  signUpMutationOptions,
  setupTwoFactorMutationOptions,
  verifyTwoFactorEnrollmentMutationOptions,
} from "./authentication.mutations";
import {
  activeSessionsQueryOptions,
  loginActivityQueryOptions,
  passkeysQueryOptions,
  twoFactorStatusQueryOptions,
} from "./authentication.queries";

export const useChangePassword = () =>
  useMutation(changePasswordMutationOptions(useApiClient().authentication));
export const useTwoFactorStatus = () =>
  useQuery(twoFactorStatusQueryOptions(useApiClient().authentication));
export const useSetupTwoFactor = () =>
  useMutation(setupTwoFactorMutationOptions(useApiClient().authentication));
export function useVerifyTwoFactorEnrollment() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(
    verifyTwoFactorEnrollmentMutationOptions(api.authentication, queryClient),
  );
}
export function useRegenerateRecoveryCodes() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(
    regenerateRecoveryCodesMutationOptions(api.authentication, queryClient),
  );
}
export function useDisableTwoFactor() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(
    disableTwoFactorMutationOptions(api.authentication, queryClient),
  );
}
export const useSignIn = () =>
  useMutation(signInMutationOptions(useApiClient().authentication));
export const useCheckEmailExistence = () =>
  useMutation(
    checkEmailExistenceMutationOptions(useApiClient().authentication),
  );
export const useSignUp = () =>
  useMutation(signUpMutationOptions(useApiClient().authentication));
export const useRequestEmailConfirmationCode = () =>
  useMutation(
    requestEmailConfirmationCodeMutationOptions(useApiClient().authentication),
  );
export function useLogout() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(logoutMutationOptions(api.authentication, queryClient));
}
export const useActiveSessions = () =>
  useQuery(activeSessionsQueryOptions(useApiClient().authentication));
export function useRevokeSession() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(
    revokeSessionMutationOptions(api.authentication, queryClient),
  );
}
export function useRevokeOtherSessions() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(
    revokeOtherSessionsMutationOptions(api.authentication, queryClient),
  );
}
export const useLoginActivity = (limit?: number) =>
  useInfiniteQuery(
    loginActivityQueryOptions(useApiClient().authentication, limit),
  );
export const usePasskeys = () =>
  useQuery(passkeysQueryOptions(useApiClient().authentication));
export const useCreatePasskeyRegistrationOptions = () =>
  useMutation(
    createPasskeyRegistrationOptionsMutationOptions(
      useApiClient().authentication,
    ),
  );
export function useCompletePasskeyRegistration() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(
    completePasskeyRegistrationMutationOptions(api.authentication, queryClient),
  );
}
export function useRenamePasskey() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(
    renamePasskeyMutationOptions(api.authentication, queryClient),
  );
}
export function useRemovePasskey() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(
    removePasskeyMutationOptions(api.authentication, queryClient),
  );
}
