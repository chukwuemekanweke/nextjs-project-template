"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../query-client/api-provider";
import {
  logoutMutationOptions,
  signInMutationOptions,
  signUpMutationOptions,
} from "./authentication.mutations";

export const useSignIn = () =>
  useMutation(signInMutationOptions(useApiClient().authentication));
export const useSignUp = () =>
  useMutation(signUpMutationOptions(useApiClient().authentication));
export function useLogout() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(logoutMutationOptions(api.authentication, queryClient));
}
