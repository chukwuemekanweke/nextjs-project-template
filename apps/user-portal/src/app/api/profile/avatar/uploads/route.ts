import {
  createAvatarUpload,
  type CreateAvatarUploadMutationRequest,
} from "@template/api-client/profiles";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const client = await createAppServerApiClient();
    const result = await createAvatarUpload(
      client,
      (await request.json()) as CreateAvatarUploadMutationRequest,
    );
    return Response.json(result);
  } catch (error) {
    return apiRouteError(error);
  }
}
