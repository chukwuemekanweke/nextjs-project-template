export {
  createBrowserApiClient,
  type BrowserApiClientConfiguration,
} from "./browser-client";
export {
  createBffSessionFetch,
  type BffSessionFetchOptions,
  type BrowserLocation,
} from "./bff-session-fetch";
export {
  createRefreshCoordinatedFetch,
  type RefreshCoordinatedFetchOptions,
} from "./refresh-coordinated-fetch";
export {
  arrayBufferToBase64Url,
  base64UrlToArrayBuffer,
  classifyWebAuthnError,
  createPasskeyCredential,
  getPasskeyAssertion,
  isWebAuthnSupported,
  serializeAuthenticationCredential,
  serializeRegistrationCredential,
  toPublicKeyCredentialCreationOptions,
  toPublicKeyCredentialRequestOptions,
  WebAuthnCeremonyError,
  WebAuthnSerializationError,
  type WebAuthnCredential,
  type WebAuthnEnvironment,
  type WebAuthnFailureReason,
} from "./webauthn";
