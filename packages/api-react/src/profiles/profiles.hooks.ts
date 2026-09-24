"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../query-client/api-provider";
import {
  completeAvatarUploadMutationOptions,
  createAvatarUploadMutationOptions,
  updateProfileMutationOptions,
} from "./profiles.mutations";
import { currentProfileQueryOptions } from "./profiles.queries";

export const useCurrentProfile = () =>
  useQuery(currentProfileQueryOptions(useApiClient().profiles));

export function useUpdateProfile() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(updateProfileMutationOptions(api.profiles, queryClient));
}

export function useCreateAvatarUpload() {
  const api = useApiClient();
  return useMutation(createAvatarUploadMutationOptions(api.profiles));
}

export function useCompleteAvatarUpload() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(
    completeAvatarUploadMutationOptions(api.profiles, queryClient),
  );
}
