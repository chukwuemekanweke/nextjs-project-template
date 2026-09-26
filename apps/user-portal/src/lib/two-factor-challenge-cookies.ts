import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  expiredTwoFactorChallengeCookie,
  TWO_FACTOR_CHALLENGE_COOKIE,
  twoFactorChallengeCookie,
} from "./two-factor-challenge-cookie-policy";

export { TWO_FACTOR_CHALLENGE_COOKIE };

export type TwoFactorChallengeCookie = {
  challenge: string;
  expiresAtUtc: string;
};

export async function getTwoFactorChallengeCookie(): Promise<
  TwoFactorChallengeCookie | undefined
> {
  const value = (await cookies()).get(TWO_FACTOR_CHALLENGE_COOKIE)?.value;
  if (!value) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    );
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as { challenge?: unknown }).challenge !== "string" ||
      typeof (parsed as { expiresAtUtc?: unknown }).expiresAtUtc !== "string"
    ) {
      return undefined;
    }
    return parsed as TwoFactorChallengeCookie;
  } catch {
    return undefined;
  }
}

export function setTwoFactorChallengeCookie(
  response: NextResponse,
  challenge: string,
  expiresAtUtc: string,
): void {
  const value = Buffer.from(
    JSON.stringify({ challenge, expiresAtUtc }),
    "utf8",
  ).toString("base64url");
  response.cookies.set(
    TWO_FACTOR_CHALLENGE_COOKIE,
    value,
    twoFactorChallengeCookie(expiresAtUtc),
  );
}

export function clearTwoFactorChallengeCookie(response: NextResponse): void {
  response.cookies.set(
    TWO_FACTOR_CHALLENGE_COOKIE,
    "",
    expiredTwoFactorChallengeCookie,
  );
}
