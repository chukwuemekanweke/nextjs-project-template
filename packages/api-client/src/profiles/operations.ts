import type {
  CompleteAvatarUploadMutationResponse,
  CompleteAvatarUploadPathParams,
  CreateAvatarUploadMutationRequest,
  CreateAvatarUploadMutationResponse,
  GetProfileQueryResponse,
  UpdateProfileMutationRequest,
  UpdateProfileMutationResponse,
} from "./contracts";
import { profilesOperations } from "./contracts";
import type { ApiOperationOptions, ApiTransport } from "../client";

export const getProfile = (
  client: ApiTransport,
  options?: ApiOperationOptions,
) =>
  client.request<GetProfileQueryResponse>({
    ...profilesOperations.getProfile,
    ...options,
  });

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

export const createAvatarUpload = (
  client: ApiTransport,
  request: CreateAvatarUploadMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<CreateAvatarUploadMutationResponse>({
    ...profilesOperations.createAvatarUpload,
    ...options,
    body: request,
  });

export const completeAvatarUpload = (
  client: ApiTransport,
  pathParams: CompleteAvatarUploadPathParams,
  options?: ApiOperationOptions,
) =>
  client.request<CompleteAvatarUploadMutationResponse>({
    ...profilesOperations.completeAvatarUpload,
    ...options,
    pathParams,
  });
