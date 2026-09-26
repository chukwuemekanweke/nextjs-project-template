/** Wire contracts owned by the authentication domain. */
export type SignInRequest = { email: string; password: string };
export type GoogleSignInRequest = { flowToken: string; idToken: string };
export type GoogleAuthenticationFlowResponse = {
  expiresAtUtc: string;
  flowToken: string;
  nonce: string;
};
export type GoogleLinkRequest = { flowToken: string; password: string };
export type RefreshSessionRequest = { refreshToken: string };
export type CheckEmailExistenceRequest = { email: string };
export type CheckEmailExistenceResponse = { exists: boolean };

export type SessionTokenResponse = {
  accessToken: string;
  expiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  tokenType: string;
};

export type AuthenticatedSessionResponse = SessionTokenResponse & {
  outcome: "authenticated";
};
export type TwoFactorRequiredResponse = {
  challenge: string;
  challengeExpiresAtUtc: string;
  outcome: "two_factor_required";
};
export type SignInResponse =
  AuthenticatedSessionResponse | TwoFactorRequiredResponse;
export type GoogleAuthenticatedResponse = SessionTokenResponse & {
  outcome: "authenticated";
};
export type GoogleSignInResponse =
  | GoogleAuthenticatedResponse
  | TwoFactorRequiredResponse
  | { outcome: "link_required" }
  | { outcome: "registration_required" };
export type GoogleLinkResponse = GoogleAuthenticatedResponse;
export type RefreshSessionResponse = SessionTokenResponse;

export type SignUpRequest = {
  confirmPassword: string;
  countryId: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export type GoogleSignUpRequest = {
  countryId: string;
  firstName: string;
  flowToken: string;
  lastName: string;
};

export type SignUpResponse = {
  email: string;
  message: string;
  retryAtUtc: string;
};
export type GoogleSignUpResponse = GoogleAuthenticatedResponse & {
  email: string;
};
export type PasswordResetRequest = { email: string };
export type RequestPasswordResetResponse = { message: string };
export type CompletePasswordResetRequest = {
  confirmPassword: string;
  email: string;
  otp: string;
  password: string;
};
export type CompletePasswordResetResponse = { message: string };
export type ChangePasswordRequest = {
  confirmNewPassword: string;
  currentPassword: string;
  newPassword: string;
};
export type TwoFactorVerificationMethod = "authenticator" | "recovery_code";
export type CompleteTwoFactorChallengeRequest = {
  challenge: string;
  code: string;
  verificationMethod: TwoFactorVerificationMethod;
};
export type TwoFactorStatusResponse = {
  enabled: boolean;
  recoveryCodesRemaining: number;
};
export type TwoFactorSetupResponse = {
  authenticatorUri: string;
  sharedKey: string;
};
export type VerifyTwoFactorEnrollmentRequest = { code: string };
export type RecoveryCodesResponse = { recoveryCodes: string[] };
export type TwoFactorProofRequest = {
  code: string;
  verificationMethod: TwoFactorVerificationMethod;
};
export type SignUpOtpRequest = { email: string; otp: string };
export type SignUpOtpResponse = SessionTokenResponse;
export type RequestEmailConfirmationCodeRequest = { email: string };
export type RequestEmailConfirmationCodeResponse = {
  message: string;
  retryAtUtc: string;
};

export type SignInMutationRequest = SignInRequest;
export type SignInMutationResponse = SignInResponse;
export type CompleteTwoFactorChallengeMutationRequest =
  CompleteTwoFactorChallengeRequest;
export type CompleteTwoFactorChallengeMutationResponse =
  AuthenticatedSessionResponse;
export type TwoFactorStatusQueryResponse = TwoFactorStatusResponse;
export type SetupTwoFactorMutationResponse = TwoFactorSetupResponse;
export type VerifyTwoFactorEnrollmentMutationRequest =
  VerifyTwoFactorEnrollmentRequest;
export type VerifyTwoFactorEnrollmentMutationResponse = RecoveryCodesResponse;
export type RegenerateRecoveryCodesMutationRequest = TwoFactorProofRequest;
export type RegenerateRecoveryCodesMutationResponse = RecoveryCodesResponse;
export type DisableTwoFactorMutationRequest = TwoFactorProofRequest;
export type DisableTwoFactorMutationResponse = void;
export type SignInWithGoogleMutationRequest = GoogleSignInRequest;
export type SignInWithGoogleMutationResponse = GoogleSignInResponse;
export type StartGoogleAuthenticationFlowMutationResponse =
  GoogleAuthenticationFlowResponse;
export type LinkGoogleAccountMutationRequest = GoogleLinkRequest;
export type LinkGoogleAccountMutationResponse = GoogleLinkResponse;
export type RefreshSessionMutationRequest = RefreshSessionRequest;
export type RefreshSessionMutationResponse = RefreshSessionResponse;
export type CheckEmailExistenceMutationRequest = CheckEmailExistenceRequest;
export type CheckEmailExistenceMutationResponse = CheckEmailExistenceResponse;
export type LogoutMutationResponse = void;
export type SignUpMutationRequest = SignUpRequest;
export type SignUpMutationResponse = SignUpResponse;
export type SignUpWithGoogleMutationRequest = GoogleSignUpRequest;
export type SignUpWithGoogleMutationResponse = GoogleSignUpResponse;
export type RequestPasswordResetMutationRequest = PasswordResetRequest;
export type RequestPasswordResetMutationResponse = RequestPasswordResetResponse;
export type CompletePasswordResetMutationRequest = CompletePasswordResetRequest;
export type CompletePasswordResetMutationResponse =
  CompletePasswordResetResponse;
export type ChangePasswordMutationRequest = ChangePasswordRequest;
export type ChangePasswordMutationResponse = void;
export type ConfirmEmailMutationRequest = SignUpOtpRequest;
export type ConfirmEmailMutationResponse = SignUpOtpResponse;
export type RequestEmailConfirmationCodeMutationRequest =
  RequestEmailConfirmationCodeRequest;
export type RequestEmailConfirmationCodeMutationResponse =
  RequestEmailConfirmationCodeResponse;

export const authenticationOperations = {
  changePassword: {
    method: "PUT",
    path: "/api/v1/authentication/password",
  },
  checkEmailExistence: {
    method: "POST",
    path: "/api/v1/authentication/email-existence-checks",
  },
  linkGoogleAccount: {
    method: "POST",
    path: "/api/v1/authentication/google-links",
  },
  completePasswordReset: {
    method: "POST",
    path: "/api/v1/authentication/password-resets/completions",
  },
  confirmEmail: {
    method: "POST",
    path: "/api/v1/authentication/email-confirmations",
  },
  requestEmailConfirmationCode: {
    method: "POST",
    path: "/api/v1/authentication/email-confirmations/confirmation-code",
  },
  logout: { method: "POST", path: "/api/v1/authentication/sessions/logout" },
  refreshSession: {
    method: "POST",
    path: "/api/v1/authentication/sessions/refresh",
  },
  requestPasswordReset: {
    method: "POST",
    path: "/api/v1/authentication/password-resets",
  },
  signIn: { method: "POST", path: "/api/v1/authentication/sessions" },
  signInWithGoogle: {
    method: "POST",
    path: "/api/v1/authentication/sessions/google",
  },
  completeTwoFactorChallenge: {
    method: "POST",
    path: "/api/v1/authentication/sessions/two-factor",
  },
  getTwoFactorStatus: {
    method: "GET",
    path: "/api/v1/authentication/security/two-factor",
  },
  setupTwoFactor: {
    method: "POST",
    path: "/api/v1/authentication/security/two-factor/setup",
  },
  verifyTwoFactorEnrollment: {
    method: "POST",
    path: "/api/v1/authentication/security/two-factor/verify",
  },
  regenerateRecoveryCodes: {
    method: "POST",
    path: "/api/v1/authentication/security/two-factor/recovery-codes",
  },
  disableTwoFactor: {
    method: "POST",
    path: "/api/v1/authentication/security/two-factor/disable",
  },
  startGoogleAuthenticationFlow: {
    method: "POST",
    path: "/api/v1/authentication/google/flows",
  },
  signUp: { method: "POST", path: "/api/v1/authentication/registrations" },
  signUpWithGoogle: {
    method: "POST",
    path: "/api/v1/authentication/registrations/google",
  },
} as const;
