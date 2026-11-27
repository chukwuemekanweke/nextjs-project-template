import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { canRequestProviderAction } from "./providers-model";
import { providersPreview } from "./providers-preview.fixtures";
import { ProvidersScreen } from "./providers-screen";

const filters = { query: "" };
const noop = () => undefined;

describe("ProvidersScreen", () => {
  it("renders providers with neutral unknown status", () => {
    const markup = renderToStaticMarkup(
      <ProvidersScreen filters={filters} model={providersPreview} />,
    );
    expect(markup).toContain("FixturePay");
    expect(markup).toContain("Unknown");
    expect(markup).toContain("This action is not available yet");
    expect(markup).toContain("Filtering is not available yet");
  });

  it("enables only operations each record reports as available", () => {
    const markup = renderToStaticMarkup(
      <ProvidersScreen
        filters={filters}
        model={providersPreview}
        onAction={noop}
        onFiltersChange={noop}
      />,
    );
    expect(markup).toContain("Only payment providers can be active.");
    expect(markup).not.toContain("This action is not available yet");
    expect(markup).toMatch(
      /<button[^>]*aria-label="Make active FixturePay"(?![^>]*disabled="")/,
    );
    expect(markup).toMatch(
      /<button[^>]*aria-label="Make active FixtureMail"[^>]*disabled=""/,
    );
    expect(markup).toMatch(
      /<button[^>]*aria-label="Test FixturePay"[^>]*disabled=""/,
    );
  });

  it("treats pending and unavailable operations as not requestable", () => {
    if (providersPreview.state !== "ready") {
      throw new Error("Preview must be ready.");
    }
    const [pay, mail] = providersPreview.rows;
    if (!pay || !mail) {
      throw new Error("Preview needs two providers.");
    }
    expect(canRequestProviderAction(pay, "configure")).toBe(true);
    expect(canRequestProviderAction(pay, "test")).toBe(false);
    expect(canRequestProviderAction(mail, "makeActive")).toBe(false);
  });

  it("renders loading, unavailable, empty and forbidden states", () => {
    expect(
      renderToStaticMarkup(
        <ProvidersScreen filters={filters} model={{ state: "loading" }} />,
      ),
    ).toContain("Loading providers");
    expect(
      renderToStaticMarkup(
        <ProvidersScreen
          filters={filters}
          model={{
            reason: "Provider reads are unavailable.",
            state: "unavailable",
          }}
        />,
      ),
    ).toContain("Provider reads are unavailable.");
    expect(
      renderToStaticMarkup(
        <ProvidersScreen
          filters={filters}
          model={{
            page: 1,
            pageSize: 20,
            rows: [],
            state: "ready",
            totalPages: 1,
          }}
        />,
      ),
    ).toContain("No providers");
    const forbidden = renderToStaticMarkup(
      <ProvidersScreen
        filters={filters}
        model={{ permission: "providers.read", state: "forbidden" }}
      />,
    );
    expect(forbidden).toContain("Error 403");
    expect(forbidden).toContain("providers.read");
  });
});
