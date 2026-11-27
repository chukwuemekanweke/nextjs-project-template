import {
  DashboardShell,
  DashboardSidebar,
  DashboardSidebarNav,
  DashboardTopbar,
} from "@template/dashboard-ui";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cdp, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { InvoiceDetailScreen } from "./invoice-detail";
import { InvoicesScreen } from "./invoices-list";
import {
  fixtureInvoiceDetail,
  fixtureInvoiceSummary,
  invoiceDetailPreviews,
  invoiceListPreviews,
} from "./invoices-preview.fixtures";

/*
 * Isolated browser harness for every admin invoice state (FE-UI-016 renders
 * the same `invoiceListPreviews` / `invoiceDetailPreviews`), composed inside
 * the dashboard shell and checked on desktop and phone and in print.
 */

const nav = [{ items: [{ href: "/", label: "Dashboard" }] }];

function Page({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <DashboardShell
      sidebar={
        <DashboardSidebar brand={<span>Template</span>}>
          <DashboardSidebarNav activeHref="/" ariaLabel="Main" groups={nav} />
        </DashboardSidebar>
      }
      topbar={<DashboardTopbar brand={<span>Template</span>} />}
    >
      {children}
    </DashboardShell>
  );
}

const screens: [string, ReactNode][] = [
  ...Object.entries(invoiceListPreviews).map(
    ([name, state]): [string, ReactNode] => [
      `list ${name}`,
      <InvoicesScreen
        key={name}
        state={state}
        summary={fixtureInvoiceSummary}
      />,
    ],
  ),
  ...Object.entries(invoiceDetailPreviews).map(
    ([name, state]): [string, ReactNode] => [
      `detail ${name}`,
      <InvoiceDetailScreen brandName="Template" key={name} state={state} />,
    ],
  ),
];

type MediaSession = {
  send(
    method: "Emulation.setEmulatedMedia",
    params: { media: string },
  ): Promise<unknown>;
};
const emulateMedia = (media: "print" | "") =>
  (cdp() as unknown as MediaSession).send("Emulation.setEmulatedMedia", {
    media,
  });

afterEach(async () => {
  await emulateMedia("");
  await page.viewport(1440, 900);
  document.documentElement.classList.remove("dark");
});

describe.each([
  ["desktop light", 1440, false],
  ["phone dark", 390, true],
] as const)("%s", (_, width, dark) => {
  it.each(screens)(
    "renders %s without horizontal overflow",
    async (_, node) => {
      await page.viewport(width, 844);
      if (dark) document.documentElement.classList.add("dark");
      await render(<Page>{node}</Page>);
      expect(document.documentElement.scrollWidth).toBe(width);
    },
  );
});

it("prints only the invoice document, light, in the dark theme", async () => {
  document.documentElement.classList.add("dark");
  const lineItems = Array.from({ length: 40 }, (_, index) => ({
    amount: 100_000,
    description: `Fixture line item ${index + 1}`,
    detail: null,
    id: `line-${index + 1}`,
    quantity: 1,
    unitAmount: 100_000,
  }));
  await render(
    <Page>
      <InvoiceDetailScreen
        backHref="/invoices"
        brandName="Template"
        state={{ record: fixtureInvoiceDetail({ lineItems }), state: "ready" }}
      />
    </Page>,
  );
  await emulateMedia("print");

  // Rendered on paper: laid out and not clipped (the sr-only skip link is).
  const visible = (element: Element) =>
    element.getClientRects().length > 0 &&
    getComputedStyle(element).clipPath === "none";
  // Polled: the stylesheet can update after the first render.
  await expect
    .poll(() =>
      Array.from(document.querySelectorAll("button, a, nav, aside, h1")).filter(
        visible,
      ),
    )
    .toEqual([]);
  const sheet = document.querySelector("[data-print-paper]")!;
  expect(getComputedStyle(sheet).backgroundColor).toBe("rgb(255, 255, 255)");
  expect(getComputedStyle(document.querySelector("thead")!).display).toBe(
    "table-header-group",
  );
  expect(document.querySelectorAll("tbody tr")).toHaveLength(40);
});
