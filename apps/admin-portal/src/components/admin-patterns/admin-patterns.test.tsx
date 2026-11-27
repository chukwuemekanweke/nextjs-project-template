import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Portalled dialogs do not server-render; this stand-in exposes the content
// and footer (focus trap/return and Escape are covered by ui-core tests).
vi.mock("@template/ui-core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@template/ui-core")>()),
  Dialog: ({
    children,
    description,
    dismissible = true,
    footer,
    open,
    title,
  }: {
    children?: ReactNode;
    description?: ReactNode;
    dismissible?: boolean;
    footer?: ReactNode;
    open: boolean;
    title: ReactNode;
  }) =>
    open
      ? createElement(
          "div",
          { "data-dismissible": String(dismissible), role: "dialog" },
          createElement("h2", null, title),
          createElement("p", null, description),
          children,
          footer,
        )
      : null,
}));

import { AdminChartSection } from "./chart-section";
import { AdminRangeFilter, AdminSearchFilter } from "./filter-bar";
import { AdminForbidden } from "./forbidden";
import { AdminKpiCard } from "./kpi-card";
import { AdminDetailHeader, AdminListCard } from "./list-detail";
import { AdminStepUpDialog } from "./step-up-dialog";
import { AdminSummaryCard } from "./summary-card";

describe("AdminKpiCard", () => {
  it("shows a ready value with delta and context", () => {
    const markup = renderToStaticMarkup(
      <AdminKpiCard
        label="Total users"
        metric={{
          context: "vs previous 30 days",
          delta: { label: "+4.2%", trend: "up" },
          state: "ready",
          value: "12,480",
        }}
      />,
    );
    expect(markup).toMatch(/<h2[^>]*>Total users<\/h2>/);
    expect(markup).toContain(">12,480<");
    expect(markup).toContain("+4.2%");
    expect(markup).toContain("vs previous 30 days");
  });

  it("explains an unavailable figure without a value", () => {
    const markup = renderToStaticMarkup(
      <AdminKpiCard
        label="MRR"
        metric={{ reason: "Needs an API.", state: "unavailable" }}
      />,
    );
    expect(markup).toContain("Not available");
    expect(markup).toContain("Needs an API.");
    expect(markup).not.toContain("text-stat");
  });
});

describe("AdminSummaryCard", () => {
  it("renders an action only with ready data", () => {
    const action = <a href="/kyc">Open KYC monitoring</a>;
    expect(
      renderToStaticMarkup(
        <AdminSummaryCard
          action={action}
          data={{ reason: "No API.", state: "unavailable" }}
          title="KYC queue"
        />,
      ),
    ).not.toContain("href");
    const ready = renderToStaticMarkup(
      <AdminSummaryCard
        action={action}
        data={{
          rows: [{ id: "p", label: "Pending", value: "0" }],
          state: "ready",
        }}
        title="KYC queue"
      />,
    );
    expect(ready).toContain('href="/kyc"');
    expect(ready).toMatch(/<dt[^>]*>Pending<\/dt>/);
  });
});

describe("AdminRangeFilter", () => {
  it("is an enabled, labelled select when a live source handles changes", () => {
    const markup = renderToStaticMarkup(
      <AdminRangeFilter
        onChange={() => undefined}
        range={{ end: "2026-11-25", start: "2026-10-27" }}
        value="30d"
      />,
    );
    expect(markup).toContain(">Reporting period</label>");
    expect(markup).not.toMatch(/<select[^>]*disabled=""/);
    expect(markup).toContain("27 Oct – 25 Nov 2026 (UTC)");
  });

  it("is disabled without a change handler", () => {
    const markup = renderToStaticMarkup(
      <AdminRangeFilter disabledReason="Not connected." value="7d" />,
    );
    expect(markup).toMatch(/<select[^>]*disabled=""/);
    expect(markup).toContain("Not connected.");
  });

  it("offers a custom range only when the page can own explicit dates", () => {
    const preset = renderToStaticMarkup(
      <AdminRangeFilter onChange={() => undefined} value="30d" />,
    );
    expect(preset).not.toContain("Custom range");
    const custom = renderToStaticMarkup(
      <AdminRangeFilter
        onChange={() => undefined}
        onSelectCustom={() => undefined}
        value="custom"
      />,
    );
    expect(custom).toMatch(/<option value="custom" selected="">Custom range/);
  });
});

describe("AdminSearchFilter", () => {
  it("links its reason when no handler is wired", () => {
    const markup = renderToStaticMarkup(
      <AdminSearchFilter placeholder="Name" value="" />,
    );
    const describedBy = /aria-describedby="([^"]+)"/.exec(markup)?.[1];
    expect(describedBy).toBeDefined();
    expect(markup).toContain(`id="${describedBy}"`);
    expect(markup).toContain("Filtering is not available yet");
    expect(markup).toMatch(/<input[^>]*disabled=""/);
  });
});

describe("AdminChartSection selection", () => {
  const data = {
    categories: ["Mon", "Tue"],
    series: [{ label: "Users", series: 1 as const, values: [3, 5] }],
    state: "ready" as const,
    summary: "Users rose from 3 to 5.",
  };

  it("marks the selected period on the buttons and the plot", () => {
    const markup = renderToStaticMarkup(
      <AdminChartSection
        data={data}
        kind="line"
        selection={{
          label: "Period",
          onSelect: () => undefined,
          selected: "Tue",
        }}
        title="Users"
      />,
    );
    expect(markup).toContain('aria-label="Period"');
    expect(markup).toMatch(/aria-pressed="true"[^>]*>(?:<[^>]*>)*Tue/);
    expect(markup).toMatch(/aria-pressed="false"[^>]*>(?:<[^>]*>)*Mon/);
    expect(markup).toContain("data-selected-band");
    expect(markup).toContain("Selected: Tue.");
  });

  it("explains inert selection and draws no band without a selection", () => {
    const markup = renderToStaticMarkup(
      <AdminChartSection
        data={data}
        kind="bars"
        selection={{
          disabledReason: "Needs the analytics API.",
          label: "Period",
          selected: null,
        }}
        title="Users"
      />,
    );
    expect(markup).toContain("Needs the analytics API.");
    expect(markup).not.toContain("data-selected-band");
    expect(markup).toMatch(/<button[^>]*disabled=""/);
  });
});

describe("AdminListCard and AdminDetailHeader", () => {
  it("compose a list section and a detail header", () => {
    const markup = renderToStaticMarkup(
      <>
        <AdminListCard
          footer={<span>Pager</span>}
          title="Users"
          toolbar={<span>Filters</span>}
        >
          <table />
        </AdminListCard>
        <AdminDetailHeader
          actions={<button type="button">Lock account</button>}
          back={{ href: "/users", label: "All users" }}
          meta="ID 42"
          title="Record title"
        />
      </>,
    );
    expect(markup).toMatch(/<h2[^>]*>Users<\/h2>/);
    expect(markup).toContain("Filters");
    expect(markup).toMatch(/<a[^>]*href="\/users"[^>]*>.*All users<\/a>/);
    expect(markup).toMatch(/<h1[^>]*>Record title<\/h1>/);
  });
});

describe("AdminForbidden", () => {
  it("renders the generic 403 without inventing a permission", () => {
    const markup = renderToStaticMarkup(<AdminForbidden />);
    expect(markup).toContain("Error 403");
    expect(markup).toMatch(
      /<h1[^>]*>You don(&#x27;|')t have access to this page<\/h1>/,
    );
    expect(markup).toMatch(/<a[^>]*href="\/"[^>]*>Back to dashboard<\/a>/);
    expect(markup).not.toContain("payments.analytics.read");
    expect(markup).not.toContain("Copy request details");
    expect(markup).toContain('role="status"');
  });

  it("shows a reported permission and offers safe request details", () => {
    const markup = renderToStaticMarkup(
      <AdminForbidden
        permission="payments.analytics.read"
        requestDetails={{
          path: "/analytics/payments?x=1",
          requestId: "corr-1",
        }}
        resourceLabel="Payment analytics"
      />,
    );
    expect(markup).toContain("Payment analytics needs the");
    expect(markup).toContain("payments.analytics.read");
    expect(markup).toContain("Copy request details");
  });

  it("hides unsafe permission text", () => {
    const markup = renderToStaticMarkup(
      <AdminForbidden permission="<img src=x>" />,
    );
    expect(markup).not.toContain("img");
  });
});

describe("AdminStepUpDialog (isolated harness, no user detail page)", () => {
  const baseProps = {
    action: {
      description: "Signs the user out everywhere.",
      title: "Lock this account",
    },
    confirmLabel: "Lock account",
    description: "Locking an account needs a fresh authenticator check.",
    onCancel: vi.fn(),
    onSubmit: vi.fn(),
    open: true,
  };

  it("renders action-specific copy, a labelled code field and actions", () => {
    const markup = renderToStaticMarkup(
      <AdminStepUpDialog
        {...baseProps}
        reason={{ label: "Reason (recorded in audit history)", required: true }}
      />,
    );
    expect(markup).toContain("Confirm it&#x27;s you");
    expect(markup).toContain("Locking an account needs a fresh");
    expect(markup).toContain("Lock this account");
    expect(markup).toContain("Reason (recorded in audit history)");
    expect(markup).toContain('aria-required="true"');
    expect(markup).toMatch(
      /<label[^>]*for="[^"]*-code-0"[^>]*>Authenticator code<\/label>/,
    );
    expect(markup.match(/aria-label="Character \d of 6"/g)).toHaveLength(6);
    expect(markup).toContain(">Cancel<");
    expect(markup).toMatch(/type="submit"[^>]*>.*Lock account/);
    expect(markup).toContain('data-dismissible="true"');
  });

  it("states no validity window unless the caller provides one", () => {
    expect(
      renderToStaticMarkup(<AdminStepUpDialog {...baseProps} />),
    ).not.toMatch(/minutes/);
    expect(
      renderToStaticMarkup(
        <AdminStepUpDialog
          {...baseProps}
          validityHint="Valid for 2 minutes."
        />,
      ),
    ).toContain("Valid for 2 minutes.");
  });

  it("omits the reason when the contract has none", () => {
    expect(
      renderToStaticMarkup(<AdminStepUpDialog {...baseProps} />),
    ).not.toContain("Reason");
  });

  it("locks the dialog while pending", () => {
    const markup = renderToStaticMarkup(
      <AdminStepUpDialog {...baseProps} pending />,
    );
    expect(markup).toContain('data-dismissible="false"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Cancel<\/button>/);
    expect(markup.match(/<input[^>]*disabled=""/g)).toHaveLength(6);
  });

  it("shows the caller's safe error", () => {
    const markup = renderToStaticMarkup(
      <AdminStepUpDialog
        {...baseProps}
        error="That code didn't work. Try again."
      />,
    );
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("That code didn&#x27;t work. Try again.");
  });

  it("renders nothing when closed and never calls the action itself", () => {
    expect(
      renderToStaticMarkup(<AdminStepUpDialog {...baseProps} open={false} />),
    ).toBe("");
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
    expect(baseProps.onCancel).not.toHaveBeenCalled();
  });
});
