"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../query-client/api-provider";
import {
  changePasswordMutationOptions,
  checkEmailExistenceMutationOptions,
  logoutMutationOptions,
  requestEmailConfirmationCodeMutationOptions,
  signInMutationOptions,
  signUpMutationOptions,
} from "./authentication.mutations";

export const useChangePassword = () =>
  useMutation(changePasswordMutationOptions(useApiClient().authentication));
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
