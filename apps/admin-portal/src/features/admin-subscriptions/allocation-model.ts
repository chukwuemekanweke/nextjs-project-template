import type { BillingAccountOwnerType } from "@template/api-client/subscriptions";
import type { AdminOption } from "../admin-billing-shared/billing-model";
import { ownerTypeLabel } from "./subscriptions-model";

/*
 * Complimentary subscription allocation (ADM-ALLOCATE). There is no
 * allocation endpoint, tenant list or user lookup (DR-070): the form is a
 * preview that validates input and reports an intent. It never computes the
 * period end, price or eligibility — the backend decides those — and never
 * presents an allocation as created.
 */

export const ALLOCATION_REASON_MAX_LENGTH = 500;

export type AllocationDraft = Readonly<{
  ownerType: BillingAccountOwnerType;
  tenantId: string;
  /** Selected user (owner type `Stakeholder`) from the lookup results. */
  userId: string;
  planId: string;
  /** `YYYY-MM-DD`, interpreted by the backend as a UTC day. */
  startDate: string;
  durationId: string;
  autoRenew: boolean;
  reason: string;
}>;

export const EMPTY_ALLOCATION_DRAFT: AllocationDraft = {
  autoRenew: false,
  durationId: "",
  ownerType: "Stakeholder",
  planId: "",
  reason: "",
  startDate: "",
  tenantId: "",
  userId: "",
};

export type AllocationErrors = Partial<
  Record<
    "tenantId" | "userId" | "planId" | "startDate" | "durationId" | "reason",
    string
  >
>;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a real calendar day in `YYYY-MM-DD` form. */
export function isIsoDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month! - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Field validation. A user allocation needs a tenant and a user in that
 * tenant; a tenant allocation needs only the tenant. The reason is always
 * required because the reference records it in audit history.
 */
export function validateAllocation(draft: AllocationDraft): AllocationErrors {
  const errors: { -readonly [K in keyof AllocationErrors]: string } = {};
  if (!draft.tenantId) errors.tenantId = "Choose a tenant.";
  if (draft.ownerType === "Stakeholder" && !draft.userId) {
    errors.userId = "Choose a user in this tenant.";
  }
  if (!draft.planId) errors.planId = "Choose a plan.";
  if (!draft.startDate) errors.startDate = "Enter a start date.";
  else if (!isIsoDate(draft.startDate))
    errors.startDate = "Enter a valid date.";
  if (!draft.durationId) errors.durationId = "Choose a duration.";
  const reason = draft.reason.trim();
  if (!reason)
    errors.reason = "Enter a reason. It is recorded in audit history.";
  else if (reason.length > ALLOCATION_REASON_MAX_LENGTH)
    errors.reason = `Use ${ALLOCATION_REASON_MAX_LENGTH} characters or fewer.`;
  return errors;
}

export type AllocationIntent = Readonly<{
  type: "allocate";
  ownerType: BillingAccountOwnerType;
  tenantId: string;
  /** Only for a user allocation. */
  userId: string | null;
  planId: string;
  startDate: string;
  durationId: string;
  autoRenew: boolean;
  reason: string;
}>;

export type AllocationDecision =
  | Readonly<{ kind: "blocked" }>
  | Readonly<{ kind: "invalid"; errors: AllocationErrors }>
  | Readonly<{ kind: "confirm"; intent: AllocationIntent }>;

/** Validates before the confirmation step; returns the intent to confirm. */
export function decideAllocation(
  draft: AllocationDraft,
  pending: boolean,
): AllocationDecision {
  if (pending) return { kind: "blocked" };
  const errors = validateAllocation(draft);
  if (Object.keys(errors).length > 0) return { errors, kind: "invalid" };
  return {
    intent: {
      autoRenew: draft.autoRenew,
      durationId: draft.durationId,
      ownerType: draft.ownerType,
      planId: draft.planId,
      reason: draft.reason.trim(),
      startDate: draft.startDate,
      tenantId: draft.tenantId,
      type: "allocate",
      userId: draft.ownerType === "Stakeholder" ? draft.userId : null,
    },
    kind: "confirm",
  };
}

/** Switching owner type clears the user so a hidden choice is never sent. */
export function changeOwnerType(
  draft: AllocationDraft,
  ownerType: BillingAccountOwnerType,
): AllocationDraft {
  return ownerType === draft.ownerType
    ? draft
    : { ...draft, ownerType, userId: "" };
}

/** Changing the tenant clears a user picked from the previous tenant. */
export function changeTenant(
  draft: AllocationDraft,
  tenantId: string,
): AllocationDraft {
  return tenantId === draft.tenantId
    ? draft
    : { ...draft, tenantId, userId: "" };
}

export type AllocationSummaryRow = Readonly<{ label: string; value: string }>;

const label = (options: readonly AdminOption[], value: string) =>
  options.find((option) => option.value === value)?.label;

/**
 * Summary of what will be requested. Unchosen values say so; the period end
 * is set by the backend and never calculated here.
 */
export function allocationSummary(
  draft: AllocationDraft,
  lookups: Readonly<{
    tenants: readonly AdminOption[];
    users: readonly AdminOption[];
    plans: readonly AdminOption[];
    durations: readonly AdminOption[];
  }>,
): AllocationSummaryRow[] {
  const notChosen = "Not chosen";
  const tenant = label(lookups.tenants, draft.tenantId);
  const owner =
    draft.ownerType === "Tenant" ? tenant : label(lookups.users, draft.userId);
  return [
    {
      label: "Owner",
      value: owner
        ? `${owner} (${ownerTypeLabel(draft.ownerType)})`
        : notChosen,
    },
    { label: "Tenant", value: tenant ?? notChosen },
    { label: "Plan", value: label(lookups.plans, draft.planId) ?? notChosen },
    {
      label: "Starts",
      value: isIsoDate(draft.startDate)
        ? `${draft.startDate} (UTC)`
        : notChosen,
    },
    {
      label: "Duration",
      value: label(lookups.durations, draft.durationId) ?? notChosen,
    },
    { label: "Period end", value: "Set by the backend" },
    { label: "Auto-renew", value: draft.autoRenew ? "On" : "Off" },
    { label: "Charge", value: "None · complimentary" },
  ];
}

/**
 * An existing subscription the backend reported for the chosen owner. It is
 * a preview warning only: the backend decides eligibility.
 */
export type AllocationOverlap = Readonly<{
  planName: string;
  statusLabel: string;
}>;

export function overlapWarning(overlap: AllocationOverlap): string {
  return `This owner already has a ${overlap.statusLabel.toLowerCase()} ${overlap.planName} subscription. The backend decides whether an allocation can overlap it; it may be rejected.`;
}
