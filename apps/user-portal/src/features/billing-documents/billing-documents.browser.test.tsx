import {
  DashboardShell,
  DashboardSidebar,
  DashboardSidebarNav,
  DashboardTopbar,
  MobileTabBar,
} from "@template/dashboard-ui";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cdp, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  invoicePreviews,
  receiptPreviews,
} from "./billing-documents-preview.fixtures";
import { InvoiceDetailScreen } from "./invoice-detail-screen";
import { ReceiptDetailScreen } from "./receipt-detail-screen";

/*
 * Isolated browser harness for every invoice and receipt state (FE-UI-016
 * renders the same `invoicePreviews` / `receiptPreviews`). Each screen is
 * composed inside the dashboard shell, as a page would be, and checked in
 * both themes on desktop and phone, and in print.
 */

const back = { href: "/billing/history", label: "Billing history" };
const nav = [{ items: [{ href: "/billing", label: "Billing" }] }];

function Page({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <DashboardShell
      sidebar={
        <DashboardSidebar brand={<span>Template</span>}>
          <DashboardSidebarNav
            activeHref="/billing"
            ariaLabel="Main"
            groups={nav}
          />
        </DashboardSidebar>
      }
      tabBar={
        <MobileTabBar
          activeHref="/billing"
          ariaLabel="Tabs"
          items={nav[0]!.items}
        />
      }
      topbar={<DashboardTopbar brand={<span>Template</span>} />}
    >
      {children}
    </DashboardShell>
  );
}

const screens: [string, ReactNode][] = [
  ...Object.entries(invoicePreviews).map(
    ([name, state]): [string, ReactNode] => [
      `invoice ${name}`,
      <InvoiceDetailScreen
        back={back}
        brandName="Template"
        key={name}
        state={state}
      />,
    ],
  ),
  ...Object.entries(receiptPreviews).map(
    ([name, state]): [string, ReactNode] => [
      `receipt ${name}`,
      <ReceiptDetailScreen
        back={back}
        brandName="Template"
        key={name}
        state={state}
      />,
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

describe("document sheet", () => {
  it("stays light paper in the dark theme", async () => {
    document.documentElement.classList.add("dark");
    await render(<Page>{screens[0]![1]}</Page>);
    const sheet = document.querySelector("[data-print-paper]")!;
    await expect
      .poll(() => getComputedStyle(sheet).backgroundColor)
      .toBe("rgb(255, 255, 255)");
  });

  it("prints through the browser", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    await render(<Page>{screens[0]![1]}</Page>);
    await page.getByRole("button", { name: "Print" }).click();
    expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  });
});

describe("composed page print", () => {
  it.each([
    ["long invoice", invoicePreviews.long!],
    ["paid invoice", invoicePreviews.paid!],
  ] as const)(
    "prints only the %s document, light, in the dark theme",
    async (_, state) => {
      document.documentElement.classList.add("dark");
      await render(
        <Page>
          <InvoiceDetailScreen back={back} brandName="Template" state={state} />
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
          Array.from(
            document.querySelectorAll("button, a, nav, aside, h1"),
          ).filter(visible),
        )
        .toEqual([]);
      const sheet = document.querySelector("[data-print-paper]")!;
      expect(visible(sheet)).toBe(true);
      expect(getComputedStyle(sheet).backgroundColor).toBe(
        "rgb(255, 255, 255)",
      );
      await expect
        .poll(() => getComputedStyle(document.body).backgroundColor)
        .toBe("rgba(0, 0, 0, 0)");
      expect(
        getComputedStyle(document.getElementById("main-content")!).paddingLeft,
      ).toBe("0px");
      expect(getComputedStyle(document.querySelector("thead")!).display).toBe(
        "table-header-group",
      );
      expect(
        getComputedStyle(document.querySelector("tbody tr")!).breakInside,
      ).toBe("avoid");
    },
  );
});
