import { ApiError } from "@template/api-client";
import { describe, expect, it } from "vitest";
import {
  classifyPasswordResetFailure,
  createAttemptGuard,
  createPasswordResetCompletion,
  normalizePasswordResetEmail,
  passwordResetCompletionSchema,
  passwordResetEmailSchema,
} from "./password-reset";

// Synthetic values only.
const valid = {
  confirmPassword: "Synthetic#Pass1",
  otp: "012345",
  password: "Synthetic#Pass1",
};

function apiError(status: number, validationErrors = {}) {
  return new ApiError({
    kind: status === 429 ? "rate-limited" : "validation",
    safeMessage: "Request failed.",
    status,
    validationErrors,
  });
}

function otpIssues(otp: string) {
  const result = passwordResetCompletionSchema.safeParse({ ...valid, otp });
  return result.success
    ? []
    : result.error.issues.filter((issue) => issue.path[0] === "otp");
}

describe("password-reset request", () => {
  it("rejects an invalid email before any request", () => {
    expect(passwordResetEmailSchema.safeParse({ email: "nope" }).success).toBe(
      false,
    );
    expect(
      passwordResetEmailSchema.safeParse({ email: "ada@example.test" }).success,
    ).toBe(true);
  });

  it("normalizes the email the same way as registration and the backend", () => {
    expect(normalizePasswordResetEmail("  Ada@Example.TEST ")).toBe(
      "ada@example.test",
    );
  });
});

describe("password-reset completion schema", () => {
  it("accepts exactly six digits and keeps leading zeroes as text", () => {
    const parsed = passwordResetCompletionSchema.parse({
      ...valid,
      otp: "000123",
    });
    expect(parsed.otp).toBe("000123");
    expect(typeof parsed.otp).toBe("string");
  });

  it.each(["", "12345", "1234567", "12a456", "12 456", "١٢٣٤٥٦"])(
    "rejects the incomplete or unsupported code %j",
    (otp) => {
      expect(otpIssues(otp)).toHaveLength(1);
    },
  );

  it("requires matching passwords", () => {
    const result = passwordResetCompletionSchema.safeParse({
      ...valid,
      confirmPassword: "Synthetic#Pass2",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        message: "Passwords don't match.",
        path: ["confirmPassword"],
      }),
    ]);
  });

  it.each([
    ["Sh#1a", "at least 8 characters"],
    ["synthetic#pass1", "uppercase"],
    ["SYNTHETIC#PASS1", "lowercase"],
    ["Synthetic#Pass", "digit"],
    ["SyntheticPass1", "non-alphanumeric"],
  ])("enforces the backend password policy for %j", (password, rule) => {
    const result = passwordResetCompletionSchema.safeParse({
      ...valid,
      confirmPassword: password,
      password,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(rule);
  });
});

describe("createPasswordResetCompletion", () => {
  it("sends the accepted email with the untouched code and passwords", () => {
    expect(
      createPasswordResetCompletion("ada@example.test", {
        confirmPassword: " Synthetic#Pass1 ",
        otp: "012345",
        password: " Synthetic#Pass1 ",
      }),
    ).toEqual({
      confirmPassword: " Synthetic#Pass1 ",
      email: "ada@example.test",
      otp: "012345",
      password: " Synthetic#Pass1 ",
    });
  });
});

describe("classifyPasswordResetFailure", () => {
  it("treats a 400 without field errors as one invalid-code outcome", () => {
    expect(classifyPasswordResetFailure(apiError(400), "complete")).toBe(
      "invalid_code",
    );
    expect(classifyPasswordResetFailure(apiError(404), "complete")).toBe(
      "invalid_code",
    );
  });

  it("keeps field validation, rate limits and outages distinct", () => {
    expect(
      classifyPasswordResetFailure(
        apiError(400, { Password: ["Too weak."] }),
        "complete",
      ),
    ).toBe("validation");
    expect(classifyPasswordResetFailure(apiError(429), "complete")).toBe(
      "rate_limited",
    );
    expect(classifyPasswordResetFailure(apiError(429), "request")).toBe(
      "rate_limited",
    );
    expect(classifyPasswordResetFailure(apiError(503), "complete")).toBe(
      "unavailable",
    );
    expect(
      classifyPasswordResetFailure(new TypeError("offline"), "request"),
    ).toBe("unavailable");
    // A request has no code, so a bare 400 is not an invalid code.
    expect(classifyPasswordResetFailure(apiError(400), "request")).toBe(
      "unavailable",
    );
  });
});

describe("createAttemptGuard", () => {
  it("returns current results and errors", async () => {
    const guard = createAttemptGuard();
    await expect(guard.run(() => Promise.resolve("ok"))).resolves.toEqual({
      status: "fulfilled",
      value: "ok",
    });
    const error = new Error("failed");
    await expect(guard.run(() => Promise.reject(error))).resolves.toEqual({
      error,
      status: "rejected",
    });
  });

  it("marks replies from an abandoned attempt as stale", async () => {
    const guard = createAttemptGuard();
    let resolve!: (value: string) => void;
    let reject!: (error: Error) => void;
    const success = guard.run(
      () => new Promise<string>((done) => (resolve = done)),
    );
    const failure = guard.run(
      () => new Promise<string>((_, fail) => (reject = fail)),
    );

    guard.advance();
    resolve("late");
    reject(new Error("late"));

    await expect(success).resolves.toEqual({ status: "stale" });
    await expect(failure).resolves.toEqual({ status: "stale" });
  });
});
