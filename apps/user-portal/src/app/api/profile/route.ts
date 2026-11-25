import {
  getProfile,
  updateProfile,
  type UpdateProfileMutationRequest,
} from "@template/api-client/profiles";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

/** Current profile for browser views (dashboard shell account identity). */
export async function GET() {
  try {
    return Response.json(await getProfile(await createAppServerApiClient()));
  } catch (error) {
    return apiRouteError(error);
  }
}

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
