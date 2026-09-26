import {
  regenerateRecoveryCodes,
  type RegenerateRecoveryCodesMutationRequest,
} from "@template/api-client/authentication";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    return Response.json(
      await regenerateRecoveryCodes(
        await createAppServerApiClient(),
        (await request.json()) as RegenerateRecoveryCodesMutationRequest,
      ),
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
