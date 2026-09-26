import type {
  ChangePasswordMutationRequest,
  ChangePasswordMutationResponse,
  CheckEmailExistenceMutationRequest,
  CheckEmailExistenceMutationResponse,
  CompletePasswordResetMutationRequest,
  CompletePasswordResetMutationResponse,
  CompleteTwoFactorChallengeMutationRequest,
  CompleteTwoFactorChallengeMutationResponse,
  ConfirmEmailMutationRequest,
  ConfirmEmailMutationResponse,
  DisableTwoFactorMutationRequest,
  DisableTwoFactorMutationResponse,
  LogoutMutationResponse,
  LinkGoogleAccountMutationRequest,
  LinkGoogleAccountMutationResponse,
  RegenerateRecoveryCodesMutationRequest,
  RegenerateRecoveryCodesMutationResponse,
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
  StartGoogleAuthenticationFlowMutationResponse,
  SetupTwoFactorMutationResponse,
  TwoFactorStatusQueryResponse,
  VerifyTwoFactorEnrollmentMutationRequest,
  VerifyTwoFactorEnrollmentMutationResponse,
} from "./contracts";
import { authenticationOperations } from "./contracts";
import type { ApiOperationOptions, ApiTransport } from "../client";

export const changePassword = (
  client: ApiTransport,
  request: ChangePasswordMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<ChangePasswordMutationResponse>({
    ...authenticationOperations.changePassword,
    ...options,
    body: request,
  });

export const checkEmailExistence = (
  client: ApiTransport,
  request: CheckEmailExistenceMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<CheckEmailExistenceMutationResponse>({
    ...authenticationOperations.checkEmailExistence,
    ...options,
    body: request,
  });

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

export const completeTwoFactorChallenge = (
  client: ApiTransport,
  request: CompleteTwoFactorChallengeMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<CompleteTwoFactorChallengeMutationResponse>({
    ...authenticationOperations.completeTwoFactorChallenge,
    ...options,
    body: request,
  });

export const getTwoFactorStatus = (
  client: ApiTransport,
  options?: ApiOperationOptions,
) =>
  client.request<TwoFactorStatusQueryResponse>({
    ...authenticationOperations.getTwoFactorStatus,
    ...options,
  });

export const setupTwoFactor = (
  client: ApiTransport,
  options?: ApiOperationOptions,
) =>
  client.request<SetupTwoFactorMutationResponse>({
    ...authenticationOperations.setupTwoFactor,
    ...options,
  });

export const verifyTwoFactorEnrollment = (
  client: ApiTransport,
  request: VerifyTwoFactorEnrollmentMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<VerifyTwoFactorEnrollmentMutationResponse>({
    ...authenticationOperations.verifyTwoFactorEnrollment,
    ...options,
    body: request,
  });

export const regenerateRecoveryCodes = (
  client: ApiTransport,
  request: RegenerateRecoveryCodesMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<RegenerateRecoveryCodesMutationResponse>({
    ...authenticationOperations.regenerateRecoveryCodes,
    ...options,
    body: request,
  });

export const disableTwoFactor = (
  client: ApiTransport,
  request: DisableTwoFactorMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<DisableTwoFactorMutationResponse>({
    ...authenticationOperations.disableTwoFactor,
    ...options,
    body: request,
  });

export const startGoogleAuthenticationFlow = (
  client: ApiTransport,
  options?: ApiOperationOptions,
) =>
  client.request<StartGoogleAuthenticationFlowMutationResponse>({
    ...authenticationOperations.startGoogleAuthenticationFlow,
    ...options,
  });

export const linkGoogleAccount = (
  client: ApiTransport,
  request: LinkGoogleAccountMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<LinkGoogleAccountMutationResponse>({
    ...authenticationOperations.linkGoogleAccount,
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

export const requestEmailConfirmationCode = (
  client: ApiTransport,
  request: RequestEmailConfirmationCodeMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<RequestEmailConfirmationCodeMutationResponse>({
    ...authenticationOperations.requestEmailConfirmationCode,
    ...options,
    body: request,
  });
