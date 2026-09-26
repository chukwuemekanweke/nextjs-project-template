import { setupTwoFactor } from "@template/api-client/authentication";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST() {
  try {
    return Response.json(
      await setupTwoFactor(await createAppServerApiClient()),
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
