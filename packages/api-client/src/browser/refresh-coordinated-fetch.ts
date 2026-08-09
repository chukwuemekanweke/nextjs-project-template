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
  onSessionExpired: expireSession,
  refreshSession,
  shouldRefreshRequest: shouldRefresh,
}: RefreshCoordinatedFetchOptions): typeof globalThis.fetch {
  let activeRefresh: Promise<boolean> | undefined;
  let activeExpiration: Promise<void> | undefined;
  let sessionExpired = false;
  let sessionVersion = 0;

  async function performRefresh(): Promise<boolean> {
    try {
      const refreshSucceeded = await refreshSession();
      if (refreshSucceeded) {
        sessionVersion += 1;
      }
      return refreshSucceeded;
    } catch {
      return false;
    }
  }

  async function runActiveRefresh(): Promise<boolean> {
    try {
      return await performRefresh();
    } finally {
      activeRefresh = undefined;
    }
  }

  function refreshOnce(): Promise<boolean> {
    if (!activeRefresh) {
      activeRefresh = runActiveRefresh();
    }
    return activeRefresh;
  }

  async function performExpiration(): Promise<void> {
    try {
      await expireSession();
    } catch {
      // Expiration is best effort and must not replace the request response.
    }
  }

  function expireOnce(): Promise<void> {
    sessionExpired = true;
    if (!activeExpiration) {
      activeExpiration = performExpiration();
    }
    return activeExpiration;
  }

  async function send(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const startingSessionVersion = sessionVersion;
    const retryInput = input instanceof Request ? input.clone() : input;
    const response = await suppliedFetch(input, init);

    if (
      response.status !== 401 ||
      sessionExpired ||
      !shouldRefresh(input, init)
    ) {
      return response;
    }

    if (startingSessionVersion === sessionVersion) {
      const refreshSucceeded = await refreshOnce();
      if (!refreshSucceeded) {
        await expireOnce();
        return response;
      }
    }

    const retryResponse = await suppliedFetch(retryInput, init);
    if (retryResponse.status === 401) {
      await expireOnce();
    }
    return retryResponse;
  }

  return send;
}
