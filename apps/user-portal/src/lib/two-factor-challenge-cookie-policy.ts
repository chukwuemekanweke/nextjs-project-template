export const TWO_FACTOR_CHALLENGE_COOKIE = "__Host-user-two-factor-challenge";

const HOST_COOKIE_POLICY = {
  httpOnly: true,
  path: "/",
  priority: "high" as const,
  sameSite: "lax" as const,
  secure: true,
};

export function twoFactorChallengeCookie(expiresAtUtc: string) {
  return {
    ...HOST_COOKIE_POLICY,
    expires: new Date(expiresAtUtc),
  };
}

export const expiredTwoFactorChallengeCookie = {
  ...HOST_COOKIE_POLICY,
  expires: new Date(0),
  maxAge: 0,
};
