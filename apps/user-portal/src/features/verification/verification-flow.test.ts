import { ApiError } from "@template/api-client";
import type { StartKycVerificationMutationResponse } from "@template/api-client/kyc";
import { describe, expect, it, vi } from "vitest";
import {
  createVerificationStarter,
  describeKycStartError,
  safeVerificationUrl,
} from "./verification-flow";

const response = (
  verificationUrl: string | null,
): StartKycVerificationMutationResponse => ({
  provider: "kycaid",
  status: "Pending",
  verificationId: "verification-1",
  verificationUrl,
});

describe("verification start workflow", () => {
  it("navigates once to the backend-returned HTTPS URL", async () => {
    const navigate = vi.fn();
    const start = vi
      .fn()
      .mockResolvedValue(response("https://forms.kycaid.com/form/1"));
    const starter = createVerificationStarter({ navigate, start });

    await expect(starter.run()).resolves.toMatchObject({ type: "redirect" });

    expect(start).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("https://forms.kycaid.com/form/1");
  });

  it("ignores duplicate clicks while a request is in flight", async () => {
    let resolve!: (value: StartKycVerificationMutationResponse) => void;
    const start = vi.fn(
      () =>
        new Promise<StartKycVerificationMutationResponse>((done) => {
          resolve = done;
        }),
    );
    const navigate = vi.fn();
    const starter = createVerificationStarter({ navigate, start });

    const first = starter.run();
    await expect(starter.run()).resolves.toEqual({ type: "ignored" });
    resolve(response("https://forms.kycaid.com/form/1"));
    await first;

    expect(start).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledOnce();
  });

  it("keeps a missing URL recoverable and rejects unsafe URLs", async () => {
    const navigate = vi.fn();
    for (const value of [null, "http://forms.kycaid.com/x", "javascript:x"]) {
      const starter = createVerificationStarter({
        navigate,
        start: vi.fn().mockResolvedValue(response(value)),
      });
      await expect(starter.run()).resolves.toEqual({ type: "preparing" });
    }
    expect(navigate).not.toHaveBeenCalled();
    expect(safeVerificationUrl("not a url")).toBeUndefined();
  });

  it.each([
    [400, "first and last name"],
    [404, "profile is not ready"],
    [409, "state changed"],
    [503, "still being prepared"],
  ])(
    "uses status-based messaging for %s without parsing detail",
    (status, text) => {
      expect(
        describeKycStartError(
          new ApiError({
            detail: "fragile provider text",
            kind: "server",
            safeMessage: "Request failed",
            status,
          }),
        ),
      ).toContain(text);
    },
  );
});
