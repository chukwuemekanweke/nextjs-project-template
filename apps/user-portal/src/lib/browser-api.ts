import { TENANT_ID_HEADER } from "@template/api-client";
import { createBrowserApiClient } from "@template/api-client/browser";
import { authenticationOperations } from "@template/api-client/authentication";
import { profilesOperations } from "@template/api-client/profiles";

const PROFILE_BFF_PATH = "/api/profile";
const PASSWORD_BFF_PATH = "/api/security/password";

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
      if (
        init?.method === profilesOperations.updateProfile.method &&
        requestUrl.pathname === profilesOperations.updateProfile.path
      ) {
        return fetchImplementation(PROFILE_BFF_PATH, {
          ...init,
          credentials: "same-origin",
        });
      }

      return fetchImplementation(input, init);
    },
  });
}
