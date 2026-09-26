"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../query-client/api-provider";
import {
  changePasswordMutationOptions,
  checkEmailExistenceMutationOptions,
  logoutMutationOptions,
  disableTwoFactorMutationOptions,
  regenerateRecoveryCodesMutationOptions,
  requestEmailConfirmationCodeMutationOptions,
  signInMutationOptions,
  signUpMutationOptions,
  setupTwoFactorMutationOptions,
  verifyTwoFactorEnrollmentMutationOptions,
} from "./authentication.mutations";
import { twoFactorStatusQueryOptions } from "./authentication.queries";

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
