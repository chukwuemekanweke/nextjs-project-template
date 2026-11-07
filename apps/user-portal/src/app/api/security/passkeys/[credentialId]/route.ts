import {
  removePasskey,
  renamePasskey,
  type RenamePasskeyRequest,
} from "@template/api-client/authentication";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

type RouteContext = { params: Promise<{ credentialId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const body = (await request.json()) as RenamePasskeyRequest;
    await renamePasskey(await createAppServerApiClient(), await params, {
      name: body.name,
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await removePasskey(await createAppServerApiClient(), await params);
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiRouteError(error);
  }
}
