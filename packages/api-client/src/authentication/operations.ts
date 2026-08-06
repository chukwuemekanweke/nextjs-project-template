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
import type { ApiClient, ApiOperationOptions } from "../client";

export const signIn = (
  client: ApiClient,
  request: SignInMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<SignInMutationResponse>({
    ...authenticationOperations.signIn,
    ...options,
    body: request,
  });

export const signInWithGoogle = (
  client: ApiClient,
  request: SignInWithGoogleMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<SignInWithGoogleMutationResponse>({
    ...authenticationOperations.signInWithGoogle,
    ...options,
    body: request,
  });

export const refreshSession = (
  client: ApiClient,
  request: RefreshSessionMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<RefreshSessionMutationResponse>({
    ...authenticationOperations.refreshSession,
    ...options,
    body: request,
  });

export const logout = (client: ApiClient, options?: ApiOperationOptions) =>
  client.request<LogoutMutationResponse>({
    ...authenticationOperations.logout,
    ...options,
  });

export const signUp = (
  client: ApiClient,
  request: SignUpMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<SignUpMutationResponse>({
    ...authenticationOperations.signUp,
    ...options,
    body: request,
  });

export const signUpWithGoogle = (
  client: ApiClient,
  request: SignUpWithGoogleMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<SignUpWithGoogleMutationResponse>({
    ...authenticationOperations.signUpWithGoogle,
    ...options,
    body: request,
  });

export const requestPasswordReset = (
  client: ApiClient,
  request: RequestPasswordResetMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<RequestPasswordResetMutationResponse>({
    ...authenticationOperations.requestPasswordReset,
    ...options,
    body: request,
  });

export const completePasswordReset = (
  client: ApiClient,
  request: CompletePasswordResetMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<CompletePasswordResetMutationResponse>({
    ...authenticationOperations.completePasswordReset,
    ...options,
    body: request,
  });

export const confirmEmail = (
  client: ApiClient,
  request: ConfirmEmailMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<ConfirmEmailMutationResponse>({
    ...authenticationOperations.confirmEmail,
    ...options,
    body: request,
  });
