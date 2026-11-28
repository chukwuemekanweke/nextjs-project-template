import { getCurrentKycVerification } from "@template/api-client/kyc";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function GET() {
  try {
    return Response.json(
      await getCurrentKycVerification(await createAppServerApiClient()),
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
