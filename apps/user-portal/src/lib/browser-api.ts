import { TENANT_ID_HEADER } from "@template/api-client";
import { createBrowserApiClient } from "@template/api-client/browser";

export function createUserPortalBrowserApi({
  apiBaseUrl,
  fetch,
  tenantId,
}: Readonly<{
  apiBaseUrl: string;
  fetch?: typeof globalThis.fetch;
  tenantId: string;
}>) {
  return createBrowserApiClient({
    baseUrl: apiBaseUrl,
    defaultHeaders: { [TENANT_ID_HEADER]: tenantId },
    fetch,
  });
}
