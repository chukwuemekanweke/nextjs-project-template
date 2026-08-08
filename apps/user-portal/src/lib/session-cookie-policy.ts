export const ACCESS_TOKEN_COOKIE = "__Host-user-session";
export const REFRESH_TOKEN_COOKIE = "__Host-user-refresh-session";

export const TOKEN_EXPIRY_SAFETY_WINDOW_SECONDS = 60;

const HOST_COOKIE_POLICY = {
  httpOnly: true,
  path: "/",
  priority: "high" as const,
  sameSite: "lax" as const,
  secure: true,
};

export function persistentSessionCookie(expiresAtUtc: string) {
  return {
    ...HOST_COOKIE_POLICY,
    expires: new Date(
      new Date(expiresAtUtc).getTime() -
        TOKEN_EXPIRY_SAFETY_WINDOW_SECONDS * 1_000,
    ),
  };
}

export const expiredSessionCookie = {
  ...HOST_COOKIE_POLICY,
  expires: new Date(0),
  maxAge: 0,
};
