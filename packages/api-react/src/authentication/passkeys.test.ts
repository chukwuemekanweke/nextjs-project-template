import type { AuthenticationClient } from "@template/api-client/authentication";
import { type MutationOptions, QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { authenticationKeys } from "./authentication.keys";
import {
  completePasskeyRegistrationMutationOptions,
  createPasskeyRegistrationOptionsMutationOptions,
  removePasskeyMutationOptions,
  renamePasskeyMutationOptions,
} from "./authentication.mutations";
import { passkeysQueryOptions } from "./authentication.queries";

const passkey = {
  createdAtUtc: "2026-11-06T10:00:00Z",
  id: "AQ",
  isBackedUp: false,
  isBackupEligible: false,
  name: "Security key",
  transports: ["usb"],
};

function createClient() {
  return {
    completePasskeyRegistration: vi.fn().mockResolvedValue(passkey),
    createPasskeyRegistrationOptions: vi.fn().mockResolvedValue({
      expiresAtUtc: "2026-11-06T10:05:00Z",
      flowToken: "flow",
      publicKey: {},
    }),
    listPasskeys: vi.fn().mockResolvedValue([passkey]),
    removePasskey: vi.fn().mockResolvedValue(undefined),
    renamePasskey: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuthenticationClient;
}

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

describe("passkey query integration", () => {
  it("lists passkeys under the security key with cancellation", async () => {
    const client = createClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await expect(
      queryClient.fetchQuery(passkeysQueryOptions(client)),
    ).resolves.toEqual([passkey]);
    expect(client.listPasskeys).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
    expect(authenticationKeys.passkeys()).toEqual([
      "authentication",
      "security",
      "passkeys",
    ]);
  });

  it("does not retain registration options or invalidate anything", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const options = createPasskeyRegistrationOptionsMutationOptions(client);
    expect(options.gcTime).toBe(0);

    await execute(queryClient, options, { name: "Laptop" });

    expect(client.createPasskeyRegistrationOptions).toHaveBeenCalledWith({
      name: "Laptop",
    });
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("invalidates only passkeys after successful registration", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const request = {
      credential: {
        clientExtensionResults: {},
        id: "AQ",
        rawId: "AQ",
        response: { attestationObject: "AA", clientDataJSON: "AA" },
        type: "public-key" as const,
      },
      flowToken: "flow",
    };

    await execute(
      queryClient,
      completePasskeyRegistrationMutationOptions(client, queryClient),
      request,
    );

    expect(client.completePasskeyRegistration).toHaveBeenCalledWith(request);
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: authenticationKeys.passkeys(),
    });
  });

  it("does not invalidate after a failed registration", async () => {
    const client = createClient();
    vi.mocked(client.completePasskeyRegistration).mockRejectedValue(
      new Error("expired"),
    );
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await expect(
      execute(
        queryClient,
        completePasskeyRegistrationMutationOptions(client, queryClient),
        {
          credential: {} as never,
          flowToken: "flow",
        },
      ),
    ).rejects.toThrow("expired");
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("renames by credential id and invalidates passkeys", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await execute(
      queryClient,
      renamePasskeyMutationOptions(client, queryClient),
      { credentialId: "AQ", name: "Phone" },
    );

    expect(client.renamePasskey).toHaveBeenCalledWith(
      { credentialId: "AQ" },
      { name: "Phone" },
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: authenticationKeys.passkeys(),
    });
  });

  it("removes by credential id and invalidates passkeys", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await execute(
      queryClient,
      removePasskeyMutationOptions(client, queryClient),
      { credentialId: "AQ" },
    );

    expect(client.removePasskey).toHaveBeenCalledWith({ credentialId: "AQ" });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: authenticationKeys.passkeys(),
    });
  });

  it("does not invalidate after a failed removal", async () => {
    const client = createClient();
    vi.mocked(client.removePasskey).mockRejectedValue(new Error("not found"));
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await expect(
      execute(queryClient, removePasskeyMutationOptions(client, queryClient), {
        credentialId: "AQ",
      }),
    ).rejects.toThrow("not found");
    expect(invalidate).not.toHaveBeenCalled();
  });
});
