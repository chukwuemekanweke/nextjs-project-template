export const PASSKEY_SIGN_IN_FLOW_COOKIE = "__Host-user-passkey-sign-in-flow";

const HOST_COOKIE_POLICY = {
  httpOnly: true,
  path: "/",
  priority: "high" as const,
  sameSite: "lax" as const,
  secure: true,
};

export function passkeySignInFlowCookie(expiresAtUtc: string) {
  return {
    ...HOST_COOKIE_POLICY,
    expires: new Date(expiresAtUtc),
  };
}

export const expiredPasskeySignInFlowCookie = {
  ...HOST_COOKIE_POLICY,
  expires: new Date(0),
  maxAge: 0,
};
