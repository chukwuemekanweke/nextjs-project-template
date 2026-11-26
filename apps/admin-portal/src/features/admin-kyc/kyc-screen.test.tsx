import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminKycDetailScreen, AdminKycScreen } from "./kyc-sections";
import {
  ADMIN_KYC_STATUSES,
  DEFAULT_ADMIN_KYC_FILTERS,
  hasActiveKycFilters,
  kycAttemptLabel,
  kycDecisionNotice,
  kycStatusBadge,
  parseAdminKycStatus,
} from "./kyc-model";
import {
  FIXTURE_PROVIDER,
  fixtureKycDetailModel,
  fixtureKycListModel,
  fixtureProviderOptions,
} from "./kyc-preview.fixtures";

/*
 * Isolated harness for ADM-KYC and ADM-KYC-DETAIL (Trello FE-UI-013). No KYC
 * API, route or navigation item exists (DR-054); decisions belong to the
 * provider, so there is no approve or reject.
 */

const render = renderToStaticMarkup;

describe("KYC status display", () => {
  it("labels every status in text and never treats unknown as success", () => {
    for (const status of ADMIN_KYC_STATUSES) {
      expect(kycStatusBadge(status).label).not.toBe("");
    }
    expect(kycStatusBadge("unknown")).toEqual({
      label: "Unknown",
      tone: "neutral",
    });
    expect(kycStatusBadge("verified").tone).toBe("success");
    expect(kycStatusBadge("failed").tone).toBe("danger");
    expect(parseAdminKycStatus("approved")).toBe("unknown");
    expect(parseAdminKycStatus(undefined)).toBe("unknown");
    expect(parseAdminKycStatus("pending")).toBe("pending");
  });

  it("builds attempt and decision copy only from supplied values", () => {
    expect(kycAttemptLabel({ attemptCount: 3, attemptNumber: 3 })).toBe(
      "Attempt #3 of 3",
    );
    expect(kycAttemptLabel({ attemptNumber: 2 })).toBe("Attempt #2");
    expect(kycAttemptLabel({})).toBeUndefined();
    expect(kycDecisionNotice(undefined)).toContain("the verification provider");
    expect(kycDecisionNotice(FIXTURE_PROVIDER)).toContain(FIXTURE_PROVIDER);
  });

  it("treats only search, status and provider as narrowing filters", () => {
    expect(hasActiveKycFilters(DEFAULT_ADMIN_KYC_FILTERS)).toBe(false);
    expect(
      hasActiveKycFilters({ ...DEFAULT_ADMIN_KYC_FILTERS, range: "7d" }),
    ).toBe(false);
    expect(
      hasActiveKycFilters({ ...DEFAULT_ADMIN_KYC_FILTERS, status: "failed" }),
    ).toBe(true);
  });
});

describe("AdminKycScreen", () => {
  const markup = render(
    <AdminKycScreen
      getVerificationHref={(id) => `/kyc/${id}`}
      model={fixtureKycListModel}
      onFiltersChange={() => undefined}
      onPageChange={() => undefined}
      providerOptions={fixtureProviderOptions}
    />,
  );

  it("renders stat tiles with missing distinct from zero", () => {
    expect(markup).toMatch(/data-kpi="Pending review" data-state="ready"/);
    expect(markup).toMatch(/data-kpi="Rejected or failed" data-state="ready"/);
    expect(markup).toMatch(/data-kpi="Verified" data-state="unavailable"/);
    expect(markup).toContain(">0</p>");
  });

  it("renders the table, statuses incl. unknown, and links", () => {
    for (const header of [
      "User",
      "Status",
      "Provider",
      "Provider ref.",
      "Started",
      "Submitted",
      "Completed",
    ]) {
      expect(markup).toContain(`>${header}</th>`);
    }
    for (const label of [
      "Pending",
      "In progress",
      "Verified",
      "Rejected",
      "Expired",
      "Failed",
      "Unknown",
    ]) {
      expect(markup).toContain(`>${label}</span>`);
    }
    expect(markup).toContain("ref_fixture_1");
    expect(markup).toContain("Not available");
    expect(markup).toContain('href="/kyc/vrf-fixture-0001"');
    expect(markup).toContain('aria-label="Verifications pagination"');
    expect(markup).toContain("Showing 1–7 of 7");
  });

  it("renders search, status, provider and UTC period filters", () => {
    expect(markup).toContain('aria-label="Verification filters"');
    for (const label of ["Search", "Status", "Provider", "Started"]) {
      expect(markup).toMatch(new RegExp(`<label[^>]*>${label}</label>`));
    }
    expect(markup).toContain("Last 30 days (UTC)");
    expect(markup).not.toMatch(/<select[^>]*disabled=""/);
  });

  it("makes filters inert without a handler", () => {
    const inert = render(<AdminKycScreen model={fixtureKycListModel} />);
    expect(inert.match(/<select[^>]*disabled=""/g)).toHaveLength(3);
    expect(inert).toContain("Filtering is not available yet");
    expect(inert).not.toContain("<a ");
    expect(inert).not.toContain(">Next<");
  });

  it("separates empty from filtered-empty, and shows loading/error/forbidden", () => {
    const empty = { ...fixtureKycListModel, items: [], totalItems: 0 };
    expect(render(<AdminKycScreen model={empty} />)).toContain(
      "No verifications yet",
    );
    expect(
      render(
        <AdminKycScreen
          filters={{ ...DEFAULT_ADMIN_KYC_FILTERS, query: "nobody" }}
          model={empty}
        />,
      ),
    ).toContain("No verifications match these filters");

    const loading = render(<AdminKycScreen model={{ state: "loading" }} />);
    expect(loading).toContain("Loading verifications");
    expect(loading).toMatch(/data-kpi="Pending review" data-state="loading"/);

    const error = render(<AdminKycScreen model={{ state: "error" }} />);
    expect(error).toContain("Couldn&#x27;t load verifications");
    expect(error).toMatch(/data-kpi="Pending review" data-state="error"/);

    expect(render(<AdminKycScreen model={{ state: "forbidden" }} />)).toContain(
      "Error 403",
    );
  });
});

describe("AdminKycDetailScreen", () => {
  it("renders read-only facts, the user, the timeline and attempts", () => {
    const markup = render(
      <AdminKycDetailScreen
        getUserHref={(id) => `/users/${id}`}
        listHref="/kyc"
        model={fixtureKycDetailModel()}
        onRefresh={() => undefined}
      />,
    );
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain("Verification · Blake Fixture");
    expect(markup).toContain("Attempt #3 of 3");
    expect(markup).toContain(`decided by ${FIXTURE_PROVIDER}`);
    expect(markup).toContain("Pending review");
    expect(markup).toContain("app_fixture_19");
    expect(markup).toContain("18 Jan 2026, 10:32 UTC");
    expect(markup).toContain('<ol aria-label="Status history"');
    expect(markup).toContain("Callback received · pending");
    expect(markup).toContain(" · signature valid");
    expect(markup.match(/<li/g)).toHaveLength(4);
    expect(markup).toContain(">#2<");
    expect(markup).toContain("15 Jan 2026");
    expect(markup).toContain('href="/users/usr-fixture-0002"');
    expect(markup).toContain('href="/kyc"');
    expect(markup).not.toMatch(/Approve|Reject verification|Override/);
    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(markup).toContain("Refresh status");
  });

  it("disables refresh with an explanation without a handler", () => {
    const markup = render(
      <AdminKycDetailScreen model={fixtureKycDetailModel()} />,
    );
    expect(markup).toMatch(
      /<button[^>]*aria-describedby="[^"]+"[^>]*disabled=""/,
    );
    expect(markup).toContain("This action is not available yet");
    expect(markup).not.toContain("<a ");
  });

  it("marks busy refresh without changing the status", () => {
    const markup = render(
      <AdminKycDetailScreen
        model={fixtureKycDetailModel()}
        onRefresh={() => undefined}
        refreshing
      />,
    );
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain(">Pending</span>");
  });

  it("warns for an unknown status and never shows it as verified", () => {
    const markup = render(
      <AdminKycDetailScreen model={fixtureKycDetailModel("unknown")} />,
    );
    expect(markup).toContain(">Unknown</span>");
    expect(markup).toContain("doesn&#x27;t recognise");
    expect(markup).not.toContain(">Verified</span>");
  });

  it("handles missing, empty and failed sections", () => {
    const base = fixtureKycDetailModel();
    const markup = render(
      <AdminKycDetailScreen
        model={{
          ...base,
          attempts: {
            reason: "Needs a KYC attempts API.",
            state: "unavailable",
          },
          history: { data: [], state: "ready" },
          verification: {
            id: "v",
            status: "inProgress",
            user: { displayName: "Fixture", email: "f@fixture.test", id: "u" },
          },
        }}
      />,
    );
    expect(markup).toContain("No status changes recorded.");
    expect(markup).toContain("Needs a KYC attempts API.");
    expect(markup).toContain("the verification provider");
    expect(markup).not.toContain("Attempt #");
    expect(
      render(
        <AdminKycDetailScreen
          model={{ ...base, history: { state: "error" } }}
          onReload={() => undefined}
        />,
      ),
    ).toContain("Couldn&#x27;t load status history");
  });

  it("renders loading, error, not found and forbidden states", () => {
    expect(
      render(<AdminKycDetailScreen model={{ state: "loading" }} />),
    ).toContain("Loading verification");
    expect(
      render(<AdminKycDetailScreen model={{ state: "error" }} />),
    ).toContain("Couldn&#x27;t load this verification");
    expect(
      render(<AdminKycDetailScreen model={{ state: "notFound" }} />),
    ).toContain("Verification not found");
    expect(
      render(<AdminKycDetailScreen model={{ state: "forbidden" }} />),
    ).toContain("Error 403");
  });
});
