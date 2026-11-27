import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AuditFilters } from "./audit-model";
import { auditPreview } from "./audit-preview.fixtures";
import { AuditScreen } from "./audit-screen";

const filters: AuditFilters = {
  action: "",
  actor: "",
  query: "",
  range: "30d",
};
const noop = () => undefined;
const available = { state: "available" } as const;

describe("AuditScreen", () => {
  it("renders events with honest missing values", () => {
    const markup = renderToStaticMarkup(
      <AuditScreen
        exportAction={available}
        filters={filters}
        model={auditPreview}
      />,
    );
    expect(markup).toContain("Audit history");
    expect(markup).toContain("Ada Fixture");
    expect(markup).toContain("Not reported");
    expect(markup).toContain("Unknown");
    expect(markup).toContain("Not available");
  });

  it("does not let a handler enable export or details the source refuses", () => {
    const markup = renderToStaticMarkup(
      <AuditScreen
        exportAction={{
          reason: "Export needs the audit API.",
          state: "unavailable",
        }}
        filters={filters}
        model={auditPreview}
        onAction={noop}
      />,
    );
    expect(markup).toContain("Export needs the audit API.");
    expect(markup).toContain("Details were not retained for this event.");
  });

  it("shows actor and action options from their reads", () => {
    const markup = renderToStaticMarkup(
      <AuditScreen
        actionOptions={{
          options: [{ label: "Role assigned", value: "role.assigned" }],
          state: "ready",
        }}
        actorOptions={{ state: "loading" }}
        exportAction={available}
        filters={{ ...filters, action: "role.assigned" }}
        model={auditPreview}
        onFiltersChange={noop}
      />,
    );
    expect(markup).toContain("Any action");
    expect(markup).toMatch(
      /<option value="role.assigned" selected="">Role assigned/,
    );
    expect(markup).toContain("Loading actors…");
  });

  it("renders error and forbidden states", () => {
    expect(
      renderToStaticMarkup(
        <AuditScreen
          exportAction={available}
          filters={filters}
          model={{ message: "Audit read failed.", state: "error" }}
        />,
      ),
    ).toContain("Audit read failed.");
    const forbidden = renderToStaticMarkup(
      <AuditScreen
        exportAction={available}
        filters={filters}
        model={{ permission: "audit.read", state: "forbidden" }}
      />,
    );
    expect(forbidden).toContain("audit.read");
  });
});
