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
export type UploadAvatarRequest = { Avatar: Blob };
export type UploadAvatarResponse = { avatarUrl: string };

export type GetProfileQueryResponse = GetProfileResponse;
export type UpdateProfileMutationRequest = UpdateProfileRequest;
export type UpdateProfileMutationResponse = void;
export type UploadAvatarMutationRequest = UploadAvatarRequest;
export type UploadAvatarMutationResponse = UploadAvatarResponse;

export const profilesOperations = {
  getProfile: { method: "GET", path: "/api/v1/stakeholders/me/profile" },
  updateProfile: { method: "PUT", path: "/api/v1/stakeholders/me/profile" },
  uploadAvatar: {
    method: "POST",
    path: "/api/v1/stakeholders/me/profile/avatar",
  },
} as const;
