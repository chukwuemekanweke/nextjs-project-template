import {
  confirmEmail,
  type ConfirmEmailMutationRequest,
} from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const result = await confirmEmail(
      client,
      (await request.json()) as ConfirmEmailMutationRequest,
    );
    return NextResponse.json(result);
  } catch (error) {
    return apiRouteError(error);
  }
}
