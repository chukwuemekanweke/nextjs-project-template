import type {
  UpdateProfileMutationRequest,
  UpdateProfileMutationResponse,
  UploadAvatarMutationRequest,
  UploadAvatarMutationResponse,
} from "./contracts";
import { profilesOperations } from "./contracts";
import type { ApiOperationOptions, ApiTransport } from "../client";

export const updateProfile = (
  client: ApiTransport,
  request: UpdateProfileMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<UpdateProfileMutationResponse>({
    ...profilesOperations.updateProfile,
    ...options,
    body: request,
  });

export const uploadAvatar = (
  client: ApiTransport,
  request: UploadAvatarMutationRequest,
  options?: ApiOperationOptions,
) => {
  const body = new FormData();
  body.append("Avatar", request.Avatar);
  return client.request<UploadAvatarMutationResponse>({
    ...profilesOperations.uploadAvatar,
    ...options,
    body,
  });
};
