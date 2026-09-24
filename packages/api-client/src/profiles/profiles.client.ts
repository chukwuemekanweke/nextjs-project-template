import type { ApiOperationOptions, ApiTransport } from "../client";
import type {
  CompleteAvatarUploadMutationResponse,
  CompleteAvatarUploadPathParams,
  CreateAvatarUploadMutationRequest,
  CreateAvatarUploadMutationResponse,
  GetProfileQueryResponse,
  UpdateProfileMutationRequest,
} from "./contracts";
import {
  completeAvatarUpload,
  createAvatarUpload,
  getProfile,
  updateProfile,
} from "./operations";

export interface ProfilesClient {
  getProfile(options?: ApiOperationOptions): Promise<GetProfileQueryResponse>;
  updateProfile(
    request: UpdateProfileMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<void>;
  createAvatarUpload(
    request: CreateAvatarUploadMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<CreateAvatarUploadMutationResponse>;
  completeAvatarUpload(
    pathParams: CompleteAvatarUploadPathParams,
    options?: ApiOperationOptions,
  ): Promise<CompleteAvatarUploadMutationResponse>;
}

export function createProfilesClient(transport: ApiTransport): ProfilesClient {
  return {
    getProfile: (options) => getProfile(transport, options),
    updateProfile: (request, options) =>
      updateProfile(transport, request, options),
    createAvatarUpload: (request, options) =>
      createAvatarUpload(transport, request, options),
    completeAvatarUpload: (pathParams, options) =>
      completeAvatarUpload(transport, pathParams, options),
  };
}
