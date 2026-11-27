import { DarkModeSwitch, ThemeProvider } from "@template/ui-core";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { emulateMedia } from "../../test/print-media";
import type { DashboardNavGroup } from "../types";
import { Breadcrumbs } from "./breadcrumbs";
import { DashboardBrand } from "./dashboard-brand";
import { DashboardShell } from "./dashboard-shell";
import { DashboardTopbar } from "./dashboard-topbar";
import { MobileNavDrawer } from "./mobile-nav";
import { MobileTabBar } from "./mobile-tab-bar";
import { AccountSummary, ProfileMenu } from "./profile-menu";
import { DashboardSidebar, DashboardSidebarNav } from "./sidebar";

const groups: readonly DashboardNavGroup[] = [
  { items: [{ href: "/dashboard", label: "Overview" }] },
  {
    label: "Account",
    items: [
      { href: "/billing", label: "Billing" },
      { href: "/security", label: "Security" },
    ],
  },
];

const ACCOUNT_NAME = "Adaeze Oluwaseun-Nwachukwu Okonkwo-Bakare";
const ACCOUNT_EMAIL =
  "adaeze.oluwaseun.nwachukwu@an-unusually-long-domain.example";

const longGroups: readonly DashboardNavGroup[] = [
  ...groups,
  {
    label: "Platform",
    items: Array.from({ length: 16 }, (_, index) => ({
      href: `/module-${index + 1}`,
      label: `Module ${index + 1}`,
    })),
  },
];

function Shell({
  activeHref = "/billing",
  defaultExpanded,
  longNavigation = false,
  onSignOut = () => undefined,
  paper = false,
}: {
  activeHref?: string;
  defaultExpanded?: boolean;
  longNavigation?: boolean;
  onSignOut?: () => void;
  /** Adds paper-like content (`data-print-paper`), as a billing document does. */
  paper?: boolean;
}) {
  const brand = <DashboardBrand href="/dashboard" name="Template" />;
  const navigation = (
    <DashboardSidebarNav
      activeHref={activeHref}
      ariaLabel="Test navigation"
      groups={longNavigation ? longGroups : groups}
    />
  );
  const signOut = (
    <button onClick={onSignOut} type="button">
      Sign out
    </button>
  );

  return (
    <ThemeProvider>
      <DashboardShell
        defaultExpanded={defaultExpanded}
        mobileNav={
          <MobileNavDrawer
            brand={brand}
            footer={
              <>
                <DarkModeSwitch />
                {signOut}
              </>
            }
            header={
              <AccountSummary detail={ACCOUNT_EMAIL} name={ACCOUNT_NAME} />
            }
          >
            {navigation}
          </MobileNavDrawer>
        }
        sidebar={
          <DashboardSidebar
            brand={brand}
            brandMark={
              <DashboardBrand compact href="/dashboard" name="Template" />
            }
            footer={signOut}
          >
            {navigation}
          </DashboardSidebar>
        }
        tabBar={
          <MobileTabBar
            activeHref={activeHref}
            ariaLabel="Primary"
            items={groups.flatMap((group) => group.items)}
          />
        }
        topbar={
          <DashboardTopbar
            actions={
              <ProfileMenu
                actions={[
                  <a href="/profile" key="profile">
                    View profile
                  </a>,
                  <button key="sign-out" onClick={onSignOut} type="button">
                    Sign out
                  </button>,
                ]}
                name={ACCOUNT_NAME}
                role={ACCOUNT_EMAIL}
              />
            }
            brand={
              <DashboardBrand href="/dashboard" name="Template" size="sm" />
            }
            breadcrumbs={
              <Breadcrumbs
                items={[
                  { href: "/billing", label: "Billing" },
                  {
                    label:
                      "A deliberately long purchase reference label 2026-11",
                  },
                ]}
              />
            }
          />
        }
      >
        <h1>Page</h1>
        <button type="button">Page action</button>
        {paper ? <article data-print-paper="">Paper</article> : null}
      </DashboardShell>
    </ThemeProvider>
  );
}

// Links navigate the test page; keep it in place while still running the
// app's click handlers.
beforeAll(() => {
  document.addEventListener("click", (event) => {
    if ((event.target as Element).closest("a")) event.preventDefault();
  });
});

afterEach(async () => {
  await page.viewport(1440, 900);
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

const sidebar = () => document.getElementById("dashboard-sidebar")!;
const sidebarNav = () =>
  page.getByRole("navigation", { name: "Test navigation" });
// Elements hidden with display:none at a breakpoint are excluded from role
// queries by default; include them to assert that they are not visible.
const hidden = { includeHidden: true } as const;

describe("desktop", () => {
  it("shows the 260px sidebar and offsets the content column", async () => {
    await render(<Shell />);
    await expect
      .element(page.getByRole("navigation", { name: "Test navigation" }))
      .toBeVisible();
    expect(sidebar().getBoundingClientRect().width).toBe(260);
    const main = document.getElementById("main-content")!;
    expect(main.getBoundingClientRect().left).toBe(260);
    await expect
      .element(page.getByRole("button", { name: "Open menu", ...hidden }))
      .not.toBeVisible();
    await expect
      .element(page.getByRole("navigation", { name: "Primary", ...hidden }))
      .not.toBeVisible();
  });

  it("collapses to a named icon rail and keeps the column in step", async () => {
    await render(<Shell />);
    const toggle = page.getByRole("button", { name: "Collapse sidebar" });
    await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();

    const expand = page.getByRole("button", { name: "Expand sidebar" });
    await expect.element(expand).toHaveAttribute("aria-expanded", "false");
    expect(sidebar().getBoundingClientRect().width).toBe(72);
    expect(
      document.getElementById("main-content")!.getBoundingClientRect().left,
    ).toBe(72);
    // Icon-only links keep their accessible names; the active one is current.
    await expect
      .element(sidebarNav().getByRole("link", { name: "Billing" }))
      .toHaveAttribute("aria-current", "page");
    await expect
      .element(sidebarNav().getByRole("link", { name: "Security" }))
      .toBeVisible();
    await expect.element(page.getByText("Sign out")).not.toBeInTheDocument();

    await expand.click();
    expect(sidebar().getBoundingClientRect().width).toBe(260);
  });

  it("shows a tooltip for rail links on keyboard focus", async () => {
    await render(<Shell defaultExpanded={false} />);
    sidebarNav().getByRole("link", { name: "Security" }).element().focus();
    await expect
      .element(page.getByRole("tooltip"))
      .toHaveTextContent("Security");
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("tooltip")).not.toBeInTheDocument();
  });

  it("scrolls a long navigation inside the sidebar", async () => {
    await page.viewport(1440, 600);
    await render(<Shell longNavigation />);
    const scroller = sidebar().querySelector(".overflow-y-auto") as HTMLElement;
    expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
    expect(document.documentElement.scrollWidth).toBe(1440);
  });
});

describe("account menu", () => {
  it("opens from the keyboard, moves between items and returns focus", async () => {
    await render(<Shell />);
    const trigger = page.getByRole("button", {
      name: `Account menu for ${ACCOUNT_NAME}`,
    });
    trigger.element().focus();
    await userEvent.keyboard("{Enter}");

    const menu = page.getByRole("menu");
    await expect.element(menu).toBeVisible();
    await expect.element(menu).toHaveTextContent(ACCOUNT_EMAIL);
    await expect
      .element(page.getByRole("menuitem", { name: "View profile" }))
      .toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .element(page.getByRole("menuitem", { name: "Sign out" }))
      .toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await expect.element(menu).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("runs the application's sign-out action and closes", async () => {
    const onSignOut = vi.fn();
    await render(<Shell onSignOut={onSignOut} />);
    await page.getByRole("button", { name: /Account menu/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    expect(onSignOut).toHaveBeenCalledOnce();
    await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
  });

  it("stays inside the viewport on phones", async () => {
    await page.viewport(390, 844);
    await render(<Shell />);
    await page.getByRole("button", { name: /Account menu/ }).click();
    const rect = page.getByRole("menu").element().getBoundingClientRect();
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(390);
  });
});

describe("theme", () => {
  it("switches the shared theme from the top bar", async () => {
    await render(<Shell />);
    await page.getByRole("button", { name: "Dark theme" }).click();
    await expect
      .poll(() => document.documentElement.classList.contains("dark"))
      .toBe(true);
    await page.getByRole("button", { name: "Dark theme" }).click();
    await expect
      .poll(() => document.documentElement.classList.contains("dark"))
      .toBe(false);
  });
});

describe("phone", () => {
  it("starts closed with the drawer trigger, tab bar and no sidebar", async () => {
    await page.viewport(390, 844);
    await render(<Shell />);

    const trigger = page.getByRole("button", { name: "Open menu" });
    await expect.element(trigger).toBeVisible();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    expect(getComputedStyle(sidebar()).display).toBe("none");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect
      .element(page.getByRole("navigation", { name: "Breadcrumb", ...hidden }))
      .not.toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Dark theme", ...hidden }))
      .not.toBeVisible();

    const tabs = page.getByRole("navigation", { name: "Primary" });
    await expect.element(tabs).toBeVisible();
    await expect
      .element(tabs.getByRole("link", { name: "Billing" }))
      .toHaveAttribute("aria-current", "page");
    expect(document.documentElement.scrollWidth).toBe(390);
  });

  it("opens a focus-trapped drawer that locks the page and closes on Escape", async () => {
    await page.viewport(390, 844);
    await render(<Shell />);
    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.click();

    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect.element(drawer).toBeVisible();
    await expect.element(drawer).toHaveTextContent(ACCOUNT_NAME);
    expect(drawer.element().getBoundingClientRect().width).toBe(304);
    expect(drawer.element().contains(document.activeElement)).toBe(true);
    expect(getComputedStyle(document.body).overflow).toBe("hidden");
    // The page behind is hidden from assistive technology.
    await expect
      .poll(() =>
        page.getByText("Page action").element().closest("[aria-hidden='true']"),
      )
      .not.toBeNull();

    for (let step = 0; step < 10; step += 1) {
      await userEvent.tab();
      expect(drawer.element().contains(document.activeElement)).toBe(true);
    }

    await userEvent.keyboard("{Escape}");
    await expect.element(drawer).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
    expect(getComputedStyle(document.body).overflow).not.toBe("hidden");
  });

  it("closes from the close button and from the backdrop", async () => {
    await page.viewport(390, 844);
    await render(<Shell />);

    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("button", { name: "Close menu" }).click();
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();

    await page.getByRole("button", { name: "Open menu" }).click();
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await userEvent.click(document.body, { position: { x: 370, y: 400 } });
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when a navigation item is selected", async () => {
    await page.viewport(390, 844);
    await render(<Shell />);
    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect
      .element(drawer.getByRole("link", { name: "Billing" }))
      .toHaveAttribute("aria-current", "page");
    await drawer.getByRole("link", { name: "Security" }).click();
    await expect.element(drawer).not.toBeInTheDocument();
  });

  it("switches dark mode from the drawer", async () => {
    await page.viewport(390, 844);
    await render(<Shell />);
    await page.getByRole("button", { name: "Open menu" }).click();
    const toggle = page.getByRole("switch", { name: "Dark mode" });
    await expect.element(toggle).toHaveAttribute("aria-checked", "false");
    await toggle.click();
    await expect.element(toggle).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("closes the drawer when the viewport grows to desktop", async () => {
    await page.viewport(390, 844);
    await render(<Shell />);
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect.element(page.getByRole("dialog")).toBeVisible();

    await page.viewport(1440, 900);
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    expect(getComputedStyle(document.body).overflow).not.toBe("hidden");
    await expect
      .element(page.getByRole("navigation", { name: "Test navigation" }))
      .toBeVisible();
  });
});

describe("tablet", () => {
  it("uses the drawer with breadcrumbs and no tab bar", async () => {
    await page.viewport(834, 1112);
    await render(<Shell />);
    await expect
      .element(page.getByRole("button", { name: "Open menu" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("navigation", { name: "Breadcrumb" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("navigation", { name: "Primary", ...hidden }))
      .not.toBeVisible();
    expect(getComputedStyle(sidebar()).display).toBe("none");
    expect(document.documentElement.scrollWidth).toBe(834);
  });
});

describe("print", () => {
  afterEach(async () => {
    await emulateMedia("");
  });

  const sidebarChrome = () => sidebar().parentElement!;
  const main = () => document.getElementById("main-content")!;

  it("leaves pages without paper-like content unchanged", async () => {
    await render(<Shell />);
    await emulateMedia("print");

    expect(matchMedia("print").matches).toBe(true);
    expect(getComputedStyle(sidebarChrome()).display).toBe("contents");
    expect(getComputedStyle(main()).paddingTop).not.toBe("0px");
  });

  it("prints only the content of a page with paper, without chrome or offsets", async () => {
    await render(<Shell paper />);
    await emulateMedia("print");

    // Polled: the stylesheet can update after the first render.
    await expect
      .poll(() => getComputedStyle(sidebarChrome()).display)
      .toBe("none");
    const shell = document.querySelector("[data-dashboard-shell]")!;
    const wrappers = shell.querySelectorAll(
      '[class~="print:group-has-[[data-print-paper]]/shell:hidden"]',
    );
    expect(wrappers).toHaveLength(3);
    for (const element of wrappers) {
      expect(getComputedStyle(element).display).toBe("none");
    }
    await expect.poll(() => getComputedStyle(main()).padding).toBe("0px");
    await expect.poll(() => getComputedStyle(main()).maxWidth).toBe("none");
    await expect
      .poll(() => getComputedStyle(main().parentElement!).paddingLeft)
      .toBe("0px");
    await expect
      .poll(() => getComputedStyle(shell).backgroundColor)
      .toBe("rgba(0, 0, 0, 0)");
    await expect
      .element(page.getByRole("heading", { name: "Page" }))
      .toBeVisible();
  });
});
