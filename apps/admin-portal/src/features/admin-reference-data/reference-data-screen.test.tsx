import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { referenceDataPreview } from "./reference-data-preview.fixtures";
import { ReferenceDataScreen } from "./reference-data-screen";

const filters = { query: "" };

describe("ReferenceDataScreen", () => {
  it("renders read-only values with unreported status kept neutral", () => {
    const markup = renderToStaticMarkup(
      <ReferenceDataScreen
        category="countries"
        filters={filters}
        model={referenceDataPreview}
      />,
    );
    expect(markup).toContain("Reference data");
    expect(markup).toContain("Nigeria");
    expect(markup).toContain("Dial code");
    expect(markup).toContain("Not reported");
  });

  it("explains inert category tabs and search", () => {
    const markup = renderToStaticMarkup(
      <ReferenceDataScreen
        category="countries"
        filters={filters}
        model={referenceDataPreview}
      />,
    );
    expect(markup).toContain(
      "Switching categories needs an admin reference-data API.",
    );
    expect(markup).toMatch(/role="tab"[^>]*disabled=""[^>]*>Languages/);
    expect(markup).toContain("Filtering is not available yet");
  });

  it("enables categories and search when handlers are supplied", () => {
    const markup = renderToStaticMarkup(
      <ReferenceDataScreen
        category="languages"
        filters={{ query: "yo" }}
        model={referenceDataPreview}
        onCategoryChange={() => undefined}
        onFiltersChange={() => undefined}
      />,
    );
    expect(markup).not.toContain("Switching categories needs");
    expect(markup).not.toContain("Dial code");
    expect(markup).toContain('value="yo"');
  });

  it("renders empty, error and forbidden states", () => {
    expect(
      renderToStaticMarkup(
        <ReferenceDataScreen
          category="countries"
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
    ).toContain("No countries");
    expect(
      renderToStaticMarkup(
        <ReferenceDataScreen
          category="currencies"
          filters={filters}
          model={{ message: "Lookup failed.", state: "error" }}
          onRetry={() => undefined}
        />,
      ),
    ).toContain("Lookup failed.");
    expect(
      renderToStaticMarkup(
        <ReferenceDataScreen
          category="countries"
          filters={filters}
          model={{ state: "forbidden" }}
        />,
      ),
    ).toContain("Error 403");
  });
});
