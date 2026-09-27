import { revokeOtherSessions } from "@template/api-client/authentication";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function DELETE() {
  try {
    await revokeOtherSessions(await createAppServerApiClient());
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiRouteError(error);
  }
}
