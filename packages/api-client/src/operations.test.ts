import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { signIn } from "./authentication";
import { createApiClient } from "./client";
import { getWalletTopUpTransaction, getWalletTransactions } from "./payments";
import { getProfile, uploadAvatar } from "./profiles";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("handwritten API operations", () => {
  it("signs in with the contract request and response", async () => {
    server.use(
      http.post(
        "http://api.test/api/v1/authentication/sessions",
        async ({ request }) => {
          expect(await request.json()).toEqual({
            email: "user@example.com",
            password: "Password1!",
          });
          return HttpResponse.json({
            accessToken: "access",
            expiresAtUtc: "2026-08-01T00:00:00Z",
            refreshToken: "refresh",
            refreshTokenExpiresAtUtc: "2026-08-31T00:00:00Z",
            tokenType: "Bearer",
          });
        },
      ),
    );
    const result = await signIn(
      createApiClient({ baseUrl: "http://api.test" }),
      {
        email: "user@example.com",
        password: "Password1!",
      },
    );
    expect(result.accessToken).toBe("access");
  });

  it("serializes wallet query and path parameters", async () => {
    server.use(
      http.get(
        "http://api.test/api/v1/payments/wallet-transactions",
        ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("Limit")).toBe("25");
          expect(url.searchParams.get("Cursor")).toBe("next");
          return HttpResponse.json({ nextCursor: null, transactions: [] });
        },
      ),
      http.get(
        "http://api.test/api/v1/payments/wallet-transactions/top-ups/:id",
        ({ params }) => {
          expect(params.id).toBe("transaction-id");
          return HttpResponse.json({
            amount: 20,
            currencyCode: "NGN",
            description: null,
            merchantReference: "merchant-ref",
            paymentMethodType: "bank-transfer",
            paymentProviderName: "Provider",
            timestamp: "2026-07-31T00:00:00Z",
            transactionTitle: "Top up",
            walletTransactionId: "transaction-id",
          });
        },
      ),
    );
    const client = createApiClient({ baseUrl: "http://api.test" });
    await expect(
      getWalletTransactions(client, { Cursor: "next", Limit: 25 }),
    ).resolves.toEqual({ nextCursor: null, transactions: [] });
    await expect(
      getWalletTopUpTransaction(client, {
        walletTransactionId: "transaction-id",
      }),
    ).resolves.toMatchObject({ walletTransactionId: "transaction-id" });
  });

  it("uploads an avatar as multipart form data", async () => {
    server.use(
      http.post(
        "http://api.test/api/v1/stakeholders/me/profile/avatar",
        async ({ request }) => {
          const form = await request.formData();
          expect(form.get("Avatar")).toBeTruthy();
          return HttpResponse.json({
            avatarUrl: "https://cdn.test/avatar.png",
          });
        },
      ),
    );
    const avatar = new Blob(["avatar"], { type: "image/png" });
    await expect(
      uploadAvatar(createApiClient({ baseUrl: "http://api.test" }), {
        Avatar: avatar,
      }),
    ).resolves.toEqual({
      avatarUrl: "https://cdn.test/avatar.png",
    });
  });

  it("gets the authenticated stakeholder profile", async () => {
    const profile = {
      stakeholderId: "stakeholder-1",
      emailAddress: "user@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      avatarUrl: null,
      isVerified: true,
    };
    server.use(
      http.get("http://api.test/api/v1/stakeholders/me/profile", () =>
        HttpResponse.json(profile),
      ),
    );

    await expect(
      getProfile(createApiClient({ baseUrl: "http://api.test" })),
    ).resolves.toEqual(profile);
  });
});
