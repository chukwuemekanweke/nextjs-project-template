import { describe, expect, it, vi } from "vitest";
import type {
  PublicKeyCredentialCreationOptionsJson,
  PublicKeyCredentialRequestOptionsJson,
} from "../authentication/contracts";
import {
  arrayBufferToBase64Url,
  base64UrlToArrayBuffer,
  classifyWebAuthnError,
  createPasskeyCredential,
  getPasskeyAssertion,
  isWebAuthnSupported,
  serializeAuthenticationCredential,
  serializeRegistrationCredential,
  toPublicKeyCredentialCreationOptions,
  toPublicKeyCredentialRequestOptions,
  WebAuthnCeremonyError,
  WebAuthnSerializationError,
  type WebAuthnEnvironment,
} from "./webauthn";

const bytes = (...values: number[]) => new Uint8Array(values).buffer;
const view = (buffer: BufferSource | undefined) =>
  Array.from(
    new Uint8Array(
      buffer instanceof ArrayBuffer ? buffer : (buffer as Uint8Array).buffer,
    ),
  );

const creationOptions: PublicKeyCredentialCreationOptionsJson = {
  attestation: "none",
  authenticatorSelection: {
    residentKey: "required",
    userVerification: "preferred",
  },
  challenge: "AQID",
  excludeCredentials: [
    { id: "BAU", transports: ["internal", "hybrid"], type: "public-key" },
  ],
  pubKeyCredParams: [{ alg: -7, type: "public-key" }],
  rp: { id: "portal.example", name: "Portal" },
  timeout: 60_000,
  user: { displayName: "Ada", id: "_-8", name: "ada@example.com" },
};

const requestOptions: PublicKeyCredentialRequestOptionsJson = {
  allowCredentials: [{ id: "BAU", type: "public-key" }],
  challenge: "AQID",
  rpId: "portal.example",
  timeout: 30_000,
  userVerification: "required",
};

function registrationCredential(overrides: Record<string, unknown> = {}) {
  return {
    authenticatorAttachment: "platform",
    getClientExtensionResults: () => ({ credProps: { rk: true } }),
    id: "AQ",
    rawId: bytes(1),
    response: {
      attestationObject: bytes(2, 3),
      clientDataJSON: bytes(4),
      getAuthenticatorData: () => bytes(5),
      getPublicKey: () => bytes(6),
      getPublicKeyAlgorithm: () => -7,
      getTransports: () => ["internal"],
    },
    type: "public-key",
    ...overrides,
  };
}

function assertionCredential(userHandle: ArrayBuffer | null = bytes(9)) {
  return {
    authenticatorAttachment: null,
    getClientExtensionResults: () => ({}),
    id: "AQ",
    rawId: bytes(1),
    response: {
      authenticatorData: bytes(5),
      clientDataJSON: bytes(4),
      signature: bytes(7, 8),
      userHandle,
    },
    type: "public-key",
  };
}

function environment(
  credentials: Partial<WebAuthnEnvironment["credentials"]> = {},
): WebAuthnEnvironment {
  return {
    credentials: {
      create: vi.fn(),
      get: vi.fn(),
      ...credentials,
    } as WebAuthnEnvironment["credentials"],
    isSecureContext: true,
    publicKeyCredential: function PublicKeyCredential() {},
  };
}

describe("base64url conversion", () => {
  it("decodes unpadded url-safe values", () => {
    expect(view(base64UrlToArrayBuffer("_-8"))).toEqual([255, 239]);
    expect(view(base64UrlToArrayBuffer("AQID"))).toEqual([1, 2, 3]);
  });

  it("encodes without padding using the url-safe alphabet", () => {
    expect(arrayBufferToBase64Url(bytes(255, 239))).toBe("_-8");
    expect(arrayBufferToBase64Url(new Uint8Array([0, 1, 2, 3]))).toBe("AAECAw");
  });

  it("round-trips arbitrary bytes", () => {
    const source = new Uint8Array(257).map((_, index) => index % 256);
    expect(
      view(base64UrlToArrayBuffer(arrayBufferToBase64Url(source.buffer))),
    ).toEqual(Array.from(source));
  });

  it("handles empty values", () => {
    expect(base64UrlToArrayBuffer("").byteLength).toBe(0);
    expect(arrayBufferToBase64Url(new ArrayBuffer(0))).toBe("");
  });

  it("encodes only the visible window of a typed-array view", () => {
    const backing = new Uint8Array([9, 1, 2, 9]);
    expect(arrayBufferToBase64Url(backing.subarray(1, 3))).toBe("AQI");
  });

  it.each(["a+b", "ab/c", "abc=", "abcde", "a b"])(
    "rejects invalid input %s",
    (value) => {
      expect(() => base64UrlToArrayBuffer(value)).toThrow(
        WebAuthnSerializationError,
      );
    },
  );
});

describe("option conversion", () => {
  it("converts creation challenge, user id, and excluded credentials", () => {
    const options = toPublicKeyCredentialCreationOptions(creationOptions);
    expect(view(options.challenge)).toEqual([1, 2, 3]);
    expect(view(options.user.id)).toEqual([255, 239]);
    expect(options.excludeCredentials?.map((item) => view(item.id))).toEqual([
      [4, 5],
    ]);
    expect(options.excludeCredentials?.[0]?.transports).toEqual([
      "internal",
      "hybrid",
    ]);
    expect(options.rp).toEqual({ id: "portal.example", name: "Portal" });
    expect(options.authenticatorSelection?.residentKey).toBe("required");
    expect(options.timeout).toBe(60_000);
    expect(options.attestation).toBe("none");
  });

  it("omits absent optional creation members", () => {
    const options = toPublicKeyCredentialCreationOptions({
      challenge: "AQID",
      pubKeyCredParams: [{ alg: -257, type: "public-key" }],
      rp: { name: "Portal" },
      user: { displayName: "Ada", id: "AQ", name: "ada" },
    });
    expect(Object.keys(options).sort()).toEqual([
      "challenge",
      "pubKeyCredParams",
      "rp",
      "user",
    ]);
  });

  it("converts request challenge and allowed credentials", () => {
    const options = toPublicKeyCredentialRequestOptions(requestOptions);
    expect(view(options.challenge)).toEqual([1, 2, 3]);
    expect(options.allowCredentials?.map((item) => view(item.id))).toEqual([
      [4, 5],
    ]);
    expect(options.allowCredentials?.[0]).not.toHaveProperty("transports");
    expect(options.rpId).toBe("portal.example");
    expect(options.userVerification).toBe("required");
  });

  it("supports discoverable requests without allowed credentials", () => {
    const options = toPublicKeyCredentialRequestOptions({ challenge: "AQID" });
    expect(options).not.toHaveProperty("allowCredentials");
  });

  it("rejects options with an invalid challenge", () => {
    expect(() =>
      toPublicKeyCredentialRequestOptions({ challenge: "not+valid" }),
    ).toThrow(WebAuthnSerializationError);
  });
});

describe("credential serialization", () => {
  it("serializes registration attestation fields", () => {
    expect(serializeRegistrationCredential(registrationCredential())).toEqual({
      authenticatorAttachment: "platform",
      clientExtensionResults: { credProps: { rk: true } },
      id: "AQ",
      rawId: "AQ",
      response: {
        attestationObject: "AgM",
        authenticatorData: "BQ",
        clientDataJSON: "BA",
        publicKey: "Bg",
        publicKeyAlgorithm: -7,
        transports: ["internal"],
      },
      type: "public-key",
    });
  });

  it("omits optional registration getters that older browsers lack", () => {
    const serialized = serializeRegistrationCredential(
      registrationCredential({
        authenticatorAttachment: null,
        getClientExtensionResults: undefined,
        response: { attestationObject: bytes(2), clientDataJSON: bytes(4) },
      }),
    );
    expect(serialized).toEqual({
      clientExtensionResults: {},
      id: "AQ",
      rawId: "AQ",
      response: { attestationObject: "Ag", clientDataJSON: "BA" },
      type: "public-key",
    });
  });

  it("omits a null public key", () => {
    const credential = registrationCredential();
    (
      credential.response as { getPublicKey: () => ArrayBuffer | null }
    ).getPublicKey = () => null;
    expect(
      serializeRegistrationCredential(credential).response,
    ).not.toHaveProperty("publicKey");
  });

  it("encodes binary extension results", () => {
    const serialized = serializeAuthenticationCredential({
      ...assertionCredential(),
      getClientExtensionResults: () => ({
        largeBlob: { blob: bytes(1, 2) },
      }),
    });
    expect(serialized.clientExtensionResults).toEqual({
      largeBlob: { blob: "AQI" },
    });
  });

  it("serializes assertion fields including the user handle", () => {
    expect(serializeAuthenticationCredential(assertionCredential())).toEqual({
      clientExtensionResults: {},
      id: "AQ",
      rawId: "AQ",
      response: {
        authenticatorData: "BQ",
        clientDataJSON: "BA",
        signature: "Bwg",
        userHandle: "CQ",
      },
      type: "public-key",
    });
  });

  it("omits null or empty user handles", () => {
    expect(
      serializeAuthenticationCredential(assertionCredential(null)).response,
    ).not.toHaveProperty("userHandle");
    expect(
      serializeAuthenticationCredential(assertionCredential(new ArrayBuffer(0)))
        .response,
    ).not.toHaveProperty("userHandle");
  });

  it("rejects credentials missing required response members", () => {
    expect(() =>
      serializeRegistrationCredential(
        registrationCredential({ response: { clientDataJSON: bytes(1) } }),
      ),
    ).toThrow(WebAuthnSerializationError);
    expect(() =>
      serializeAuthenticationCredential({
        ...assertionCredential(),
        response: registrationCredential().response,
      }),
    ).toThrow(WebAuthnSerializationError);
  });

  it("rejects non public-key credentials", () => {
    expect(() =>
      serializeRegistrationCredential(
        registrationCredential({ type: "password" }),
      ),
    ).toThrow(WebAuthnSerializationError);
  });
});

describe("support and error classification", () => {
  it("requires a secure context and WebAuthn APIs", () => {
    expect(isWebAuthnSupported(environment())).toBe(true);
    expect(
      isWebAuthnSupported({ ...environment(), isSecureContext: false }),
    ).toBe(false);
    expect(
      isWebAuthnSupported({ ...environment(), publicKeyCredential: undefined }),
    ).toBe(false);
    expect(isWebAuthnSupported({})).toBe(false);
  });

  it.each([
    ["NotAllowedError", "cancelled"],
    ["AbortError", "cancelled"],
    ["InvalidStateError", "credential_exists"],
    ["NotSupportedError", "not_supported"],
    ["SecurityError", "security"],
    ["UnknownError", "unknown"],
  ])("classifies %s as %s", (name, reason) => {
    expect(classifyWebAuthnError(new DOMException("x", name))).toBe(reason);
  });

  it("classifies serialization failures as invalid responses", () => {
    expect(classifyWebAuthnError(new WebAuthnSerializationError("x"))).toBe(
      "invalid_response",
    );
    expect(classifyWebAuthnError("boom")).toBe("unknown");
  });
});

describe("ceremonies", () => {
  it("creates and serializes a registration credential", async () => {
    const create = vi.fn().mockResolvedValue(registrationCredential());
    const signal = new AbortController().signal;
    const result = await createPasskeyCredential(creationOptions, {
      environment: environment({ create }),
      signal,
    });
    expect(result.response.attestationObject).toBe("AgM");
    const [argument] = create.mock.calls[0] as [CredentialCreationOptions];
    expect(argument.signal).toBe(signal);
    expect(view(argument.publicKey?.challenge)).toEqual([1, 2, 3]);
  });

  it("gets and serializes an assertion", async () => {
    const get = vi.fn().mockResolvedValue(assertionCredential());
    const result = await getPasskeyAssertion(requestOptions, {
      environment: environment({ get }),
    });
    expect(result.response.signature).toBe("Bwg");
  });

  it("reports unsupported browsers without invoking WebAuthn", async () => {
    await expect(
      getPasskeyAssertion(requestOptions, { environment: {} }),
    ).rejects.toMatchObject({ reason: "not_supported" });
  });

  it("maps native cancellation", async () => {
    const create = vi
      .fn()
      .mockRejectedValue(new DOMException("cancel", "NotAllowedError"));
    await expect(
      createPasskeyCredential(creationOptions, {
        environment: environment({ create }),
      }),
    ).rejects.toMatchObject({ reason: "cancelled" });
  });

  it("maps excluded credential collisions", async () => {
    const create = vi
      .fn()
      .mockRejectedValue(new DOMException("exists", "InvalidStateError"));
    await expect(
      createPasskeyCredential(creationOptions, {
        environment: environment({ create }),
      }),
    ).rejects.toMatchObject({ reason: "credential_exists" });
  });

  it("treats a null credential as cancellation", async () => {
    const get = vi.fn().mockResolvedValue(null);
    await expect(
      getPasskeyAssertion(requestOptions, {
        environment: environment({ get }),
      }),
    ).rejects.toBeInstanceOf(WebAuthnCeremonyError);
  });

  it("reports invalid authenticator responses", async () => {
    const get = vi
      .fn()
      .mockResolvedValue({ ...assertionCredential(), response: {} });
    await expect(
      getPasskeyAssertion(requestOptions, {
        environment: environment({ get }),
      }),
    ).rejects.toMatchObject({ reason: "invalid_response" });
  });

  it("rejects malformed backend options asynchronously", async () => {
    await expect(
      getPasskeyAssertion(
        { challenge: "bad+" },
        { environment: environment() },
      ),
    ).rejects.toBeInstanceOf(WebAuthnSerializationError);
  });
});
