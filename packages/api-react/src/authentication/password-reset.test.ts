import { ApiError } from "@template/api-client";
import type { AuthenticationClient } from "@template/api-client/authentication";
import { type MutationOptions, QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  completePasswordResetMutationOptions,
  requestPasswordResetMutationOptions,
} from "./authentication.mutations";

const completion = {
  confirmPassword: "Synthetic#Pass1",
  email: "reset@example.test",
  otp: "012345",
  password: "Synthetic#Pass1",
};

function execute<TData, TVariables>(
  queryClient: QueryClient,
  options: MutationOptions<TData, Error, TVariables, unknown>,
  variables: TVariables,
) {
  return queryClient
    .getMutationCache()
    .build(queryClient, options)
    .execute(variables);
}

describe("password-reset mutation options", () => {
  it("forwards the exact request and completion payloads", async () => {
    const client = {
      completePasswordReset: vi.fn().mockResolvedValue({ message: "done" }),
      requestPasswordReset: vi.fn().mockResolvedValue({ message: "sent" }),
    } as unknown as AuthenticationClient;
    const queryClient = new QueryClient();

    await execute(queryClient, requestPasswordResetMutationOptions(client), {
      email: "reset@example.test",
    });
    await execute(
      queryClient,
      completePasswordResetMutationOptions(client),
      completion,
    );

    expect(client.requestPasswordReset).toHaveBeenCalledWith({
      email: "reset@example.test",
    });
    expect(client.completePasswordReset).toHaveBeenCalledWith(completion);
  });

  it("never retries and does not retain sensitive variables", async () => {
    const client = {
      completePasswordReset: vi.fn().mockRejectedValue(
        new ApiError({
          kind: "server",
          safeMessage: "The service is temporarily unavailable.",
          status: 503,
        }),
      ),
      requestPasswordReset: vi.fn(),
    } as unknown as AuthenticationClient;
    const requestOptions = requestPasswordResetMutationOptions(client);
    const completeOptions = completePasswordResetMutationOptions(client);

    for (const options of [requestOptions, completeOptions]) {
      expect(options.gcTime).toBe(0);
      expect(options.retry).toBe(false);
    }

    // Even with a retrying default, the option itself forbids a replay.
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: 3, retryDelay: 0 } },
    });
    await expect(
      execute(queryClient, completeOptions, completion),
    ).rejects.toBeInstanceOf(ApiError);
    expect(client.completePasswordReset).toHaveBeenCalledTimes(1);
  });
});
