import { TENANT_ID_HEADER } from "@template/api-client";
import { describe, expect, it, vi } from "vitest";
import { createUserPortalBrowserApi } from "./browser-api";

const TENANT_ID = "1203d9d1-2a6b-48ef-9cc1-e561a23aff72";

describe("User Portal browser API", () => {
  it("sends the tenant header for every registration-flow request", async () => {
    const requests: RequestInit[] = [];
    const fetchImplementation = vi.fn<typeof fetch>(async (input, init) => {
      requests.push(init ?? {});
      const path = new URL(input.toString()).pathname;
      if (path.endsWith("/countries")) {
        return Response.json([]);
      }
      if (path.endsWith("/email-existence-checks")) {
        return Response.json({ exists: false });
      }
      if (path.endsWith("/registrations")) {
        return Response.json(
          {
            email: "user@example.com",
            message: "Confirmation sent",
            retryAtUtc: "2026-08-22T10:05:00Z",
          },
          { status: 202 },
        );
      }
      if (path.endsWith("/confirmation-code")) {
        return Response.json({
          message: "Confirmation code requested",
          retryAtUtc: "2026-08-22T10:10:00Z",
        });
      }
      return Response.json({ message: "Email confirmed" });
    });
    const client = createUserPortalBrowserApi({
      apiBaseUrl: "http://api.test",
      fetch: fetchImplementation,
      tenantId: TENANT_ID,
    });

    await client.referenceData.getCountries();
    await client.authentication.checkEmailExistence({
      email: "user@example.com",
    });
    await client.authentication.signUp({
      confirmPassword: "Password1!",
      countryId: "country-id",
      email: "user@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      password: "Password1!",
    });
    await client.authentication.requestEmailConfirmationCode({
      email: "user@example.com",
    });

    expect(requests).toHaveLength(4);
    for (const request of requests) {
      expect(new Headers(request.headers).get(TENANT_ID_HEADER)).toBe(
        TENANT_ID,
      );
    }
  });

  it("routes authenticated profile updates through the same-origin BFF", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const client = createUserPortalBrowserApi({
      apiBaseUrl: "http://api.test",
      fetch: fetchImplementation,
      tenantId: TENANT_ID,
    });

    await client.profiles.updateProfile({
      firstName: "Ada",
      lastName: "Byron",
    });

    expect(fetchImplementation).toHaveBeenCalledOnce();
    const [input, init] = fetchImplementation.mock.calls[0]!;
    expect(input.toString()).toBe("/api/profile");
    expect(init).toMatchObject({
      credentials: "same-origin",
      method: "PUT",
    });
    expect(init?.body).toBe(
      JSON.stringify({ firstName: "Ada", lastName: "Byron" }),
    );
  });

  it("routes password changes through the authenticated same-origin BFF", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const client = createUserPortalBrowserApi({
      apiBaseUrl: "http://api.test",
      fetch: fetchImplementation,
      tenantId: TENANT_ID,
    });
    const request = {
      confirmNewPassword: "NewPassword2!",
      currentPassword: "CurrentPassword1!",
      newPassword: "NewPassword2!",
    };

    await client.authentication.changePassword(request);

    expect(fetchImplementation).toHaveBeenCalledOnce();
    const [input, init] = fetchImplementation.mock.calls[0]!;
    expect(input.toString()).toBe("/api/security/password");
    expect(init).toMatchObject({
      credentials: "same-origin",
      method: "PUT",
    });
    expect(init?.body).toBe(JSON.stringify(request));
  });

  it("routes avatar upload session calls through authenticated BFF routes", async () => {
    const uploadId = "1d130feb-40d9-4ec9-9957-3827dfe02dc5";
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          uploadId,
          uploadUrl: "https://signed-storage.test/avatar",
          method: "PUT",
          headers: { "Content-Type": "image/png" },
          expiresAtUtc: "2026-09-24T10:05:00Z",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ avatarUrl: "https://cdn.test/avatar.png" }),
      );
    const client = createUserPortalBrowserApi({
      apiBaseUrl: "http://api.test",
      fetch: fetchImplementation,
      tenantId: TENANT_ID,
    });
    const createRequest = {
      fileName: "portrait.png",
      contentType: "image/png",
      contentLength: 128,
    };

    await client.profiles.createAvatarUpload(createRequest);
    await client.profiles.completeAvatarUpload({ uploadId });

    expect(fetchImplementation).toHaveBeenNthCalledWith(
      1,
      "/api/profile/avatar/uploads",
      expect.objectContaining({
        body: JSON.stringify(createRequest),
        credentials: "same-origin",
        method: "POST",
      }),
    );
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      2,
      `/api/profile/avatar/uploads/${uploadId}/complete`,
      expect.objectContaining({
        credentials: "same-origin",
        method: "POST",
      }),
    );
  });

  it("leaves unrelated API calls on the configured backend URL", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json([]));
    const client = createUserPortalBrowserApi({
      apiBaseUrl: "http://api.test",
      fetch: fetchImplementation,
      tenantId: TENANT_ID,
    });

    await client.referenceData.getCountries();

    expect(fetchImplementation.mock.calls[0]?.[0].toString()).toBe(
      "http://api.test/api/v1/reference-data/countries",
    );
  });
});
