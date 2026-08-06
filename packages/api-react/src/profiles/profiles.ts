"use client";

import type { ProfilesClient } from "@template/api-client/profiles";
import {
  mutationOptions,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useApiClient } from "../query-client/api-provider";

export const profileKeys = {
  all: ["profiles"] as const,
  current: () => ["profiles", "current"] as const,
};
export const updateProfileMutationOptions = (
  client: ProfilesClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: [...profileKeys.current(), "update"],
    mutationFn: (request: Parameters<ProfilesClient["updateProfile"]>[0]) =>
      client.updateProfile(request),
    onSuccess: () =>
      queryClient?.invalidateQueries({ queryKey: profileKeys.current() }),
  });
export const uploadAvatarMutationOptions = (
  client: ProfilesClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: [...profileKeys.current(), "avatar"],
    mutationFn: (request: Parameters<ProfilesClient["uploadAvatar"]>[0]) =>
      client.uploadAvatar(request),
    onSuccess: () =>
      queryClient?.invalidateQueries({ queryKey: profileKeys.current() }),
  });
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
