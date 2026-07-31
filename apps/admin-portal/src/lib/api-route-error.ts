import { isApiError } from "@template/api-client";
import { NextResponse } from "next/server";

export function apiRouteError(error: unknown): NextResponse {
  if (!isApiError(error))
    return NextResponse.json(
      { title: "Unexpected error", status: 500 },
      { status: 500 },
    );
  return NextResponse.json(
    {
      code: error.code,
      detail: error.safeMessage,
      errors: error.validationErrors,
      status: error.status ?? 503,
      title: error.title ?? "Request failed",
      traceId: error.traceId ?? error.correlationId,
      type: error.problemType,
    },
    { status: error.status ?? 503 },
  );
}
