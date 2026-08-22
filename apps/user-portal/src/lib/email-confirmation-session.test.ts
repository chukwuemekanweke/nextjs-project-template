import { isApiError } from "@template/api-client";
import { describe, expect, it, vi } from "vitest";
import { confirmEmailSession } from "./email-confirmation-session";

describe("confirmEmailSession", () => {
  it("creates the session through the same-origin confirmation route", async () => {
    const fetchImplementation = vi.fn<typeof globalThis.fetch>(async () =>
      Response.json({
        expiresAtUtc: "2026-08-22T13:00:00Z",
        tokenType: "Bearer",
      }),
    );

    await confirmEmailSession(
      { email: "user@example.com", otp: "123456" },
      { baseUrl: "http://portal.test", fetch: fetchImplementation },
    );

    expect(fetchImplementation).toHaveBeenCalledOnce();
    const [requestUrl, requestInit] = fetchImplementation.mock.calls[0]!;
    expect(requestUrl.toString()).toBe(
      "http://portal.test/api/auth/email-confirmations",
    );
    expect(requestInit).toMatchObject({
      body: JSON.stringify({ email: "user@example.com", otp: "123456" }),
      credentials: "same-origin",
      method: "POST",
    });
  });

  it("preserves backend validation errors", async () => {
    const fetchImplementation = vi.fn<typeof globalThis.fetch>(async () =>
      Response.json(
        {
          errors: { otp: ["The confirmation code is invalid."] },
          title: "Invalid OTP",
        },
        { status: 400 },
      ),
    );

    try {
      await confirmEmailSession(
        { email: "user@example.com", otp: "000000" },
        { baseUrl: "http://portal.test", fetch: fetchImplementation },
      );
      throw new Error("Expected confirmation to fail.");
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect(error).toMatchObject({
        kind: "validation",
        validationErrors: {
          otp: ["The confirmation code is invalid."],
        },
      });
    }
  });
});
