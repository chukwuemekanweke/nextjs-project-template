import {
  completePasswordReset,
  type CompletePasswordResetMutationRequest,
} from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const result = await completePasswordReset(
      client,
      (await request.json()) as CompletePasswordResetMutationRequest,
    );
    return NextResponse.json(result);
  } catch (error) {
    return apiRouteError(error);
  }
}
