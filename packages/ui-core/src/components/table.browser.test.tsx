import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "./button";
import { Pager, describePageRange } from "./pagination";
import { ErrorState } from "./states";
import { DataTable, type TableColumn } from "./table";

type Payment = Readonly<{ amount: string; id: string; status: string }>;

const rows: readonly Payment[] = [
  { amount: "₦15,000.00", id: "PAY-001", status: "Paid" },
  { amount: "₦7,500.00", id: "PAY-002", status: "Failed" },
];

const columns: readonly TableColumn<Payment>[] = [
  { cell: (row) => row.id, header: "Reference" },
  { cell: (row) => row.status, header: "Status" },
  { align: "right", cell: (row) => row.amount, header: "Amount" },
  {
    cell: (row) => <Button size="sm">View {row.id}</Button>,
    header: "Actions",
    mobileLabel: "",
  },
];

describe("DataTable", () => {
  it("renders headers, rows and column alignment", async () => {
    const screen = await render(
      <DataTable
        caption="Payments"
        columns={columns}
        keyField={(row) => row.id}
        rows={rows}
      />,
    );
    const table = screen.getByRole("table", { name: "Payments" });

    await expect.element(table).toBeVisible();
    expect(screen.getByRole("columnheader").all()).toHaveLength(4);
    expect(screen.getByRole("row").all()).toHaveLength(3);
    const amountHeader = screen.getByRole("columnheader", { name: "Amount" });
    expect(getComputedStyle(amountHeader.element()).textAlign).toBe("right");
    const amountCell = screen.getByRole("cell", { name: "₦15,000.00" });
    expect(getComputedStyle(amountCell.element()).textAlign).toBe("right");
  });

  it("shows the empty state", async () => {
    const screen = await render(
      <DataTable
        columns={columns}
        emptyMessage="No payments yet."
        keyField={(row) => row.id}
        rows={[]}
      />,
    );
    await expect.element(screen.getByText("No payments yet.")).toBeVisible();
  });

  it("announces loading and hides placeholder rows from assistive technology", async () => {
    const screen = await render(
      <DataTable
        columns={columns}
        keyField={(row) => row.id}
        loading
        loadingLabel="Loading payments"
        rows={[]}
      />,
    );

    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Loading payments");
    await expect
      .element(screen.getByRole("table"))
      .toHaveAttribute("aria-busy", "true");
    // Only the header row is exposed while loading.
    expect(screen.getByRole("row").all()).toHaveLength(1);
  });

  it("shows error content instead of rows", async () => {
    const onRetry = vi.fn();
    const screen = await render(
      <DataTable
        columns={columns}
        error={<ErrorState onRetry={onRetry} title="Payments unavailable" />}
        keyField={(row) => row.id}
        rows={rows}
      />,
    );

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Payments unavailable");
    expect(screen.container.textContent).not.toContain("PAY-001");
    await screen.getByRole("button", { name: "Try again" }).click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  describe("on phones", () => {
    it("stacks rows with labels and keeps one set of controls", async () => {
      await page.viewport(390, 844);
      try {
        const screen = await render(
          <DataTable
            caption="Payments"
            columns={columns}
            keyField={(row) => row.id}
            mobileLayout="stack"
            rows={rows}
            variant="embedded"
          />,
        );
        const statusCell = screen.getByRole("cell", { name: "Paid" }).element();

        expect(getComputedStyle(statusCell).display).toBe("flex");
        // The column label is drawn before the value...
        expect(getComputedStyle(statusCell, "::before").content).toContain(
          "Status",
        );
        // ...but table semantics remain, so the header still names the cell.
        await expect
          .element(screen.getByRole("columnheader", { name: "Status" }))
          .toBeInTheDocument();
        // No horizontal scrolling and no duplicated actions.
        const table = screen.getByRole("table").element();
        expect(table.scrollWidth).toBeLessThanOrEqual(390);
        expect(
          screen.getByRole("button", { name: "View PAY-001" }).all(),
        ).toHaveLength(1);
        // Action cells have no label.
        const actionCell = screen
          .getByRole("button", { name: "View PAY-001" })
          .element()
          .closest("td") as HTMLElement;
        expect(getComputedStyle(actionCell, "::before").display).toBe("none");
      } finally {
        await page.viewport(1440, 900);
      }
    });

    it("scrolls horizontally by default", async () => {
      await page.viewport(390, 844);
      try {
        const screen = await render(
          <DataTable
            columns={[
              ...columns,
              { cell: () => "A long provider name", header: "Provider" },
              { cell: () => "2026-11-25 08:12 UTC", header: "Created" },
            ]}
            keyField={(row) => row.id}
            rows={rows}
          />,
        );
        const cell = screen.getByRole("cell", { name: "Paid" }).element();
        expect(getComputedStyle(cell).display).toBe("table-cell");
        const scroller = screen.getByRole("table").element()
          .parentElement as HTMLElement;
        expect(getComputedStyle(scroller).overflowX).toBe("auto");
      } finally {
        await page.viewport(1440, 900);
      }
    });
  });
});

describe("Pager", () => {
  it("describes the record range", () => {
    expect(
      describePageRange({
        page: 2,
        pageSize: 10,
        totalItems: 42,
        totalPages: 5,
      }),
    ).toBe("Showing 11–20 of 42");
    expect(describePageRange({ page: 2, totalPages: 5 })).toBe("Page 2 of 5");
    expect(
      describePageRange({
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
      }),
    ).toBe("No results");
  });

  it("disables the boundary controls", async () => {
    const onPageChange = vi.fn();
    const screen = await render(
      <Pager onPageChange={onPageChange} page={1} totalPages={3} />,
    );
    const previous = screen.getByRole("button", { name: "Previous" });

    await expect.element(previous).toBeDisabled();
    await screen.getByRole("button", { name: "Next" }).click();
    expect(onPageChange).toHaveBeenCalledWith(2);

    await screen.rerender(
      <Pager onPageChange={onPageChange} page={3} totalPages={3} />,
    );
    await expect
      .element(screen.getByRole("button", { name: "Next" }))
      .toBeDisabled();
  });

  it("uses links for URL-driven pages, never for disabled boundaries", async () => {
    const screen = await render(
      <Pager getHref={(page) => `?page=${page}`} page={1} totalPages={2} />,
    );
    await expect
      .element(screen.getByRole("link", { name: "Next" }))
      .toHaveAttribute("href", "?page=2");
    await expect
      .element(screen.getByRole("button", { name: "Previous" }))
      .toBeDisabled();
    await expect
      .element(screen.getByRole("navigation", { name: "Pagination" }))
      .toBeVisible();
  });

  it("disables navigation while a page loads", async () => {
    const screen = await render(
      <Pager loading onPageChange={() => undefined} page={2} totalPages={3} />,
    );
    await expect
      .element(screen.getByRole("button", { name: "Previous" }))
      .toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: "Next" }))
      .toBeDisabled();
  });
});
