import type { ApiOperationOptions, ApiTransport } from "../client";
import type {
  UpdateProfileMutationRequest,
  UploadAvatarMutationRequest,
  UploadAvatarMutationResponse,
} from "./contracts";
import { updateProfile, uploadAvatar } from "./operations";

export interface ProfilesClient {
  updateProfile(
    request: UpdateProfileMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<void>;
  uploadAvatar(
    request: UploadAvatarMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<UploadAvatarMutationResponse>;
}

export function createProfilesClient(transport: ApiTransport): ProfilesClient {
  return {
    updateProfile: (request, options) =>
      updateProfile(transport, request, options),
    uploadAvatar: (request, options) =>
      uploadAvatar(transport, request, options),
  };
}
