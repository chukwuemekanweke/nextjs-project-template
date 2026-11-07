import { ApiError, type ApiErrorKind } from "@template/api-client";
import { WebAuthnCeremonyError } from "@template/api-client/browser";
import { describe, expect, it, vi } from "vitest";
import {
  describePasskeyBackup,
  describePasskeyTransports,
  passkeyRemovalError,
  passkeyRenameError,
  passkeysLoadError,
  registerPasskey,
  validatePasskeyName,
} from "./passkey-management";

const flow = {
  expiresAtUtc: "2026-11-07T10:05:00Z",
  flowToken: "flow",
  publicKey: {
    challenge: "AQID",
    pubKeyCredParams: [{ alg: -7, type: "public-key" as const }],
    rp: { name: "Portal" },
    user: { displayName: "Ada", id: "AQ", name: "ada" },
  },
};
const credential = {
  clientExtensionResults: {},
  id: "AQ",
  rawId: "AQ",
  response: { attestationObject: "AgM", clientDataJSON: "BA" },
  type: "public-key" as const,
};
const passkey = {
  createdAtUtc: "2026-11-07T10:00:00Z",
  id: "AQ",
  isBackedUp: false,
  isBackupEligible: false,
  name: "Laptop",
  transports: ["internal"],
};

function apiError(
  status: number,
  kind: ApiErrorKind = "conflict",
  extra: Partial<ConstructorParameters<typeof ApiError>[0]> = {},
) {
  return new ApiError({
    kind,
    safeMessage: "Request failed",
    status,
    ...extra,
  });
}

function dependencies() {
  return {
    complete: vi.fn().mockResolvedValue(passkey),
    createCredential: vi.fn().mockResolvedValue(credential),
    createOptions: vi.fn().mockResolvedValue(flow),
  };
}

describe("passkey registration workflow", () => {
  it("registers after backend verification and trims the friendly name", async () => {
    const deps = dependencies();

    await expect(registerPasskey("  Laptop ", deps)).resolves.toEqual({
      passkey,
      status: "registered",
    });
    expect(deps.createOptions).toHaveBeenCalledWith({ name: "Laptop" });
    expect(deps.createCredential).toHaveBeenCalledWith(flow.publicKey);
    expect(deps.complete).toHaveBeenCalledWith({
      credential,
      flowToken: "flow",
    });
  });

  it("treats cancellation as normal and never completes registration", async () => {
    const deps = dependencies();
    deps.createCredential.mockRejectedValue(
      new WebAuthnCeremonyError("cancelled", "x"),
    );

    await expect(registerPasskey("Laptop", deps)).resolves.toEqual({
      status: "cancelled",
    });
    expect(deps.complete).not.toHaveBeenCalled();
  });

  it.each([
    ["not_supported", "does not support"],
    ["credential_exists", "already has a passkey"],
    ["invalid_response", "unexpected response"],
    ["security", "cannot be created"],
  ] as const)("explains the %s ceremony failure", async (reason, text) => {
    const deps = dependencies();
    deps.createCredential.mockRejectedValue(
      new WebAuthnCeremonyError(reason, "x"),
    );
    const result = await registerPasskey("Laptop", deps);
    expect(result).toMatchObject({ status: "error" });
    expect(JSON.stringify(result)).toContain(text);
    expect(deps.complete).not.toHaveBeenCalled();
  });

  it.each([
    [apiError(410, "unexpected"), "expired"],
    [apiError(409), "already registered"],
    [apiError(400, "validation"), "could not be verified"],
    [apiError(401, "unauthorized"), "session has expired"],
    [apiError(403, "forbidden"), "cannot manage passkeys"],
    [
      new ApiError({ kind: "network", safeMessage: "Network" }),
      "could not reach the server",
    ],
  ])("maps completion failure %#", async (error, text) => {
    const deps = dependencies();
    deps.complete.mockRejectedValue(error);
    const result = await registerPasskey("Laptop", deps);
    expect(result).toMatchObject({ status: "error" });
    expect(JSON.stringify(result)).toContain(text);
  });

  it("surfaces backend name validation when options are rejected", async () => {
    const deps = dependencies();
    deps.createOptions.mockRejectedValue(
      apiError(400, "validation", {
        validationErrors: { Name: ["'Name' must not be empty."] },
      }),
    );
    const result = await registerPasskey("x", deps);
    expect(result).toEqual({
      message: "'Name' must not be empty.",
      status: "error",
    });
    expect(deps.createCredential).not.toHaveBeenCalled();
  });

  it("is repeatable for multiple passkeys", async () => {
    const deps = dependencies();
    await registerPasskey("Laptop", deps);
    await registerPasskey("Phone", deps);
    expect(deps.createOptions).toHaveBeenCalledTimes(2);
    expect(deps.complete).toHaveBeenCalledTimes(2);
  });
});

describe("passkey management helpers", () => {
  it("validates friendly names against the backend limit", () => {
    expect(validatePasskeyName("  ")).toBe("Enter a name for this passkey.");
    expect(validatePasskeyName("a".repeat(101))).toContain("100");
    expect(validatePasskeyName("Work laptop")).toBeUndefined();
  });

  it("maps rename, removal, and load failures", () => {
    expect(passkeyRenameError(apiError(404, "not-found"))).toBe(
      "That passkey no longer exists.",
    );
    expect(passkeyRemovalError(apiError(404, "not-found"))).toBe(
      "That passkey was already removed.",
    );
    expect(passkeyRemovalError(apiError(401, "unauthorized"))).toContain(
      "session has expired",
    );
    expect(passkeysLoadError(apiError(403, "forbidden"))).toContain(
      "cannot manage passkeys",
    );
    expect(passkeysLoadError(new Error("boom"))).toBe(
      "Passkeys could not be loaded. Refresh and try again.",
    );
  });

  it("describes only backend-provided transports and backup state", () => {
    expect(describePasskeyTransports(["internal", "hybrid", "unknown"])).toBe(
      "This device, Phone or tablet",
    );
    expect(describePasskeyTransports([])).toBe("");
    expect(
      describePasskeyBackup({ isBackedUp: true, isBackupEligible: true }),
    ).toBe("Synced");
    expect(
      describePasskeyBackup({ isBackedUp: false, isBackupEligible: false }),
    ).toBeUndefined();
  });
});
