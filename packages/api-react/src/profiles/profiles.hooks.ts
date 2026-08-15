"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../query-client/api-provider";
import {
  updateProfileMutationOptions,
  uploadAvatarMutationOptions,
} from "./profiles.mutations";
import { currentProfileQueryOptions } from "./profiles.queries";

export const useCurrentProfile = () =>
  useQuery(currentProfileQueryOptions(useApiClient().profiles));

export function useUpdateProfile() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(updateProfileMutationOptions(api.profiles, queryClient));
}

export function useUploadAvatar() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(uploadAvatarMutationOptions(api.profiles, queryClient));
}
