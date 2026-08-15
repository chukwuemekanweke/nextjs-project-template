import type { ApiOperationOptions, ApiTransport } from "../client";
import type {
  GetProfileQueryResponse,
  UpdateProfileMutationRequest,
  UploadAvatarMutationRequest,
  UploadAvatarMutationResponse,
} from "./contracts";
import { getProfile, updateProfile, uploadAvatar } from "./operations";

export interface ProfilesClient {
  getProfile(options?: ApiOperationOptions): Promise<GetProfileQueryResponse>;
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
    getProfile: (options) => getProfile(transport, options),
    updateProfile: (request, options) =>
      updateProfile(transport, request, options),
    uploadAvatar: (request, options) =>
      uploadAvatar(transport, request, options),
  };
}
