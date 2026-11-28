import { ApiError, type ApiClient } from "@template/api-client";
import {
  ApiProvider,
  createApiQueryClient,
} from "@template/api-react/query-client";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ForgotPasswordFlow } from "./forgot-password-flow";

// Synthetic values only; the network boundary is the fake domain client.
const EMAIL = "reset@example.test";
const PASSWORD = "Synthetic#Pass1";

type Screen = Awaited<ReturnType<typeof render>>;

function apiError(
  status: number,
  validationErrors: Record<string, string[]> = {},
) {
  return new ApiError({
    kind:
      status === 429 ? "rate-limited" : status >= 500 ? "server" : "validation",
    safeMessage: "Request failed.",
    status,
    validationErrors,
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, reject, resolve };
}

async function renderFlow() {
  const authentication = {
    completePasswordReset: vi.fn(),
    requestPasswordReset: vi.fn(),
  };
  const queryClient = createApiQueryClient();
  const screen = await render(
    <ApiProvider
      apiClient={{ authentication } as unknown as ApiClient}
      queryClient={queryClient}
    >
      <ForgotPasswordFlow signInDestination="/dashboard" />
    </ApiProvider>,
  );
  return { authentication, queryClient, screen };
}

const emailInput = (screen: Screen) => screen.getByLabelText(/^Email address/);
const codeBox = (screen: Screen, index: number) =>
  screen.getByLabelText(`Character ${index} of 6`);
const newPassword = (screen: Screen) => screen.getByLabelText(/^New password/);
const confirmPassword = (screen: Screen) =>
  screen.getByLabelText(/^Confirm new password/);

async function reachResetStep(
  screen: Screen,
  authentication: { requestPasswordReset: ReturnType<typeof vi.fn> },
  email = EMAIL,
) {
  authentication.requestPasswordReset.mockResolvedValueOnce({ message: "ok" });
  await emailInput(screen).fill(email);
  await screen.getByRole("button", { name: "Send code" }).click();
  await expect
    .element(screen.getByRole("heading", { name: "Enter your reset code" }))
    .toBeVisible();
}

function pasteCode(screen: Screen, code: string) {
  const data = new DataTransfer();
  data.setData("text", code);
  codeBox(screen, 1)
    .element()
    .dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      }),
    );
}

async function fillCompletion(screen: Screen, code = "012345") {
  await codeBox(screen, 1).click();
  pasteCode(screen, code);
  await newPassword(screen).fill(PASSWORD);
  await confirmPassword(screen).fill(PASSWORD);
}

const resetButton = (screen: Screen) =>
  screen.getByRole("button", { name: "Reset password" });

describe("forgot password: request step", () => {
  it("does not request a code for an invalid email", async () => {
    const { authentication, screen } = await renderFlow();
    await emailInput(screen).fill("not-an-email");
    await screen.getByRole("button", { name: "Send code" }).click();

    await expect
      .element(screen.getByText("Enter a valid email address."))
      .toBeVisible();
    expect(authentication.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("requests once with the normalized email and then asks for the code", async () => {
    const { authentication, screen } = await renderFlow();
    const pending = deferred<{ message: string }>();
    authentication.requestPasswordReset.mockReturnValue(pending.promise);

    await emailInput(screen).fill("Reset@Example.TEST");
    const send = screen.getByRole("button", { name: /^Send/ });
    await send.click();
    await expect.element(send).toHaveAttribute("aria-busy", "true");
    await send.click({ force: true });
    expect(authentication.requestPasswordReset).toHaveBeenCalledTimes(1);
    expect(authentication.requestPasswordReset).toHaveBeenCalledWith({
      email: EMAIL,
    });

    pending.resolve({ message: "accepted" });
    await expect
      .element(screen.getByRole("heading", { name: "Enter your reset code" }))
      .toBeVisible();
    await expect.element(screen.getByText(EMAIL)).toBeVisible();
    // Focus follows the step: the first code box is ready for typing.
    await expect.element(codeBox(screen, 1)).toHaveFocus();
  });

  it("stays on the email step when the request fails", async () => {
    const { authentication, screen } = await renderFlow();
    authentication.requestPasswordReset.mockRejectedValue(apiError(503));

    await emailInput(screen).fill(EMAIL);
    await screen.getByRole("button", { name: "Send code" }).click();

    await expect
      .element(screen.getByText("We couldn't send a code"))
      .toBeVisible();
    await expect
      .element(screen.getByRole("heading", { name: "Reset your password" }))
      .toBeVisible();
  });
});

describe("forgot password: code and new password", () => {
  it("never submits on the sixth digit and validates before completing", async () => {
    const { authentication, screen } = await renderFlow();
    await reachResetStep(screen, authentication);

    await codeBox(screen, 1).click();
    await userEvent.keyboard("012345");
    expect(authentication.completePasswordReset).not.toHaveBeenCalled();
    await expect.element(codeBox(screen, 1)).toHaveValue("0");

    await newPassword(screen).fill(PASSWORD);
    await confirmPassword(screen).fill("Synthetic#Pass2");
    await resetButton(screen).click();
    await expect
      .element(screen.getByText("Passwords don't match."))
      .toBeVisible();

    await confirmPassword(screen).fill(PASSWORD);
    await codeBox(screen, 6).click();
    await userEvent.keyboard("{Backspace}");
    await resetButton(screen).click();
    await expect
      .element(screen.getByText("Enter the 6-digit code."))
      .toBeVisible();
    expect(authentication.completePasswordReset).not.toHaveBeenCalled();
  });

  it("rejects letters and fills the whole code from a paste", async () => {
    const { authentication, screen } = await renderFlow();
    await reachResetStep(screen, authentication);

    await codeBox(screen, 1).click();
    await userEvent.keyboard("a");
    await expect.element(codeBox(screen, 1)).toHaveValue("");
    pasteCode(screen, "00 12-34");
    await expect.element(codeBox(screen, 1)).toHaveValue("0");
    await expect.element(codeBox(screen, 6)).toHaveValue("4");
  });

  it("completes once with the exact payload and shows success only afterwards", async () => {
    const { authentication, screen } = await renderFlow();
    await reachResetStep(screen, authentication);
    const pending = deferred<{ message: string }>();
    authentication.completePasswordReset.mockReturnValue(pending.promise);

    await fillCompletion(screen);
    await resetButton(screen).click();
    await expect
      .element(screen.getByRole("button", { name: "Resetting password…" }))
      .toHaveAttribute("aria-busy", "true");
    await screen
      .getByRole("button", { name: "Resetting password…" })
      .click({ force: true });
    expect(authentication.completePasswordReset).toHaveBeenCalledTimes(1);
    expect(authentication.completePasswordReset).toHaveBeenCalledWith({
      confirmPassword: PASSWORD,
      email: EMAIL,
      otp: "012345",
      password: PASSWORD,
    });
    expect(screen.getByText("Password updated").query()).toBeNull();

    pending.resolve({ message: "done" });
    await expect
      .element(screen.getByRole("heading", { name: "Password updated" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: "Sign in" }))
      .toHaveAttribute("href", "/sign-in?email=reset%40example.test");
    expect(document.querySelectorAll("input")).toHaveLength(0);
    expect(document.body.innerHTML).not.toContain(PASSWORD);
    // Focus moves to the success region instead of falling to the body.
    const focused = document.activeElement;
    expect(focused).not.toBe(document.body);
    expect(focused?.querySelector("h1")?.textContent).toBe("Password updated");
  });

  it("explains a wrong, expired or used code and keeps the passwords", async () => {
    const { authentication, screen } = await renderFlow();
    await reachResetStep(screen, authentication);
    authentication.completePasswordReset.mockRejectedValue(apiError(400));

    await fillCompletion(screen);
    await resetButton(screen).click();

    await expect
      .element(screen.getByText("That code didn't work"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Invalid or expired code."))
      .toBeVisible();
    await expect.element(newPassword(screen)).toHaveValue(PASSWORD);

    authentication.requestPasswordReset.mockResolvedValueOnce({ message: "" });
    expect(
      screen.getByRole("button", { name: "Send a new code" }).query(),
    ).toBeNull();
    await screen.getByRole("button", { name: "Resend code" }).click();
    await expect.element(screen.getByText("Code requested")).toBeVisible();
    expect(authentication.requestPasswordReset).toHaveBeenLastCalledWith({
      email: EMAIL,
    });
    await expect.element(codeBox(screen, 1)).toHaveValue("");
    await expect.element(newPassword(screen)).toHaveValue(PASSWORD);
  });

  it.each([
    [apiError(429), "Too many requests"],
    [apiError(503), "We couldn't confirm your password reset"],
    [
      new ApiError({ kind: "network", safeMessage: "Offline." }),
      "We couldn't confirm your password reset",
    ],
  ])("reports %s without advancing", async (error, title) => {
    const { authentication, screen } = await renderFlow();
    await reachResetStep(screen, authentication);
    authentication.completePasswordReset.mockRejectedValue(error);

    await fillCompletion(screen);
    await resetButton(screen).click();

    await expect.element(screen.getByText(title)).toBeVisible();
    await expect.element(resetButton(screen)).toBeVisible();
  });

  it("never claims an unverified outcome after a lost response", async () => {
    const { authentication, screen } = await renderFlow();
    await reachResetStep(screen, authentication);
    authentication.completePasswordReset.mockRejectedValue(
      new ApiError({ kind: "network", safeMessage: "Offline." }),
    );

    await fillCompletion(screen);
    await resetButton(screen).click();

    await expect
      .element(screen.getByText(/try signing in with your new password/))
      .toBeVisible();
    expect(document.body.textContent).not.toMatch(/wasn't changed/i);
    // Recoverable: the code and passwords stay for a retry.
    await expect.element(codeBox(screen, 6)).toHaveValue("5");
    await expect.element(newPassword(screen)).toHaveValue(PASSWORD);
  });

  it("releases the code and passwords held by the mutation once settled", async () => {
    const { authentication, queryClient, screen } = await renderFlow();
    await reachResetStep(screen, authentication);
    authentication.completePasswordReset.mockRejectedValueOnce(apiError(400));

    await fillCompletion(screen);
    await resetButton(screen).click();
    await expect
      .element(screen.getByText("That code didn't work"))
      .toBeVisible();

    await expect
      .poll(() =>
        JSON.stringify(
          queryClient
            .getMutationCache()
            .getAll()
            .map((mutation) => mutation.state.variables),
        ),
      )
      .not.toMatch(/012345|Synthetic/);
  });

  it("keeps focus on the submit button when a completion fails", async () => {
    const { authentication, screen } = await renderFlow();
    await reachResetStep(screen, authentication);
    authentication.completePasswordReset.mockRejectedValue(apiError(429));

    await fillCompletion(screen);
    await resetButton(screen).click();

    await expect.element(screen.getByRole("alert")).toBeVisible();
    await expect.element(resetButton(screen)).toHaveFocus();
  });

  it("maps backend field validation onto the form", async () => {
    const { authentication, screen } = await renderFlow();
    await reachResetStep(screen, authentication);
    authentication.completePasswordReset.mockRejectedValue(
      apiError(400, { Password: ["Passwords must have at least one digit."] }),
    );

    await fillCompletion(screen);
    await resetButton(screen).click();

    await expect
      .element(newPassword(screen))
      .toHaveAccessibleDescription(/Passwords must have at least one digit/);
    expect(screen.getByText("That code didn't work").query()).toBeNull();
  });
});

describe("forgot password: resend and change email", () => {
  it("shows pending, success and failure for a resend", async () => {
    const { authentication, screen } = await renderFlow();
    await reachResetStep(screen, authentication);
    const pending = deferred<{ message: string }>();
    authentication.requestPasswordReset.mockReturnValueOnce(pending.promise);

    await screen.getByRole("button", { name: "Resend code" }).click();
    await expect
      .element(screen.getByRole("button", { name: "Sending…" }))
      .toHaveAttribute("aria-disabled", "true");
    // Still focused: an aria-disabled control does not drop focus.
    await expect
      .element(screen.getByRole("button", { name: "Sending…" }))
      .toHaveFocus();
    pending.resolve({ message: "ok" });
    await expect.element(screen.getByText("Code requested")).toBeVisible();

    authentication.requestPasswordReset.mockRejectedValueOnce(apiError(429));
    await screen.getByRole("button", { name: "Resend code" }).click();
    await expect.element(screen.getByText("Too many requests")).toBeVisible();
    expect(screen.getByText("Code requested").query()).toBeNull();
  });

  it("clears the code, passwords and errors when the email changes", async () => {
    const { authentication, screen } = await renderFlow();
    await reachResetStep(screen, authentication);
    authentication.completePasswordReset.mockRejectedValueOnce(apiError(400));
    await fillCompletion(screen);
    await resetButton(screen).click();
    await expect
      .element(screen.getByText("That code didn't work"))
      .toBeVisible();

    await screen.getByRole("button", { name: "Change email" }).click();
    await expect.element(emailInput(screen)).toHaveValue(EMAIL);
    await expect.element(emailInput(screen)).toHaveFocus();
    expect(screen.getByText("That code didn't work").query()).toBeNull();

    await reachResetStep(screen, authentication, "other@example.test");
    await expect.element(codeBox(screen, 1)).toHaveValue("");
    await expect.element(newPassword(screen)).toHaveValue("");
    await expect.element(confirmPassword(screen)).toHaveValue("");
    expect(screen.getByText("Invalid or expired code.").query()).toBeNull();

    authentication.completePasswordReset.mockResolvedValueOnce({ message: "" });
    await fillCompletion(screen, "654321");
    await resetButton(screen).click();
    await expect
      .element(screen.getByRole("heading", { name: "Password updated" }))
      .toBeVisible();
    expect(authentication.completePasswordReset).toHaveBeenLastCalledWith({
      confirmPassword: PASSWORD,
      email: "other@example.test",
      otp: "654321",
      password: PASSWORD,
    });
  });

  it("ignores a resend reply that arrives after the email changed", async () => {
    const { authentication, screen } = await renderFlow();
    await reachResetStep(screen, authentication);
    const stale = deferred<{ message: string }>();
    authentication.requestPasswordReset.mockReturnValueOnce(stale.promise);

    await screen.getByRole("button", { name: "Resend code" }).click();
    await screen.getByRole("button", { name: "Change email" }).click();
    await reachResetStep(screen, authentication, "other@example.test");

    stale.reject(apiError(429));
    stale.resolve({ message: "late" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByText("Too many requests").query()).toBeNull();
    expect(screen.getByText("Code requested").query()).toBeNull();
    await expect.element(screen.getByText("other@example.test")).toBeVisible();
  });
});
