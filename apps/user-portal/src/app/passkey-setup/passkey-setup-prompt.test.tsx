import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const usePasskeys = vi.fn();
const useWebAuthnSupport = vi.fn();
const idleMutation = { isPending: false, mutateAsync: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@template/api-react/authentication", () => ({
  useCompletePasskeyRegistration: () => idleMutation,
  useCreatePasskeyRegistrationOptions: () => idleMutation,
  usePasskeys: () => usePasskeys(),
}));
vi.mock("@/lib/use-webauthn-support", () => ({
  useWebAuthnSupport: () => useWebAuthnSupport(),
}));

import { PasskeySetupPrompt } from "./passkey-setup-prompt";

const render = () =>
  renderToStaticMarkup(
    createElement(PasskeySetupPrompt, { destination: "/dashboard" }),
  );

beforeEach(() => {
  useWebAuthnSupport.mockReturnValue(true);
  usePasskeys.mockReturnValue({ data: [], isPending: false });
});

describe("PasskeySetupPrompt", () => {
  it("waits for support detection before offering setup", () => {
    useWebAuthnSupport.mockReturnValue(undefined);
    const markup = render();
    expect(markup).toContain("Preparing passkey setup");
    expect(markup).not.toContain("Create passkey");
  });

  it("offers creation with a skip option", () => {
    const markup = render();
    expect(markup).toContain("Passkey name");
    expect(markup).toContain("Create passkey");
    expect(markup).toContain("Skip for now");
    expect(markup).toContain("Security settings");
  });

  it("only offers to continue when the browser cannot create passkeys", () => {
    useWebAuthnSupport.mockReturnValue(false);
    const markup = render();
    expect(markup).toContain("This browser cannot create passkeys");
    expect(markup).toContain("Continue");
    expect(markup).not.toContain("Create passkey");
  });

  it("does not prompt users who already have a passkey", () => {
    usePasskeys.mockReturnValue({
      data: [{ id: "AQ", name: "Mac" }],
      isPending: false,
    });
    const markup = render();
    expect(markup).not.toContain("Create passkey");
  });

  it("still offers setup when the passkey list cannot be loaded", () => {
    usePasskeys.mockReturnValue({ error: new Error("x"), isPending: false });
    expect(render()).toContain("Create passkey");
  });
});
