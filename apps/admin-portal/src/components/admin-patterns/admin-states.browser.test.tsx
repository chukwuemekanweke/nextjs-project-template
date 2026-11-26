import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { AdminListState } from "./admin-read-state";
import { AdminListPager, AdminListTable } from "./admin-states";
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
