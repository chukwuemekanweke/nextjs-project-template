import {
  disableTwoFactor,
  type DisableTwoFactorMutationRequest,
} from "@template/api-client/authentication";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    await disableTwoFactor(
      await createAppServerApiClient(),
      (await request.json()) as DisableTwoFactorMutationRequest,
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiRouteError(error);
  }
}
