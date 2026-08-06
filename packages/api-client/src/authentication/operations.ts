import type {
  CompletePasswordResetMutationRequest,
  CompletePasswordResetMutationResponse,
  ConfirmEmailMutationRequest,
  ConfirmEmailMutationResponse,
  LogoutMutationResponse,
  RefreshSessionMutationRequest,
  RefreshSessionMutationResponse,
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
import { authenticationOperations } from "./contracts";
import type { ApiOperationOptions, ApiTransport } from "../client";

export const signIn = (
  client: ApiTransport,
  request: SignInMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<SignInMutationResponse>({
    ...authenticationOperations.signIn,
    ...options,
    body: request,
  });

export const signInWithGoogle = (
  client: ApiTransport,
  request: SignInWithGoogleMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<SignInWithGoogleMutationResponse>({
    ...authenticationOperations.signInWithGoogle,
    ...options,
    body: request,
  });

export const refreshSession = (
  client: ApiTransport,
  request: RefreshSessionMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<RefreshSessionMutationResponse>({
    ...authenticationOperations.refreshSession,
    ...options,
    body: request,
  });

export const logout = (client: ApiTransport, options?: ApiOperationOptions) =>
  client.request<LogoutMutationResponse>({
    ...authenticationOperations.logout,
    ...options,
  });

export const signUp = (
  client: ApiTransport,
  request: SignUpMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<SignUpMutationResponse>({
    ...authenticationOperations.signUp,
    ...options,
    body: request,
  });

export const signUpWithGoogle = (
  client: ApiTransport,
  request: SignUpWithGoogleMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<SignUpWithGoogleMutationResponse>({
    ...authenticationOperations.signUpWithGoogle,
    ...options,
    body: request,
  });

export const requestPasswordReset = (
  client: ApiTransport,
  request: RequestPasswordResetMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<RequestPasswordResetMutationResponse>({
    ...authenticationOperations.requestPasswordReset,
    ...options,
    body: request,
  });

export const completePasswordReset = (
  client: ApiTransport,
  request: CompletePasswordResetMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<CompletePasswordResetMutationResponse>({
    ...authenticationOperations.completePasswordReset,
    ...options,
    body: request,
  });

export const confirmEmail = (
  client: ApiTransport,
  request: ConfirmEmailMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<ConfirmEmailMutationResponse>({
    ...authenticationOperations.confirmEmail,
    ...options,
    body: request,
  });
