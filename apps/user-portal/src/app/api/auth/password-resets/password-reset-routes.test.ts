import { ApiError } from "@template/api-client";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  client: { kind: "anonymous-server-client" },
  completePasswordReset: vi.fn(),
  createAppServerApiClient: vi.fn(),
  requestPasswordReset: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server-api", () => ({
  createAppServerApiClient: (options: unknown) => {
    mocks.createAppServerApiClient(options);
    return Promise.resolve(mocks.client);
  },
}));
vi.mock("@template/api-client/authentication", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@template/api-client/authentication")
  >()),
  completePasswordReset: mocks.completePasswordReset,
  requestPasswordReset: mocks.requestPasswordReset,
}));

import { POST as completeReset } from "./completions/route";
import { POST as requestReset } from "./route";

// Synthetic values only.
const completion = {
  confirmPassword: "Synthetic#Pass1",
  email: "reset@example.test",
  otp: "012345",
  password: "Synthetic#Pass1",
};

function post(path: string, body: unknown) {
  return new Request(`http://portal.test${path}`, {
    body: typeof body === "string" ? body : JSON.stringify(body),
    method: "POST",
  });
}

function backendError(
  status: number,
  options: Partial<ConstructorParameters<typeof ApiError>[0]> = {},
) {
  return new ApiError({
    kind: status === 429 ? "rate-limited" : "validation",
    safeMessage: "Backend safe message.",
    status,
    ...options,
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("password-reset request BFF", () => {
  it("forwards only the email with an anonymous server client", async () => {
    mocks.requestPasswordReset.mockResolvedValue({ message: "Queued." });

    const response = await requestReset(
      post("/api/auth/password-resets", {
        email: "reset@example.test",
        unexpected: "dropped",
      }),
    );

    expect(mocks.createAppServerApiClient).toHaveBeenCalledWith({
      authenticated: false,
    });
    expect(mocks.requestPasswordReset).toHaveBeenCalledWith(mocks.client, {
      email: "reset@example.test",
    });
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ message: "Queued." });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("answers an unknown email exactly like an accepted request", async () => {
    mocks.requestPasswordReset.mockRejectedValue(
      backendError(404, { title: "Email not found" }),
    );

    const response = await requestReset(
      post("/api/auth/password-resets", { email: "nobody@example.test" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(JSON.stringify(payload)).not.toMatch(/not found|no account/i);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns normalized validation and rate-limit problems", async () => {
    mocks.requestPasswordReset.mockRejectedValueOnce(
      backendError(400, { validationErrors: { Email: ["Invalid email."] } }),
    );
    const invalid = await requestReset(
      post("/api/auth/password-resets", { email: "x" }),
    );
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toMatchObject({
      errors: { Email: ["Invalid email."] },
      status: 400,
    });
    expect(invalid.headers.get("cache-control")).toBe("no-store");

    mocks.requestPasswordReset.mockRejectedValueOnce(
      backendError(429, { code: "rate_limited" }),
    );
    const limited = await requestReset(
      post("/api/auth/password-resets", { email: "reset@example.test" }),
    );
    expect(limited.status).toBe(429);
    await expect(limited.json()).resolves.toMatchObject({
      code: "rate_limited",
    });
  });

  it("does not leak unexpected failures", async () => {
    mocks.requestPasswordReset.mockRejectedValue(
      new Error("provider stack trace"),
    );
    const response = await requestReset(
      post("/api/auth/password-resets", "not json"),
    );
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("stack trace");
  });
});

describe("password-reset completion BFF", () => {
  it("forwards the exact contract and creates no session", async () => {
    mocks.completePasswordReset.mockResolvedValue({ message: "Reset." });

    const response = await completeReset(
      post("/api/auth/password-resets/completions", {
        ...completion,
        rememberMe: true,
      }),
    );

    expect(mocks.createAppServerApiClient).toHaveBeenCalledWith({
      authenticated: false,
    });
    expect(mocks.completePasswordReset).toHaveBeenCalledWith(
      mocks.client,
      completion,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: "Reset." });
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("keeps the backend's combined invalid-code problem", async () => {
    mocks.completePasswordReset.mockRejectedValue(
      backendError(400, { title: "Invalid OTP" }),
    );

    const response = await completeReset(
      post("/api/auth/password-resets/completions", completion),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.errors).toEqual({});
    expect(JSON.stringify(payload)).not.toContain("012345");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("folds an unknown email into the invalid-code outcome", async () => {
    mocks.completePasswordReset.mockRejectedValue(
      backendError(404, { title: "Email not found" }),
    );

    const response = await completeReset(
      post("/api/auth/password-resets/completions", completion),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).not.toHaveProperty("errors");
    expect(JSON.stringify(payload)).not.toMatch(/not found|no account/i);
  });

  it("returns field validation problems for the form", async () => {
    mocks.completePasswordReset.mockRejectedValue(
      backendError(400, {
        validationErrors: { Password: ["Password is too weak."] },
      }),
    );

    const response = await completeReset(
      post("/api/auth/password-resets/completions", completion),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      errors: { Password: ["Password is too weak."] },
    });
  });
});
