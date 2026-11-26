import { ApiError } from "@template/api-client";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { AdminUserDetailScreen } from "./user-detail";
import type {
  AdminUserActionRequest,
  AdminUserDetailRecord,
} from "./users-model";
import {
  fixtureRoles,
  fixtureUserDetail,
  fixtureUserDetailRecord,
} from "./users-preview.fixtures";

/*
 * Interaction tests for the user detail action lifecycle: the captured
 * target, invalidation when the record changes, pending/duplicate
 * protection, failure and retry. Preview fixtures only; no API.
 */

const ready = (record: AdminUserDetailRecord) =>
  ({ record, state: "ready" }) as const;

const otherUser = fixtureUserDetailRecord({
  displayName: "Avery Fixture",
  email: "avery@fixture.test",
  id: "usr-fixture-0001",
});

function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, reject, resolve };
}

async function enterCode(code: string) {
  const first = document.getElementById(
    document.querySelector<HTMLLabelElement>("label[for$='-code-0']")
      ?.htmlFor ?? "",
  );
  if (!first) {
    throw new Error("Authenticator code input not found");
  }
  await userEvent.click(first);
  await userEvent.keyboard(code);
}

describe("user detail privileged actions", () => {
  it("revokes exactly the session that was confirmed", async () => {
    const onAction = vi.fn(() => Promise.resolve());
    const screen = await render(
      <AdminUserDetailScreen
        model={ready(fixtureUserDetailRecord())}
        onAction={onAction}
      />,
    );

    await screen
      .getByRole("button", { name: "Revoke Safari on iPhone" })
      .click();
    const dialog = screen.getByRole("dialog", { name: "Revoke this session?" });
    await expect.element(dialog).toHaveTextContent("Safari on iPhone");
    await dialog.getByRole("button", { name: "Revoke session" }).click();

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({
      intent: {
        sessionId: "ses-fixture-2",
        sessionLabel: "Safari on iPhone",
        type: "revokeSession",
        userId: fixtureUserDetail.id,
      },
    });
    await expect.element(dialog).not.toBeInTheDocument();
  });

  it("closes the confirmation instead of acting on a different user", async () => {
    const onAction = vi.fn(() => Promise.resolve());
    const screen = await render(
      <AdminUserDetailScreen
        model={ready(fixtureUserDetailRecord())}
        onAction={onAction}
      />,
    );
    await screen.getByRole("button", { name: "Lock account" }).click();
    await expect
      .element(screen.getByRole("dialog", { name: "Confirm it's you" }))
      .toHaveTextContent("Lock Blake Fixture");

    await screen.rerender(
      <AdminUserDetailScreen model={ready(otherUser)} onAction={onAction} />,
    );

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect
      .element(screen.getByText(/confirmation was closed/))
      .toBeVisible();
    expect(onAction).not.toHaveBeenCalled();
  });

  it("closes the confirmation when the account status no longer allows it", async () => {
    const onAction = vi.fn(() => Promise.resolve());
    const screen = await render(
      <AdminUserDetailScreen
        model={ready(fixtureUserDetailRecord())}
        onAction={onAction}
      />,
    );
    await screen.getByRole("button", { name: "Lock account" }).click();
    await expect.element(screen.getByRole("dialog")).toBeVisible();

    await screen.rerender(
      <AdminUserDetailScreen
        model={ready(fixtureUserDetailRecord({ accountStatus: "locked" }))}
        onAction={onAction}
      />,
    );

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Unlock account" }))
      .toBeVisible();
    expect(onAction).not.toHaveBeenCalled();
  });

  it("drops a role assignment when the catalogue no longer offers the role", async () => {
    const onAction = vi.fn(() => Promise.resolve());
    const record = fixtureUserDetailRecord();
    const screen = await render(
      <AdminUserDetailScreen model={ready(record)} onAction={onAction} />,
    );
    await screen
      .getByLabelText("Role to assign")
      .selectOptions(fixtureRoles.finance.id);
    await screen.getByRole("button", { name: "Assign role" }).click();
    await expect
      .element(screen.getByRole("dialog"))
      .toHaveTextContent(`Assign ${fixtureRoles.finance.name}`);

    await screen.rerender(
      <AdminUserDetailScreen
        model={ready({
          ...record,
          assignableRoles: {
            data: [fixtureRoles.support, fixtureRoles.compliance],
            state: "ready",
          },
        })}
        onAction={onAction}
      />,
    );

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect
      .element(screen.getByLabelText("Role to assign"))
      .toHaveValue("");
    await expect
      .element(screen.getByRole("button", { name: "Assign role" }))
      .toBeDisabled();
    expect(onAction).not.toHaveBeenCalled();
  });

  it("sends a step-up request once while pending and blocks dismissal", async () => {
    const request = deferred();
    const onAction = vi.fn<(input: AdminUserActionRequest) => Promise<void>>(
      () => request.promise,
    );
    const screen = await render(
      <AdminUserDetailScreen
        model={ready(fixtureUserDetailRecord())}
        onAction={onAction}
      />,
    );
    await screen.getByRole("button", { name: "Sign out all sessions" }).click();
    await enterCode("123456");
    const confirm = screen
      .getByRole("dialog")
      .getByRole("button", { name: "Sign out all sessions" });
    await confirm.click();
    await confirm.click({ force: true });
    await userEvent.keyboard("{Enter}");

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({
      intent: { type: "signOutAll", userId: fixtureUserDetail.id },
      stepUp: { code: "123456" },
    });
    await expect
      .element(
        screen.getByRole("dialog").getByRole("button", { name: "Cancel" }),
      )
      .toBeDisabled();
    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByRole("dialog")).toBeVisible();

    request.resolve();
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect
      .element(screen.getByText(/successfully/i))
      .not.toBeInTheDocument();
  });

  it("keeps the dialog open with safe copy after a failure and allows a retry", async () => {
    const onAction = vi
      .fn<(input: AdminUserActionRequest) => Promise<void>>()
      .mockRejectedValueOnce(
        new ApiError({ kind: "conflict", safeMessage: "Raw backend detail" }),
      )
      .mockResolvedValueOnce(undefined);
    const screen = await render(
      <AdminUserDetailScreen
        model={ready(fixtureUserDetailRecord())}
        onAction={onAction}
      />,
    );
    await screen
      .getByRole("button", { name: "Revoke Safari on iPhone" })
      .click();
    const dialog = screen.getByRole("dialog");
    await dialog.getByRole("button", { name: "Revoke session" }).click();

    await expect
      .element(dialog)
      .toHaveTextContent(
        "This record changed and no longer allows the action.",
      );
    await expect.element(dialog).not.toHaveTextContent("Raw backend detail");

    await dialog.getByRole("button", { name: "Revoke session" }).click();
    expect(onAction).toHaveBeenCalledTimes(2);
    expect(onAction.mock.calls[1]?.[0].intent).toMatchObject({
      sessionId: "ses-fixture-2",
      userId: fixtureUserDetail.id,
    });
    await expect.element(dialog).not.toBeInTheDocument();
  });

  it("clears the failure and the code when the confirmation is dismissed", async () => {
    const onAction = vi
      .fn<(input: AdminUserActionRequest) => Promise<void>>()
      .mockRejectedValue(new ApiError({ kind: "server", safeMessage: "x" }));
    const screen = await render(
      <AdminUserDetailScreen
        model={ready(fixtureUserDetailRecord())}
        onAction={onAction}
      />,
    );
    await screen.getByRole("button", { name: "Lock account" }).click();
    await enterCode("654321");
    await screen
      .getByRole("dialog")
      .getByRole("button", { name: "Lock account" })
      .click();
    await expect
      .element(screen.getByRole("dialog"))
      .toHaveTextContent("Try again in a moment.");

    await screen
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel" })
      .click();
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();

    await screen.getByRole("button", { name: "Lock account" }).click();
    const reopened = screen.getByRole("dialog");
    await expect
      .element(reopened)
      .not.toHaveTextContent("Try again in a moment.");
    for (const input of document.querySelectorAll<HTMLInputElement>(
      "[role='dialog'] input",
    )) {
      expect(input.value).toBe("");
    }
  });
});
