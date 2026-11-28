import { ApiError } from "@template/api-client";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentKycVerification: vi.fn(),
  serverClient: { authenticated: true, tenant: true },
  startKycVerification: vi.fn(),
}));

vi.mock("@/lib/server-api", () => ({
  createAppServerApiClient: () => Promise.resolve(mocks.serverClient),
}));
vi.mock("@template/api-client/kyc", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@template/api-client/kyc")>()),
  getCurrentKycVerification: mocks.getCurrentKycVerification,
  startKycVerification: mocks.startKycVerification,
}));

import { GET } from "./route";
import { POST } from "./start/route";

afterEach(() => vi.clearAllMocks());

describe("KYC BFF routes", () => {
  it("reads current verification through the authenticated tenant client", async () => {
    mocks.getCurrentKycVerification.mockResolvedValue({
      isVerified: false,
      status: "NotStarted",
      verificationUrl: null,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.getCurrentKycVerification).toHaveBeenCalledWith(
      mocks.serverClient,
    );
  });

  it("starts without forwarding caller-controlled stakeholder fields", async () => {
    const continuation = {
      provider: "kycaid",
      status: "Pending",
      verificationId: "verification-1",
      verificationUrl: "https://forms.kycaid.com/form/1",
    };
    mocks.startKycVerification.mockResolvedValue(continuation);

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(continuation);
    expect(mocks.startKycVerification).toHaveBeenCalledWith(mocks.serverClient);
  });

  it.each([401, 400, 404, 409, 503])(
    "preserves a normalized backend %s without internal detail",
    async (status) => {
      mocks.startKycVerification.mockRejectedValue(
        new ApiError({
          detail: "provider-internal-detail",
          kind: status === 401 ? "unauthorized" : "server",
          safeMessage: "Verification could not be started.",
          status,
        }),
      );

      const response = await POST();

      expect(response.status).toBe(status);
      expect(JSON.stringify(await response.json())).not.toContain(
        "provider-internal-detail",
      );
    },
  );
});
