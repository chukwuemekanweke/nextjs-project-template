import type { ProfilesClient } from "@template/api-client/profiles";
import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { profileKeys } from "./profiles.keys";

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

export const createAvatarUploadMutationOptions = (client: ProfilesClient) =>
  mutationOptions({
    mutationKey: [...profileKeys.current(), "avatar", "create"],
    mutationFn: (
      request: Parameters<ProfilesClient["createAvatarUpload"]>[0],
    ) => client.createAvatarUpload(request),
  });

export const completeAvatarUploadMutationOptions = (
  client: ProfilesClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: [...profileKeys.current(), "avatar", "complete"],
    mutationFn: (
      pathParams: Parameters<ProfilesClient["completeAvatarUpload"]>[0],
    ) => client.completeAvatarUpload(pathParams),
    onSuccess: () =>
      queryClient?.invalidateQueries({ queryKey: profileKeys.current() }),
  });
