import {
  verifyTwoFactorEnrollment,
  type VerifyTwoFactorEnrollmentMutationRequest,
} from "@template/api-client/authentication";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    return Response.json(
      await verifyTwoFactorEnrollment(
        await createAppServerApiClient(),
        (await request.json()) as VerifyTwoFactorEnrollmentMutationRequest,
      ),
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
