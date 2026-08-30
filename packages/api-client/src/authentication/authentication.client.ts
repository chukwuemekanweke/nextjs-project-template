import type { ApiOperationOptions, ApiTransport } from "../client";
import type {
  ChangePasswordMutationRequest,
  ChangePasswordMutationResponse,
  CheckEmailExistenceMutationRequest,
  CheckEmailExistenceMutationResponse,
  CompletePasswordResetMutationRequest,
  CompletePasswordResetMutationResponse,
  ConfirmEmailMutationRequest,
  ConfirmEmailMutationResponse,
  RefreshSessionMutationRequest,
  RefreshSessionMutationResponse,
  RequestEmailConfirmationCodeMutationRequest,
  RequestEmailConfirmationCodeMutationResponse,
  RequestPasswordResetMutationRequest,
  RequestPasswordResetMutationResponse,
  SignInMutationRequest,
  SignInMutationResponse,
  SignInWithGoogleMutationRequest,
  SignInWithGoogleMutationResponse,
  SignUpMutationRequest,
  SignUpMutationResponse,
  SignUpWithGoogleMutationRequest,
  SignUpWithGoogleMutationResponse,
} from "./contracts";
import {
  changePassword,
  checkEmailExistence,
  completePasswordReset,
  confirmEmail,
  logout,
  refreshSession,
  requestEmailConfirmationCode,
  requestPasswordReset,
  signIn,
  signInWithGoogle,
  signUp,
  signUpWithGoogle,
} from "./operations";

export interface AuthenticationClient {
  changePassword(
    request: ChangePasswordMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<ChangePasswordMutationResponse>;
  checkEmailExistence(
    request: CheckEmailExistenceMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<CheckEmailExistenceMutationResponse>;
  signIn(
    request: SignInMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<SignInMutationResponse>;
  signInWithGoogle(
    request: SignInWithGoogleMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<SignInWithGoogleMutationResponse>;
  refreshSession(
    request: RefreshSessionMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<RefreshSessionMutationResponse>;
  logout(options?: ApiOperationOptions): Promise<void>;
  signUp(
    request: SignUpMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<SignUpMutationResponse>;
  signUpWithGoogle(
    request: SignUpWithGoogleMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<SignUpWithGoogleMutationResponse>;
  requestPasswordReset(
    request: RequestPasswordResetMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<RequestPasswordResetMutationResponse>;
  completePasswordReset(
    request: CompletePasswordResetMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<CompletePasswordResetMutationResponse>;
  confirmEmail(
    request: ConfirmEmailMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<ConfirmEmailMutationResponse>;
  requestEmailConfirmationCode(
    request: RequestEmailConfirmationCodeMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<RequestEmailConfirmationCodeMutationResponse>;
}

export function createAuthenticationClient(
  transport: ApiTransport,
): AuthenticationClient {
  return {
    changePassword: (request, options) =>
      changePassword(transport, request, options),
    checkEmailExistence: (request, options) =>
      checkEmailExistence(transport, request, options),
    signIn: (request, options) => signIn(transport, request, options),
    signInWithGoogle: (request, options) =>
      signInWithGoogle(transport, request, options),
    refreshSession: (request, options) =>
      refreshSession(transport, request, options),
    logout: (options) => logout(transport, options),
    signUp: (request, options) => signUp(transport, request, options),
    signUpWithGoogle: (request, options) =>
      signUpWithGoogle(transport, request, options),
    requestPasswordReset: (request, options) =>
      requestPasswordReset(transport, request, options),
    completePasswordReset: (request, options) =>
      completePasswordReset(transport, request, options),
    confirmEmail: (request, options) =>
      confirmEmail(transport, request, options),
    requestEmailConfirmationCode: (request, options) =>
      requestEmailConfirmationCode(transport, request, options),
  };
}
