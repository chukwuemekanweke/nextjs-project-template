import { completeAvatarUpload } from "@template/api-client/profiles";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ uploadId: string }> },
) {
  try {
    const client = await createAppServerApiClient();
    const result = await completeAvatarUpload(client, await params);
    return Response.json(result);
  } catch (error) {
    return apiRouteError(error);
  }
}
