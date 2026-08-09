export interface RefreshCoordinatedFetchOptions {
  fetch?: typeof globalThis.fetch;
  onSessionExpired: () => Promise<void> | void;
  refreshSession: () => Promise<boolean>;
  shouldRefreshRequest: (
    input: RequestInfo | URL,
    init: RequestInit | undefined,
  ) => boolean;
}

export function createRefreshCoordinatedFetch({
  fetch: suppliedFetch = globalThis.fetch.bind(globalThis),
  onSessionExpired,
  refreshSession,
  shouldRefreshRequest,
}: RefreshCoordinatedFetchOptions): typeof globalThis.fetch {
  let refreshRequest: Promise<boolean> | undefined;
  let sessionExpiration: Promise<void> | undefined;
  let sessionExpired = false;
  let sessionVersion = 0;

  async function refreshOnce(): Promise<boolean> {
    if (!refreshRequest) {
      refreshRequest = Promise.resolve()
        .then(refreshSession)
        .then((refreshed) => {
          if (refreshed) {
            sessionVersion += 1;
          }
          return refreshed;
        })
        .catch(() => false)
        .finally(() => {
          refreshRequest = undefined;
        });
    }
    return refreshRequest;
  }

  async function expireSessionOnce(): Promise<void> {
    sessionExpired = true;
    if (!sessionExpiration) {
      sessionExpiration = Promise.resolve()
        .then(onSessionExpired)
        .catch(() => undefined);
    }
    await sessionExpiration;
  }

  return async function refreshCoordinatedFetch(input, init) {
    const requestSessionVersion = sessionVersion;
    const retryInput = input instanceof Request ? input.clone() : input;
    const response = await suppliedFetch(input, init);

    if (
      response.status !== 401 ||
      sessionExpired ||
      !shouldRefreshRequest(input, init)
    ) {
      return response;
    }

    if (requestSessionVersion === sessionVersion) {
      const refreshed = await refreshOnce();
      if (!refreshed) {
        await expireSessionOnce();
        return response;
      }
    }

    const retryResponse = await suppliedFetch(retryInput, init);
    if (retryResponse.status === 401) {
      await expireSessionOnce();
    }
    return retryResponse;
  };
}
