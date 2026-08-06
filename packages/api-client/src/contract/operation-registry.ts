export type HttpMethod = "GET" | "POST" | "PUT";

export interface SupportedOperation {
  /** Stable frontend identifier. OpenAPI operationId is omitted until the backend publishes one. */
  clientOperationId: string;
  method: HttpMethod;
  path: string;
  operationId?: string;
  requestSchema?: string;
  responseSchema?: string;
  parameters?: ReadonlyArray<{
    in: "path" | "query";
    name: string;
    required: boolean;
  }>;
}

const operation = <T extends SupportedOperation>(value: T): T => value;

export const supportedOperations = [
  operation({
    clientOperationId: "profiles.updateProfile",
    method: "PUT",
    path: "/api/v1/stakeholders/me/profile",
    requestSchema: "UpdateProfileRequest",
  }),
  operation({
    clientOperationId: "profiles.uploadAvatar",
    method: "POST",
    path: "/api/v1/stakeholders/me/profile/avatar",
    responseSchema: "UploadAvatarResponse",
  }),
  operation({
    clientOperationId: "referenceData.getCountries",
    method: "GET",
    path: "/api/v1/reference-data/countries",
    responseSchema: "GetCountriesResponse",
  }),
  operation({
    clientOperationId: "providers.setActiveProvider",
    method: "PUT",
    path: "/api/v1/providers/active",
    requestSchema: "ActivateProviderRequest",
  }),
  operation({
    clientOperationId: "payments.getWalletTransactions",
    method: "GET",
    path: "/api/v1/payments/wallet-transactions",
    responseSchema: "GetStakeholderWalletTransactionsResult",
    parameters: [
      { in: "query", name: "Limit", required: false },
      { in: "query", name: "Cursor", required: false },
    ],
  }),
  operation({
    clientOperationId: "payments.getWalletTopUpTransaction",
    method: "GET",
    path: "/api/v1/payments/wallet-transactions/top-ups/{walletTransactionId}",
    responseSchema: "GetStakeholderWalletTopUpTransactionDetailResponse",
    parameters: [{ in: "path", name: "WalletTransactionId", required: true }],
  }),
  operation({
    clientOperationId: "payments.setPaymentProviderActivation",
    method: "PUT",
    path: "/api/v1/payment-providers/{id}/activation",
    requestSchema: "SetPaymentProviderActivationRequest",
    parameters: [{ in: "path", name: "id", required: true }],
  }),
  operation({
    clientOperationId: "payments.initiatePayment",
    method: "POST",
    path: "/api/v1/payments/initiate",
    requestSchema: "InitiatePaymentRequest",
    responseSchema: "InitiatePaymentResponse",
  }),
  operation({
    clientOperationId: "authentication.signIn",
    method: "POST",
    path: "/api/v1/authentication/sessions",
    requestSchema: "SignInRequest",
    responseSchema: "SignInResponse",
  }),
  operation({
    clientOperationId: "authentication.signInWithGoogle",
    method: "POST",
    path: "/api/v1/authentication/sessions/google",
    requestSchema: "GoogleSignInRequest",
    responseSchema: "GoogleSignInResponse",
  }),
  operation({
    clientOperationId: "authentication.refreshSession",
    method: "POST",
    path: "/api/v1/authentication/sessions/refresh",
    requestSchema: "RefreshSessionRequest",
    responseSchema: "RefreshSessionResponse",
  }),
  operation({
    clientOperationId: "authentication.logout",
    method: "POST",
    path: "/api/v1/authentication/sessions/logout",
  }),
  operation({
    clientOperationId: "authentication.signUp",
    method: "POST",
    path: "/api/v1/authentication/registrations",
    requestSchema: "SignUpRequest",
    responseSchema: "SignUpResponse",
  }),
  operation({
    clientOperationId: "authentication.signUpWithGoogle",
    method: "POST",
    path: "/api/v1/authentication/registrations/google",
    requestSchema: "GoogleSignUpRequest",
    responseSchema: "GoogleSignUpResponse",
  }),
  operation({
    clientOperationId: "authentication.requestPasswordReset",
    method: "POST",
    path: "/api/v1/authentication/password-resets",
    requestSchema: "PasswordResetRequest",
    responseSchema: "RequestPasswordResetResponse",
  }),
  operation({
    clientOperationId: "authentication.completePasswordReset",
    method: "POST",
    path: "/api/v1/authentication/password-resets/completions",
    requestSchema: "CompletePasswordResetRequest",
    responseSchema: "CompletePasswordResetResponse",
  }),
  operation({
    clientOperationId: "authentication.confirmEmail",
    method: "POST",
    path: "/api/v1/authentication/email-confirmations",
    requestSchema: "SignUpOtpRequest",
    responseSchema: "SignUpOtpResponse",
  }),
] as const satisfies ReadonlyArray<SupportedOperation>;

/** Review and update these hashes only after comparing the handwritten contracts. */
export const supportedSchemaFingerprints = {
  ActivateProviderRequest: "d558138463a90d9f",
  CompletePasswordResetRequest: "ac6c0192bc0fcf9e",
  CompletePasswordResetResponse: "2d9389fd413dd301",
  GetCountriesResponse: "eebf6bfcec381b9e",
  GetStakeholderWalletTopUpTransactionDetailResponse: "faafee5729177819",
  GetStakeholderWalletTransactionsResult: "dd3a698798c860f3",
  GoogleSignInRequest: "4f32b866ffed6ed6",
  GoogleSignInResponse: "9e993613c812a828",
  GoogleSignUpRequest: "1f8036f346c7aa62",
  GoogleSignUpResponse: "1171df136dc9d025",
  InitiatePaymentRequest: "12403b5b1ccda985",
  InitiatePaymentResponse: "ae3a3db610d502c2",
  PasswordResetRequest: "09a114eaed54059d",
  RefreshSessionRequest: "9105526f2d9133f3",
  RefreshSessionResponse: "9e993613c812a828",
  RequestPasswordResetResponse: "2d9389fd413dd301",
  SetPaymentProviderActivationRequest: "7c37fe52fef38900",
  SignInRequest: "f1400a836feea9d8",
  SignInResponse: "9e993613c812a828",
  SignUpOtpRequest: "c5ad7c0d511ee237",
  SignUpOtpResponse: "2d9389fd413dd301",
  SignUpRequest: "0452a89a14bd2d93",
  SignUpResponse: "1171df136dc9d025",
  UpdateProfileRequest: "c70346509b469e51",
  UploadAvatarResponse: "20c5c87e7c887894",
} as const;
