import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Portalled dialogs do not server-render; this stand-in exposes their
// content (focus trap/return and Escape are covered by ui-core tests).
vi.mock("@template/ui-core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@template/ui-core")>()),
  Dialog: ({
    children,
    description,
    footer,
    open,
    title,
  }: {
    children?: ReactNode;
    description?: ReactNode;
    footer?: ReactNode;
    open: boolean;
    title: ReactNode;
  }) =>
    open
      ? createElement(
          "div",
          { role: "dialog" },
          createElement("h2", null, title),
          createElement("p", null, description),
          children,
          footer,
        )
      : null,
  ConfirmDialog: ({
    children,
    confirmLabel,
    description,
    open,
    title,
  }: {
    children?: ReactNode;
    confirmLabel: string;
    description?: ReactNode;
    open: boolean;
    title: ReactNode;
  }) =>
    open
      ? createElement(
          "div",
          { role: "alertdialog" },
          createElement("h2", null, title),
          createElement("p", null, description),
          children,
          createElement("button", { type: "button" }, "Cancel"),
          createElement("button", { type: "button" }, confirmLabel),
        )
      : null,
}));

import { AdminStepUpDialog } from "@/components/admin-patterns";
import { ConfirmDialog } from "@template/ui-core";
import { AdminUserDetailScreen } from "./user-detail";
import { UserActionConfirmation } from "./user-action-confirmation";
import { AdminUsersScreen } from "./users-list";
import {
  DEFAULT_ADMIN_USER_FILTERS,
  accountActionFor,
  accountStatusBadge,
  hasActiveUserFilters,
  isUserIntentStillAllowed,
  nextUserFilters,
  rolesAvailableToAssign,
  subscriptionStatusBadge,
  userActionConfirmation,
  type AdminUserIntent,
} from "./users-model";
import {
  fixturePlanOptions,
  fixtureRoleOptions,
  fixtureRoles,
  fixtureUserDetail,
  fixtureUserDetailRecord,
  fixtureUsers,
  previewUserQuery,
} from "./users-preview.fixtures";

/*
 * Isolated harness for ADM-USERS and ADM-USER-DETAIL (Trello FE-UI-013).
 * There is no admin user API, route or navigation item (DR-071, DR-072).
 */

const render = (node: ReactNode) => renderToStaticMarkup(node);
const ready = (record = fixtureUserDetailRecord()) =>
  ({ record, state: "ready" }) as const;
const userId = fixtureUserDetail.id;
const resolved = () => Promise.resolve();

describe("AdminUsersScreen", () => {
  const ready = previewUserQuery(DEFAULT_ADMIN_USER_FILTERS, 1, 5);

  it("renders the reference columns, badges and chips", () => {
    const markup = render(
      <AdminUsersScreen
        filters={DEFAULT_ADMIN_USER_FILTERS}
        model={ready}
        onFiltersChange={() => undefined}
        planOptions={fixturePlanOptions}
        roleOptions={fixtureRoleOptions}
      />,
    );
    expect(markup.match(/<h1/g)).toHaveLength(1);
    for (const header of [
      "User",
      "Status",
      "KYC",
      "Plan",
      "Role",
      "Last login",
    ]) {
      expect(markup).toContain(`>${header}</th>`);
      expect(markup).toContain(`data-label="${header}"`);
    }
    expect(markup).toContain("max-md:block");
    expect(markup).toContain(">Locked</span>");
    expect(markup).toContain(">Pending</span>");
    expect(markup).toContain(">Not started</span>");
    expect(markup).toContain(">Unknown</span>");
    expect(markup).toContain("Finance officer");
    expect(markup).toContain("No plan");
    expect(markup).toContain("Never");
    // Not reported is not "none": KYC/plan/last login of the unknown user.
    expect(markup).toContain("Not available");
    expect(markup).toContain("20 Jan 2026, 08:12 UTC");
  });

  it("shows the five filter menus, search and sort", () => {
    const markup = render(
      <AdminUsersScreen
        model={ready}
        onFiltersChange={() => undefined}
        planOptions={fixturePlanOptions}
        roleOptions={fixtureRoleOptions}
      />,
    );
    expect(markup).toContain('aria-label="User filters"');
    for (const label of ["Search", "Status", "KYC", "Role", "Plan", "Sort"]) {
      expect(markup).toMatch(new RegExp(`<label[^>]*>${label}</label>`));
    }
    expect(markup).toContain(">Compliance officer</option>");
    expect(markup).toContain(">Fixture Basic</option>");
    expect(markup).not.toMatch(/<select[^>]*disabled=""/);
  });

  it("makes filters inert and explained without a handler", () => {
    const markup = render(<AdminUsersScreen model={ready} />);
    expect(markup.match(/<select[^>]*disabled=""/g)).toHaveLength(5);
    expect(markup).toMatch(/<input[^>]*disabled=""/);
    expect(markup).toContain("Filtering is not available yet");
  });

  it("keeps role and plan menus inert without backend options", () => {
    const markup = render(
      <AdminUsersScreen model={ready} onFiltersChange={() => undefined} />,
    );
    expect(markup.match(/<select[^>]*disabled=""/g)).toHaveLength(2);
  });

  it("adds detail links only for an implemented route", () => {
    expect(render(<AdminUsersScreen model={ready} />)).not.toContain("<a ");
    const linked = render(
      <AdminUsersScreen getUserHref={(id) => `/users/${id}`} model={ready} />,
    );
    expect(linked).toContain('href="/users/usr-fixture-0001"');
    expect(linked).toContain('aria-label="View Avery Fixture"');
  });

  it("shows paging controls only with a page handler", () => {
    const paged = previewUserQuery(DEFAULT_ADMIN_USER_FILTERS, 2, 2);
    const withPager = render(
      <AdminUsersScreen model={paged} onPageChange={() => undefined} />,
    );
    expect(withPager).toContain('aria-label="Users pages"');
    expect(withPager).toContain("Showing 3–4 of 5");
    const withoutPager = render(<AdminUsersScreen model={paged} />);
    expect(withoutPager).toContain("Showing 3–4 of 5");
    expect(withoutPager).not.toContain(">Next<");
  });

  it("distinguishes no users from no matches", () => {
    const empty = { ...ready, rows: [], totalItems: 0, totalPages: 1 };
    expect(render(<AdminUsersScreen model={empty} />)).toContain(
      "No users yet",
    );
    const filtered = render(
      <AdminUsersScreen
        filters={{ ...DEFAULT_ADMIN_USER_FILTERS, status: "locked" }}
        model={empty}
        onFiltersChange={() => undefined}
      />,
    );
    expect(filtered).toContain("No users match these filters");
    expect(filtered).toContain("Clear filters");
  });

  it("renders loading, error and forbidden without sample rows", () => {
    const loading = render(<AdminUsersScreen model={{ state: "loading" }} />);
    expect(loading).toContain("Loading users");
    expect(loading).toContain('aria-busy="true"');
    expect(loading).not.toContain("Fixture");

    const error = render(
      <AdminUsersScreen
        model={{ state: "error" }}
        onReload={() => undefined}
      />,
    );
    expect(error).toContain('role="alert"');
    expect(error).toContain("Couldn&#x27;t load this list");
    expect(error).toContain("Try again");

    const forbidden = render(
      <AdminUsersScreen model={{ state: "forbidden" }} />,
    );
    expect(forbidden).toContain("Error 403");
    expect(forbidden).not.toContain("User filters");
  });
});

describe("user filter, sort and page interactions (synthetic fixtures)", () => {
  it("returns null for a no-op change and a new value otherwise", () => {
    expect(
      nextUserFilters(DEFAULT_ADMIN_USER_FILTERS, "status", "any"),
    ).toBeNull();
    expect(
      nextUserFilters(DEFAULT_ADMIN_USER_FILTERS, "kyc", "pending"),
    ).toEqual({ ...DEFAULT_ADMIN_USER_FILTERS, kyc: "pending" });
  });

  it("treats sort as ordering, not filtering", () => {
    expect(hasActiveUserFilters(DEFAULT_ADMIN_USER_FILTERS)).toBe(false);
    expect(
      hasActiveUserFilters({ ...DEFAULT_ADMIN_USER_FILTERS, sort: "name" }),
    ).toBe(false);
    expect(
      hasActiveUserFilters({ ...DEFAULT_ADMIN_USER_FILTERS, query: "  " }),
    ).toBe(false);
    expect(
      hasActiveUserFilters({ ...DEFAULT_ADMIN_USER_FILTERS, role: "r" }),
    ).toBe(true);
  });

  it("filters, sorts and pages the fixture rows", () => {
    const byRole = previewUserQuery(
      { ...DEFAULT_ADMIN_USER_FILTERS, role: fixtureRoles.finance.id },
      1,
      5,
    );
    expect(byRole.rows.map((user) => user.displayName)).toEqual([
      "Drew Fixture",
    ]);
    const byName = previewUserQuery(
      { ...DEFAULT_ADMIN_USER_FILTERS, sort: "name" },
      1,
      5,
    );
    expect(byName.rows[0]?.displayName).toBe("Avery Fixture");
    const page3 = previewUserQuery(DEFAULT_ADMIN_USER_FILTERS, 3, 2);
    expect(page3.totalPages).toBe(3);
    expect(page3.rows).toHaveLength(1);
  });

  it("recovers from a page past the results", () => {
    const beyond = previewUserQuery(DEFAULT_ADMIN_USER_FILTERS, 4, 2);
    expect(beyond.rows).toHaveLength(0);
    const markup = render(
      <AdminUsersScreen model={beyond} onPageChange={() => undefined} />,
    );
    expect(markup).toContain("No results on this page");
    expect(markup).toContain("Back to first page");
    expect(markup).toContain('aria-label="Users pages"');
  });
});

describe("AdminUserDetailScreen", () => {
  const model = ready();

  it("renders the identity header, account, roles, summaries and activity", () => {
    const markup = render(
      <AdminUserDetailScreen
        getKycHref={(id) => `/kyc/${id}`}
        listHref="/users"
        model={model}
        onAction={resolved}
        rolesHref="/roles"
      />,
    );
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toMatch(/<h1[^>]*>Blake Fixture<\/h1>/);
    expect(markup).toContain(">Email confirmed</span>");
    expect(markup).toContain("usr-fixture-0002");
    expect(markup).toContain("Tenant: Fixture tenant");
    for (const title of [
      "Account",
      "Administrative roles",
      "KYC",
      "Subscription",
      "Active sessions",
      "Security activity",
    ]) {
      expect(markup).toMatch(new RegExp(`<h2[^>]*>${title}</h2>`));
    }
    expect(markup).toContain("Password · Google · 1 passkey");
    expect(markup).toContain('aria-label="Remove Support agent"');
    expect(markup).toContain("Role to assign");
    // Held roles are not offered again.
    expect(markup).not.toContain('<option value="role-fixture-support"');
    expect(markup).toContain("Attempt #3 · started 18 Jan 2026, 10:32 UTC");
    expect(markup).toContain('href="/kyc/vrf-fixture-0003"');
    expect(markup).toContain("Fixture Basic · monthly");
    expect(markup).toContain("auto-renew on");
    expect(markup).toContain("Fixture City · active now");
    expect(markup).toContain('aria-label="Revoke Safari on iPhone"');
    expect(markup).toContain("Failed sign-in");
    expect(markup).toContain('href="/users"');
    expect(markup).toContain('href="/roles"');
    expect(markup).not.toContain('role="dialog"');
  });

  it("offers unlock for a locked account and no account action when unknown", () => {
    const locked = render(
      <AdminUserDetailScreen
        model={ready(fixtureUserDetailRecord({ accountStatus: "locked" }))}
        onAction={resolved}
      />,
    );
    expect(locked).toContain('data-intent="unlock"');
    expect(locked).not.toContain("Lock account");
    const unknown = render(
      <AdminUserDetailScreen
        model={ready(fixtureUserDetailRecord({ accountStatus: "unknown" }))}
        onAction={resolved}
      />,
    );
    expect(unknown).not.toContain("data-intent");
  });

  it("disables every action with an explanation without a handler", () => {
    const markup = render(<AdminUserDetailScreen model={model} />);
    const buttons = markup.match(/<button[^>]*>/g) ?? [];
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button).toContain('disabled=""');
    }
    expect(markup).toContain("This action is not available yet");
    expect(markup).not.toContain('aria-label="Remove Support agent"');
    expect(markup).not.toContain("<a ");
  });

  it("shows unavailable, empty and missing values honestly", () => {
    const markup = render(
      <AdminUserDetailScreen
        model={ready({
          ...fixtureUserDetailRecord({
            account: {},
            emailConfirmed: undefined,
            roles: [],
          }),
          activity: {
            reason: "Needs an admin activity API.",
            state: "unavailable",
          },
          assignableRoles: {
            reason: "Needs a role catalogue API.",
            state: "unavailable",
          },
          kyc: { data: null, state: "ready" },
          sessions: { data: [], state: "ready" },
          subscription: { state: "loading" },
        })}
      />,
    );
    expect(markup).toContain("No administrative roles.");
    expect(markup).toContain("Needs a role catalogue API.");
    expect(markup).toContain("Needs an admin activity API.");
    expect(markup).toContain("No verification yet.");
    expect(markup).toContain("No active sessions.");
    expect(markup).toContain("Loading subscription");
    expect(markup).not.toContain("Email confirmed");
    expect(markup).not.toContain(">Not enabled<");
  });

  it("renders loading, error, not found and forbidden states", () => {
    expect(
      render(<AdminUserDetailScreen model={{ state: "loading" }} />),
    ).toContain("Loading user");
    expect(
      render(<AdminUserDetailScreen model={{ state: "error" }} />),
    ).toContain("Couldn&#x27;t load user");
    expect(
      render(<AdminUserDetailScreen model={{ state: "notFound" }} />),
    ).toContain("User not found");
    const forbidden = render(
      <AdminUserDetailScreen
        model={{ permission: "users.read", state: "forbidden" }}
      />,
    );
    expect(forbidden).toContain("Error 403");
    expect(forbidden).toContain("users.read");
  });
});

describe("user action confirmations", () => {
  const intents: AdminUserIntent[] = [
    { type: "lock", userId },
    { type: "unlock", userId },
    { type: "signOutAll", userId },
    {
      roleId: fixtureRoles.finance.id,
      roleName: fixtureRoles.finance.name,
      type: "assignRole",
      userId,
    },
    {
      roleId: fixtureRoles.support.id,
      roleName: fixtureRoles.support.name,
      type: "removeRole",
      userId,
    },
  ];
  const revoke: AdminUserIntent = {
    sessionId: "ses-fixture-2",
    sessionLabel: "Safari on iPhone",
    type: "revokeSession",
    userId,
  };

  it("assumes step-up for account, all-session and role changes", () => {
    for (const intent of intents) {
      expect(userActionConfirmation(intent, fixtureUserDetail).kind).toBe(
        "stepUp",
      );
    }
    expect(userActionConfirmation(revoke, fixtureUserDetail).kind).toBe(
      "confirm",
    );
  });

  it("states only the intended effect, never timing or success", () => {
    for (const intent of [...intents, revoke]) {
      const copy = userActionConfirmation(intent, fixtureUserDetail);
      expect(copy.description).not.toMatch(/next request|successfully/i);
    }
  });

  it("renders the step-up dialog with the action summary and no success copy", () => {
    const markup = render(
      <UserActionConfirmation
        error={null}
        intent={{ type: "lock", userId }}
        onCancel={() => undefined}
        onSubmit={() => undefined}
        open
        pending={false}
        user={fixtureUserDetail}
      />,
    );
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain("Lock Blake Fixture");
    expect(markup).toContain("Authenticator code");
    expect(markup).not.toMatch(/locked successfully|has been locked/i);
  });

  it("wires cancel and submit for step-up without completing the action", () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    const element = UserActionConfirmation({
      error: null,
      intent: {
        roleId: fixtureRoles.finance.id,
        roleName: fixtureRoles.finance.name,
        type: "assignRole",
        userId,
      },
      onCancel,
      onSubmit,
      open: true,
      pending: false,
      user: fixtureUserDetail,
    }) as ReactElement<Parameters<typeof AdminStepUpDialog>[0]>;
    expect(element.type).toBe(AdminStepUpDialog);
    expect(element.props.reason).toBeUndefined();
    element.props.onCancel();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
    element.props.onSubmit({ code: "123456" });
    expect(onSubmit).toHaveBeenCalledWith({ code: "123456" });
  });

  it("uses ConfirmDialog for one session and shows a safe failure", () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    const props = {
      error: "Try again in a moment.",
      intent: revoke,
      onCancel,
      onSubmit,
      open: true,
      pending: false,
      user: fixtureUserDetail,
    };
    const element = UserActionConfirmation(props) as ReactElement<
      Parameters<typeof ConfirmDialog>[0]
    >;
    expect(element.type).toBe(ConfirmDialog);
    element.props.onCancel();
    expect(onCancel).toHaveBeenCalledTimes(1);
    element.props.onConfirm();
    expect(onSubmit).toHaveBeenCalledWith();
    const markup = render(<UserActionConfirmation {...props} />);
    expect(markup).toContain("Revoke this session?");
    expect(markup).toContain("Safari on iPhone");
    expect(markup).toContain("Try again in a moment.");
  });

  it("picks the account action and assignable roles", () => {
    expect(accountActionFor("active")).toBe("lock");
    expect(accountActionFor("locked")).toBe("unlock");
    expect(accountActionFor("unknown")).toBeNull();
    expect(
      rolesAvailableToAssign(Object.values(fixtureRoles), [
        fixtureRoles.support,
      ]),
    ).not.toContainEqual(fixtureRoles.support);
  });
});

describe("isUserIntentStillAllowed", () => {
  const record = fixtureUserDetailRecord();
  const assignFinance: AdminUserIntent = {
    roleId: fixtureRoles.finance.id,
    roleName: fixtureRoles.finance.name,
    type: "assignRole",
    userId,
  };

  it("allows an intent captured for the record on screen", () => {
    expect(isUserIntentStillAllowed({ type: "lock", userId }, record)).toBe(
      true,
    );
    expect(isUserIntentStillAllowed(assignFinance, record)).toBe(true);
    expect(
      isUserIntentStillAllowed(
        {
          sessionId: "ses-fixture-2",
          sessionLabel: "Safari on iPhone",
          type: "revokeSession",
          userId,
        },
        record,
      ),
    ).toBe(true);
  });

  it("rejects an intent for another user", () => {
    expect(
      isUserIntentStillAllowed(
        { type: "signOutAll", userId: "usr-fixture-0001" },
        record,
      ),
    ).toBe(false);
  });

  it("rejects an account action the status no longer permits", () => {
    const locked = fixtureUserDetailRecord({ accountStatus: "locked" });
    expect(isUserIntentStillAllowed({ type: "lock", userId }, locked)).toBe(
      false,
    );
    expect(isUserIntentStillAllowed({ type: "unlock", userId }, locked)).toBe(
      true,
    );
    const unknown = fixtureUserDetailRecord({ accountStatus: "unknown" });
    expect(isUserIntentStillAllowed({ type: "lock", userId }, unknown)).toBe(
      false,
    );
  });

  it("rejects removed sessions and unavailable or held roles", () => {
    expect(
      isUserIntentStillAllowed(
        {
          sessionId: "ses-gone",
          sessionLabel: "Gone",
          type: "revokeSession",
          userId,
        },
        record,
      ),
    ).toBe(false);
    expect(
      isUserIntentStillAllowed(assignFinance, {
        ...record,
        assignableRoles: { data: [fixtureRoles.support], state: "ready" },
      }),
    ).toBe(false);
    expect(
      isUserIntentStillAllowed(assignFinance, {
        ...record,
        assignableRoles: { state: "loading" },
      }),
    ).toBe(false);
    expect(
      isUserIntentStillAllowed(
        {
          roleId: fixtureRoles.finance.id,
          roleName: fixtureRoles.finance.name,
          type: "removeRole",
          userId,
        },
        record,
      ),
    ).toBe(false);
  });
});

describe("unknown statuses and invalid timestamps", () => {
  it("shows unrecognised or inherited-name statuses as Unknown", () => {
    for (const status of ["suspended", "", "constructor", "__proto__"]) {
      expect(accountStatusBadge(status)).toEqual({
        label: "Unknown",
        tone: "neutral",
      });
      expect(subscriptionStatusBadge(status).label).toBe("Unknown");
    }
  });

  it("renders zone-less or invalid timestamps as not available", () => {
    const markup = render(
      <AdminUserDetailScreen
        model={ready(
          fixtureUserDetailRecord({
            account: {
              createdAt: "2026-01-03T10:14:00",
              lastActiveAt: "not a date",
            },
          }),
        )}
      />,
    );
    expect(markup).not.toContain("3 Jan 2026");
    expect(markup.match(/Not available/g)?.length).toBeGreaterThan(2);
  });
});

describe("fixtures are synthetic", () => {
  it("never reuse reference sample people", () => {
    const text = JSON.stringify([fixtureUsers, fixtureUserDetailRecord()]);
    for (const sample of [
      "Okafor",
      "Bakare",
      "example.com",
      "Lagos",
      "12,480",
    ]) {
      expect(text).not.toContain(sample);
    }
  });
});

/* ------------------------------------------------------------------------ */
/* Production boundary (shared by the FE-UI-013 compositions)                */
/* ------------------------------------------------------------------------ */

describe("production boundary", () => {
  const sourceRoot = fileURLToPath(new URL("../..", import.meta.url));
  const ownDirectories = ["admin-users", "admin-roles", "admin-kyc"].map(
    (name) => join(sourceRoot, "features", name),
  );

  function productionFiles(directory: string): string[] {
    return readdirSync(directory).flatMap((entry) => {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) {
        return productionFiles(path);
      }
      return /\.tsx?$/.test(entry) &&
        !/\.test\.tsx?$/.test(entry) &&
        !entry.endsWith(".fixtures.ts")
        ? [path]
        : [];
    });
  }

  it("never imports preview fixtures from production modules", () => {
    const files = productionFiles(sourceRoot);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /from "[^"]*(users|roles|kyc)-preview\.fixtures"/,
      );
    }
  });

  it("is not imported by routes, components or configuration", () => {
    const outside = productionFiles(sourceRoot).filter(
      (file) => !ownDirectories.some((directory) => file.startsWith(directory)),
    );
    for (const file of outside) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /features\/admin-(users|roles|kyc)/,
      );
    }
  });

  it("adds no route, navigation entry or preview switch", () => {
    const appDirectory = join(sourceRoot, "app");
    for (const route of ["users", "roles", "kyc"]) {
      expect(() => statSync(join(appDirectory, route)), route).toThrow();
    }
    const navigation = readFileSync(
      join(sourceRoot, "config", "navigation.ts"),
      "utf8",
    );
    expect(navigation).not.toMatch(/href: "\/(users|roles|kyc)/);
    for (const directory of ownDirectories) {
      for (const file of productionFiles(directory)) {
        const source = readFileSync(file, "utf8");
        expect(source, file).not.toMatch(/process\.env|NEXT_PUBLIC/);
        expect(source, file).not.toMatch(/@template\/api-(client|react)/);
        expect(source, file).not.toMatch(/fetch\(/);
      }
    }
  });
});
