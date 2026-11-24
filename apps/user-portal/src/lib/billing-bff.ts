import "server-only";

import type {
  BillingAccountOwnerType,
  PurchaseSubscriptionMutationRequest,
} from "@template/api-client/subscriptions";
import {
  billingAccountOwnerTypes,
  IDEMPOTENCY_KEY_HEADER,
  isIdempotencyKey,
} from "@template/api-client/subscriptions";
import { NextResponse } from "next/server";

/**
 * Same-origin prefix for the subscription BFF. Each route forwards one
 * handwritten operation with the server-side access token; there is no
 * generic proxy.
 */
export const BILLING_BFF_PREFIX = "/api/billing";

export function billingValidationError(field: string, message: string) {
  return NextResponse.json(
    {
      errors: { [field]: [message] },
      status: 400,
      title: "One or more validation errors occurred.",
    },
    { status: 400 },
  );
}

function asOwnerType(value: unknown): BillingAccountOwnerType | undefined {
  return billingAccountOwnerTypes.find((ownerType) => ownerType === value);
}

/** Reads the required `BillingAccountOwnerType` query parameter. */
export function ownerTypeFromQuery(
  request: Request,
): BillingAccountOwnerType | undefined {
  return asOwnerType(
    new URL(request.url).searchParams.get("BillingAccountOwnerType"),
  );
}

/** Reads a positive integer query parameter, or `undefined` when absent/invalid. */
export function positiveIntegerFromQuery(
  request: Request,
  name: string,
): number | undefined {
  const value = new URL(request.url).searchParams.get(name);
  if (!value || !/^\d{1,6}$/.test(value)) return undefined;
  const parsed = Number(value);
  return parsed > 0 ? parsed : undefined;
}

export function idempotencyKeyFromHeaders(request: Request) {
  const value = request.headers.get(IDEMPOTENCY_KEY_HEADER);
  return isIdempotencyKey(value) ? value : undefined;
}

/** Forwards only the documented purchase fields; never amounts or currencies. */
export function purchaseRequestFromBody(
  body: unknown,
): PurchaseSubscriptionMutationRequest | undefined {
  if (!body || typeof body !== "object") return undefined;
  const candidate = body as Record<string, unknown>;
  const billingAccountOwnerType = asOwnerType(
    candidate.billingAccountOwnerType,
  );
  if (
    typeof candidate.planId !== "string" ||
    typeof candidate.paymentProviderId !== "string" ||
    typeof candidate.billingInterval !== "string" ||
    candidate.billingInterval.length === 0 ||
    typeof candidate.autoRenew !== "boolean" ||
    !billingAccountOwnerType
  ) {
    return undefined;
  }
  return {
    autoRenew: candidate.autoRenew,
    billingAccountOwnerType,
    billingInterval: candidate.billingInterval,
    paymentProviderId: candidate.paymentProviderId,
    planId: candidate.planId,
  };
}

export function ownerTypeFromBody(
  body: unknown,
): BillingAccountOwnerType | undefined {
  return body && typeof body === "object"
    ? asOwnerType((body as Record<string, unknown>).billingAccountOwnerType)
    : undefined;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
