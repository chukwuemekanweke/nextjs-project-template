import { ApiError, type ApiErrorKind } from "@template/api-client";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { describeAdminActionFailure } from "./admin-action-failure";
import {
  formatAdminDate,
  formatAdminDateTime,
  parseAdminTimestamp,
} from "./admin-dates";
import {
  adminOptionsUnavailableText,
  isAdminOptionAvailable,
  type AdminListState,
} from "./admin-read-state";
import {
  AdminDetailFallback,
  AdminListPager,
  AdminListTable,
} from "./admin-states";
import { lookupAdminBadge, UNKNOWN_ADMIN_BADGE } from "./admin-status";
import { AdminDateTime, AdminNotAvailable } from "./admin-values";

function render(node: ReactNode) {
  return renderToStaticMarkup(node).replaceAll(" ", " ");
}

describe("admin dates", () => {
  it("formats zone-qualified timestamps in UTC", () => {
    expect(formatAdminDateTime("2026-11-25T10:32:00Z")).toBe(
      "25 Nov 2026, 10:32 UTC",
    );
    expect(formatAdminDateTime("2026-11-25T11:32:00+01:00")).toBe(
      "25 Nov 2026, 10:32 UTC",
    );
    expect(formatAdminDateTime("2026-11-25T23:30:00.123-02:00")).toBe(
      "26 Nov 2026, 01:30 UTC",
    );
  });

  it("rejects missing, invalid and zone-less timestamps", () => {
    for (const value of [
      undefined,
      null,
      "",
      "not a date",
      "2026-11-25T10:32:00",
      "2026-11-25 10:32:00Z",
      "2026-13-40T10:32:00Z",
    ]) {
      expect(parseAdminTimestamp(value), String(value)).toBeUndefined();
      expect(formatAdminDateTime(value), String(value)).toBeUndefined();
    }
  });

  it("shows calendar dates as written and timestamps as their UTC date", () => {
    expect(formatAdminDate("2026-12-14")).toBe("14 Dec 2026");
    expect(formatAdminDate("2026-12-14T23:30:00-05:00")).toBe("15 Dec 2026");
    expect(formatAdminDate("2026-02-30")).toBeUndefined();
    expect(formatAdminDate("2026-12-14T10:00:00")).toBeUndefined();
  });

  it("renders a missing value as a dash with an accessible name", () => {
    expect(render(<AdminNotAvailable />)).toBe(
      '<span aria-hidden="true">—</span><span class="sr-only">Not available</span>',
    );
    expect(render(<AdminDateTime value="2026-11-25T10:32:00" />)).toContain(
      "Not available",
    );
    expect(render(<AdminDateTime value="2026-11-25T10:32:00Z" />)).toBe(
      '<time dateTime="2026-11-25T10:32:00Z">25 Nov 2026, 10:32 UTC</time>',
    );
  });
});

describe("lookupAdminBadge", () => {
  const badges = { Active: { label: "Active", tone: "success" } } as const;

  it("returns the feature's badge for a known status", () => {
    expect(lookupAdminBadge(badges, "Active").label).toBe("Active");
  });

  it("never resolves inherited properties or empty statuses", () => {
    for (const status of [
      "constructor",
      "toString",
      "__proto__",
      "hasOwnProperty",
      "",
      null,
      undefined,
      "Other",
    ]) {
      expect(lookupAdminBadge(badges, status), String(status)).toBe(
        UNKNOWN_ADMIN_BADGE,
      );
    }
  });
});

describe("admin options", () => {
  it("validates selections against ready options only", () => {
    const ready = {
      options: [{ label: "Pro", value: "plan-1" }],
      state: "ready",
    } as const;
    expect(isAdminOptionAvailable(ready, "plan-1")).toBe(true);
    expect(isAdminOptionAvailable(ready, "plan-2")).toBe(false);
    expect(isAdminOptionAvailable({ state: "loading" }, "plan-1")).toBe(false);
    expect(adminOptionsUnavailableText(ready, "Plans")).toBeUndefined();
    expect(
      adminOptionsUnavailableText({ options: [], state: "ready" }, "Plans"),
    ).toBe("No plans to choose from.");
  });
});

describe("describeAdminActionFailure", () => {
  function apiError(kind: ApiErrorKind) {
    return new ApiError({ kind, safeMessage: "secret backend detail" });
  }

  it("maps normalized error kinds to safe categories", () => {
    const expected: [ApiErrorKind, string][] = [
      ["unauthorized", "authentication"],
      ["forbidden", "permission"],
      ["conflict", "conflict"],
      ["locked", "conflict"],
      ["not-found", "conflict"],
      ["validation", "invalid"],
      ["network", "temporary"],
      ["timeout", "temporary"],
      ["server", "temporary"],
      ["rate-limited", "temporary"],
      ["unexpected", "unexpected"],
    ];
    for (const [kind, category] of expected) {
      expect(describeAdminActionFailure(apiError(kind)).category, kind).toBe(
        category,
      );
    }
  });

  it("never exposes raw error text", () => {
    const failure = describeAdminActionFailure(new Error("stack trace"));
    expect(failure.category).toBe("unexpected");
    expect(failure.message).not.toContain("stack trace");
    expect(
      describeAdminActionFailure(apiError("conflict")).message,
    ).not.toContain("secret");
  });
});

describe("admin list states", () => {
  const columns = [{ cell: (row: { id: string }) => row.id, header: "Id" }];
  const table = (
    state: Exclude<AdminListState<{ id: string }>, { state: "forbidden" }>,
  ) =>
    render(
      <AdminListTable
        caption="Records"
        columns={columns}
        emptyTitle="No records"
        keyField={(row) => row.id}
        loadingLabel="Loading records"
        onPageChange={() => undefined}
        state={state}
      />,
    );

  it("keeps unavailable, error and empty distinct", () => {
    expect(table({ reason: "No API yet.", state: "unavailable" })).toContain(
      "No API yet.",
    );
    expect(table({ state: "error" })).toContain("Couldn&#x27;t load this list");
    const empty = table({
      page: 1,
      pageSize: 20,
      rows: [],
      state: "ready",
      totalPages: 0,
    });
    expect(empty).toContain("No records");
    expect(empty).not.toContain("Back to first page");
  });

  it("recovers from a page beyond the results", () => {
    const state = {
      page: 3,
      pageSize: 20,
      rows: [],
      state: "ready",
      totalItems: 40,
      totalPages: 2,
    } as const;
    expect(table(state)).toContain("Back to first page");
    const pager = render(
      <AdminListPager
        label="Records pages"
        onPageChange={() => undefined}
        state={state}
      />,
    );
    expect(pager).toContain("Previous");
    expect(pager).not.toMatch(/<button[^>]*disabled=""[^>]*>.*Previous/);
  });

  it("shows no pager for a first page without results or a non-ready list", () => {
    expect(
      render(
        <AdminListPager
          label="Records pages"
          state={{
            page: 1,
            pageSize: 20,
            rows: [],
            state: "ready",
            totalPages: 0,
          }}
        />,
      ),
    ).toBe("");
    expect(
      render(
        <AdminListPager label="Records pages" state={{ state: "loading" }} />,
      ),
    ).toBe("");
  });

  it("renders range text without a page handler", () => {
    expect(
      render(
        <AdminListPager
          label="Records pages"
          state={{
            page: 1,
            pageSize: 20,
            rows: [{ id: "a" }],
            state: "ready",
            totalItems: 1,
            totalPages: 1,
          }}
        />,
      ),
    ).toContain("Showing 1–1 of 1");
  });
});

describe("AdminDetailFallback", () => {
  it("renders nothing for ready and a labelled state otherwise", () => {
    expect(
      render(
        <AdminDetailFallback
          resourceLabel="Payment"
          state={{ record: {}, state: "ready" }}
        />,
      ),
    ).toBe("");
    expect(
      render(
        <AdminDetailFallback
          resourceLabel="Payment"
          state={{ state: "notFound" }}
        />,
      ),
    ).toContain("Payment not found");
    expect(
      render(
        <AdminDetailFallback
          resourceLabel="Payment"
          state={{ reason: "No API yet.", state: "unavailable" }}
        />,
      ),
    ).toContain("Payment is not available");
  });
});
