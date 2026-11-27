import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { systemHealthPreview } from "./system-health-preview.fixtures";
import { SystemHealthScreen } from "./system-health-screen";

const available = { state: "available" } as const;

describe("SystemHealthScreen", () => {
  it("renders overall and per-service health with unknown kept neutral", () => {
    const markup = renderToStaticMarkup(
      <SystemHealthScreen
        refreshAction={available}
        state={{ data: systemHealthPreview, state: "ready" }}
      />,
    );
    expect(markup).toContain("Degraded");
    expect(markup).toContain("Background jobs");
    expect(markup).toContain("Unknown");
    expect(markup).toContain("Last checked: Not reported");
  });

  it("enables refresh only when it is available and handled", () => {
    const state = { data: systemHealthPreview, state: "ready" } as const;
    expect(
      renderToStaticMarkup(
        <SystemHealthScreen refreshAction={available} state={state} />,
      ),
    ).toContain("Live refresh is unavailable.");
    expect(
      renderToStaticMarkup(
        <SystemHealthScreen
          onRefresh={() => undefined}
          refreshAction={{
            reason: "Checks run every minute.",
            state: "unavailable",
          }}
          state={state}
        />,
      ),
    ).toContain("Checks run every minute.");
    expect(
      renderToStaticMarkup(
        <SystemHealthScreen
          onRefresh={() => undefined}
          refreshAction={available}
          state={state}
        />,
      ),
    ).not.toContain("Live refresh is unavailable.");
  });

  it("renders unavailable services and screen-level forbidden", () => {
    expect(
      renderToStaticMarkup(
        <SystemHealthScreen
          refreshAction={available}
          state={{
            data: {
              overall: "unknown",
              services: {
                reason: "Health API unavailable.",
                state: "unavailable",
              },
            },
            state: "ready",
          }}
        />,
      ),
    ).toContain("Health API unavailable.");
    const forbidden = renderToStaticMarkup(
      <SystemHealthScreen
        refreshAction={available}
        state={{ permission: "system.health.read", state: "forbidden" }}
      />,
    );
    expect(forbidden).toContain("Error 403");
    expect(forbidden).toContain("system.health.read");
  });
});
