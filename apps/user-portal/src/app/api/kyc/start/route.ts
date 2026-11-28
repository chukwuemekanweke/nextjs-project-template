import { startKycVerification } from "@template/api-client/kyc";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

/** The backend derives stakeholder identity; callers cannot supply a body. */
export async function POST() {
  try {
    return Response.json(
      await startKycVerification(await createAppServerApiClient()),
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
