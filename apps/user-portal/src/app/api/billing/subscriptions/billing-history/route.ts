import { getBillingHistory } from "@template/api-client/subscriptions";
import { apiRouteError } from "@/lib/api-route-error";
import {
  billingValidationError,
  ownerTypeFromQuery,
  positiveIntegerFromQuery,
} from "@/lib/billing-bff";
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
      await getBillingHistory(await createAppServerApiClient(), {
        BillingAccountOwnerType: ownerType,
        Page: positiveIntegerFromQuery(request, "Page"),
        PageSize: positiveIntegerFromQuery(request, "PageSize"),
      }),
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
