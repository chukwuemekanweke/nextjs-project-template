import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { ProvidersModel } from "./providers-model";
import { providersPreview } from "./providers-preview.fixtures";
import { ProvidersScreen } from "./providers-screen";

const filters = { query: "" };

function withoutMakeActive(model: ProvidersModel): ProvidersModel {
  if (model.state !== "ready") {
    return model;
  }
  return {
    ...model,
    rows: model.rows.map((row) => ({
      ...row,
      actions: {
        ...row.actions,
        makeActive: { reason: "Already active.", state: "unavailable" },
      },
    })),
  };
}

describe("ProvidersScreen", () => {
  it("reports an unconfirmed operation directly", async () => {
    const onAction = vi.fn();
    const screen = await render(
      <ProvidersScreen
        filters={filters}
        model={providersPreview}
        onAction={onAction}
      />,
    );

    await screen.getByRole("button", { name: "Configure FixturePay" }).click();
    expect(onAction).toHaveBeenCalledWith({
      providerId: "fixture-provider-1",
      type: "configure",
    });
    await expect
      .element(screen.getByRole("button", { name: "Test FixturePay" }))
      .toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: "Make active FixtureMail" }))
      .toBeDisabled();
  });

  it("requires confirmation and does not report a cancelled operation", async () => {
    const onAction = vi.fn();
    const screen = await render(
      <ProvidersScreen
        filters={filters}
        model={providersPreview}
        onAction={onAction}
      />,
    );

    await screen
      .getByRole("button", { name: "Make active FixturePay" })
      .click();
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await screen.getByRole("button", { name: "Cancel" }).click();
    expect(onAction).not.toHaveBeenCalled();

    await screen
      .getByRole("button", { name: "Make active FixturePay" })
      .click();
    await screen
      .getByRole("dialog")
      .getByRole("button", { name: "Make active" })
      .click();
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith({
      providerId: "fixture-provider-1",
      type: "makeActive",
    });
  });

  it("drops a captured operation that is no longer eligible", async () => {
    const onAction = vi.fn();
    const screen = await render(
      <ProvidersScreen
        filters={filters}
        model={providersPreview}
        onAction={onAction}
      />,
    );

    await screen
      .getByRole("button", { name: "Make active FixturePay" })
      .click();
    await screen.rerender(
      <ProvidersScreen
        filters={filters}
        model={withoutMakeActive(providersPreview)}
        onAction={onAction}
      />,
    );
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    expect(onAction).not.toHaveBeenCalled();
  });
});
