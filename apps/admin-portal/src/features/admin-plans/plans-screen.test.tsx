import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  decidePlanSubmit,
  emptyPlanDraft,
  planDraftFromPlan,
  planPriceLines,
  validatePlanDraft,
  type PlanDraft,
} from "./plans-model";
import { PlanEditor, PlansScreen } from "./plans-screen";
import { fixturePlan, fixturePlanList } from "./plans-preview.fixtures";

/*
 * Preview harness for ADM-PLANS (no route, DR-070). The drawer is portalled,
 * so its content (`PlanEditor`) is rendered directly; drawer focus and
 * Escape behaviour are covered by ui-core browser tests.
 */

const render = (node: ReactNode) => renderToStaticMarkup(node);
const noop = () => undefined;
const currencies = {
  options: [{ label: "NGN", value: "NGN" }],
  state: "ready",
} as const;

function validDraft(overrides: Partial<PlanDraft> = {}): PlanDraft {
  return {
    ...emptyPlanDraft("NGN"),
    code: "FIXTURE_NEW",
    features: ["Feature"],
    name: "Fixture",
    prices: { Monthly: "15,000.00", Yearly: "" },
    ...overrides,
  };
}

describe("plan editor validation", () => {
  it("accepts a valid new plan and reports a create intent", () => {
    const decision = decidePlanSubmit(validDraft(), {
      mode: "create",
      pending: false,
    });
    expect(decision).toEqual({
      intent: {
        plan: {
          code: "FIXTURE_NEW",
          currencyCode: "NGN",
          description: null,
          features: ["Feature"],
          isActive: true,
          name: "Fixture",
          prices: [{ amount: "15000.00", billingInterval: "Monthly" }],
        },
        type: "create",
      },
      kind: "submit",
    });
  });

  it("requires name, code, currency and at least one price", () => {
    expect(validatePlanDraft(emptyPlanDraft(), { mode: "create" })).toEqual({
      code: "Enter a plan code.",
      currencyCode: "Choose a currency.",
      features: "Fill in or remove empty features.",
      name: "Enter a plan name.",
    });
    expect(
      validatePlanDraft(validDraft({ prices: { Monthly: "", Yearly: "" } }), {
        mode: "create",
      }).prices,
    ).toBe("Enter at least one price.");
  });

  it("rejects malformed codes, prices and too many decimals", () => {
    const errors = validatePlanDraft(
      validDraft({
        code: "bad code",
        prices: { Monthly: "10.123", Yearly: "0" },
      }),
      { mode: "create" },
    );
    expect(errors.code).toMatch(/capital letters/);
    expect(errors.priceMonthly).toBe(
      "Enter an amount with up to 2 decimal places.",
    );
    expect(errors.priceYearly).toBe("Enter an amount greater than zero.");
  });

  it("keeps the code immutable when editing", () => {
    const plan = fixturePlan(2);
    const draft = { ...planDraftFromPlan(plan), code: "CHANGED" };
    expect(
      validatePlanDraft(draft, { mode: "edit", originalCode: plan.code }).code,
    ).toBe("Codes can't change after creation.");
    const decision = decidePlanSubmit(planDraftFromPlan(plan), {
      mode: "edit",
      originalCode: plan.code,
      pending: false,
      planId: plan.id,
    });
    expect(decision.kind === "submit" && decision.intent.type).toBe("update");
  });

  it("converts stored minor units to exact decimals and blocks while pending", () => {
    expect(planDraftFromPlan(fixturePlan(3)).prices).toEqual({
      Monthly: "15000.00",
      Yearly: "150000.00",
    });
    expect(
      decidePlanSubmit(validDraft(), { mode: "create", pending: true }),
    ).toEqual({
      kind: "blocked",
    });
  });
});

describe("PlansScreen", () => {
  it("renders the reference columns, statuses and prices", () => {
    const markup = render(<PlansScreen state={fixturePlanList()} />);
    expect(markup).toMatch(/<h1[^>]*>Plans<\/h1>/);
    for (const header of [
      "Plan",
      "Price",
      "Currency",
      "Status",
      "Subscribers",
    ]) {
      expect(markup).toContain(`>${header}</th>`);
    }
    expect(markup).toContain("FIXTURE_1");
    expect(markup).toMatch(/NGN\s5,000\.00 \/ month/);
    expect(markup).toMatch(/NGN\s50,000\.00 \/ year/);
    expect(markup).toContain(">Inactive</span>");
    expect(markup).toContain(">Not available<");
    expect(markup).toContain(">0<");
    expect(markup).toContain(
      'Edit<span class="sr-only"> Fixture Plan 1</span>',
    );
    expect(markup).not.toContain('aria-label="Plans pages"');
  });

  it("renders unavailable, empty, loading, error and forbidden states", () => {
    const unavailable = render(
      <PlansScreen
        state={{ reason: "Needs the admin plans API.", state: "unavailable" }}
      />,
    );
    expect(unavailable).toContain("Needs the admin plans API.");
    expect(unavailable).not.toContain("No plans yet");
    expect(render(<PlansScreen state={fixturePlanList([])} />)).toContain(
      "No plans yet",
    );
    expect(render(<PlansScreen state={{ state: "loading" }} />)).toContain(
      "Loading plans",
    );
    expect(
      render(<PlansScreen onRetry={noop} state={{ state: "error" }} />),
    ).toContain('role="alert"');
    expect(render(<PlansScreen state={{ state: "forbidden" }} />)).toContain(
      "Error 403",
    );
  });

  it("does not render the reference price-change claim", () => {
    const markup = render(<PlansScreen state={fixturePlanList()} />);
    expect(markup).not.toContain("keep the price they were purchased at");
  });
});

describe("PlanEditor", () => {
  it("shows the plan's values with an immutable code", () => {
    const plan = fixturePlan(2);
    const markup = render(
      <PlanEditor
        onCancel={noop}
        onSubmit={noop}
        plan={plan}
        title="Edit Fixture Plan 2"
      />,
    );
    expect(markup).toContain('data-plan-editor="edit"');
    expect(markup).toMatch(/<h2[^>]*>Edit Fixture Plan 2<\/h2>/);
    expect(markup).toMatch(/<input[^>]*readOnly=""[^>]*value="FIXTURE_2"/);
    expect(markup).toContain("Codes can&#x27;t change after creation.");
    expect(markup).toContain('value="10000.00"');
    expect(markup).toContain('aria-label="Feature 1"');
    expect(markup).toContain('aria-label="Remove feature 2"');
    expect(markup).toMatch(/role="switch"[^>]*aria-checked="true"/);
    expect(markup).toContain('aria-label="Close plan editor"');
  });

  it("disables saving with a reason when no handler is supplied", () => {
    const markup = render(<PlanEditor onCancel={noop} title="New plan" />);
    expect(markup).toContain('data-plan-editor="create"');
    expect(markup).toMatch(/<button[^>]*data-intent="create"[^>]*disabled=""/);
    expect(markup).toContain("needs the admin billing API");
  });

  it("disables the currency choice when currencies have no source", () => {
    const markup = render(
      <PlanEditor onCancel={noop} onSubmit={noop} title="New plan" />,
    );
    expect(markup).toContain("Currencies are not available yet.");
    const ready = render(
      <PlanEditor
        currencyOptions={currencies}
        onCancel={noop}
        onSubmit={noop}
        title="New plan"
      />,
    );
    expect(ready).toMatch(/<option value="NGN" selected="">/);
  });

  it("shows a caller's save error and never a success state", () => {
    const markup = render(
      <PlanEditor
        error="The plan could not be saved."
        onCancel={noop}
        onSubmit={noop}
        pending
        plan={fixturePlan(1)}
        title="Edit"
      />,
    );
    expect(markup).toContain("The plan could not be saved.");
    expect(markup).toContain('aria-busy="true"');
    expect(markup).not.toMatch(/saved successfully|Plan saved/i);
  });

  it("formats price lines per interval", () => {
    expect(planPriceLines(fixturePlan(1, { prices: [] }))).toEqual([]);
  });
});

describe("production boundary", () => {
  const sourceRoot = fileURLToPath(new URL("../..", import.meta.url));

  function productionFiles(directory: string): string[] {
    return readdirSync(directory).flatMap((entry) => {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) return productionFiles(path);
      return /\.tsx?$/.test(entry) && !/\.(test|fixtures)\.tsx?$/.test(entry)
        ? [path]
        : [];
    });
  }

  it("never imports the preview fixtures or the public plan read", () => {
    for (const file of productionFiles(sourceRoot)) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/plans-preview\.fixtures/);
    }
    for (const file of productionFiles(
      join(sourceRoot, "features", "admin-plans"),
    )) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /listSubscriptionPlans\(|useSubscriptionPlans|@template\/api-react/,
      );
    }
  });

  it("adds no route, navigation entry or production import", () => {
    expect(() => statSync(join(sourceRoot, "app", "plans"))).toThrow();
    expect(
      readFileSync(join(sourceRoot, "config", "navigation.ts"), "utf8"),
    ).not.toMatch(/"\/plans/);
    for (const file of productionFiles(join(sourceRoot, "app"))) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /features\/admin-plans/,
      );
    }
  });
});
