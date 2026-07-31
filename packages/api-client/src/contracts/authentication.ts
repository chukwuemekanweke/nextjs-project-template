export type SignInRequest = { email: string; password: string };
export type GoogleSignInRequest = { idToken: string };
export type RefreshSessionRequest = { refreshToken: string };

export type SessionTokenResponse = {
  accessToken: string;
  expiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  tokenType: string;
};

export type SignInResponse = SessionTokenResponse;
export type GoogleSignInResponse = SessionTokenResponse;
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
  idToken: string;
  lastName: string;
};

export type SignUpResponse = { email: string; message: string };
export type GoogleSignUpResponse = { email: string; message: string };
export type PasswordResetRequest = { email: string };
export type RequestPasswordResetResponse = { message: string };
export type CompletePasswordResetRequest = {
  confirmPassword: string;
  email: string;
  otp: string;
  password: string;
};
export type CompletePasswordResetResponse = { message: string };
export type SignUpOtpRequest = { email: string; otp: string };
export type SignUpOtpResponse = { message: string };

export type SignInMutationRequest = SignInRequest;
export type SignInMutationResponse = SignInResponse;
export type SignInWithGoogleMutationRequest = GoogleSignInRequest;
export type SignInWithGoogleMutationResponse = GoogleSignInResponse;
export type RefreshSessionMutationRequest = RefreshSessionRequest;
export type RefreshSessionMutationResponse = RefreshSessionResponse;
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
export type ConfirmEmailMutationRequest = SignUpOtpRequest;
export type ConfirmEmailMutationResponse = SignUpOtpResponse;

export const authenticationOperations = {
  completePasswordReset: {
    method: "POST",
    path: "/api/v1/authentication/password-resets/completions",
  },
  confirmEmail: {
    method: "POST",
    path: "/api/v1/authentication/email-confirmations",
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
  signUp: { method: "POST", path: "/api/v1/authentication/registrations" },
  signUpWithGoogle: {
    method: "POST",
    path: "/api/v1/authentication/registrations/google",
  },
} as const;
