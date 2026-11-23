import { cancelSubscriptionAtPeriodEnd } from "@template/api-client/subscriptions";
import { apiRouteError } from "@/lib/api-route-error";
import {
  billingValidationError,
  ownerTypeFromBody,
  readJson,
} from "@/lib/billing-bff";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST(request: Request) {
  const ownerType = ownerTypeFromBody(await readJson(request));
  if (!ownerType) {
    return billingValidationError(
      "billingAccountOwnerType",
      "billingAccountOwnerType must be Tenant or Stakeholder.",
    );
  }
  try {
    return Response.json(
      await cancelSubscriptionAtPeriodEnd(await createAppServerApiClient(), {
        billingAccountOwnerType: ownerType,
      }),
    );
  } catch (error) {
    return apiRouteError(error);
  }
}
