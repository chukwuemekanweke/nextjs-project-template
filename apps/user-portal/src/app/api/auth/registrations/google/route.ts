import {
  signUpWithGoogle,
  type SignUpWithGoogleMutationRequest,
} from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const result = await signUpWithGoogle(
      client,
      (await request.json()) as SignUpWithGoogleMutationRequest,
    );
    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    return apiRouteError(error);
  }
}
