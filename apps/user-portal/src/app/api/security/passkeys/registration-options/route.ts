import {
  createPasskeyRegistrationOptions,
  type CreatePasskeyRegistrationOptionsRequest,
} from "@template/api-client/authentication";
import { apiRouteError } from "@/lib/api-route-error";
import { NO_STORE_HEADERS } from "@/lib/passkey-bff";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as CreatePasskeyRegistrationOptionsRequest;
    return Response.json(
      await createPasskeyRegistrationOptions(await createAppServerApiClient(), {
        name: body.name,
      }),
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
