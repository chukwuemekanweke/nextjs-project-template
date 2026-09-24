import { describe, expect, it } from "vitest";
import {
  GOOGLE_AUTH_ERROR_CODES,
  googleAuthenticationError,
  googleErrorFromResponse,
} from "./google-authentication";

describe("Google authentication errors", () => {
  it.each([
    GOOGLE_AUTH_ERROR_CODES.flowExpired,
    GOOGLE_AUTH_ERROR_CODES.flowInvalid,
    GOOGLE_AUTH_ERROR_CODES.flowConsumed,
    GOOGLE_AUTH_ERROR_CODES.invalidCredential,
  ])("offers a safe restart for %s", (code) => {
    expect(googleAuthenticationError(code, 400)).toMatchObject({
      code,
      restartRequired: true,
    });
  });

  it("maps stable codes without presenting backend details", async () => {
    const response = Response.json(
      {
        code: GOOGLE_AUTH_ERROR_CODES.accountLocked,
        detail: "sensitive backend detail",
      },
      { status: 423 },
    );

    const error = await googleErrorFromResponse(response);

    expect(error.message).toContain("temporarily locked");
    expect(error.message).not.toContain("sensitive");
  });

  it("uses the stable invalid-credentials code for a wrong link password", () => {
    expect(
      googleAuthenticationError(
        GOOGLE_AUTH_ERROR_CODES.invalidCredentials,
        401,
      ),
    ).toMatchObject({
      message: "The password is incorrect.",
      restartRequired: false,
    });
  });

  it("uses a generic message for provider and unreadable failures", async () => {
    const error = await googleErrorFromResponse(
      new Response("gateway failed", { status: 502 }),
    );

    expect(error.message).toContain("temporarily unavailable");
  });

  it("retains structured validation errors without trusting detail text", async () => {
    const error = await googleErrorFromResponse(
      Response.json(
        { errors: { CountryId: ["Select a valid country."] } },
        { status: 400 },
      ),
    );

    expect(error.validationErrors).toEqual({
      CountryId: ["Select a valid country."],
    });
  });
});
