import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const usePasskeys = vi.fn();
const useTwoFactorStatus = vi.fn();

vi.mock("@template/api-react/authentication", () => ({
  usePasskeys: () => usePasskeys(),
  useTwoFactorStatus: () => useTwoFactorStatus(),
}));

import { SecurityOverviewCard } from "./security-overview-card";

const render = () => renderToStaticMarkup(createElement(SecurityOverviewCard));

describe("SecurityOverviewCard", () => {
  it("summarises each sign-in method from the shared queries", () => {
    usePasskeys.mockReturnValue({ data: [], isError: false, isPending: false });
    useTwoFactorStatus.mockReturnValue({
      data: { enabled: true, recoveryCodesRemaining: 8 },
      isError: false,
      isPending: false,
    });

    const markup = render();

    expect(markup).toContain("Account security overview");
    expect(markup).toContain("Password status: </span>Set");
    expect(markup).toContain("Passkeys status: </span>Not set");
    expect(markup).toContain("Two-factor auth status: </span>Enabled");
  });

  it("shows accessible placeholders while statuses load", () => {
    usePasskeys.mockReturnValue({ isError: false, isPending: true });
    useTwoFactorStatus.mockReturnValue({ isError: false, isPending: true });

    const markup = render();

    expect(markup).toContain("Checking Passkeys status");
    expect(markup).toContain("Checking Two-factor auth status");
    expect(markup).toContain('aria-busy="true"');
  });
});
