import { ThemeProvider } from "@template/ui-core";
import { afterEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MarketingHeader } from "./marketing-header";

// Fragment hrefs: choosing a link must not navigate the test frame.
const navigation = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

function Header() {
  return (
    <ThemeProvider>
      <MarketingHeader
        activeHref="#pricing"
        brand={<a href="/">Acme</a>}
        navigation={navigation}
        register={{ label: "Get started", href: "#register" }}
        signIn={{ label: "Sign in", href: "#sign-in" }}
      />
      <main>
        <p>Page content</p>
      </main>
    </ThemeProvider>
  );
}

afterEach(() => {
  document.documentElement.classList.remove("dark");
  localStorage.clear();
});

describe("desktop", () => {
  it("shows the site navigation, theme switch and both actions", async () => {
    await page.viewport(1440, 900);
    await render(<Header />);

    const nav = page.getByRole("navigation", { name: "Site" });
    await expect.element(nav).toBeVisible();
    await expect
      .element(nav.getByRole("link", { name: "Pricing" }))
      .toHaveAttribute("aria-current", "page");
    await expect
      .element(nav.getByRole("link", { name: "Features" }))
      .not.toHaveAttribute("aria-current");
    await expect
      .element(page.getByRole("link", { name: "Sign in" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Dark theme" }))
      .toBeVisible();
    // Hidden with `display: none`, so absent from the accessibility tree.
    await expect
      .element(page.getByRole("button", { name: "Open menu" }))
      .not.toBeInTheDocument();
  });
});

describe("phone", () => {
  it("shows the compact bar: brand, Get started and the menu button", async () => {
    await page.viewport(390, 844);
    await render(<Header />);

    await expect
      .element(page.getByRole("navigation", { name: "Site" }))
      .not.toBeInTheDocument();
    await expect
      .element(page.getByRole("link", { name: "Get started" }))
      .toBeVisible();
    const trigger = page.getByRole("button", { name: "Open menu" });
    await expect.element(trigger).toBeVisible();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens a focus-trapped full-screen menu that closes on Escape", async () => {
    await page.viewport(390, 844);
    await render(<Header />);
    const trigger = page.getByRole("button", { name: "Open menu" });
    const triggerButton = trigger.element();
    await trigger.click();

    const menu = page.getByRole("dialog", { name: "Site menu" });
    await expect.element(menu).toBeVisible();
    expect(triggerButton.getAttribute("aria-expanded")).toBe("true");
    expect(triggerButton.getAttribute("aria-controls")).toBe(menu.element().id);
    // The page behind is hidden from assistive technology.
    await expect
      .poll(() =>
        page
          .getByText("Page content")
          .element()
          .closest("[aria-hidden='true']"),
      )
      .not.toBeNull();
    expect(menu.element().getBoundingClientRect().width).toBe(390);
    expect(menu.element().contains(document.activeElement)).toBe(true);
    expect(getComputedStyle(document.body).overflow).toBe("hidden");
    await expect
      .element(menu.getByRole("link", { name: "Pricing" }))
      .toHaveAttribute("aria-current", "page");
    await expect
      .element(menu.getByRole("link", { name: "Sign in" }))
      .toBeVisible();
    await expect
      .element(menu.getByRole("link", { name: "Get started" }))
      .toBeVisible();

    for (let step = 0; step < 12; step += 1) {
      await userEvent.tab();
      expect(menu.element().contains(document.activeElement)).toBe(true);
    }

    await userEvent.keyboard("{Escape}");
    await expect.element(menu).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
    expect(getComputedStyle(document.body).overflow).not.toBe("hidden");
  });

  it("closes from the close button and when a link is chosen", async () => {
    await page.viewport(390, 844);
    await render(<Header />);
    const trigger = page.getByRole("button", { name: "Open menu" });
    const menu = page.getByRole("dialog", { name: "Site menu" });

    await trigger.click();
    await page.getByRole("button", { name: "Close menu" }).click();
    await expect.element(menu).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();

    await trigger.click();
    await menu.getByRole("link", { name: "Features" }).click();
    await expect.element(menu).not.toBeInTheDocument();
  });

  it("switches dark mode from the menu", async () => {
    await page.viewport(390, 844);
    await render(<Header />);
    await page.getByRole("button", { name: "Open menu" }).click();

    const darkMode = page.getByRole("switch", { name: "Dark mode" });
    await expect.element(darkMode).not.toBeChecked();
    await darkMode.click();
    await expect.element(darkMode).toBeChecked();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("closes the menu when the viewport grows to desktop", async () => {
    await page.viewport(390, 844);
    await render(<Header />);
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Site menu" });
    await expect.element(menu).toBeVisible();

    await page.viewport(1440, 900);
    await expect.element(menu).not.toBeInTheDocument();
    await expect
      .element(page.getByRole("navigation", { name: "Site" }))
      .toBeVisible();
  });
});

describe("theme", () => {
  it("switches the shared theme from the desktop bar", async () => {
    await page.viewport(1440, 900);
    await render(<Header />);
    const toggle = page.getByRole("button", { name: "Dark theme" });

    await toggle.click();
    await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    await toggle.click();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
