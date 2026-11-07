import {
  completePasskeyRegistration,
  type CompletePasskeyRegistrationRequest,
} from "@template/api-client/authentication";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompletePasskeyRegistrationRequest;
    return Response.json(
      await completePasskeyRegistration(await createAppServerApiClient(), {
        credential: body.credential,
        flowToken: body.flowToken,
      }),
      { status: 201 },
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
