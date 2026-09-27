import { revokeSession } from "@template/api-client/authentication";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    await revokeSession(await createAppServerApiClient(), await params);
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiRouteError(error);
  }
}
