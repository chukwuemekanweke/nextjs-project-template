import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminRoleEditScreen, AdminRolesScreen } from "./roles-sections";
import {
  groupGrantCount,
  isPermissionGranted,
  permissionCountLabel,
} from "./roles-model";
import {
  fixtureMatrix,
  fixturePermissionGroups,
  fixtureRoleEditModel,
  fixtureRolesModel,
} from "./roles-preview.fixtures";

/*
 * Isolated harness for ADM-ROLES and ADM-ROLE-EDIT (Trello FE-UI-013). No
 * permission model, role API, route or navigation item exists (DR-073); the
 * editor is a read-only visual composition (CAF-FE-008).
 */

describe("AdminRolesScreen", () => {
  const markup = renderToStaticMarkup(
    <AdminRolesScreen
      getRoleHref={(id) => `/roles/${id}`}
      model={fixtureRolesModel}
    />,
  );

  it("renders the roles table with kinds, counts and links", () => {
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain("Roles &amp; permissions");
    for (const header of ["Role", "Type", "Permissions", "Members"]) {
      expect(markup).toContain(`>${header}</th>`);
    }
    expect(markup).toContain(">System</span>");
    expect(markup).toContain(">Custom</span>");
    expect(markup).toContain("5 of 16");
    expect(markup).toContain('href="/roles/role-fixture-lead"');
    expect(markup).toContain('aria-label="View Support lead"');
  });

  it("keeps missing counts distinct from zero", () => {
    // Finance has no member count; Support agent has 0 members and no
    // permission count.
    expect(markup).toContain(">0</td>");
    expect(markup).toContain("Not available");
  });

  it("disables New role with an explanation", () => {
    expect(markup).toMatch(
      /<button[^>]*aria-describedby="admin-roles-new-hint"[^>]*disabled=""/,
    );
    expect(markup).toContain("needs a role-management API");
  });

  it("renders a read-only permission matrix with text states", () => {
    expect(markup).toContain('aria-label="Permission matrix"');
    expect(markup).toContain("(read-only)");
    for (const role of fixtureMatrix.roles) {
      expect(markup).toContain(`>${role.name}</th>`);
    }
    expect(markup).toContain('scope="colgroup"');
    expect(markup.match(/scope="row"/g)).toHaveLength(16);
    const cells = markup.match(/data-granted="(true|false)"/g) ?? [];
    expect(cells).toHaveLength(16 * 5);
    expect(markup.match(/>Granted</g)).toHaveLength(
      cells.filter((cell) => cell.includes("true")).length,
    );
    expect(markup).toContain(">Not granted<");
    expect(markup).not.toContain("<input");
  });

  it("does not link roles without a route", () => {
    const unlinked = renderToStaticMarkup(
      <AdminRolesScreen model={fixtureRolesModel} />,
    );
    expect(unlinked).not.toContain("<a ");
  });

  it("renders loading, error, unavailable matrix and forbidden states", () => {
    const loading = renderToStaticMarkup(
      <AdminRolesScreen model={{ state: "loading" }} />,
    );
    expect(loading).toContain("Loading roles");
    expect(loading).not.toContain("Permission matrix");

    expect(
      renderToStaticMarkup(<AdminRolesScreen model={{ state: "error" }} />),
    ).toContain("Couldn&#x27;t load roles");

    const unavailable = renderToStaticMarkup(
      <AdminRolesScreen
        model={{
          ...fixtureRolesModel,
          matrix: {
            reason: "Needs a permission model API.",
            state: "unavailable",
          },
        }}
      />,
    );
    expect(unavailable).toContain("Needs a permission model API.");
    expect(unavailable).not.toContain("data-granted");

    expect(
      renderToStaticMarkup(<AdminRolesScreen model={{ state: "forbidden" }} />),
    ).toContain("Error 403");
  });
});

describe("AdminRoleEditScreen (read-only preview editor)", () => {
  const markup = renderToStaticMarkup(
    <AdminRoleEditScreen listHref="/roles" model={fixtureRoleEditModel()} />,
  );

  it("renders details, grouped checklists, summary, members and danger zone", () => {
    expect(markup).toMatch(/<h1[^>]*>Support lead<\/h1>/);
    expect(markup).toContain("Custom role");
    expect(markup).toContain(
      "5 permissions · 2 members · last changed 20 Jan 2026, 09:00 UTC by Fixture Admin",
    );
    for (const title of [
      "Details",
      "Users",
      "KYC",
      "Summary",
      "Members",
      "Danger zone",
    ]) {
      expect(markup).toMatch(new RegExp(`<h2[^>]*>${title}</h2>`));
    }
    expect(markup).toContain("3 of 3");
    expect(markup).toContain("1 of 2");
    expect(markup).toContain("5 of 16");
    expect(markup).toContain("Blake Fixture");
    expect(markup).toContain('href="/roles"');
  });

  it("reflects grants in disabled checkboxes and never persists", () => {
    expect(markup.match(/<fieldset[^>]*disabled=""/g)).toHaveLength(5);
    expect(markup.match(/type="checkbox"/g)).toHaveLength(16);
    expect(markup.match(/checked=""/g)).toHaveLength(5);
    expect(markup).not.toContain("<form");
    const buttons = markup.match(/<button[^>]*>/g) ?? [];
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) expect(button).toContain('disabled=""');
    for (const input of markup.match(/<(input|textarea)[^>]*>/g) ?? []) {
      expect(input).toContain('disabled=""');
    }
    expect(markup).toContain("Role editing is not available");
  });

  it("explains system roles", () => {
    const system = renderToStaticMarkup(
      <AdminRoleEditScreen model={fixtureRoleEditModel("system")} />,
    );
    expect(system).toContain("System role");
    expect(system).toContain("System roles can&#x27;t be deleted.");
  });

  it("renders loading, error, not found, unavailable and forbidden states", () => {
    expect(
      renderToStaticMarkup(
        <AdminRoleEditScreen model={{ state: "loading" }} />,
      ),
    ).toContain("Loading role");
    expect(
      renderToStaticMarkup(<AdminRoleEditScreen model={{ state: "error" }} />),
    ).toContain("Couldn&#x27;t load this role");
    expect(
      renderToStaticMarkup(
        <AdminRoleEditScreen model={{ state: "notFound" }} />,
      ),
    ).toContain("Role not found");
    const unavailable = renderToStaticMarkup(
      <AdminRoleEditScreen
        model={{
          ...fixtureRoleEditModel(),
          groups: {
            reason: "Needs a permission catalogue API.",
            state: "unavailable",
          },
          members: { state: "error" },
        }}
      />,
    );
    expect(unavailable).toContain("Needs a permission catalogue API.");
    expect(unavailable).toContain("Couldn&#x27;t load members");
    expect(
      renderToStaticMarkup(
        <AdminRoleEditScreen model={{ state: "forbidden" }} />,
      ),
    ).toContain("Error 403");
  });
});

describe("roles model helpers", () => {
  it("labels counts without inventing zero", () => {
    expect(permissionCountLabel(5, 16)).toBe("5 of 16");
    expect(permissionCountLabel(5, undefined)).toBe("5");
    expect(permissionCountLabel(0, 16)).toBe("0 of 16");
    expect(permissionCountLabel(undefined, 16)).toBeUndefined();
  });

  it("reads grants and group counts from the source only", () => {
    expect(
      isPermissionGranted(fixtureMatrix, "role-fixture-support", "users.read"),
    ).toBe(true);
    expect(
      isPermissionGranted(
        fixtureMatrix,
        "role-fixture-support",
        "roles.manage",
      ),
    ).toBe(false);
    expect(
      isPermissionGranted(fixtureMatrix, "missing-role", "users.read"),
    ).toBe(false);
    const [users] = fixturePermissionGroups;
    expect(users && groupGrantCount(users, ["users.read"])).toEqual({
      granted: 1,
      total: 3,
    });
  });
});
