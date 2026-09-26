import { getTwoFactorStatus } from "@template/api-client/authentication";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function GET() {
  try {
    return Response.json(
      await getTwoFactorStatus(await createAppServerApiClient()),
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
