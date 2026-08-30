import {
  changePassword,
  type ChangePasswordMutationRequest,
} from "@template/api-client/authentication";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function PUT(request: Request) {
  try {
    const client = await createAppServerApiClient();
    await changePassword(
      client,
      (await request.json()) as ChangePasswordMutationRequest,
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiRouteError(error);
  }
}
