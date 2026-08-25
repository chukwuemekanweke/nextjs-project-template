import {
  updateProfile,
  type UpdateProfileMutationRequest,
} from "@template/api-client/profiles";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function PUT(request: Request) {
  try {
    const client = await createAppServerApiClient();
    await updateProfile(
      client,
      (await request.json()) as UpdateProfileMutationRequest,
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiRouteError(error);
  }
}
