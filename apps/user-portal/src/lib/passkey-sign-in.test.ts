import { WebAuthnCeremonyError } from "@template/api-client/browser";
import { describe, expect, it, vi } from "vitest";
import {
  PASSKEY_OPTIONS_PATH,
  PASSKEY_SESSION_PATH,
  passkeySignInError,
  signInWithPasskey,
  type PasskeySignInDependencies,
} from "./passkey-sign-in";

type GetAssertion = NonNullable<PasskeySignInDependencies["getAssertion"]>;
const assertionMock = () => vi.fn<GetAssertion>();

const options = { challenge: "AQID", userVerification: "preferred" };
const assertion = {
  clientExtensionResults: {},
  id: "AQ",
  rawId: "AQ",
  response: { authenticatorData: "BQ", clientDataJSON: "BA", signature: "Bw" },
  type: "public-key" as const,
};

function setup({
  completion = Response.json({ status: "authenticated" }),
  start = Response.json({ expiresAtUtc: "x", publicKey: options }),
  getAssertion = assertionMock().mockResolvedValue(assertion),
}: {
  completion?: Response | Error;
  getAssertion?: ReturnType<typeof assertionMock>;
  start?: Response | Error;
} = {}) {
  const fetch = vi.fn<typeof globalThis.fetch>((input, init) => {
    if (input === PASSKEY_OPTIONS_PATH) {
      return start instanceof Error
        ? Promise.reject(start)
        : Promise.resolve(start);
    }
    if (input === PASSKEY_SESSION_PATH && init?.method === "DELETE") {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    return completion instanceof Error
      ? Promise.reject(completion)
      : Promise.resolve(completion);
  });
  return { fetch, getAssertion };
}

describe("passkey sign-in workflow", () => {
  it("authenticates through the BFF with the serialized assertion", async () => {
    const deps = setup();

    await expect(signInWithPasskey(deps)).resolves.toEqual({
      status: "authenticated",
    });

    expect(deps.getAssertion).toHaveBeenCalledWith(options);
    expect(deps.fetch).toHaveBeenNthCalledWith(
      1,
      PASSKEY_OPTIONS_PATH,
      expect.objectContaining({ credentials: "same-origin", method: "POST" }),
    );
    const [path, init] = deps.fetch.mock.calls[1]!;
    expect(path).toBe(PASSKEY_SESSION_PATH);
    expect(JSON.parse(init?.body as string)).toEqual({ credential: assertion });
  });

  it("reports a two-factor continuation", async () => {
    const deps = setup({
      completion: Response.json({ status: "two_factor_required" }),
    });
    await expect(signInWithPasskey(deps)).resolves.toEqual({
      status: "two_factor_required",
    });
  });

  it("treats native cancellation as a normal outcome and releases the flow", async () => {
    const deps = setup({
      getAssertion: assertionMock().mockRejectedValue(
        new WebAuthnCeremonyError("cancelled", "x"),
      ),
    });

    await expect(signInWithPasskey(deps)).resolves.toEqual({
      status: "cancelled",
    });
    expect(deps.fetch).toHaveBeenCalledWith(
      PASSKEY_SESSION_PATH,
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(deps.fetch).not.toHaveBeenCalledWith(
      PASSKEY_SESSION_PATH,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("explains unsupported browsers", async () => {
    const deps = setup({
      getAssertion: assertionMock().mockRejectedValue(
        new WebAuthnCeremonyError("not_supported", "x"),
      ),
    });
    const result = await signInWithPasskey(deps);
    expect(result).toMatchObject({ status: "error" });
    expect(JSON.stringify(result)).toContain("does not support passkeys");
  });

  it("reports invalid authenticator responses without contacting the session endpoint", async () => {
    const deps = setup({
      getAssertion: assertionMock().mockRejectedValue(
        new WebAuthnCeremonyError("invalid_response", "x"),
      ),
    });
    const result = await signInWithPasskey(deps);
    expect(JSON.stringify(result)).toContain("unexpected response");
  });

  it.each([
    [401, "could not be verified"],
    [410, "expired"],
    [409, "expired"],
    [423, "locked"],
    [429, "Too many"],
    [503, "temporarily unavailable"],
  ])(
    "maps a %s completion failure to passkey-specific copy",
    async (status, text) => {
      const deps = setup({
        completion: Response.json({ status }, { status }),
      });
      const result = await signInWithPasskey(deps);
      expect(result).toMatchObject({ status: "error" });
      expect(JSON.stringify(result)).toContain(text);
      expect(JSON.stringify(result)).not.toMatch(/password is incorrect/);
    },
  );

  it("handles a failure to start the flow without invoking WebAuthn", async () => {
    const deps = setup({ start: Response.json({}, { status: 429 }) });
    const result = await signInWithPasskey(deps);
    expect(JSON.stringify(result)).toContain("Too many");
    expect(deps.getAssertion).not.toHaveBeenCalled();
  });

  it.each(["start", "completion"] as const)(
    "handles network failure during %s",
    async (stage) => {
      const deps = setup({ [stage]: new TypeError("Failed to fetch") });
      const result = await signInWithPasskey(deps);
      expect(JSON.stringify(result)).toContain("could not reach the server");
    },
  );

  it("never echoes backend details", () => {
    for (const status of [0, 400, 401, 403, 409, 410, 423, 429, 500]) {
      expect(passkeySignInError(status)).not.toMatch(/stack|exception/i);
    }
  });
});
