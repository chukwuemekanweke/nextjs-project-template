import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AllocateScreen, AllocationConfirmContent } from "./allocate-screen";
import {
  EMPTY_ALLOCATION_DRAFT,
  allocationSummary,
  changeOwnerType,
  changeTenant,
  decideAllocation,
  isIsoDate,
  overlapWarning,
  validateAllocation,
  type AllocationDraft,
} from "./allocation-model";
import { SubscriptionDetailScreen } from "./subscription-detail";
import { SubscriptionsScreen } from "./subscriptions-list";
import {
  DEFAULT_SUBSCRIPTION_FILTERS,
  SUBSCRIPTION_ACTIONS,
  availableSubscriptionActions,
  describeSubscriptionStatus,
  hasActiveSubscriptionFilters,
  parseSubscriptionFilters,
  subscriptionActionCopy,
  subscriptionFiltersToSearchParams,
} from "./subscriptions-model";
import {
  fixtureDurationOptions,
  fixturePlanOptions,
  fixtureSubscriptionDetail,
  fixtureSubscriptionList,
  fixtureSubscriptionRows,
  fixtureTenantOptions,
  fixtureUserResults,
} from "./subscriptions-preview.fixtures";

/*
 * Preview harness for ADM-SUBSCRIPTIONS, ADM-SUBSCRIPTION-DETAIL and
 * ADM-ALLOCATE (no routes, DR-070). Confirmation dialogs are portalled, so
 * their copy and content are asserted through the pure copy helpers and
 * `AllocationConfirmContent`; dialog semantics are covered by ui-core.
 */

const render = (node: ReactNode) => renderToStaticMarkup(node);
const noop = () => undefined;

describe("subscription filters", () => {
  it("parses known values and drops unknown ones", () => {
    expect(
      parseSubscriptionFilters(
        new URLSearchParams(
          "q=%20ada%20&status=Active&owner=Robot&renewal=off&plan=p1",
        ),
      ),
    ).toEqual({
      ownerType: "",
      plan: "p1",
      query: "ada",
      renewal: "off",
      status: "Active",
    });
  });

  it("round-trips and detects active filters", () => {
    const filters = {
      ...DEFAULT_SUBSCRIPTION_FILTERS,
      ownerType: "Tenant" as const,
      status: "PastDue",
    };
    const params = subscriptionFiltersToSearchParams(filters);
    expect(params.toString()).toBe("status=PastDue&owner=Tenant");
    expect(parseSubscriptionFilters(params)).toEqual(filters);
    expect(hasActiveSubscriptionFilters(DEFAULT_SUBSCRIPTION_FILTERS)).toBe(
      false,
    );
  });
});

describe("SubscriptionsScreen", () => {
  it("renders search, four filters, owner chips and the reference columns", () => {
    const markup = render(
      <SubscriptionsScreen
        filters={DEFAULT_SUBSCRIPTION_FILTERS}
        onFiltersChange={noop}
        planOptions={fixturePlanOptions}
        state={fixtureSubscriptionList()}
      />,
    );
    expect(markup).toMatch(/<h1[^>]*>Subscriptions<\/h1>/);
    for (const label of ["Search", "Status", "Plan", "Owner", "Renewal"]) {
      expect(markup).toContain(`>${label}</label>`);
    }
    for (const header of [
      "Owner",
      "Type",
      "Tenant",
      "Plan",
      "Status",
      "Period end",
      "Next billing",
      "Auto-renew",
    ]) {
      expect(markup).toContain(`>${header}</th>`);
    }
    expect(markup).toMatch(/>User<\/span>/);
    expect(markup).toMatch(/>Tenant<\/span>/);
    expect(markup).toContain(">Cancels at period end</span>");
    expect(markup).toContain(">Past due</span>");
    expect(markup).toContain(">Paused</span>");
    expect(markup).toContain("11 Feb 2026");
    expect(markup).not.toMatch(/<select[^>]*disabled=""/);
  });

  it("shows missing tenant and renewal as not available, not guessed", () => {
    const markup = render(
      <SubscriptionsScreen
        filters={DEFAULT_SUBSCRIPTION_FILTERS}
        state={fixtureSubscriptionList([fixtureSubscriptionRows[3]!])}
      />,
    );
    expect((markup.match(/>Not available</g) ?? []).length).toBe(3);
  });

  it("omits allocate and detail links while their routes do not exist", () => {
    const markup = render(
      <SubscriptionsScreen
        filters={DEFAULT_SUBSCRIPTION_FILTERS}
        state={fixtureSubscriptionList()}
      />,
    );
    expect(markup).not.toContain("<a ");
    expect(markup).not.toContain("Allocate subscription");
    expect(markup).toContain(
      "Filters apply once the admin billing API is available.",
    );
    const linked = render(
      <SubscriptionsScreen
        allocateHref="/subscriptions/allocate"
        detailHref={(row) => `/subscriptions/${row.id}`}
        filters={DEFAULT_SUBSCRIPTION_FILTERS}
        state={fixtureSubscriptionList()}
      />,
    );
    expect(linked).toContain('href="/subscriptions/allocate"');
    expect(linked).toContain('href="/subscriptions/sub-fixture-1"');
  });

  it("distinguishes empty, filtered-empty, unavailable and forbidden", () => {
    expect(
      render(
        <SubscriptionsScreen
          filters={DEFAULT_SUBSCRIPTION_FILTERS}
          state={fixtureSubscriptionList([])}
        />,
      ),
    ).toContain("No subscriptions yet");
    expect(
      render(
        <SubscriptionsScreen
          filters={{ ...DEFAULT_SUBSCRIPTION_FILTERS, query: "x" }}
          state={fixtureSubscriptionList([])}
        />,
      ),
    ).toContain("No subscriptions match these filters");
    const unavailable = render(
      <SubscriptionsScreen
        filters={DEFAULT_SUBSCRIPTION_FILTERS}
        state={{
          reason: "Needs the admin subscriptions API.",
          state: "unavailable",
        }}
      />,
    );
    expect(unavailable).toContain("Needs the admin subscriptions API.");
    expect(unavailable).not.toContain("No subscriptions yet");
    expect(
      render(
        <SubscriptionsScreen
          filters={DEFAULT_SUBSCRIPTION_FILTERS}
          state={{ state: "forbidden" }}
        />,
      ),
    ).toContain("Error 403");
  });
});

describe("subscription actions", () => {
  it("offers actions by reported state only", () => {
    const detail = fixtureSubscriptionDetail();
    expect(availableSubscriptionActions(detail)).toEqual([
      "cancelAtPeriodEnd",
      "cancelNow",
    ]);
    expect(
      availableSubscriptionActions({ ...detail, cancelAtPeriodEnd: true }),
    ).toEqual(["cancelNow"]);
    expect(
      availableSubscriptionActions({ ...detail, fulfillmentStatus: "Blocked" }),
    ).toContain("retryFulfillment");
    expect(
      availableSubscriptionActions({ ...detail, lifecycleStatus: "Cancelled" }),
    ).toEqual([]);
    expect(
      availableSubscriptionActions({ ...detail, lifecycleStatus: "Paused" }),
    ).toEqual([]);
  });

  it("uses distinct confirmations that never claim completion", () => {
    const detail = fixtureSubscriptionDetail();
    const copies = SUBSCRIPTION_ACTIONS.map((action) =>
      subscriptionActionCopy(action, detail),
    );
    expect(new Set(copies.map((copy) => copy.confirmLabel)).size).toBe(3);
    expect(new Set(copies.map((copy) => copy.title)).size).toBe(3);
    for (const copy of copies) {
      expect(
        `${copy.title} ${copy.description} ${copy.confirmLabel}`,
      ).not.toMatch(/\b(cancelled|retried|succeeded|completed|done)\b/i);
    }
    expect(subscriptionActionCopy("cancelNow", detail).tone).toBe("danger");
    expect(subscriptionActionCopy("retryFulfillment", detail).tone).toBe(
      "primary",
    );
  });

  it("maps lifecycle statuses and keeps unknown neutral", () => {
    expect(
      describeSubscriptionStatus({
        cancelAtPeriodEnd: false,
        lifecycleStatus: "Active",
      }),
    ).toEqual({ label: "Active", tone: "success" });
    expect(
      describeSubscriptionStatus({
        cancelAtPeriodEnd: false,
        lifecycleStatus: "Paused",
      }),
    ).toEqual({ label: "Paused", tone: "neutral" });
  });
});

describe("SubscriptionDetailScreen", () => {
  it("renders header, stat tiles, details, timeline and payments", () => {
    const markup = render(
      <SubscriptionDetailScreen
        onAction={noop}
        state={{ record: fixtureSubscriptionDetail(), state: "ready" }}
      />,
    );
    expect(markup).toMatch(/<h1[^>]*>Fixture Standard · Fixture User 1<\/h1>/);
    expect(markup).toContain("User billing account · Tenant: Fixture Tenant");
    for (const text of [
      "Recurring amount",
      "per month",
      "11 Jan 2026 – 11 Feb 2026",
      "Auto-renew on",
      "Lifetime paid",
      "3 payments",
      "Paid purchase · Fixture Provider",
      'aria-label="Subscription status history"',
      "FIX-SUB-0002",
      ">Failed</span>",
      ">Successful</span>",
    ]) {
      expect(markup).toContain(text);
    }
    expect(markup).toMatch(/NGN\s45,000\.00/);
    expect(markup).toMatch(/<button[^>]*data-intent="cancelAtPeriodEnd"/);
    expect(markup).toMatch(/<button[^>]*data-intent="cancelNow"/);
    expect(markup).not.toMatch(/data-intent="retryFulfillment"/);
    expect(markup).not.toMatch(
      /<button[^>]*data-intent="cancelNow"[^>]*disabled=""/,
    );
    expect(markup).not.toMatch(/invoice|refunded/i);
  });

  it("disables actions with a reason without a handler", () => {
    const markup = render(
      <SubscriptionDetailScreen
        state={{
          record: fixtureSubscriptionDetail({ fulfillmentStatus: "Blocked" }),
          state: "ready",
        }}
      />,
    );
    for (const action of SUBSCRIPTION_ACTIONS) {
      expect(markup).toMatch(
        new RegExp(`<button[^>]*data-intent="${action}"[^>]*disabled=""`),
      );
    }
    expect(markup).toContain("needs the admin billing API");
  });

  it("marks the busy action and blocks the others", () => {
    const markup = render(
      <SubscriptionDetailScreen
        busyAction="cancelNow"
        onAction={noop}
        state={{ record: fixtureSubscriptionDetail(), state: "ready" }}
      />,
    );
    expect(markup).toMatch(
      /<button[^>]*aria-busy="true"[^>]*data-intent="cancelNow"|data-intent="cancelNow"[^>]*aria-busy="true"/,
    );
    expect(markup).toMatch(
      /<button[^>]*data-intent="cancelAtPeriodEnd"[^>]*disabled=""/,
    );
  });

  it("shows missing figures as not available, never zero", () => {
    const markup = render(
      <SubscriptionDetailScreen
        state={{
          record: fixtureSubscriptionDetail({
            lifetimePaid: null,
            nextBillingAtUtc: null,
            payments: null,
            planPrice: null,
            statusHistory: null,
          }),
          state: "ready",
        }}
      />,
    );
    expect(markup).toContain("Not reported by the backend.");
    expect(markup).toContain("No next billing date reported.");
    expect(markup).toContain("Payment history is not available");
    expect(markup).toContain("Status history is not available");
    expect(markup).not.toMatch(/NGN\s0\.00/);
  });

  it("renders cancellation-scheduled and ended states without cancel actions", () => {
    const scheduled = render(
      <SubscriptionDetailScreen
        onAction={noop}
        state={{
          record: fixtureSubscriptionDetail({ cancelAtPeriodEnd: true }),
          state: "ready",
        }}
      />,
    );
    expect(scheduled).toContain(">Cancels at period end</span>");
    expect(scheduled).not.toMatch(/data-intent="cancelAtPeriodEnd"/);
    const ended = render(
      <SubscriptionDetailScreen
        onAction={noop}
        state={{
          record: fixtureSubscriptionDetail({ lifecycleStatus: "Cancelled" }),
          state: "ready",
        }}
      />,
    );
    expect(ended).not.toContain("data-intent=");
  });

  it("renders loading, not found, unavailable and forbidden states", () => {
    expect(
      render(<SubscriptionDetailScreen state={{ state: "loading" }} />),
    ).toContain("Loading subscription");
    expect(
      render(<SubscriptionDetailScreen state={{ state: "notFound" }} />),
    ).toContain("Subscription not found");
    expect(
      render(
        <SubscriptionDetailScreen
          state={{
            reason: "Needs the admin subscriptions API.",
            state: "unavailable",
          }}
        />,
      ),
    ).toContain("Needs the admin subscriptions API.");
    expect(
      render(<SubscriptionDetailScreen state={{ state: "forbidden" }} />),
    ).toContain("Error 403");
  });
});

describe("allocation validation", () => {
  const valid: AllocationDraft = {
    ...EMPTY_ALLOCATION_DRAFT,
    durationId: "P3M",
    planId: "plan-premium",
    reason: "  Partner onboarding  ",
    startDate: "2026-02-01",
    tenantId: "tenant-1",
    userId: "user-1",
  };

  it("requires a user for a user allocation but not for a tenant", () => {
    expect(validateAllocation({ ...valid, userId: "" }).userId).toBe(
      "Choose a user in this tenant.",
    );
    expect(
      validateAllocation({ ...valid, ownerType: "Tenant", userId: "" }),
    ).toEqual({});
    expect(validateAllocation({ ...valid, tenantId: "" }).tenantId).toBe(
      "Choose a tenant.",
    );
  });

  it("requires a reason and valid date, plan and duration", () => {
    expect(validateAllocation(EMPTY_ALLOCATION_DRAFT)).toEqual({
      durationId: "Choose a duration.",
      planId: "Choose a plan.",
      reason: "Enter a reason. It is recorded in audit history.",
      startDate: "Enter a start date.",
      tenantId: "Choose a tenant.",
      userId: "Choose a user in this tenant.",
    });
    expect(validateAllocation({ ...valid, reason: "   " }).reason).toMatch(
      /reason/,
    );
    expect(
      validateAllocation({ ...valid, startDate: "2026-02-30" }).startDate,
    ).toBe("Enter a valid date.");
    expect(isIsoDate("2028-02-29")).toBe(true);
  });

  it("produces a trimmed intent and drops the user for tenants", () => {
    const decision = decideAllocation(valid, false);
    expect(decision.kind === "confirm" && decision.intent).toMatchObject({
      reason: "Partner onboarding",
      type: "allocate",
      userId: "user-1",
    });
    const tenant = decideAllocation({ ...valid, ownerType: "Tenant" }, false);
    expect(tenant.kind === "confirm" && tenant.intent.userId).toBeNull();
    expect(decideAllocation(valid, true)).toEqual({ kind: "blocked" });
  });

  it("clears the user when owner type or tenant changes", () => {
    expect(changeOwnerType(valid, "Tenant").userId).toBe("");
    expect(changeTenant(valid, "tenant-2").userId).toBe("");
    expect(changeTenant(valid, "tenant-1").userId).toBe("user-1");
  });

  it("summarises without computing a period end or charge", () => {
    const rows = allocationSummary(valid, {
      durations: [{ label: "3 months", value: "P3M" }],
      plans: [{ label: "Fixture Premium", value: "plan-premium" }],
      tenants: [{ label: "Fixture Tenant", value: "tenant-1" }],
      users: [{ label: "Fixture User 1", value: "user-1" }],
    });
    expect(
      Object.fromEntries(rows.map((row) => [row.label, row.value])),
    ).toEqual({
      "Auto-renew": "Off",
      Charge: "None · complimentary",
      Duration: "3 months",
      Owner: "Fixture User 1 (User)",
      "Period end": "Set by the backend",
      Plan: "Fixture Premium",
      Starts: "2026-02-01 (UTC)",
      Tenant: "Fixture Tenant",
    });
  });
});

describe("AllocateScreen", () => {
  const options = {
    durationOptions: fixtureDurationOptions,
    planOptions: fixturePlanOptions,
    tenantOptions: fixtureTenantOptions,
  };

  it("renders the user form with lookup, required reason and summary", () => {
    const markup = render(
      <AllocateScreen
        {...options}
        initialDraft={{ ...EMPTY_ALLOCATION_DRAFT, tenantId: "tenant-1" }}
        onAllocate={noop}
        onUserSearch={noop}
        userResults={fixtureUserResults}
      />,
    );
    expect(markup).toMatch(/<h1[^>]*>Allocate a subscription<\/h1>/);
    expect(markup).toContain('aria-label="Allocate to"');
    expect(markup).toContain("data-owner-lookup");
    expect(markup).toContain("Matching users");
    expect(markup).toContain("Fixture User 1 · user1@fixture.test");
    expect(markup).toMatch(/<textarea[^>]*aria-required="true"/);
    expect(markup).toContain("Recorded in audit history.");
    expect(markup).toContain('type="date"');
    expect(markup).toContain("Set by the backend");
    expect(markup).toContain("None · complimentary");
    expect(markup).not.toMatch(
      /<button[^>]*data-intent="allocate"[^>]*disabled=""/,
    );
  });

  it("hides the user lookup for a tenant allocation", () => {
    const markup = render(
      <AllocateScreen
        {...options}
        initialDraft={{ ...EMPTY_ALLOCATION_DRAFT, ownerType: "Tenant" }}
        onAllocate={noop}
      />,
    );
    expect(markup).not.toContain("data-owner-lookup");
  });

  it("disables lookups and review without sources or handlers", () => {
    const markup = render(<AllocateScreen />);
    expect(markup).toContain("Tenants are not available yet.");
    expect(markup).toContain("Plans are not available yet.");
    expect(markup).toContain("Durations are not available yet.");
    expect(markup).toContain("User lookup is not available yet.");
    expect(markup).toMatch(
      /<button[^>]*data-intent="allocate"[^>]*disabled=""/,
    );
    expect(markup).toContain("needs the admin billing API");
  });

  it("shows the overlap warning as a preview, not an eligibility decision", () => {
    const overlap = { planName: "Fixture Standard", statusLabel: "Active" };
    const markup = render(<AllocateScreen {...options} overlap={overlap} />);
    expect(markup).toContain("Existing subscription");
    expect(markup).toContain(overlapWarning(overlap));
    expect(overlapWarning(overlap)).toMatch(/backend decides/);
    expect(render(<AllocateScreen {...options} />)).not.toContain(
      "Existing subscription",
    );
  });

  it("confirms with the summary and never reports success", () => {
    const rows = allocationSummary(EMPTY_ALLOCATION_DRAFT, {
      durations: [],
      plans: [],
      tenants: [],
      users: [],
    });
    const markup = render(
      <AllocationConfirmContent
        overlap={{ planName: "Fixture Standard", statusLabel: "Active" }}
        rows={rows}
      />,
    );
    expect(markup).toContain("data-allocation-confirm");
    expect(markup).toContain("Not chosen");
    expect(markup).toContain('role="alert"');
    const screen = render(
      <AllocateScreen
        {...options}
        error="The allocation was rejected."
        onAllocate={noop}
      />,
    );
    expect(screen).toContain("The allocation was rejected.");
    expect(screen).not.toMatch(/allocated successfully|allocation created/i);
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

  it("never imports the preview fixtures from production modules", () => {
    for (const file of productionFiles(sourceRoot)) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /subscriptions-preview\.fixtures/,
      );
    }
  });

  it("adds no route, navigation entry or production import", () => {
    expect(() => statSync(join(sourceRoot, "app", "subscriptions"))).toThrow();
    expect(
      readFileSync(join(sourceRoot, "config", "navigation.ts"), "utf8"),
    ).not.toMatch(/"\/subscriptions/);
    for (const file of productionFiles(join(sourceRoot, "app"))) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /features\/admin-(subscriptions|billing-shared)/,
      );
    }
  });

  it("billing features call no API client, hooks or BFF", () => {
    const featureRoots = [
      "admin-payments",
      "admin-plans",
      "admin-subscriptions",
      "admin-billing-shared",
    ];
    for (const root of featureRoots) {
      for (const file of productionFiles(join(sourceRoot, "features", root))) {
        const source = readFileSync(file, "utf8");
        expect(source, file).not.toMatch(
          /@template\/api-react|fetch\(|\/api\/|server-api|NEXT_PUBLIC/,
        );
        expect(source, file).not.toMatch(
          /from "@template\/api-client"(?!\/subscriptions)/,
        );
      }
    }
  });
});
