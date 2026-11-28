import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApiClient } from "../api-client";
import { ApiError } from "../client";
import { getCurrentKycVerification, startKycVerification } from "./operations";

const base = "http://api.test/api/v1/stakeholders/me/kyc";
const tenantId = "1203d9d1-2a6b-48ef-9cc1-e561a23aff72";
const verificationId = "019a0000-0000-7000-8000-000000000001";
const server = setupServer();
const client = () =>
  createApiClient({
    baseUrl: "http://api.test",
    defaultHeaders: { "X-Tenant-Id": tenantId },
  });

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("KYC operations", () => {
  it("gets the authenticated stakeholder's current verification", async () => {
    const response = {
      completedAtUtc: null,
      isVerified: false,
      provider: "kycaid",
      startedAtUtc: "2026-11-28T12:00:00Z",
      status: "Pending",
      submittedAtUtc: null,
      verificationId,
      verificationUrl: "https://forms.kycaid.com/form/1",
    };
    server.use(
      http.get(base, ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBe(tenantId);
        expect(request.method).toBe("GET");
        return HttpResponse.json(response);
      }),
    );

    await expect(getCurrentKycVerification(client())).resolves.toEqual(
      response,
    );
  });

  it("preserves nullable fields when no attempt exists", async () => {
    const response = {
      completedAtUtc: null,
      isVerified: false,
      provider: null,
      startedAtUtc: null,
      status: "NotStarted",
      submittedAtUtc: null,
      verificationId: null,
      verificationUrl: null,
    };
    server.use(http.get(base, () => HttpResponse.json(response)));

    await expect(client().kyc.getCurrentKycVerification()).resolves.toEqual(
      response,
    );
  });

  it("starts or resumes verification with no request body", async () => {
    const response = {
      provider: "kycaid",
      status: "Pending",
      verificationId,
      verificationUrl: "https://forms.kycaid.com/form/1",
    };
    server.use(
      http.post(`${base}/start`, async ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBe(tenantId);
        expect(request.headers.get("Content-Type")).toBeNull();
        expect(await request.text()).toBe("");
        return HttpResponse.json(response);
      }),
    );

    await expect(startKycVerification(client())).resolves.toEqual(response);
  });

  it.each([400, 401, 404, 409, 503])(
    "normalizes a %s start response",
    async (status) => {
      server.use(
        http.post(`${base}/start`, () =>
          HttpResponse.json(
            { detail: "Provider detail", status, title: "Request failed" },
            { status },
          ),
        ),
      );

      const error = await startKycVerification(client()).catch(
        (caught: unknown) => caught,
      );
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(status);
    },
  );
});
