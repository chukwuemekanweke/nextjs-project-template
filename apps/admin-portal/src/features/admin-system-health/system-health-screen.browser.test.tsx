import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { systemHealthPreview } from "./system-health-preview.fixtures";
import { SystemHealthScreen } from "./system-health-screen";

const ready = { data: systemHealthPreview, state: "ready" } as const;

describe("SystemHealthScreen", () => {
  it("reports refresh, then blocks it while pending", async () => {
    const onRefresh = vi.fn();
    const screen = await render(
      <SystemHealthScreen
        onRefresh={onRefresh}
        refreshAction={{ state: "available" }}
        state={ready}
      />,
    );

    await screen.getByRole("button", { name: "Refresh" }).click();
    expect(onRefresh).toHaveBeenCalledOnce();

    await screen.rerender(
      <SystemHealthScreen
        onRefresh={onRefresh}
        refreshAction={{ pending: true, state: "available" }}
        state={ready}
      />,
    );
    await expect
      .element(screen.getByRole("button", { name: "Refresh" }))
      .toBeDisabled();
    await expect.element(screen.getByText("Unknown").first()).toBeVisible();
  });

  it("offers retry for a failed health read", async () => {
    const onRetry = vi.fn();
    const screen = await render(
      <SystemHealthScreen
        onRetry={onRetry}
        refreshAction={{ state: "available" }}
        state={{ message: "Health read failed.", state: "error" }}
      />,
    );

    await screen.getByRole("button", { name: "Try again" }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
