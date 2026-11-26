import type { SubscriptionPlanPriceResponse } from "@template/api-client/subscriptions";
import {
  currencyMinorUnitDigits,
  formatMinorUnits,
  minorUnitsToDecimalString,
} from "@template/ui-core";
import type { StatusPresentation } from "../admin-billing-shared/billing-model";

/*
 * Admin plan management view model (ADM-PLANS: table + editor drawer).
 *
 * Local presentation types: there is no admin plans API (DR-070). The public
 * `listSubscriptionPlans` read returns active plans only, without status or
 * subscriber counts, so it is not an admin inventory and is not used here.
 * A future adapter (CAF-FE-015) maps the admin plans API into `AdminPlan`.
 * Saving only reports an intent; this module never decides that a save
 * succeeded.
 */

export type AdminPlan = Readonly<{
  id: string;
  /** Immutable after creation. */
  code: string;
  name: string;
  description: string | null;
  currencyCode: string;
  /** One price per offered interval, in whole minor units. */
  prices: readonly SubscriptionPlanPriceResponse[];
  features: readonly string[];
  isActive: boolean;
  /** `null` when the source does not report a count (never shown as 0). */
  subscriberCount: number | null;
}>;

export const PLAN_INTERVALS = ["Monthly", "Yearly"] as const;
export type PlanInterval = (typeof PLAN_INTERVALS)[number];

export function describePlanStatus(isActive: boolean): StatusPresentation {
  return isActive
    ? { label: "Active", tone: "success" }
    : { label: "Inactive", tone: "neutral" };
}

const cadence: Record<string, string> = { Monthly: "month", Yearly: "year" };

/** "NGN 15,000.00 / month", one line per offered interval. */
export function planPriceLines(plan: AdminPlan): string[] {
  return plan.prices.map(
    (price) =>
      `${formatMinorUnits(price.price, plan.currencyCode)} / ${
        cadence[price.billingInterval] ?? price.billingInterval.toLowerCase()
      }`,
  );
}

/* ------------------------------------------------------------------------ */
/* Editor draft and validation                                               */
/* ------------------------------------------------------------------------ */

export const PLAN_NAME_MAX_LENGTH = 80;
export const PLAN_DESCRIPTION_MAX_LENGTH = 300;
export const PLAN_FEATURE_MAX_LENGTH = 120;
export const PLAN_FEATURES_MAX = 20;
export const PLAN_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,31}$/;

export type PlanEditorMode = "create" | "edit";

/** Editable values; prices are decimal strings in major units as typed. */
export type PlanDraft = Readonly<{
  name: string;
  code: string;
  description: string;
  currencyCode: string;
  prices: Readonly<Record<PlanInterval, string>>;
  features: readonly string[];
  isActive: boolean;
}>;

export type PlanDraftErrors = Partial<
  Record<
    "name" | "code" | "description" | "currencyCode" | "prices" | "features",
    string
  > &
    Record<`price${PlanInterval}`, string>
>;

export function emptyPlanDraft(currencyCode = ""): PlanDraft {
  return {
    code: "",
    currencyCode,
    description: "",
    features: [""],
    isActive: true,
    name: "",
    prices: { Monthly: "", Yearly: "" },
  };
}

/** Draft for an existing plan; minor units become exact decimal strings. */
export function planDraftFromPlan(plan: AdminPlan): PlanDraft {
  const digits = currencyMinorUnitDigits(plan.currencyCode);
  const decimal = (interval: PlanInterval) => {
    const price = plan.prices.find((p) => p.billingInterval === interval);
    if (!price || digits === undefined) return "";
    return minorUnitsToDecimalString(price.price, digits) ?? "";
  };
  return {
    code: plan.code,
    currencyCode: plan.currencyCode,
    description: plan.description ?? "",
    features: plan.features.length > 0 ? [...plan.features] : [""],
    isActive: plan.isActive,
    name: plan.name,
    prices: { Monthly: decimal("Monthly"), Yearly: decimal("Yearly") },
  };
}

function decimalPattern(digits: number): RegExp {
  return digits === 0
    ? /^\d{1,12}$/
    : new RegExp(`^\\d{1,12}(\\.\\d{1,${digits}})?$`);
}

/** Validation for the preview editor. Field-level, never throws. */
export function validatePlanDraft(
  draft: PlanDraft,
  context: Readonly<{ mode: PlanEditorMode; originalCode?: string }>,
): PlanDraftErrors {
  const errors: { -readonly [K in keyof PlanDraftErrors]: string } = {};
  const name = draft.name.trim();
  if (!name) errors.name = "Enter a plan name.";
  else if (name.length > PLAN_NAME_MAX_LENGTH)
    errors.name = `Use ${PLAN_NAME_MAX_LENGTH} characters or fewer.`;

  const code = draft.code.trim();
  if (context.mode === "edit") {
    if (code !== context.originalCode)
      errors.code = "Codes can't change after creation.";
  } else if (!code) {
    errors.code = "Enter a plan code.";
  } else if (!PLAN_CODE_PATTERN.test(code)) {
    errors.code =
      "Use 2–32 capital letters, digits or underscores, starting with a letter.";
  }

  if (draft.description.trim().length > PLAN_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Use ${PLAN_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }

  const digits = draft.currencyCode
    ? currencyMinorUnitDigits(draft.currencyCode)
    : undefined;
  if (digits === undefined) {
    errors.currencyCode = "Choose a currency.";
  } else {
    const pattern = decimalPattern(digits);
    let anyPrice = false;
    for (const interval of PLAN_INTERVALS) {
      const value = draft.prices[interval].trim().replaceAll(",", "");
      if (!value) continue;
      anyPrice = true;
      if (!pattern.test(value)) {
        errors[`price${interval}`] =
          digits === 0
            ? "Enter a whole amount."
            : `Enter an amount with up to ${digits} decimal places.`;
      } else if (/^0*(\.0*)?$/.test(value)) {
        errors[`price${interval}`] = "Enter an amount greater than zero.";
      }
    }
    if (!anyPrice) errors.prices = "Enter at least one price.";
  }

  const features = draft.features.map((feature) => feature.trim());
  if (features.some((feature) => !feature)) {
    errors.features = "Fill in or remove empty features.";
  } else if (
    features.some((feature) => feature.length > PLAN_FEATURE_MAX_LENGTH)
  ) {
    errors.features = `Keep each feature to ${PLAN_FEATURE_MAX_LENGTH} characters or fewer.`;
  } else if (features.length > PLAN_FEATURES_MAX) {
    errors.features = `Use ${PLAN_FEATURES_MAX} features or fewer.`;
  }
  return errors;
}

/** Normalised values reported with a save intent. */
export type PlanSubmission = Readonly<{
  name: string;
  code: string;
  description: string | null;
  currencyCode: string;
  /** Major-unit decimal strings, exactly as entered (commas removed). */
  prices: readonly Readonly<{
    billingInterval: PlanInterval;
    amount: string;
  }>[];
  features: readonly string[];
  isActive: boolean;
}>;

export type PlanIntent =
  | Readonly<{ type: "create"; plan: PlanSubmission }>
  | Readonly<{ type: "update"; planId: string; plan: PlanSubmission }>;

export type PlanSubmitDecision =
  | Readonly<{ kind: "blocked" }>
  | Readonly<{ kind: "invalid"; errors: PlanDraftErrors }>
  | Readonly<{ kind: "submit"; intent: PlanIntent }>;

export function decidePlanSubmit(
  draft: PlanDraft,
  context: Readonly<{
    mode: PlanEditorMode;
    planId?: string;
    originalCode?: string;
    pending: boolean;
  }>,
): PlanSubmitDecision {
  if (context.pending) return { kind: "blocked" };
  const errors = validatePlanDraft(draft, context);
  if (Object.keys(errors).length > 0) return { errors, kind: "invalid" };
  const plan: PlanSubmission = {
    code: draft.code.trim(),
    currencyCode: draft.currencyCode,
    description: draft.description.trim() || null,
    features: draft.features.map((feature) => feature.trim()),
    isActive: draft.isActive,
    name: draft.name.trim(),
    prices: PLAN_INTERVALS.flatMap((billingInterval) => {
      const amount = draft.prices[billingInterval].trim().replaceAll(",", "");
      return amount ? [{ amount, billingInterval }] : [];
    }),
  };
  if (context.mode === "edit") {
    if (!context.planId) return { kind: "blocked" };
    return {
      intent: { plan, planId: context.planId, type: "update" },
      kind: "submit",
    };
  }
  return { intent: { plan, type: "create" }, kind: "submit" };
}
