import { getLoginActivity } from "@template/api-client/authentication";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    return Response.json(
      await getLoginActivity(await createAppServerApiClient(), {
        Cursor: searchParams.get("Cursor") ?? undefined,
        Limit: searchParams.get("Limit") ?? undefined,
      }),
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
