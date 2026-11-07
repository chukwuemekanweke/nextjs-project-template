import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApiClient, isApiError } from "../client";
import {
  completePasskeyAuthentication,
  completePasskeyRegistration,
  createAuthenticationClient,
  createPasskeyAuthenticationOptions,
  createPasskeyRegistrationOptions,
  listPasskeys,
  removePasskey,
  renamePasskey,
} from "./index";
import type {
  AuthenticationResponseJson,
  RegistrationResponseJson,
} from "./contracts";

const server = setupServer();
const base = "http://api.test/api/v1/authentication/passkeys";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const client = () => createApiClient({ baseUrl: "http://api.test" });

const registrationCredential: RegistrationResponseJson = {
  clientExtensionResults: {},
  id: "AQ",
  rawId: "AQ",
  response: { attestationObject: "AgM", clientDataJSON: "BA" },
  type: "public-key",
};
const assertion: AuthenticationResponseJson = {
  clientExtensionResults: {},
  id: "AQ",
  rawId: "AQ",
  response: { authenticatorData: "BQ", clientDataJSON: "BA", signature: "Bw" },
  type: "public-key",
};
const passkey = {
  createdAtUtc: "2026-11-06T10:00:00Z",
  id: "AQ",
  isBackedUp: true,
  isBackupEligible: true,
  name: "Work laptop",
  transports: ["internal"],
};

describe("passkey operations", () => {
  it("requests registration options with the friendly name", async () => {
    const options = {
      expiresAtUtc: "2026-11-06T10:05:00Z",
      flowToken: "flow",
      publicKey: {
        challenge: "AQID",
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        rp: { name: "Portal" },
        user: { displayName: "Ada", id: "AQ", name: "ada" },
      },
    };
    server.use(
      http.post(`${base}/registration-options`, async ({ request }) => {
        expect(await request.json()).toEqual({ name: "Work laptop" });
        return HttpResponse.json(options);
      }),
    );
    await expect(
      createPasskeyRegistrationOptions(client(), { name: "Work laptop" }),
    ).resolves.toEqual(options);
  });

  it("completes registration with the flow token and serialized credential", async () => {
    server.use(
      http.post(`${base}/registrations`, async ({ request }) => {
        expect(await request.json()).toEqual({
          credential: registrationCredential,
          flowToken: "flow",
        });
        return HttpResponse.json(passkey, { status: 201 });
      }),
    );
    await expect(
      completePasskeyRegistration(client(), {
        credential: registrationCredential,
        flowToken: "flow",
      }),
    ).resolves.toEqual(passkey);
  });

  it.each([
    [410, "expired"],
    [409, "consumed or duplicate"],
    [400, "invalid"],
  ])("surfaces a %s registration failure (%s) as ApiError", async (status) => {
    server.use(
      http.post(`${base}/registrations`, () =>
        HttpResponse.json(
          { status, title: "Passkey failure" },
          { status, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    );
    const error: unknown = await completePasskeyRegistration(client(), {
      credential: registrationCredential,
      flowToken: "flow",
    }).catch((caught: unknown) => caught);
    expect(isApiError(error) && error.status).toBe(status);
  });

  it("requests discoverable authentication options without a body", async () => {
    server.use(
      http.post(`${base}/authentication-options`, async ({ request }) => {
        expect(await request.text()).toBe("");
        return HttpResponse.json({
          expiresAtUtc: "2026-11-06T10:05:00Z",
          flowToken: "flow",
          publicKey: { challenge: "AQID" },
        });
      }),
    );
    await expect(
      createPasskeyAuthenticationOptions(client()),
    ).resolves.toMatchObject({ flowToken: "flow" });
  });

  it("completes authentication and preserves the backend outcome", async () => {
    const session = {
      accessToken: "access",
      accessTokenExpiresAtUtc: "2026-11-06T11:00:00Z",
      outcome: "authenticated",
      refreshToken: "refresh",
      refreshTokenExpiresAtUtc: "2026-12-06T11:00:00Z",
      tokenType: "Bearer",
    };
    server.use(
      http.post(`${base}/authentication-completions`, async ({ request }) => {
        expect(await request.json()).toEqual({
          credential: assertion,
          flowToken: "flow",
        });
        return HttpResponse.json(session);
      }),
    );
    await expect(
      completePasskeyAuthentication(client(), {
        credential: assertion,
        flowToken: "flow",
      }),
    ).resolves.toEqual(session);
  });

  it("lists, renames, and removes passkeys by encoded credential id", async () => {
    server.use(
      http.get(base, () => HttpResponse.json([passkey])),
      http.patch(`${base}/:credentialId`, async ({ params, request }) => {
        expect(params.credentialId).toBe("a_b-c");
        expect(await request.json()).toEqual({ name: "Phone" });
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete(`${base}/:credentialId`, ({ params }) => {
        expect(params.credentialId).toBe("a_b-c");
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await expect(listPasskeys(client())).resolves.toEqual([passkey]);
    await expect(
      renamePasskey(client(), { credentialId: "a_b-c" }, { name: "Phone" }),
    ).resolves.toBeUndefined();
    await expect(
      removePasskey(client(), { credentialId: "a_b-c" }),
    ).resolves.toBeUndefined();
  });

  it("encodes credential ids so they cannot alter the route", async () => {
    server.use(
      http.delete(`${base}/:credentialId`, ({ request }) => {
        expect(new URL(request.url).pathname).toBe(
          "/api/v1/authentication/passkeys/..%2Fsessions",
        );
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await removePasskey(client(), { credentialId: "../sessions" });
  });

  it("exposes every passkey operation on the domain client", async () => {
    server.use(http.get(base, () => HttpResponse.json([])));
    const authentication = createAuthenticationClient(client());
    await expect(authentication.listPasskeys()).resolves.toEqual([]);
    expect(typeof authentication.renamePasskey).toBe("function");
    expect(typeof authentication.removePasskey).toBe("function");
    expect(typeof authentication.completePasskeyAuthentication).toBe(
      "function",
    );
  });
});
