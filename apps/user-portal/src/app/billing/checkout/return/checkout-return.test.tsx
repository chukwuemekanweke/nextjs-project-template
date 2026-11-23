import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({ useRememberedCheckoutAttempt: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/lib/use-checkout-attempt", () => ({
  useRememberedCheckoutAttempt: () => hooks.useRememberedCheckoutAttempt(),
}));

import { CheckoutReturn } from "./checkout-return";

const render = () => renderToStaticMarkup(createElement(CheckoutReturn));

describe("CheckoutReturn", () => {
  it("waits for the remembered purchase before resolving its status", () => {
    hooks.useRememberedCheckoutAttempt.mockReturnValue(undefined);
    expect(render()).toContain("Finding your checkout");

    hooks.useRememberedCheckoutAttempt.mockReturnValue({
      purchaseId: "019a0000-0000-7000-8000-000000000002",
    });
    expect(render()).toContain("Finding your checkout");
  });

  it("offers billing when no checkout is remembered in this browser", () => {
    hooks.useRememberedCheckoutAttempt.mockReturnValue(null);
    const markup = render();
    expect(markup).toContain("could not find a recent checkout");
    expect(markup).toContain('href="/billing"');
  });
});
