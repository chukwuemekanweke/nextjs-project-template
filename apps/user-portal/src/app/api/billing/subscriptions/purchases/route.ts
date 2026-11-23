import { purchaseSubscription } from "@template/api-client/subscriptions";
import { apiRouteError } from "@/lib/api-route-error";
import {
  billingValidationError,
  idempotencyKeyFromHeaders,
  purchaseRequestFromBody,
  readJson,
} from "@/lib/billing-bff";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST(request: Request) {
  const idempotencyKey = idempotencyKeyFromHeaders(request);
  if (!idempotencyKey) {
    return billingValidationError(
      "Idempotency-Key",
      "A non-empty Idempotency-Key header is required.",
    );
  }
  const purchase = purchaseRequestFromBody(await readJson(request));
  if (!purchase) {
    return billingValidationError(
      "request",
      "planId, paymentProviderId, billingAccountOwnerType, and autoRenew are required.",
    );
  }
  try {
    return Response.json(
      await purchaseSubscription(
        await createAppServerApiClient(),
        purchase,
        idempotencyKey,
      ),
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
