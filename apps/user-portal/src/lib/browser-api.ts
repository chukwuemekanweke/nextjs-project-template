import { TENANT_ID_HEADER } from "@template/api-client";
import { createBrowserApiClient } from "@template/api-client/browser";
import { authenticationOperations } from "@template/api-client/authentication";
import { profilesOperations } from "@template/api-client/profiles";

const PROFILE_BFF_PATH = "/api/profile";
const AVATAR_UPLOADS_BFF_PATH = "/api/profile/avatar/uploads";
const PASSWORD_BFF_PATH = "/api/security/password";
const TWO_FACTOR_BFF_PATH = "/api/security/two-factor";
const SESSIONS_BFF_PATH = "/api/security/sessions";
const LOGIN_ACTIVITY_BFF_PATH = "/api/security/login-activity";
const PASSKEYS_BFF_PATH = "/api/security/passkeys";
const PASSKEY_BFF_ROUTES = new Map<string, string>([
  [authenticationOperations.listPasskeys.path, PASSKEYS_BFF_PATH],
  [
    authenticationOperations.createPasskeyRegistrationOptions.path,
    `${PASSKEYS_BFF_PATH}/registration-options`,
  ],
  [
    authenticationOperations.completePasskeyRegistration.path,
    `${PASSKEYS_BFF_PATH}/registrations`,
  ],
]);
const PASSKEY_CREDENTIAL_PATH =
  /^\/api\/v1\/authentication\/passkeys\/(?!(?:registration-options|registrations|authentication-options|authentication-completions)$)([^/]+)$/;
const PASSKEY_CREDENTIAL_METHODS = new Set<string>([
  authenticationOperations.renamePasskey.method,
  authenticationOperations.removePasskey.method,
]);
const TWO_FACTOR_BFF_ROUTES = new Map<string, string>([
  [authenticationOperations.getTwoFactorStatus.path, TWO_FACTOR_BFF_PATH],
  [
    authenticationOperations.setupTwoFactor.path,
    `${TWO_FACTOR_BFF_PATH}/setup`,
  ],
  [
    authenticationOperations.verifyTwoFactorEnrollment.path,
    `${TWO_FACTOR_BFF_PATH}/verify`,
  ],
  [
    authenticationOperations.regenerateRecoveryCodes.path,
    `${TWO_FACTOR_BFF_PATH}/recovery-codes`,
  ],
  [
    authenticationOperations.disableTwoFactor.path,
    `${TWO_FACTOR_BFF_PATH}/disable`,
  ],
]);
const COMPLETE_AVATAR_UPLOAD_PATH =
  /^\/api\/v1\/stakeholders\/me\/profile\/avatar\/uploads\/([^/]+)\/complete$/;
const REVOKE_SESSION_PATH =
  /^\/api\/v1\/authentication\/sessions\/(?!others$)([^/]+)$/;

export function createUserPortalBrowserApi({
  apiBaseUrl,
  fetch,
  tenantId,
}: Readonly<{
  apiBaseUrl: string;
  fetch?: typeof globalThis.fetch;
  tenantId: string;
}>) {
  const fetchImplementation = fetch ?? globalThis.fetch;

  return createBrowserApiClient({
    baseUrl: apiBaseUrl,
    defaultHeaders: { [TENANT_ID_HEADER]: tenantId },
    fetch: (input, init) => {
      const requestUrl = new URL(input.toString());
      if (
        init?.method === authenticationOperations.changePassword.method &&
        requestUrl.pathname === authenticationOperations.changePassword.path
      ) {
        return fetchImplementation(PASSWORD_BFF_PATH, {
          ...init,
          credentials: "same-origin",
        });
      }
      const twoFactorRoute = TWO_FACTOR_BFF_ROUTES.get(requestUrl.pathname);
      if (twoFactorRoute) {
        return fetchImplementation(twoFactorRoute, {
          ...init,
          credentials: "same-origin",
        });
      }
      if (
        init?.method === profilesOperations.updateProfile.method &&
        requestUrl.pathname === profilesOperations.updateProfile.path
      ) {
        return fetchImplementation(PROFILE_BFF_PATH, {
          ...init,
          credentials: "same-origin",
        });
      }
      if (
        init?.method === profilesOperations.createAvatarUpload.method &&
        requestUrl.pathname === profilesOperations.createAvatarUpload.path
      ) {
        return fetchImplementation(AVATAR_UPLOADS_BFF_PATH, {
          ...init,
          credentials: "same-origin",
        });
      }

      const completeAvatarMatch = requestUrl.pathname.match(
        COMPLETE_AVATAR_UPLOAD_PATH,
      );
      if (
        init?.method === profilesOperations.completeAvatarUpload.method &&
        completeAvatarMatch
      ) {
        return fetchImplementation(
          `${AVATAR_UPLOADS_BFF_PATH}/${completeAvatarMatch[1]}/complete`,
          { ...init, credentials: "same-origin" },
        );
      }
      if (
        init?.method === authenticationOperations.listActiveSessions.method &&
        requestUrl.pathname === authenticationOperations.listActiveSessions.path
      ) {
        return fetchImplementation(SESSIONS_BFF_PATH, {
          ...init,
          credentials: "same-origin",
        });
      }
      if (
        init?.method === authenticationOperations.revokeOtherSessions.method &&
        requestUrl.pathname ===
          authenticationOperations.revokeOtherSessions.path
      ) {
        return fetchImplementation(`${SESSIONS_BFF_PATH}/others`, {
          ...init,
          credentials: "same-origin",
        });
      }
      const revokeSessionMatch = requestUrl.pathname.match(REVOKE_SESSION_PATH);
      if (
        init?.method === authenticationOperations.revokeSession.method &&
        revokeSessionMatch
      ) {
        return fetchImplementation(
          `${SESSIONS_BFF_PATH}/${revokeSessionMatch[1]}`,
          { ...init, credentials: "same-origin" },
        );
      }
      const passkeyRoute = PASSKEY_BFF_ROUTES.get(requestUrl.pathname);
      if (passkeyRoute) {
        return fetchImplementation(passkeyRoute, {
          ...init,
          credentials: "same-origin",
        });
      }
      const passkeyMatch = requestUrl.pathname.match(PASSKEY_CREDENTIAL_PATH);
      if (passkeyMatch && PASSKEY_CREDENTIAL_METHODS.has(init?.method ?? "")) {
        return fetchImplementation(`${PASSKEYS_BFF_PATH}/${passkeyMatch[1]}`, {
          ...init,
          credentials: "same-origin",
        });
      }
      if (
        init?.method === authenticationOperations.getLoginActivity.method &&
        requestUrl.pathname === authenticationOperations.getLoginActivity.path
      ) {
        return fetchImplementation(
          `${LOGIN_ACTIVITY_BFF_PATH}${requestUrl.search}`,
          { ...init, credentials: "same-origin" },
        );
      }

      return fetchImplementation(input, init);
    },
  });
}
