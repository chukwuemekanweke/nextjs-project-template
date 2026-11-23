import { getCurrentSubscription } from "@template/api-client/subscriptions";
import { apiRouteError } from "@/lib/api-route-error";
import { billingValidationError, ownerTypeFromQuery } from "@/lib/billing-bff";
import { createAppServerApiClient } from "@/lib/server-api";

export async function GET(request: Request) {
  const ownerType = ownerTypeFromQuery(request);
  if (!ownerType) {
    return billingValidationError(
      "BillingAccountOwnerType",
      "BillingAccountOwnerType must be Tenant or Stakeholder.",
    );
  }
  try {
    return Response.json(
      await getCurrentSubscription(await createAppServerApiClient(), {
        BillingAccountOwnerType: ownerType,
      }),
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
