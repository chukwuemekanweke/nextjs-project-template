import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { AdminListState } from "./admin-read-state";
import { AdminListPager, AdminListTable } from "./admin-states";
import { AdminChartSection } from "./chart-section";
import { AdminRangeFilter } from "./filter-bar";
import type { AdminReportingRange } from "./utc-range";
import { AdminListCard } from "./list-detail";

type Row = Readonly<{ id: string }>;

function ListHarness({
  onPageChange,
  state,
}: Readonly<{
  onPageChange: (page: number) => void;
  state: Exclude<AdminListState<Row>, { state: "forbidden" }>;
}>) {
  return (
    <AdminListCard
      footer={
        <AdminListPager
          label="Records pages"
          onPageChange={onPageChange}
          state={state}
        />
      }
      title="Records"
    >
      <AdminListTable
        caption="Records"
        columns={[{ cell: (row: Row) => row.id, header: "Id" }]}
        emptyTitle="No records"
        keyField={(row) => row.id}
        loadingLabel="Loading records"
        onPageChange={onPageChange}
        state={state}
      />
    </AdminListCard>
  );
}

describe("admin list pagination", () => {
  it("offers a way back when a requested page is past the results", async () => {
    const onPageChange = vi.fn();
    const screen = await render(
      <ListHarness
        onPageChange={onPageChange}
        state={{
          page: 4,
          pageSize: 20,
          rows: [],
          state: "ready",
          totalItems: 40,
          totalPages: 2,
        }}
      />,
    );

    await expect
      .element(screen.getByText("No results on this page"))
      .toBeVisible();
    await screen.getByRole("button", { name: "Back to first page" }).click();
    expect(onPageChange).toHaveBeenLastCalledWith(1);

    await screen.getByRole("button", { name: "Previous" }).click();
    expect(onPageChange).toHaveBeenLastCalledWith(3);
  });

  it("pages forward from the footer pager", async () => {
    const onPageChange = vi.fn();
    const screen = await render(
      <ListHarness
        onPageChange={onPageChange}
        state={{
          page: 1,
          pageSize: 1,
          rows: [{ id: "record-1" }],
          state: "ready",
          totalItems: 2,
          totalPages: 2,
        }}
      />,
    );

    await expect
      .element(screen.getByRole("navigation", { name: "Records pages" }))
      .toHaveTextContent("Showing 1–1 of 2");
    await screen.getByRole("button", { name: "Next" }).click();
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

describe("admin chart period selection", () => {
  function ChartHarness({
    onSelect,
  }: Readonly<{ onSelect: (category: string | null) => void }>) {
    const [selected, setSelected] = useState<string | null>(null);
    function select(category: string | null) {
      onSelect(category);
      setSelected(category);
    }
    return (
      <AdminChartSection
        data={{
          categories: ["Mon", "Tue", "Wed"],
          series: [{ label: "Users", series: 1, values: [3, 5, 4] }],
          state: "ready",
          summary: "Users by day.",
        }}
        kind="bars"
        selection={{ label: "Period", onSelect: select, selected }}
        title="Users"
      />
    );
  }

  it("selects with the keyboard and clears on a second press", async () => {
    const onSelect = vi.fn();
    const screen = await render(<ChartHarness onSelect={onSelect} />);
    const tue = screen.getByRole("button", { name: "Tue" });

    await userEvent.click(screen.getByRole("button", { name: "Mon" }));
    await userEvent.tab();
    await expect.element(tue).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith("Tue");
    await expect.element(tue).toHaveAttribute("aria-pressed", "true");
    await expect
      .element(screen.getByText("Selected: Tue.", { exact: false }))
      .toBeVisible();

    await userEvent.keyboard(" ");
    expect(onSelect).toHaveBeenLastCalledWith(null);
    await expect.element(tue).toHaveAttribute("aria-pressed", "false");
  });
});

describe("admin reporting range", () => {
  it("reports presets and the custom choice separately", async () => {
    const onChange = vi.fn();
    const onSelectCustom = vi.fn();
    function Harness() {
      const [value, setValue] = useState<AdminReportingRange>("30d");
      return (
        <AdminRangeFilter
          onChange={(preset) => {
            onChange(preset);
            setValue(preset);
          }}
          onSelectCustom={() => {
            onSelectCustom();
            setValue("custom");
          }}
          value={value}
        />
      );
    }
    const screen = await render(<Harness />);
    const select = screen.getByLabelText("Reporting period");

    await select.selectOptions("7d");
    expect(onChange).toHaveBeenCalledWith("7d");
    await select.selectOptions("custom");
    expect(onSelectCustom).toHaveBeenCalledOnce();
    await expect.element(select).toHaveValue("custom");
  });
});
