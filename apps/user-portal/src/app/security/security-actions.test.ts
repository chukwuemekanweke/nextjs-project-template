import { ApiError } from "@template/api-client";
import { describe, expect, it, vi } from "vitest";
import {
  runSecurityAction,
  sessionActionError,
  sessionsLoadError,
} from "./security-actions";

const apiError = (status: number, safeMessage = "Request failed.") =>
  new ApiError({ kind: "unexpected", safeMessage, status });

describe("runSecurityAction", () => {
  it("reports success only after the mutation resolves", async () => {
    let resolve: () => void = () => undefined;
    const mutation = vi.fn(
      () => new Promise<void>((done) => (resolve = () => done())),
    );
    const outcome = runSecurityAction(mutation, "Signed out.", () => "Failed");
    let settled = false;
    void outcome.then(() => (settled = true));

    await Promise.resolve();
    expect(mutation).toHaveBeenCalledTimes(1);
    expect(settled).toBe(false);

    resolve();
    await expect(outcome).resolves.toEqual({
      message: "Signed out.",
      status: "succeeded",
    });
  });

  it("maps a rejected mutation to failure copy instead of success", async () => {
    await expect(
      runSecurityAction(
        () => Promise.reject(apiError(404)),
        "Signed out.",
        sessionActionError,
      ),
    ).resolves.toEqual({
      message: "That session was already signed out.",
      status: "failed",
    });
  });
});

describe("session error copy", () => {
  it("explains sign-out failures without leaking raw errors", () => {
    expect(sessionActionError(apiError(403))).toContain(
      "does not have permission to manage sessions",
    );
    expect(sessionActionError(apiError(500, "Service unavailable."))).toBe(
      "Service unavailable.",
    );
    expect(sessionActionError(new Error("socket at Foo.cs"))).toBe(
      "The session could not be signed out. Try again.",
    );
  });

  it("explains load failures", () => {
    expect(sessionsLoadError(apiError(403))).toContain(
      "does not have permission to view active sessions",
    );
    expect(sessionsLoadError(new Error("x"))).toBe(
      "Active sessions could not be loaded. Refresh and try again.",
    );
  });
});
