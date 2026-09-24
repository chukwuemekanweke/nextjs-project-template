/** Wire contracts owned by the profiles domain. */
export type GetProfileResponse = {
  stakeholderId: string;
  emailAddress: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isVerified: boolean;
};
export type UpdateProfileRequest = { firstName: string; lastName: string };
export type CreateAvatarUploadRequest = {
  fileName: string;
  contentType: string;
  contentLength: number;
};
export type CreateAvatarUploadResponse = {
  uploadId: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  expiresAtUtc: string;
};
export type CompleteAvatarUploadPathParams = { uploadId: string };
export type CompleteAvatarUploadResponse = { avatarUrl: string };

export type GetProfileQueryResponse = GetProfileResponse;
export type UpdateProfileMutationRequest = UpdateProfileRequest;
export type UpdateProfileMutationResponse = void;
export type CreateAvatarUploadMutationRequest = CreateAvatarUploadRequest;
export type CreateAvatarUploadMutationResponse = CreateAvatarUploadResponse;
export type CompleteAvatarUploadMutationResponse = CompleteAvatarUploadResponse;

export const profilesOperations = {
  getProfile: { method: "GET", path: "/api/v1/stakeholders/me/profile" },
  updateProfile: { method: "PUT", path: "/api/v1/stakeholders/me/profile" },
  createAvatarUpload: {
    method: "POST",
    path: "/api/v1/stakeholders/me/profile/avatar/uploads",
  },
  completeAvatarUpload: {
    method: "POST",
    path: "/api/v1/stakeholders/me/profile/avatar/uploads/{uploadId}/complete",
  },
} as const;
