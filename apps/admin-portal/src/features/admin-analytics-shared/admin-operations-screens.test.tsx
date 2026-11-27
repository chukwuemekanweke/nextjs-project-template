import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActiveUserAnalyticsScreen } from "../admin-active-user-analytics/active-user-analytics-screen";
import { activeUserAnalyticsPreview } from "../admin-active-user-analytics/active-user-analytics-preview.fixtures";
import { AuditScreen } from "../admin-audit/audit-screen";
import { auditPreview } from "../admin-audit/audit-preview.fixtures";
import { PaymentAnalyticsScreen } from "../admin-payment-analytics/payment-analytics-screen";
import { paymentAnalyticsPreview } from "../admin-payment-analytics/payment-analytics-preview.fixtures";
import { ProvidersScreen } from "../admin-providers/providers-screen";
import { providersPreview } from "../admin-providers/providers-preview.fixtures";
import { ReferenceDataScreen } from "../admin-reference-data/reference-data-screen";
import { referenceDataPreview } from "../admin-reference-data/reference-data-preview.fixtures";
import { RegistrationAnalyticsScreen } from "../admin-registration-analytics/registration-analytics-screen";
import { registrationAnalyticsPreview } from "../admin-registration-analytics/registration-analytics-preview.fixtures";
import { SubscriptionAnalyticsScreen } from "../admin-subscription-analytics/subscription-analytics-screen";
import { subscriptionAnalyticsPreview } from "../admin-subscription-analytics/subscription-analytics-preview.fixtures";
import { SystemHealthScreen } from "../admin-system-health/system-health-screen";
import { systemHealthPreview } from "../admin-system-health/system-health-preview.fixtures";

const render = (node: ReactNode) => renderToStaticMarkup(node);
const noop = () => undefined;

describe("FE-UI-015 screen compositions", () => {
  it("renders all four analytics families from typed ready data", () => {
    const registrations = render(
      <RegistrationAnalyticsScreen
        filters={{ granularity: "day", range: "30d" }}
        model={registrationAnalyticsPreview}
      />,
    );
    expect(registrations).toContain("Registrations");
    expect(registrations).toContain("Amara Fixture");
    expect(registrations).toContain("Never");

    const active = render(
      <ActiveUserAnalyticsScreen
        filters={{ range: "7d", selectedDate: "24 Nov 2026" }}
        model={activeUserAnalyticsPreview}
      />,
    );
    expect(active).toContain("DAU / MAU stickiness");
    expect(active).toContain("Last activity");
    expect(active).toContain("Last login");

    const payments = render(
      <PaymentAnalyticsScreen
        filters={{
          currency: "NGN",
          interval: "day",
          provider: "",
          range: "30d",
        }}
        model={paymentAnalyticsPreview}
      />,
    );
    expect(payments).toContain("Payment analytics");
    expect(payments).toContain("FixturePay");
    expect(payments).toContain("NGN");

    const subscriptions = render(
      <SubscriptionAnalyticsScreen
        filters={{ currency: "NGN", owner: "", plan: "", range: "30d" }}
        model={subscriptionAnalyticsPreview}
      />,
    );
    expect(subscriptions).toContain("Subscription analytics");
    expect(subscriptions).toContain("Monthly recurring revenue");
    expect(subscriptions).toContain("Renewals");
  });

  it("renders all four operational families and honest unknown states", () => {
    const providers = render(<ProvidersScreen model={providersPreview} />);
    expect(providers).toContain("FixturePay");
    expect(providers).toContain("Unknown");
    expect(providers).toContain("Management is unavailable");

    const reference = render(
      <ReferenceDataScreen category="countries" model={referenceDataPreview} />,
    );
    expect(reference).toContain("Reference data");
    expect(reference).toContain("Nigeria");
    expect(reference).toContain("Not reported");

    const audit = render(
      <AuditScreen
        filters={{ action: "", actor: "", query: "", range: "30d" }}
        model={auditPreview}
      />,
    );
    expect(audit).toContain("Audit history");
    expect(audit).toContain("Not recorded");
    expect(audit).toContain("Unknown");

    const health = render(<SystemHealthScreen model={systemHealthPreview} />);
    expect(health).toContain("Degraded");
    expect(health).toContain("Background jobs");
    expect(health).toContain("Unknown");
    expect(health).not.toContain("Background jobs</h3><span");
  });

  it("renders loading, unavailable, error, empty and forbidden states", () => {
    expect(render(<ProvidersScreen model={{ state: "loading" }} />)).toContain(
      "Loading providers",
    );
    expect(
      render(
        <ProvidersScreen
          model={{
            reason: "Provider reads are unavailable.",
            state: "unavailable",
          }}
        />,
      ),
    ).toContain("Provider reads are unavailable");
    expect(
      render(
        <AuditScreen
          filters={{ action: "", actor: "", query: "", range: "30d" }}
          model={{ message: "Audit read failed.", state: "error" }}
        />,
      ),
    ).toContain("Audit read failed");
    expect(
      render(
        <ReferenceDataScreen
          category="countries"
          model={{
            page: 1,
            pageSize: 20,
            rows: [],
            state: "ready",
            totalPages: 1,
          }}
        />,
      ),
    ).toContain("No countries");
    expect(
      render(<ProvidersScreen model={{ state: "forbidden" }} />),
    ).toContain("Error 403");
    expect(
      render(
        <SystemHealthScreen
          model={{
            overall: "unknown",
            services: {
              reason: "Health API unavailable.",
              state: "unavailable",
            },
          }}
        />,
      ),
    ).toContain("Health API unavailable");
  });

  it("enables typed intents only when handlers are supplied", () => {
    expect(
      render(<ProvidersScreen model={providersPreview} onAction={noop} />),
    ).not.toContain("Management is unavailable");
    expect(
      render(
        <AuditScreen
          filters={{ action: "", actor: "", query: "", range: "30d" }}
          model={auditPreview}
          onAction={noop}
          onFiltersChange={noop}
        />,
      ),
    ).not.toContain("Export is unavailable");
    expect(
      render(
        <SystemHealthScreen model={systemHealthPreview} onRefresh={noop} />,
      ),
    ).not.toContain("Live refresh is unavailable");
  });
});

describe("FE-UI-015 production boundaries", () => {
  it("keeps preview fixtures out of production modules and routes unpublished", () => {
    const src = fileURLToPath(new URL("../../", import.meta.url));
    const files = walk(src).filter(
      (path) =>
        /\.(ts|tsx)$/.test(path) && !/\.test\.|preview\.fixtures\./.test(path),
    );
    for (const file of files)
      expect(readFileSync(file, "utf8")).not.toMatch(
        /from\s+["'][^"']*preview\.fixtures["']/,
      );
    for (const route of [
      "analytics/registrations",
      "analytics/active-users",
      "analytics/payments",
      "analytics/subscriptions",
      "providers",
      "reference-data",
      "audit",
      "system-health",
    ]) {
      expect(statOrNull(join(src, "app", route, "page.tsx"))).toBeNull();
    }
  });
});

function walk(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
function statOrNull(path: string) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}
