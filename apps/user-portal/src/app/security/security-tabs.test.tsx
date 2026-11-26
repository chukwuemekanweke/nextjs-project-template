import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// The URL is the tab's source of truth; each render reads `?tab=` from it.
let currentSearch = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

import { SECURITY_TABS, type SecurityTab } from "./security-tab";
import { SecurityTabLink, SecurityTabs } from "./security-tabs";

const panels = Object.fromEntries(
  SECURITY_TABS.map(({ label, value }) => [
    value,
    createElement("p", null, `${label} panel`),
  ]),
) as unknown as Record<SecurityTab, ReactNode>;

function renderAt(search: string) {
  currentSearch = search;
  return renderToStaticMarkup(createElement(SecurityTabs, { panels }));
}

const render = (tab: SecurityTab) => renderAt(`?tab=${tab}`);

const selectedTab = (markup: string) =>
  /aria-selected="true"[^>]*>([^<]+)</.exec(markup)?.[1];

describe("SecurityTabs", () => {
  it("renders six accessible tabs with the overview selected by default", () => {
    const markup = render("overview");

    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('aria-label="Security sections"');
    expect(markup.match(/role="tab"/g)).toHaveLength(6);
    for (const { label } of SECURITY_TABS) {
      expect(markup).toContain(`>${label}</button>`);
    }
    expect(markup).toMatch(/aria-selected="true"[^>]*>Overview/);
    expect(markup).toContain('role="tabpanel"');
    expect(markup).toContain("Overview panel");
    expect(markup).not.toContain("Sessions panel");
  });

  it.each(SECURITY_TABS)(
    "opens the $value tab from a ?tab= deep link",
    ({ label, value }) => {
      const markup = render(value);

      expect(markup).toMatch(new RegExp(`aria-selected="true"[^>]*>${label}<`));
      expect(markup).toContain(`${label} panel`);
      expect(markup.match(/aria-selected="true"/g)).toHaveLength(1);
    },
  );

  it("follows the current URL rather than the tab it first rendered with", () => {
    // Load ?tab=passkeys, then navigate back to bare /security: the overview
    // must show again, matching the URL.
    expect(selectedTab(renderAt("?tab=passkeys"))).toBe("Passkeys");
    expect(selectedTab(renderAt(""))).toBe("Overview");
    expect(selectedTab(renderAt("?tab=activity"))).toBe("Activity");
    expect(selectedTab(renderAt("?tab=overview"))).toBe("Overview");
  });

  it("falls back to the overview for unknown or empty ?tab= values", () => {
    expect(selectedTab(renderAt("?tab=general"))).toBe("Overview");
    expect(selectedTab(renderAt("?tab="))).toBe("Overview");
  });

  it("renders in-page tab links as real, shareable URLs", () => {
    const markup = renderToStaticMarkup(
      <SecurityTabLink tab="passkeys">Manage passkeys</SecurityTabLink>,
    );

    expect(markup).toBe('<a href="/security?tab=passkeys">Manage passkeys</a>');
  });
});
