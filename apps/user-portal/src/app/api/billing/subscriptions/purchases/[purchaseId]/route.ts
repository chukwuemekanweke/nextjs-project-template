import { getSubscriptionPurchaseStatus } from "@template/api-client/subscriptions";
import { apiRouteError } from "@/lib/api-route-error";
import { billingValidationError, ownerTypeFromQuery } from "@/lib/billing-bff";
import { createAppServerApiClient } from "@/lib/server-api";

type RouteContext = { params: Promise<{ purchaseId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const ownerType = ownerTypeFromQuery(request);
  if (!ownerType) {
    return billingValidationError(
      "BillingAccountOwnerType",
      "BillingAccountOwnerType must be Tenant or Stakeholder.",
    );
  }
  try {
    return Response.json(
      await getSubscriptionPurchaseStatus(
        await createAppServerApiClient(),
        await params,
        { BillingAccountOwnerType: ownerType },
      ),
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
