import "server-only";

import type { ApiTransport } from "@template/api-client";
import {
  listSubscriptionPlans,
  type SubscriptionPlanResponse,
} from "@template/api-client/subscriptions";
import { createPublicServerApiClient } from "./server-api";

/** Plans change rarely; cached responses are reused for this many seconds. */
export const SUBSCRIPTION_PLANS_REVALIDATE_SECONDS = 60;
export const SUBSCRIPTION_PLANS_CACHE_TAG = "subscription-plans";

export type SubscriptionPlansResult =
  | Readonly<{ plans: SubscriptionPlanResponse[]; status: "loaded" }>
  | Readonly<{ status: "unavailable" }>;

/**
 * Loads backend-authoritative plans on the server. Failures render an
 * unavailable state instead of failing the page.
 */
export async function loadSubscriptionPlans(
  client: ApiTransport = createPublicServerApiClient(),
): Promise<SubscriptionPlansResult> {
  try {
    const plans = await listSubscriptionPlans(client, {
      next: {
        revalidate: SUBSCRIPTION_PLANS_REVALIDATE_SECONDS,
        tags: [SUBSCRIPTION_PLANS_CACHE_TAG],
      },
    });
    return { plans, status: "loaded" };
  } catch {
    return { status: "unavailable" };
  }
}
