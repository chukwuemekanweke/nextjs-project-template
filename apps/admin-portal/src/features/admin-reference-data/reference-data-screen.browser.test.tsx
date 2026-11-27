import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { ReferenceDataCategory } from "./reference-data-model";
import { referenceDataPreview } from "./reference-data-preview.fixtures";
import { ReferenceDataScreen } from "./reference-data-screen";

function Harness({
  onCategoryChange,
}: Readonly<{ onCategoryChange: (category: ReferenceDataCategory) => void }>) {
  const [category, setCategory] = useState<ReferenceDataCategory>("countries");
  const [query, setQuery] = useState("");
  function changeCategory(next: ReferenceDataCategory) {
    onCategoryChange(next);
    setCategory(next);
  }
  return (
    <ReferenceDataScreen
      category={category}
      filters={{ query }}
      model={referenceDataPreview}
      onCategoryChange={changeCategory}
      onFiltersChange={(filters) => setQuery(filters.query)}
    />
  );
}

describe("ReferenceDataScreen", () => {
  it("changes category and keeps search controlled", async () => {
    const onCategoryChange = vi.fn();
    const screen = await render(
      <Harness onCategoryChange={onCategoryChange} />,
    );

    await screen.getByRole("tab", { name: "Currencies" }).click();
    expect(onCategoryChange).toHaveBeenCalledWith("currencies");
    await expect
      .element(screen.getByRole("tab", { name: "Currencies" }))
      .toHaveAttribute("aria-selected", "true");
    await expect
      .element(screen.getByRole("columnheader", { name: "Dial code" }))
      .not.toBeInTheDocument();

    await screen.getByLabelText("Search reference data").fill("cedi");
    await expect
      .element(screen.getByLabelText("Search reference data"))
      .toHaveValue("cedi");
  });
});
