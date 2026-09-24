export const GOOGLE_AUTH_FLOW_COOKIE = "__Host-user-google-auth-flow";

const HOST_COOKIE_POLICY = {
  httpOnly: true,
  path: "/",
  priority: "high" as const,
  sameSite: "lax" as const,
  secure: true,
};

export function googleFlowCookie(expiresAtUtc: string) {
  return {
    ...HOST_COOKIE_POLICY,
    expires: new Date(expiresAtUtc),
  };
}

export const expiredGoogleFlowCookie = {
  ...HOST_COOKIE_POLICY,
  expires: new Date(0),
  maxAge: 0,
};
