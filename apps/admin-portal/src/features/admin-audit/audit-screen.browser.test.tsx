import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { AuditAction, AuditFilters } from "./audit-model";
import { auditPreview } from "./audit-preview.fixtures";
import { AuditScreen } from "./audit-screen";

const initialFilters: AuditFilters = {
  action: "",
  actor: "",
  query: "",
  range: "30d",
};

function Harness({
  onAction,
  onFiltersChange,
}: Readonly<{
  onAction: (action: AuditAction) => void;
  onFiltersChange: (filters: AuditFilters) => void;
}>) {
  const [filters, setFilters] = useState(initialFilters);
  function change(next: AuditFilters) {
    onFiltersChange(next);
    setFilters(next);
  }
  return (
    <AuditScreen
      actionOptions={{
        options: [{ label: "Role assigned", value: "role.assigned" }],
        state: "ready",
      }}
      actorOptions={{
        options: [{ label: "Ada Fixture", value: "fixture-admin-1" }],
        state: "ready",
      }}
      exportAction={{ state: "available" }}
      filters={filters}
      model={auditPreview}
      onAction={onAction}
      onFiltersChange={change}
    />
  );
}

describe("AuditScreen", () => {
  it("reports actor and action filter changes from source options", async () => {
    const onFiltersChange = vi.fn();
    const screen = await render(
      <Harness onAction={vi.fn()} onFiltersChange={onFiltersChange} />,
    );

    await screen.getByLabelText("Action").selectOptions("role.assigned");
    await screen.getByLabelText("Actor").selectOptions("fixture-admin-1");
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...initialFilters,
      action: "role.assigned",
      actor: "fixture-admin-1",
    });
    await screen.getByLabelText("Action").selectOptions("");
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...initialFilters,
      actor: "fixture-admin-1",
    });
  });

  it("reports export and only eligible detail intents", async () => {
    const onAction = vi.fn();
    const screen = await render(
      <Harness onAction={onAction} onFiltersChange={vi.fn()} />,
    );

    await screen.getByRole("button", { name: "Export CSV" }).click();
    expect(onAction).toHaveBeenCalledWith({ type: "exportCsv" });

    const details = screen.getByRole("button", { name: "Details" });
    await details.first().click();
    expect(onAction).toHaveBeenLastCalledWith({
      eventId: "fixture-audit-1",
      type: "viewDetails",
    });
    await expect.element(details.nth(1)).toBeDisabled();
    await expect
      .element(screen.getByText("Details were not retained for this event."))
      .toBeVisible();
  });
});
