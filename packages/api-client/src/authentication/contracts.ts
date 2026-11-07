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

export type ActiveSessionResponse = {
  sessionId: string;
  deviceName: string | null;
  devicePlatform: string | null;
  browserName: string | null;
  userAgent: string;
  firstIpAddress: string;
  lastIpAddress: string;
  city: string | null;
  state: string | null;
  country: string | null;
  createdAtUtc: string;
  lastActiveAtUtc: string;
  expiresAtUtc: string;
  isCurrent: boolean;
};
export type RevokeSessionPathParams = { sessionId: string };
export type LoginActivityType = "InitialLogin" | "TokenRefresh";
export type LoginActivityResponse = {
  id: string;
  activityType: LoginActivityType;
  occurredAtUtc: string;
  ipAddress: string;
  deviceName: string | null;
  devicePlatform: string | null;
  browserName: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
};
export type GetLoginActivityQueryParams = {
  Cursor?: string;
  Limit?: number | string;
};
export type LoginActivityHistoryResponse = {
  activities: Array<LoginActivityResponse>;
  nextCursor: string | null;
};

/**
 * WebAuthn Level 3 JSON wire shapes. Binary members are base64url strings;
 * browser conversion lives in `@template/api-client/browser`.
 */
export type Base64UrlString = string;
export type PublicKeyCredentialDescriptorJson = {
  id: Base64UrlString;
  transports?: string[];
  type: "public-key";
};
export type PublicKeyCredentialCreationOptionsJson = {
  attestation?: string;
  attestationFormats?: string[];
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    requireResidentKey?: boolean;
    residentKey?: string;
    userVerification?: string;
  };
  challenge: Base64UrlString;
  excludeCredentials?: PublicKeyCredentialDescriptorJson[];
  extensions?: Record<string, unknown>;
  hints?: string[];
  pubKeyCredParams: Array<{ alg: number; type: "public-key" }>;
  rp: { id?: string; name: string };
  timeout?: number;
  user: { displayName: string; id: Base64UrlString; name: string };
};
export type PublicKeyCredentialRequestOptionsJson = {
  allowCredentials?: PublicKeyCredentialDescriptorJson[];
  challenge: Base64UrlString;
  extensions?: Record<string, unknown>;
  hints?: string[];
  rpId?: string;
  timeout?: number;
  userVerification?: string;
};
export type RegistrationResponseJson = {
  authenticatorAttachment?: string;
  clientExtensionResults: Record<string, unknown>;
  id: Base64UrlString;
  rawId: Base64UrlString;
  response: {
    attestationObject: Base64UrlString;
    authenticatorData?: Base64UrlString;
    clientDataJSON: Base64UrlString;
    publicKey?: Base64UrlString;
    publicKeyAlgorithm?: number;
    transports?: string[];
  };
  type: "public-key";
};
export type AuthenticationResponseJson = {
  authenticatorAttachment?: string;
  clientExtensionResults: Record<string, unknown>;
  id: Base64UrlString;
  rawId: Base64UrlString;
  response: {
    authenticatorData: Base64UrlString;
    clientDataJSON: Base64UrlString;
    signature: Base64UrlString;
    userHandle?: Base64UrlString;
  };
  type: "public-key";
};

/** Backend passkey flow: an opaque single-use token plus WebAuthn options. */
export type PasskeyRegistrationOptionsResponse = {
  expiresAtUtc: string;
  flowToken: string;
  publicKey: PublicKeyCredentialCreationOptionsJson;
};
export type PasskeyAuthenticationOptionsResponse = {
  expiresAtUtc: string;
  flowToken: string;
  publicKey: PublicKeyCredentialRequestOptionsJson;
};
export type CreatePasskeyRegistrationOptionsRequest = { name: string };
export type CompletePasskeyRegistrationRequest = {
  credential: RegistrationResponseJson;
  flowToken: string;
};
export type CompletePasskeyAuthenticationRequest = {
  credential: AuthenticationResponseJson;
  flowToken: string;
};
export type PasskeyResponse = {
  createdAtUtc: string;
  id: string;
  isBackedUp: boolean;
  isBackupEligible: boolean;
  name: string;
  transports: string[];
};
export type PasskeyPathParams = { credentialId: string };
export type RenamePasskeyRequest = { name: string };
/**
 * Unlike password/Google sign-in, the passkey endpoint names the access-token
 * expiry `accessTokenExpiresAtUtc`; the field is kept faithful here.
 */
export type PasskeyAuthenticatedResponse = Omit<
  SessionTokenResponse,
  "expiresAtUtc"
> & {
  accessTokenExpiresAtUtc: string;
  outcome: "authenticated";
};
export type PasskeySignInResponse =
  PasskeyAuthenticatedResponse | TwoFactorRequiredResponse;

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
export type ListActiveSessionsQueryResponse = Array<ActiveSessionResponse>;
export type RevokeSessionMutationResponse = void;
export type RevokeOtherSessionsMutationResponse = void;
export type GetLoginActivityQueryResponse = LoginActivityHistoryResponse;
export type CreatePasskeyRegistrationOptionsMutationRequest =
  CreatePasskeyRegistrationOptionsRequest;
export type CreatePasskeyRegistrationOptionsMutationResponse =
  PasskeyRegistrationOptionsResponse;
export type CompletePasskeyRegistrationMutationRequest =
  CompletePasskeyRegistrationRequest;
export type CompletePasskeyRegistrationMutationResponse = PasskeyResponse;
export type CreatePasskeyAuthenticationOptionsMutationResponse =
  PasskeyAuthenticationOptionsResponse;
export type CompletePasskeyAuthenticationMutationRequest =
  CompletePasskeyAuthenticationRequest;
export type CompletePasskeyAuthenticationMutationResponse =
  PasskeySignInResponse;
export type ListPasskeysQueryResponse = Array<PasskeyResponse>;
export type RenamePasskeyMutationRequest = RenamePasskeyRequest;
export type RenamePasskeyMutationResponse = void;
export type RemovePasskeyMutationResponse = void;

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
  listActiveSessions: {
    method: "GET",
    path: "/api/v1/authentication/sessions",
  },
  revokeSession: {
    method: "DELETE",
    path: "/api/v1/authentication/sessions/{sessionId}",
  },
  revokeOtherSessions: {
    method: "DELETE",
    path: "/api/v1/authentication/sessions/others",
  },
  getLoginActivity: {
    method: "GET",
    path: "/api/v1/stakeholders/me/login-activity",
  },
  createPasskeyRegistrationOptions: {
    method: "POST",
    path: "/api/v1/authentication/passkeys/registration-options",
  },
  completePasskeyRegistration: {
    method: "POST",
    path: "/api/v1/authentication/passkeys/registrations",
  },
  createPasskeyAuthenticationOptions: {
    method: "POST",
    path: "/api/v1/authentication/passkeys/authentication-options",
  },
  completePasskeyAuthentication: {
    method: "POST",
    path: "/api/v1/authentication/passkeys/authentication-completions",
  },
  listPasskeys: {
    method: "GET",
    path: "/api/v1/authentication/passkeys",
  },
  renamePasskey: {
    method: "PATCH",
    path: "/api/v1/authentication/passkeys/{credentialId}",
  },
  removePasskey: {
    method: "DELETE",
    path: "/api/v1/authentication/passkeys/{credentialId}",
  },
} as const;
