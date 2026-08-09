export interface RouteSessionOptions<TSession> {
  accessToken?: string;
  isAccessTokenValid: (accessToken: string) => boolean;
  refreshSession: (refreshToken: string) => Promise<TSession>;
  refreshToken?: string;
}

export type RouteSessionResolution<TSession> =
  | { status: "active" }
  | { session: TSession; status: "refreshed" }
  | { status: "unauthenticated" };

export type CoordinateSessionRefresh<TSession> = (
  refreshToken: string,
  refreshSession: () => Promise<TSession>,
) => Promise<TSession>;

export function createSessionRefreshCoordinator<
  TSession,
>(): CoordinateSessionRefresh<TSession> {
  const activeRefreshes = new Map<string, Promise<TSession>>();

  return (refreshToken, refreshSession) => {
    const activeRefresh = activeRefreshes.get(refreshToken);
    if (activeRefresh) {
      return activeRefresh;
    }

    const pendingRefresh = Promise.resolve()
      .then(refreshSession)
      .finally(() => {
        if (activeRefreshes.get(refreshToken) === pendingRefresh) {
          activeRefreshes.delete(refreshToken);
        }
      });
    activeRefreshes.set(refreshToken, pendingRefresh);
    return pendingRefresh;
  };
}

export async function resolveRouteSession<TSession>({
  accessToken,
  isAccessTokenValid,
  refreshSession,
  refreshToken,
}: RouteSessionOptions<TSession>): Promise<RouteSessionResolution<TSession>> {
  if (accessToken && isAccessTokenValid(accessToken)) {
    return { status: "active" };
  }

  if (!refreshToken) {
    return { status: "unauthenticated" };
  }

  try {
    return {
      session: await refreshSession(refreshToken),
      status: "refreshed",
    };
  } catch {
    return { status: "unauthenticated" };
  }
}

export function hasActiveAccessToken(
  accessToken: string,
  now: Date = new Date(),
): boolean {
  const payload = decodeAccessTokenPayload(accessToken);
  if (!payload || typeof payload.exp !== "number") {
    return false;
  }

  const nowInSeconds = Math.floor(now.getTime() / 1_000);
  if (
    "nbf" in payload &&
    (typeof payload.nbf !== "number" || !Number.isFinite(payload.nbf))
  ) {
    return false;
  }
  return (
    Number.isFinite(payload.exp) &&
    payload.exp > nowInSeconds &&
    (typeof payload.nbf !== "number" || payload.nbf <= nowInSeconds)
  );
}

export function decodeAccessTokenPayload(
  accessToken: string,
): Record<string, unknown> | undefined {
  const segments = accessToken.split(".");
  if (segments.length !== 3 || !segments[1]) {
    return undefined;
  }

  try {
    const base64 = segments[1].replaceAll("-", "+").replaceAll("_", "/");
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const bytes = Uint8Array.from(atob(paddedBase64), (character) =>
      character.charCodeAt(0),
    );
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return undefined;
    }
    return value as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export function createSignInRedirectUrl(
  requestUrl: URL,
  signInPath: string,
): URL {
  const destination = `${requestUrl.pathname}${requestUrl.search}`;
  const signInUrl = new URL(signInPath, requestUrl.origin);
  signInUrl.searchParams.set("returnTo", destination);
  return signInUrl;
}
