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
