/** Wire contracts owned by the profiles domain. */
export type UpdateProfileRequest = { firstName: string; lastName: string };
export type UploadAvatarRequest = { Avatar: Blob };
export type UploadAvatarResponse = { avatarUrl: string };

export type UpdateProfileMutationRequest = UpdateProfileRequest;
export type UpdateProfileMutationResponse = void;
export type UploadAvatarMutationRequest = UploadAvatarRequest;
export type UploadAvatarMutationResponse = UploadAvatarResponse;

export const profilesOperations = {
  updateProfile: { method: "PUT", path: "/api/v1/stakeholders/me/profile" },
  uploadAvatar: {
    method: "POST",
    path: "/api/v1/stakeholders/me/profile/avatar",
  },
} as const;
