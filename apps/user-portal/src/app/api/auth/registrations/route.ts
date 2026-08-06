import {
  signUp,
  type SignUpMutationRequest,
} from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const result = await signUp(
      client,
      (await request.json()) as SignUpMutationRequest,
    );
    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    return apiRouteError(error);
  }
}
